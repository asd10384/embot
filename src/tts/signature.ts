import axios from "axios";
import { existsSync, mkdirSync, writeFile } from "fs";
import { signaturefilepath } from "./tts";

export const signaturesiteurl = `https://signaturesite.netlify.app`;

export async function getsignature(): Promise<[ { name: string[], url: string }[], { [key: string]: string }] > {
  let sncheckobj: { [key: string]: string } = {};
  const snobj: { name: string[], url: string }[] = await (await axios.get(`${signaturesiteurl}/signature.json`, { responseType: "json" })).data;
  for (let i in snobj) {
    let obj = snobj[i];
    for (let j in obj.name) {
      sncheckobj[obj.name[j]] = obj.url;
    }
  }
  makefile(snobj);
  return [ snobj, sncheckobj ];
}

function makefile(snobj: { name: string[], url: string }[]) {
  snobj.forEach(async (val) => {
    const args = val.url.trim().split("/");
    if (args.length > 1) {
      if (!existsSync(`${signaturefilepath}${args[0]}`)) {
        mkdirSync(`${signaturefilepath}${args[0]}`);
      }
      var getbuf = await axios.get(`${signaturesiteurl}/file/${encodeURI(val.url)}.mp3`, { responseType: "arraybuffer", timeout: 7000 }).catch((err) => {
        return undefined;
      });
      if (getbuf && getbuf.data) {
        writeFile(`${signaturefilepath}${val.url}.mp3`, getbuf.data, (err) => {
          if (err) return console.log(`${val.url}파일생성중 오류발생`);
        });
      } else {
        console.log(`${val.url}불러오는중 오류발생`);
      }
    }
  });
}