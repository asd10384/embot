
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
