export default function replacemsg(text: string) {
  text = text.replace(/\?/gi, '물음표');
  text = text.replace(/\!/gi, '느낌표');
  text = text.replace(/\~/gi, '물결');
  text = text.replace(/\+/gi, '더하기');
  text = text.replace(/\-/gi, '빼기');
  text = text.replace(/\(/gi, '여는소괄호');
  text = text.replace(/\)/gi, '닫는소괄호');
  text = text.replace(/\{/gi, '여는중괄호');
  text = text.replace(/\}/gi, '닫는중괄호');
  text = text.replace(/\[/gi, '여는대괄호');
  text = text.replace(/\]/gi, '닫는대괄호');
  return text;
};