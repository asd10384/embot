import "dotenv/config";
import { client } from "../index";
import { Guild, Message, TextChannel, VoiceBasedChannel } from "discord.js";
import { QDB } from "../databases/Quickdb";
import axios from "axios";
import { makefile, signaturesiteurl } from "./signature";
import { getsignature } from "./signature";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { existsSync, readFileSync, unlink, writeFileSync } from "fs";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { repalcelist, replaceobj, replacetext } from "./replaceMessage";
import { TimerTime } from "./ttsConfig";
import { Logger } from "../utils/Logger";

export const ttsfilepath: string = (process.env.TTS_FILE_PATH) ? (process.env.TTS_FILE_PATH.endsWith('/')) ? process.env.TTS_FILE_PATH.slice(0,-1) : process.env.TTS_FILE_PATH : '';
export const signaturefilepath: string = (process.env.SIGNATURE_FILE_PATH) ? (process.env.SIGNATURE_FILE_PATH.endsWith('/')) ? process.env.SIGNATURE_FILE_PATH.slice(0,-1) : process.env.SIGNATURE_FILE_PATH : '';
const replaceRegExp = new RegExp(repalcelist.join('|'), 'gi');
const ttsfilelist = new Set<string>();
const addlasttts = 150;

const googlettsspeed = 1.105; // 트윕속도 : 0.905

const ttsclient = new TextToSpeechClient({
  keyFile: 'googlettsapi.json',
  fallback: false
});

const fileformat: {
  ttsformat: "AUDIO_ENCODING_UNSPECIFIED" | "LINEAR16" | "MP3" | "OGG_OPUS",
  fileformat: "mp3" | "wav" | "ogg"
} = {
  ttsformat: 'MP3',
  fileformat: 'mp3'
};

export let snobj: { name: string[], url: string }[] = [];
export let sncheckobj: { [key: string]: string } = {};
export let snlist: string[] = [];
export let sncheck: RegExp = /default/;

export const restartsignature = () => new Promise<string>(async (res, rej) => {
  try {
    const sig = await getsignature();
    snobj = sig[0];
    sncheckobj = sig[1];
    snlist = Object.keys(sncheckobj);
    sncheck = new RegExp(Object.keys(sncheckobj).join('|'), 'gi');
    const getlog = await makefile(sig[0]);
    Logger.log(getlog);
    return res(getlog);
  } catch(err) {
    return rej(err);
  }
});


export class TTS {
  guild: Guild;
  ttsTimer: NodeJS.Timer;
  ttsTimerTime: number;
  lasttts: number;
  setPlayerSubscription: PlayerSubscription | undefined;
  move: boolean;
  connection: VoiceConnection | undefined;
  statsChageTime: number;

  constructor(guild: Guild) {
    this.guild = guild;
    this.lasttts = 0;
    this.setPlayerSubscription = undefined;
    this.move = true;
    this.connection = undefined;
    this.statsChageTime = 0;
    this.ttsTimerTime = -1;
    this.ttsTimer = setInterval(() => {
      if (this.ttsTimerTime != -1 && this.ttsTimerTime < Date.now()) {
        this.ttsTimerTime = -1;
        this.move = true;
        getVoiceConnection(this.guild.id)?.disconnect();
        getVoiceConnection(this.guild.id)?.destroy();
      }
    }, 5000);
  }

  setmove(getmove: boolean) {
    this.move = getmove;
  }

  async tts(message: Message, text: string) {
    text = replacetext(this.guild, text);
    if (message.member) {
      const UDB = await QDB.user.get(this.guild, message.member!);
      if (UDB.tts.ban) {
        client.msgdelete(message, 70, true);
        if (UDB.tts.time == -1 || UDB.tts.time - Date.now() > 0) {
          return message.member.user.send({
            embeds: [
              client.mkembed({
                author: { name: message.guild!.name, iconURL: message.guild!.iconURL() || "" },
                title: `\` TTS ban \``,
                description: `
                  \` 현재 당신은 TTS ban 상태입니다. \`
                
                  현재 TTS 를 사용할수 없는 상태입니다.
                  남은시간 : ${(UDB.tts.time == -1) ? "무기한" : ((UDB.tts.time - Date.now())/1000).toFixed(2) + "초"}
    
                  ban한사람 : <@${UDB.tts.banforid}>
                  ban된시간 : <t:${Math.round(UDB.tts.date/1000)}:F> (<t:${UDB.tts.date}:R>)
                `,
                color: 'DarkRed'
              })
            ]
          }).then(m => client.msgdelete(m, 3));
        } else {
          await QDB.user.set(this.guild, message.member!, {
            tts: {
              ban: false,
              banforid: "",
              date: 0,
              time: 0
            }
          }).catch(() => {});
        }
      }
    }
    const channel = await this.getchannel(message);
    if (!channel) return (message.channel as TextChannel).send({
      embeds: [
        client.mkembed({
          title: `음성채널을 찾을수 없습니다.`,
          description: `음성채널에 들어간 다음 사용해주세요.`,
          color: 'DarkRed'
        })
      ]
    }).then(m => client.msgdelete(m, 1));

    if (text.length > 300) return (message.channel as TextChannel).send({
      embeds: [
        client.mkembed({
          title: `너무많은글자`,
          description: `최대 300자까지 가능합니다.`,
          color: 'DarkRed'
        })
      ]
    }).then(m => client.msgdelete(m, 1));

    if (this.lasttts+addlasttts > Date.now()) return;
    
    this.lasttts = Date.now();

    this.ttsTimerTime = Date.now() + (TimerTime*1000);

    let randomfilename = Math.random().toString(36).replace(/0?\./g,"");
    while (true) {
      if (ttsfilelist.has(randomfilename)) {
        randomfilename = Math.random().toString(36).replace(/0?\./g,"");
      } else {
        ttsfilelist.add(randomfilename);
        break;
      }
    }
    const file = await this.mktts(randomfilename, text).catch(() => {
      return undefined;
    });
    if (!file) return;
    this.connection = undefined;
    this.play(channel, file, randomfilename).catch(() => {});
    return;
  }
  async play(channel: VoiceBasedChannel, fileURL: string, filename: string, options?: { volume?: number }) {
    this.connection = await this.getConnection(channel);
    if (!this.connection) return;
    
    try {
      this.setPlayerSubscription?.player.stop();
      const Player = createAudioPlayer();
      Player.setMaxListeners(0);
      const resource = createAudioResource(fileURL, {
        inlineVolume: true
      });
      resource.volume?.setVolume((options && options.volume) ? options.volume : 1);
      Player.play(resource);
      try {
        await entersState(Player, AudioPlayerStatus.Playing, 5000);
        const subscription = this.connection.subscribe(Player);
        this.setPlayerSubscription = subscription;
      } catch {
        this.setPlayerSubscription = undefined;
      }
    } catch {
      this.setPlayerSubscription = undefined;
    }
    setTimeout(() => {
      try {
        unlink(`${ttsfilepath}/${filename}.${fileformat.fileformat}`, (err) => {
          if (ttsfilelist.has(filename)) ttsfilelist.delete(filename);
          if (err) return;
        });
      } catch {}
    }, 5000);
    return;
  }

  async getConnection(channel: VoiceBasedChannel) {
    return new Promise<VoiceConnection | undefined>(async (res) => {
      try {
        let connection: VoiceConnection | undefined = undefined;
        if (this.move) {
          if (this.guild.members.cache.get(client.user?.id || "")?.voice.channelId === channel.id) {
            connection = getVoiceConnection(this.guild.id);
          } else {
            connection = joinVoiceChannel({
              adapterCreator: this.guild.voiceAdapterCreator,
              guildId: this.guild.id,
              channelId: channel.id
            });
            connection.once(VoiceConnectionStatus.Ready, () => {
              if (connection) this.setConnection(connection);
              return res(connection);
            });
          }
        } else {
          const bot = this.guild.members.cache.get(client.user?.id || "");
          if (bot?.voice.channelId) {
            connection = joinVoiceChannel({
              adapterCreator: this.guild.voiceAdapterCreator,
              guildId: this.guild.id,
              channelId: bot.voice.channelId
            });
            connection.once(VoiceConnectionStatus.Ready, () => {
              if (connection) this.setConnection(connection);
              return res(connection);
            });
          }
          if (!connection) {
            connection = joinVoiceChannel({
              adapterCreator: this.guild.voiceAdapterCreator,
              guildId: this.guild.id,
              channelId: channel.id
            });
            connection.once(VoiceConnectionStatus.Ready, () => {
              if (connection) this.setConnection(connection);
              return res(connection);
            });
          }
        }
        if (!connection) return res(undefined);
        return res(connection);
      } catch {
        return res(undefined);
      }
    });
  }

  setConnection(connection: VoiceConnection): VoiceConnection {
    connection.setMaxListeners(0);
    // connection.configureNetworking();
    // connection.on("stateChange", (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
    //   if (this.statsChageTime <= Date.now()) {
    //     this.statsChageTime = Date.now() + 10000;
    //     connection.configureNetworking();
    //     const oldNetworking = Reflect.get(oldState, 'networking');
    //     const newNetworking = Reflect.get(newState, 'networking');
    //     const networkStateChangeHandler = (_oldNetworkState: any, newNetworkState: any) => {
    //       const newUdp = Reflect.get(newNetworkState, 'udp');
    //       clearInterval(newUdp?.keepAliveInterval);
    //     }
    //     oldNetworking?.off('stateChange', networkStateChangeHandler);
    //     newNetworking?.on('stateChange', networkStateChangeHandler);
    //   }
    // });
    return connection;
  }

  async getchannel(message: Message) {
    if (message.member?.voice.channel) return message.member.voice.channel;
    const bot = await message.guild?.members.fetchMe({ cache: true });
    if (bot?.voice.channel) return bot.voice.channel;
    return undefined;
  }

  async getbotchannelboolen(message: Message) {
    const bot = await message.guild?.members.fetchMe({ cache: true });
    if (bot?.voice.channel) return true;
    return false;
  }

  async mktts(fileURL: string, text: string): Promise<string | undefined> {
    const scobj: any = sncheckobj;
    let list: any;
    let buf: any;
    let output: any;
    text = text.replace(sncheck, (text) => {
    return '#*#'+text+'#*#';
    });
    list = text.split('#*#');
    var checkerr = false;
    if (list.length > 0) {
      for (let i in list) {
        if (snlist.includes(list[i])) {
          var getbuf: Buffer | undefined = undefined;
          try {
            if (existsSync(`${signaturefilepath}/${scobj[list[i]]}.mp3`)) getbuf = readFileSync(`${signaturefilepath}/${scobj[list[i]]}.mp3`);
            if (!getbuf) {
              var encodetext = encodeURI(scobj[list[i]]);
              var getsitebuf = await axios.get(`${signaturesiteurl}/file/${encodetext}.mp3`, {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Accept-Encoding": "gzip,deflate,compress",
                  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
              },
                responseType: "arraybuffer",
                timeout: 3000
              }).catch(() => {
                return undefined;
              });
              if (getsitebuf?.data) getbuf = getsitebuf.data;
            }
          } catch (err) {
            getbuf = undefined;
          }
          if (getbuf) {
            buf = Buffer.from(getbuf);
          } else {
            buf = await this.gettext(list[i]).catch(() => {
              return undefined;
            });
          }
        } else {
          list[i] = this.replacemsg(list[i]);
          buf = await this.gettext(list[i]).catch(() => {
            return undefined;
          });
        }
        if (!buf) checkerr = true;
        list[i] = buf;
      }
      if (checkerr) return;
      try {
        output = Buffer.concat(list);
      } catch(err) {
        return;
      }
    } else {
      output = await this.gettext(text).catch(() => {
        return undefined;
      });
      if (!output) return;
    }
    let filename: string | undefined = `${ttsfilepath}/${fileURL}.${fileformat.fileformat}`;
    try {
      writeFileSync(filename, output);
    } catch (err) {
      filename = undefined;
    }
    return filename;
  }

  async gettext(text: string) {
    let response: any = undefined;
    try {
      response = await ttsclient.synthesizeSpeech({
        input: { text: text },
        voice: {
          languageCode: 'ko-KR',
          name: 'ko-KR-Standard-A' // ko-KR-Neural2-A
        },
        audioConfig: {
          audioEncoding: fileformat.ttsformat, // 형식
          speakingRate: googlettsspeed, // 속도 0.905
          pitch: 0, // 피치
          // sampleRateHertz: 16000, // 헤르츠
          // effectsProfileId: ['medium-bluetooth-speaker-class-device'] // 효과 https://cloud.google.com/text-to-speech/docs/audio-profiles
        }
      }).catch(() => {
        return undefined;
      });
      if (!response || !response[0] || !response[0].audioContent) return undefined;
      return response[0].audioContent;
    } catch {
      return undefined;
    }
  }

  replacemsg(text: string) {
    text = text.replace(replaceRegExp, (text) => {
      return (replaceobj[text]) ? replaceobj[text] : (replaceobj['\\'+text]) ? replaceobj['\\'+text] : text;
    });
    return text;
  };
}