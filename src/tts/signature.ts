import axios from "axios";
import { existsSync, mkdirSync, writeFile } from "fs";
import { signaturefilepath } from "./tts";

export const signaturesiteurl = `https://signaturesite.netlify.app`;

export async function getsignature(): Promise<[ { name: string[], url: string }[], { [key: string]: string }] > {
  let sncheckobj: { [key: string]: string } = {};
  const get: { [key: string]: any, data: any } = await axios.get(`${signaturesiteurl}/signature.json`, { responseType: "json", timeout: 5000 }).catch((err) => {
    return { data: undefined };
  });
  const snobj: { name: string[], url: string }[] | undefined = get.data;
  if (!snobj) return [ [], {} ];
  for (let i in snobj) {
    let obj = snobj[i];
    for (let j in obj.name) {
      sncheckobj[obj.name[j]] = obj.url;
    }
  }
  return [ snobj, sncheckobj ];
}

export async function makefile(snobj: { name: string[], url: string }[]): Promise<string> {
  var sucnum = 0;
  var errnum = 0;
  var errlog: string[] = [];
  for (let i in snobj) {
    let val = snobj[i];
    const args = val.url.trim().split("/");
    if (args.length > 1) {
      if (!existsSync(`${signaturefilepath}${args[0]}`)) mkdirSync(`${signaturefilepath}${args[0]}`);
      var getbuf = await axios.get(`${signaturesiteurl}/file/${encodeURI(val.url)}.mp3`, { responseType: "arraybuffer", timeout: 5000 }).catch((err) => {
        return undefined;
      });
      if (getbuf && getbuf.data) {
        writeFile(`${signaturefilepath}${val.url}.mp3`, getbuf.data, (err) => {
          if (err) {
            errnum+=1;
            errlog.push(`${val.url}.mp3파일생성중 오류발생`);
            console.log(`${val.url}파일생성중 오류발생`);
          } else {
            sucnum+=1;
            console.log(`${val.url}파일생성 완료`);
          }
        });
      } else {
        errnum+=1;
        errlog.push(`${val.url}.mp3불러오는중 오류발생`);
        console.log(`${val.url}불러오는중 오류발생`);
      }
    }
  }
  return `성공적으로 불러온 시그니쳐: ${sucnum}개\n오류난 시그니쳐: ${errnum}개\n${errnum ? `오류코드:\n${errlog.join("\n")}` : ""}`;
}