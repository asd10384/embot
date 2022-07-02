import axios from "axios";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { client } from "../index";
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
  for (let i=0; i<snobj.length; i++) {
    let val = snobj[i];
    const args = val.url.trim().split("/");
    if (args.length > 1) if (!existsSync(`${signaturefilepath}/${args[0]}`)) mkdirSync(`${signaturefilepath}/${args[0]}`);
    var getbuf = await axios.get(`${signaturesiteurl}/file/${encodeURI(val.url)}.mp3`, { responseType: "arraybuffer", timeout: 5000 }).catch((err) => {
      return undefined;
    });
    let num = ((i+1) < 10) ? "0"+(i+1) : i+1;
    if (getbuf?.data) {
      try {
        writeFileSync(`${signaturefilepath}/${val.url}.mp3`, getbuf.data);
        sucnum+=1;
        console.log(`${num}. 파일생성 완료 : ${val.url}`);
      } catch (err) {
        errnum+=1;
        errlog.push(`${num}. 파일생성중 오류발생 : ${val.url}`);
        console.log(`${num}. 파일생성중 오류발생 : ${val.url}`);
      }
    } else {
      errnum+=1;
      errlog.push(`${num}. 불러오는중 오류발생 : ${val.url}`);
      console.log(`${num}. 불러오는중 오류발생 : ${val.url}`);
    }
  }
  await client.sleep(500);
  return `성공적으로 불러온 시그니쳐: ${sucnum}개\n오류난 시그니쳐: ${errnum}개\n${errnum ? `오류코드:\n${errlog.join("\n")}` : ""}`;
}