import BotClient from "./classes/BotClient";
import SlashHandler from "./classes/Handler";

import onReady from "./events/onReady";
import onInteractionCreate from "./events/onInteractionCreate";
import onMessageCreate from "./events/onMessageCreate";
import guildDelete from "./events/guildDelete";
import voiceStateUpdate from "./events/voiceStateUpdate";
import { ttsfilepath, signaturefilepath, restartsignature } from "./tts/tts";
import { existsSync, mkdirSync, readdir, readdirSync, rmdirSync, unlink, unlinkSync } from "fs";
import nowdate from "./function/nowdate";

// 봇 클라이언트 생성
export const client = new BotClient();
export const handler = new SlashHandler();

// 이벤트 로딩
client.onEvent('ready', onReady);
client.onEvent('interactionCreate', onInteractionCreate);
client.onEvent('messageCreate', onMessageCreate);
client.onEvent('guildDelete', guildDelete);
client.onEvent('voiceStateUpdate', voiceStateUpdate);

// TTS 파일 삭제
if (!existsSync(ttsfilepath)) mkdirSync(ttsfilepath);
readdir(ttsfilepath, (err, files) => {
  if (err) console.error(err);
  files.forEach((file) => {
    unlink(`${ttsfilepath}/${file}`, (err) => {
      if (err) return;
    });
  });
});

// 시그니쳐 파일 삭제
if (!existsSync(signaturefilepath)) mkdirSync(signaturefilepath);
readdir(signaturefilepath, (err, files) => {
  if (err) console.error(err);
  files.forEach((file) => {
    if (file.endsWith(".mp3")) {
      unlink(`${signaturefilepath}/${file}`, (err) => {
        if (err) return;
      });
    } else {
      try {
        const fl = readdirSync(`${signaturefilepath}/${file}`);
        for (let val of fl) {
          try {
            unlinkSync(`${signaturefilepath}/${file}/${val}`);
          } catch (err) {}
        }
        try {
          rmdirSync(`${signaturefilepath}/${file}`);
        } catch (err) {}
      } catch (err) {}
    }
  });
});

// 시그니쳐 로딩
console.log("시그니쳐 불러오는중...");
restartsignature().catch((err) => {
  return console.log("시그니쳐 불러오던중 오류발생\n");
}).then((val) => {
  return console.log(`현재시간: ${nowdate()}\n`);
});
