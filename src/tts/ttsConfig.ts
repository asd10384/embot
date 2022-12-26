export const TimerTime = (60) * 45; //분

export const sleep = (ms: number) => {
  return new Promise(res => setTimeout(res, ms));
}