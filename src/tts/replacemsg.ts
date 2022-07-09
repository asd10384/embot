import { Guild } from "discord.js";

export const replaceobj: {
  [key: string]: string
} = {
  '\\?': '물음표',
  '\\!': '느낌표',
  '\\~': '물결',
  '\\+': '더하기',
  '\\-': '빼기',
  '\\(': '여는소괄호',
  '\\)': '닫는소괄호',
  '\\{': '여는중괄호',
  '\\}': '닫는중괄호',
  '\\[': '여는대괄호',
  '\\]': '닫는대괄호',
  'ㄹㅇ': '리얼',
  'ㅅㅂ': '시바',
  'ㄲㅂ': '까비',
  'ㅎㅇ': '하이',
  'ㅇㅋ': '오키',
  'ㄴㅇㅅ': '나이스',
  'ㅇㅈ': '인정',
  'ㅅㄱ': '수고',
  '시발': '야발',
  '씨발': '야발',
  '개새끼': '멍새끼',
  'ㅇㅎ': '아하'
};
let msglist: string[] = [];
for (let i in replaceobj) {
  msglist.push(i);
}
export const repalcelist = msglist;

export function replacetext(guild: Guild, text: string): string {
  if (text.length === 0) return "파일";
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
    const member = guild.members.cache.get(t.replace(/[^0-9]/g,''));
    return (member) ? (member.nickname) ? member.nickname : (member.user) ? member.user.username : '유저' : '유저';
  });
  text = text.replace(/\<a?\:.*\:[(0-9)]{18}\>/g, (t) => {
    return '이모티콘';
  });
  return text;
}