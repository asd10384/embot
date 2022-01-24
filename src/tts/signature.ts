import axios from "axios";

export const signaturesiteurl = `https://asd10384.github.io/signaturesite`;

export async function getsignature(): Promise<[ { name: string[], url: string }[], { [key: string]: string }] > {
  let sncheckobj: { [key: string]: string } = {};
  const snobj: { name: string[], url: string }[] = await (await axios.get(`${signaturesiteurl}/signature.json`, { responseType: "json" })).data;
  for (let i in snobj) {
    let obj = snobj[i];
    for (let j in obj.name) {
      eval(`sncheckobj['${obj.name[j]}'] = '${obj.url}'`);
    }
  }
  return [ snobj, sncheckobj ];
}