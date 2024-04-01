import "dotenv/config";
import axios from "axios";

export type Voice = "nyuna" | "ngaram" | "nhajun" | "nmeow" | "nkyungtae";

const Cookie = {
  NID_AUT: process.env.CHZZK_NID_AUT?.trim() || "",
  NID_SES: process.env.CHZZK_NID_SES?.trim() || ""
};

const getToken = () => new Promise<string>((res, rej) => {
  axios.get("https://api.chzzk.naver.com/service/v1/alerts/token", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Cookie": Object.entries(Cookie).map(([key, value]) => key+'='+value).join(';')
    },
    responseType: "json"
  }).then((val) => {
    if (!val.data?.content?.token) return rej(val.data?.message || "오류");
    return res(val.data.content.token);
  }).catch((err) => {
    return rej(err.response?.data?.message || "오류");
  });
});

export const textToSpeech = (text: string, voice: Voice) => new Promise<Buffer>(async (res, rej) => {
  axios.post("https://api.chzzk.naver.com/service/v1/alerts/tts", {
    message: text,
    token: await getToken().catch(() => "undefined"),
    type: voice
  }, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Cookie": Object.entries(Cookie).map(([key, value]) => key+'='+value).join(';')
    },
    responseType: "arraybuffer"
  }).then((val) => {
    if (val.status !== 200) return rej(val.data?.message || "오류");
    return res(val.data);
  }).catch((err) => {
    return rej(err.response?.data?.message || "오류");
  });
});
