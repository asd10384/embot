import axios from "axios";

const SPEED = 0.5;

export const textToSpeech = (text: string) => new Promise<Buffer>(async (res, rej) => {
  axios.get(`https://www.google.com/speech-api/v1/synthesize?${new URLSearchParams({
    "text": text,
    "lang": "ko-kr",
    "speed": SPEED.toString()
  }).toString()}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    },
    responseType: "arraybuffer"
  }).then((val) => {
    if (val.status !== 200) return rej("오류");
    return res(val.data);
  }).catch(() => {
    return rej("오류");
  });
});
