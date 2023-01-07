import "dotenv/config";
import { client } from "../index";
import { Guild, Message } from "discord.js";
import { QDB } from "../databases/Quickdb";
import axios from "axios";
import { makefile, signaturesiteurl } from "./signature";
import { getsignature } from "./signature";
import { createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel, PlayerSubscription, VoiceConnection } from "@discordjs/voice";
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
  ttstimer: NodeJS.Timeout | undefined;
  lasttts: number;
  setPlayerSubscription: PlayerSubscription | undefined;
  move: boolean;

  constructor(guild: Guild) {
    this.guild = guild;
    this.ttstimer = undefined;
    this.lasttts = 0;
    this.setPlayerSubscription = undefined;
    this.move = true;
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
          await QDB.user.set(this.guild.id, message.member!.id, {
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
    if (!channel) return message.channel.send({
      embeds: [
        client.mkembed({
          title: `음성채널을 찾을수 없습니다.`,
          description: `음성채널에 들어간 다음 사용해주세요.`,
          color: 'DarkRed'
        })
      ]
    }).then(m => client.msgdelete(m, 1));

    if (text.length > 300) return message.channel.send({
      embeds: [
        client.mkembed({
          title: `너무많은글자`,
          description: `최대 300자까지 가능합니다.`,
          color: 'DarkRed'
        })
      ]
    }).then(m => client.msgdelete(m, 1));

    if (this.lasttts+addlasttts <= Date.now()) {
      this.lasttts = Date.now();
    } else {
      return;
    }

    if (this.ttstimer) clearTimeout(this.ttstimer);

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
    this.play(channel.id, file, randomfilename).catch(() => {});
    return;
  }
  async play(channelID: string, fileURL: string, filename: string, options?: { volume?: number }) {
    let connection: VoiceConnection | undefined = undefined;
    if (this.move) {
      connection = joinVoiceChannel({
        adapterCreator: this.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
        guildId: this.guild.id,
        channelId: channelID
      });
    } else {
      const bot = await this.guild.members.fetchMe({ cache: true });
      if (bot?.voice.channelId) connection = joinVoiceChannel({
        adapterCreator: this.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
        guildId: this.guild.id,
        channelId: bot.voice.channelId
      });
      if (!connection) connection = joinVoiceChannel({
        adapterCreator: this.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
        guildId: this.guild.id,
        channelId: channelID
      });
    }
    if (!connection) return;
    
    this.ttstimer = setTimeout(() => {
      this.move = true;
      getVoiceConnection(this.guild.id)?.disconnect();
    }, 1000 * TimerTime);

    try {
      this.setPlayerSubscription?.player.stop();
      const Player = createAudioPlayer();
      const resource = createAudioResource(fileURL, {
        inlineVolume: true
      });
      resource.volume?.setVolume((options && options.volume) ? options.volume : 1);
      Player.play(resource);
      const subscription = connection.subscribe(Player);
      this.setPlayerSubscription = subscription;
    } catch (err) {
      this.setPlayerSubscription = undefined;
    }
    setTimeout(() => {
      try {
        unlink(`${ttsfilepath}/${filename}.${fileformat.fileformat}`, (err) => {
          if (ttsfilelist.has(filename)) ttsfilelist.delete(filename);
          if (err) return;
        });
      } catch (err) {}
    }, 2500);
    return;
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
          name: 'ko-KR-Standard-A'
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