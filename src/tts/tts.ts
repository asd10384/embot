import { config } from "dotenv";
import { client } from "..";
import { writeFileSync, readFileSync, readdirSync, readdir, unlinkSync } from "fs";
import { M } from "../aliases/discord.js";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import mkembed from "../function/mkembed";
import { createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, createAudioPlayer, getVoiceConnection, VoiceConnection } from "@discordjs/voice";
import { signature_check_obj } from "./signature";
import replacemsg from "./replacemsg";
import googlettsapi from "../tts/googlettsapi";
import { set_timer } from "./timer";
import MDB from "../database/Mongodb";

config();
const ttsfilemaxlength: number = 8;
const ttsfilepath: string = (process.env.TTS_FILE_PATH) ? (process.env.TTS_FILE_PATH.endsWith('/')) ? process.env.TTS_FILE_PATH : process.env.TTS_FILE_PATH+'/' : '';

const fileformat: {
  ttsformat: "AUDIO_ENCODING_UNSPECIFIED" | "LINEAR16" | "MP3" | "OGG_OPUS",
  fileformat: "mp3" | "wav" | "ogg"
} = {
  ttsformat: 'MP3',
  fileformat: 'mp3'
};
let ttsfilelist: string[] = [];

readdir(ttsfilepath, (err, files) => {
  if (err) console.error(err);
  files.forEach((file) => {
    unlinkSync(ttsfilepath+file);
  });
});
setInterval(() => {
  const files = readdirSync(ttsfilepath);
  if (!files || files.length < ttsfilemaxlength+1) return;
  for (let i=0; i<files.length-ttsfilemaxlength; i++) {
    let filename = ttsfilelist.shift();
    unlinkSync(ttsfilepath+filename+'.'+fileformat.fileformat);
  }
}, 10000);

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

const snlist = Object.keys(signature_check_obj);
const sncheck = new RegExp(Object.keys(signature_check_obj).join('|'), 'gi');

async function fttsfplay(message: M, text: string) {
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
    if (userDB && !userDB.tts.istts) {
      client.msgdelete(message, 50, true);
      return message.member.user.send({
        embeds: [
          mkembed({
            author: { name: message.guild?.name!, iconURL: message.guild?.iconURL()! },
            title: `\` TTS ban \``,
            description: `
              \` 현재 당신은 TTS ban 상태입니다. \`
              
              현재 TTS 를 사용할수 없는 상태입니다.

              ban한사람 : <@${userDB.tts.banforid}>
              ban된시간 : ${userDB.tts.date}
            `,
            color: 'DARK_RED'
          })
        ]
      }).then(m => client.msgdelete(m, 2));
    }
  }
  const channel = await getchannel(message);
  if (!channel) return message.channel.send({
    embeds: [
      mkembed({
        title: `음성채널을 찾을수 없습니다.`,
        description: `음성채널에 들어간 다음 사용해주세요.`,
        color: 'ORANGE'
      })
    ]
  }).then(m => client.msgdelete(m, 1));
  const filename = (Math.random() * Number(message.guildId)).toString().replace('.','');
  const file = await mktts(filename, text);
  if (!file) return;
  const vca = message.guild?.voiceAdapterCreator!;
  const bvcb = await getbotchannelboolen(message);
  set_timer(message.guildId!, true);
  fplay(vca, message.guildId!, channel.id, file, bvcb);
}

async function fplay(voiceAdapterCreator: DiscordGatewayAdapterCreator, guildID: string, channelID: string, fileURL: string, bvcb: boolean, options?: { volume?: number }) {
  let connection: VoiceConnection;
  const getvoicechannel = getVoiceConnection(guildID);
  if (bvcb && getvoicechannel) {
    connection = getvoicechannel;
  } else {
    connection = joinVoiceChannel({
      adapterCreator: voiceAdapterCreator,
      guildId: guildID,
      channelId: channelID
    });
  }
  const Player = createAudioPlayer();
  const subscription = connection.subscribe(Player);

  const resource = createAudioResource(fileURL, {
    inlineVolume: true
  });
  resource.volume?.setVolume((options && options.volume) ? options.volume : 1);
  Player.play(resource);
  return subscription;
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
  text = replacemsg(text);
  text = text.replace(sncheck, (text) => {
  return '#*#'+text+'#*#';
  });
  list = text.split('#*#');
  if (list.length > 0) {
    for (let i in list) {
      if (snlist.includes(list[i])) {
        buf = readFileSync(`sound/signature/${scobj[list[i]]}.mp3`);
      } else {
        buf = await gettext(list[i]);
      }
      list[i] = buf;
    }
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
  writeFileSync(filename, output);
  ttsfilelist.push(fileURL);
  return filename;
}

async function gettext(text: string) {
  let response: any;
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
      },
    });
    if (!response) return null;
    return response[0].audioContent;
  } catch(err) {
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
      },
    });
    if (!response) return null;
    return response[0].audioContent;
  }
}

export const play = fplay;
export const ttsplay = fttsfplay;