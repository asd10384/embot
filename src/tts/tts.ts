import "dotenv/config";
import "./googlettsapi";
import { client } from "../index";
import { Guild } from "discord.js";
import { M } from "../aliases/discord.js.js";
import MDB from "../database/Mysql";
import axios from "axios";
import { makefile, signaturesiteurl } from "./signature";
import { getsignature } from "./signature";
import { createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel, PlayerSubscription, VoiceConnection } from "@discordjs/voice";
import { existsSync, readFileSync, unlink, writeFileSync } from "fs";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { repalcelist, replaceobj, replacetext } from "./replacemsg";

export const ttsfilepath: string = (process.env.TTS_FILE_PATH) ? (process.env.TTS_FILE_PATH.endsWith('/')) ? process.env.TTS_FILE_PATH.slice(0,-1) : process.env.TTS_FILE_PATH : '';
export const signaturefilepath: string = (process.env.SIGNATURE_FILE_PATH) ? (process.env.SIGNATURE_FILE_PATH.endsWith('/')) ? process.env.SIGNATURE_FILE_PATH.slice(0,-1) : process.env.SIGNATURE_FILE_PATH : '';
const replaceRegExp = new RegExp(repalcelist.join('|'), 'gi');
const ttsfilelist = new Set<string>();
const addlasttts = 150;

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

export async function restartsignature(): Promise<string> {
  const sig = await getsignature();
  snobj = sig[0];
  sncheckobj = sig[1];
  snlist = Object.keys(sncheckobj);
  sncheck = new RegExp(Object.keys(sncheckobj).join('|'), 'gi');
  const getlog = await makefile(sig[0]);
  console.log(getlog);
  return getlog;
}


export default class TTS {
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

  async tts(message: M, text: string) {
    text = replacetext(this.guild, text);
    if (message.member) {
      let userDB = await MDB.get.user(message.member);
      if (userDB && userDB.tts.findIndex((ttsDB) => ttsDB.guildId === this.guild.id) > -1) {
        client.msgdelete(message, 70, true);
        const ttsDB = userDB.tts[userDB.tts.findIndex(ttsDB => ttsDB.guildId === this.guild.id)];
        if (ttsDB.inf || ttsDB.time - Date.now() > 0) {
          return message.member.user.send({
            embeds: [
              client.mkembed({
                author: { name: message.guild?.name!, iconURL: message.guild?.iconURL()! },
                title: `\` TTS ban \``,
                description: `
                  \` ?????? ????????? TTS ban ???????????????. \`
                  
                  ?????? TTS ??? ???????????? ?????? ???????????????.
                  ???????????? : ${(ttsDB.inf) ? "?????????" : ((ttsDB.time - Date.now())/1000).toFixed(2) + "???"}
    
                  ban????????? : <@${ttsDB.banforid}>
                  ban????????? : ${ttsDB.date}
                `,
                color: 'DARK_RED'
              })
            ]
          }).then(m => client.msgdelete(m, 3));
        } else {
          userDB.tts.splice(userDB.tts.findIndex(ttsDB => ttsDB.guildId === message.guildId!), 1);
          await MDB.update.user(userDB.id, { tts: JSON.stringify(userDB.tts) }).catch((err) => {});
        }
      }
    }
    const channel = this.getchannel(message);
    if (!channel) return message.channel.send({
      embeds: [
        client.mkembed({
          title: `??????????????? ????????? ????????????.`,
          description: `??????????????? ????????? ?????? ??????????????????.`,
          color: 'DARK_RED'
        })
      ]
    }).then(m => client.msgdelete(m, 1));

    if (text.length > 300) return message.channel.send({
      embeds: [
        client.mkembed({
          title: `??????????????????`,
          description: `?????? 300????????? ???????????????.`,
          color: 'DARK_RED'
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
    const file = await this.mktts(randomfilename, text).catch((err) => {
      return undefined;
    });
    if (!file) return;
    this.play(channel.id, file, randomfilename).catch((err) => {});
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
      connection = getVoiceConnection(this.guild.id);
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
    }, 1000 * client.ttstimertime);
  
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

  getchannel(message: M) {
    if (message.member?.voice.channelId) return message.member.voice.channel;
    if (message.guild?.me?.voice.channelId) return message.guild?.me?.voice.channel;
    return undefined;
  }
  getbotchannelboolen(message: M) {
    if (message.guild?.me?.voice.channelId) return true;
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
              var getsitebuf = await axios.get(`${signaturesiteurl}/file/${encodetext}.mp3`, { responseType: "arraybuffer", timeout: 3000 }).catch((err) => {
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
            buf = await this.gettext(list[i]).catch((err) => {
              return undefined;
            });
          }
        } else {
          list[i] = this.replacemsg(list[i]);
          buf = await this.gettext(list[i]).catch((err) => {
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
      output = await this.gettext(text).catch((err) => {
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
          audioEncoding: fileformat.ttsformat, // ??????
          speakingRate: 0.905, // ??????
          pitch: 0, // ??????
          // sampleRateHertz: 16000, // ?????????
          // effectsProfileId: ['medium-bluetooth-speaker-class-device'] // ?????? https://cloud.google.com/text-to-speech/docs/audio-profiles
        }
      }).catch((err) => {
        return undefined;
      });
      if (!response || !response[0] || !response[0].audioContent) return undefined;
      return response[0].audioContent;
    } catch(err) {
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