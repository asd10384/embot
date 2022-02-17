import "dotenv/config";
import { client } from "../index";
import { writeFileSync, readFileSync, readdir, unlink, existsSync, mkdirSync } from "fs";
import { M } from "../aliases/discord.js";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, createAudioPlayer, getVoiceConnection, VoiceConnection } from "@discordjs/voice";
import { getsignature, makefile, signaturesiteurl } from "./signature";
import replacemsg from "./replacemsg";
import googlettsapi from "../tts/googlettsapi";
import { set_timer } from "./timer";
import MDB from "../database/Mongodb";
import axios from "axios";

export const ttsfilepath: string = (process.env.TTS_FILE_PATH) ? (process.env.TTS_FILE_PATH.endsWith('/')) ? process.env.TTS_FILE_PATH : process.env.TTS_FILE_PATH+'/' : '';
export const signaturefilepath: string = (process.env.SIGNATURE_FILE_PATH) ? (process.env.SIGNATURE_FILE_PATH.endsWith('/')) ? process.env.SIGNATURE_FILE_PATH : process.env.SIGNATURE_FILE_PATH+'/' : '';

const fileformat: {
  ttsformat: "AUDIO_ENCODING_UNSPECIFIED" | "LINEAR16" | "MP3" | "OGG_OPUS",
  fileformat: "mp3" | "wav" | "ogg"
} = {
  ttsformat: 'MP3',
  fileformat: 'mp3'
};
const ttsfilelist: Set<string> = new Set();

if (!existsSync(ttsfilepath)) mkdirSync(ttsfilepath);
if (!existsSync(signaturefilepath)) mkdirSync(signaturefilepath);
readdir(ttsfilepath, (err, files) => {
  if (err) console.error(err);
  files.forEach((file) => {
    unlink(ttsfilepath+file, (err) => {
      if (err) return;
    });
  });
});

readdir(signaturefilepath, (err, files) => {
  if (err) console.error(err);
  files.forEach((file) => {
    if (file.endsWith(".mp3")) {
      unlink(`${signaturefilepath}${file}`, (err) => {
        if (err) return;
      });
    } else {
      readdir(`${signaturefilepath}${file}`, (err, fl) => {
        if (err) return;
        fl.forEach((val) => {
          unlink(`${signaturefilepath}${file}${val}`, (err) => {
            if (err) return;
          });
        });
      });
    }
  })
})
getsignature();

/**
 * @discordjs/voice 모듈의 추가 모듈 확인 명령어
 * import { generateDependencyReport } from "@discordjs/voice";
 * console.log(generateDependencyReport());
 */

/** google tts api connect */
googlettsapi();

const ttsclient = new TextToSpeechClient({
  keyFile: 'googlettsapi.json',
  fallback: false
});

var signature_check_start = false;
var signature_check_obj: { [key: string]: string } = {};
var snlist: string[] = [];
var sncheck = /defaultRegExpmessage/gi;

export async function restartsignature(): Promise<string> {
  const sig = await getsignature();
  signature_check_obj = sig[1];
  snlist = Object.keys(signature_check_obj);
  sncheck = new RegExp(Object.keys(signature_check_obj).join('|'), 'gi');
  const getlog = await makefile(sig[0]);
  return getlog;
}

export async function ttsplay(message: M, text: string) {
  if (!signature_check_start) {
    signature_check_start = true;
    await restartsignature();
  }
  text = (/https?\:\/\//gi.test(text))
    ? (/https?\:\/\/(www\.)?youtu/gi.test(text))
    ? '유튜브 주소'
    : (/https?\:\/\/(www\.)?twitch\.tv/gi.test(text))
    ? '트위치 주소'
    : (/https?\:\/\/(www\.)?(store\.)?steampowered/gi.test(text))
    ? '스팀 주소'
    : (/https?\:\/\/(www\.)?naver/gi.test(text))
    ? '네이버 주소'
    : (/https?\:\/\/(www\.)?namu\.wiki/gi.test(text))
    ? '나무위키 주소'
    : (/https?\:\/\/(www\.)?google\.com/gi.test(text))
    ? '구글 주소'
    : '주소'
    : text;
  text = text.replace(/<@\!?[(0-9)]{18}>/g, (t) => {
    const member = message.guild?.members.cache.get(t.replace(/[^0-9]/g,''));
    return (member) ? (member.nickname) ? member.nickname : (member.user) ? member.user.username : '' : '';
  });
  text = text.replace(/\<a?\:.*\:[(0-9)]{18}\>/g, (t) => {
    return '이모티콘';
  });
  if (message.member) {
    let userDB = await MDB.get.user(message.member);
    if (userDB && userDB.tts.some((ttsDB) => ttsDB.guildId === message.guildId!)) {
      client.msgdelete(message, 70, true);
      const ttsDB = userDB.tts[userDB.tts.findIndex(ttsDB => ttsDB.guildId === message.guildId!)];
      if (ttsDB.inf || ttsDB.time - Date.now() > 0) {
        return message.member.user.send({
          embeds: [
            client.mkembed({
              author: { name: message.guild?.name!, iconURL: message.guild?.iconURL()! },
              title: `\` TTS ban \``,
              description: `
                \` 현재 당신은 TTS ban 상태입니다. \`
                
                현재 TTS 를 사용할수 없는 상태입니다.
                남은시간 : ${(ttsDB.inf) ? "무기한" : ((ttsDB.time - Date.now())/1000).toFixed(2) + "초"}
  
                ban한사람 : <@${ttsDB.banforid}>
                ban된시간 : ${ttsDB.date}
              `,
              color: 'DARK_RED'
            })
          ]
        }).then(m => client.msgdelete(m, 3));
      } else {
        userDB.tts.splice(userDB.tts.findIndex(ttsDB => ttsDB.guildId === message.guildId!), 1);
        userDB.save().catch((err) => {});
      }
    }
  }
  const channel = await getchannel(message);
  if (!channel) return message.channel.send({
    embeds: [
      client.mkembed({
        title: `음성채널을 찾을수 없습니다.`,
        description: `음성채널에 들어간 다음 사용해주세요.`,
        color: 'ORANGE'
      })
    ]
  }).then(m => client.msgdelete(m, 1));
  let randomfilename = Math.random().toString(36).replace(/0?\./g,"");
  while (true) {
    if (ttsfilelist.has(randomfilename)) {
      randomfilename = Math.random().toString(36).replace(/0?\./g,"");
    } else {
      ttsfilelist.add(randomfilename);
      break;
    }
  }
  const file = await mktts(randomfilename, text);
  if (!file) return;
  const vca = message.guild?.voiceAdapterCreator! as DiscordGatewayAdapterCreator;
  const bvcb = await getbotchannelboolen(message);
  set_timer(message.guildId!, true);
  play(vca, message.guildId!, channel.id, file, bvcb, randomfilename);
}

export async function play(voiceAdapterCreator: DiscordGatewayAdapterCreator, guildID: string, channelID: string, fileURL: string, bvcb: boolean, filename: string, options?: { volume?: number }) {
  let connection: VoiceConnection = joinVoiceChannel({
    adapterCreator: voiceAdapterCreator,
    guildId: guildID,
    channelId: channelID
  });
  const Player = createAudioPlayer();
  const subscription = connection.subscribe(Player);

  try {
    const resource = createAudioResource(fileURL, {
      inlineVolume: true
    });
    resource.volume?.setVolume((options && options.volume) ? options.volume : 1);
    Player.play(resource);
    setTimeout(() => {
      unlink(`${ttsfilepath}${filename}.${fileformat.fileformat}`, (err) => {
        ttsfilelist.delete(filename);
        if (err) return;
      });
    }, 1500);
    return subscription;
  } catch (err) {}
}

async function getchannel(message: M) {
  if (message.member?.voice.channelId) return message.member.voice.channel;
  if (message.guild?.me?.voice.channelId) return message.guild?.me?.voice.channel;
  return undefined;
}
async function getbotchannelboolen(message: M) {
  if (message.guild?.me?.voice.channelId) return true;
  return false;
}

async function mktts(fileURL: string, text: string) {
  const scobj: any = signature_check_obj;
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
        if (existsSync(`${signaturefilepath}${scobj[list[i]]}.mp3`)) getbuf = readFileSync(`${signaturefilepath}${scobj[list[i]]}.mp3`);
        if (!getbuf) {
          var encodetext = encodeURI(scobj[list[i]]);
          var getsitebuf = await axios.get(`${signaturesiteurl}/file/${encodetext}.mp3`, { responseType: "arraybuffer", timeout: 3000 }).catch((err) => {
            return undefined;
          });
          if (getsitebuf?.data) getbuf = getsitebuf.data;
        }
        if (getbuf) buf = Buffer.from(getbuf);
        else buf = await gettext(list[i]);
      } else {
        list[i] = replacemsg(list[i]);
        buf = await gettext(list[i]);
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
    output = await gettext(text);
    if (!output) return;
  }
  let filename = `${ttsfilepath}${fileURL}.${fileformat.fileformat}`;
  try {
    writeFileSync(filename, output);
  } catch (err) {}
  return filename;
}

async function gettext(text: string) {
  let response: any = undefined;
  try {
    response = await ttsclient.synthesizeSpeech({
      input: {text: text},
      voice: {
        languageCode: 'ko-KR',
        name: 'ko-KR-Standard-A'
      },
      audioConfig: {
        audioEncoding: fileformat.ttsformat, // 형식
        speakingRate: 0.905, // 속도
        pitch: 0, // 피치
        // sampleRateHertz: 16000, // 헤르츠
        // effectsProfileId: ['medium-bluetooth-speaker-class-device'] // 효과 https://cloud.google.com/text-to-speech/docs/audio-profiles
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
