import axios from "axios";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { Logger } from "../utils/Logger";
import { signaturefilepath } from "./tts";
import { sleep } from "./ttsConfig";

export const signaturesiteurl = `https://signaturesite.netlify.app`;

export const getsignature = async (): Promise<[ { name: string[], url: string }[], { [key: string]: string }] > => {
  let sncheckobj: { [key: string]: string } = {};
  const get: { [key: string]: any, data: any } = await axios.get(`${signaturesiteurl}/signature.json`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Encoding": "gzip,deflate,compress",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    },
    responseType: "json",
    timeout: 5000
  }).catch(() => {
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

export const makefile = (snobj: { name: string[], url: string }[]) => new Promise<string>(async (res, _rej) => {
  var sucnum = 0;
  var errnum = 0;
  var errlog: string[] = [];
  for (let i=0; i<snobj.length; i++) {
    let val = snobj[i];
    const args = val.url.trim().split("/");
    if (args.length > 1) if (!existsSync(`${signaturefilepath}/${args[0]}`)) {
      mkdirSync(`${signaturefilepath}/${args[0]}`);
      await sleep(100);
    }
    var getbuf = await axios.get(`${signaturesiteurl}/file/${encodeURI(val.url)}.mp3`, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip,deflate,compress",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
      },
      responseType: "arraybuffer",
      timeout: 5000
    }).catch(() => {
      return undefined;
    });
    let num = ((i+1) < 10) ? "0"+(i+1) : i+1;
    if (getbuf?.data) {
      try {
        writeFileSync(`${signaturefilepath}/${val.url}.mp3`, getbuf.data);
        sucnum+=1;
        Logger.log(`${num}. 파일생성 완료 : ${val.url}`);
      } catch (err) {
        errnum+=1;
        errlog.push(`${num}. 파일생성중 오류발생 : ${val.url}`);
        Logger.error(`${num}. 파일생성중 오류발생 : ${val.url}`);
      }
    } else {
      errnum+=1;
      errlog.push(`${num}. 불러오는중 오류발생 : ${val.url}`);
      Logger.error(`${num}. 불러오는중 오류발생 : ${val.url}`);
    }
  }
  await sleep(500);
  return res(`성공적으로 불러온 시그니쳐: ${sucnum}개\n오류난 시그니쳐: ${errnum}개\n${errnum ? `오류코드:\n${errlog.join("\n")}` : ""}`);
});