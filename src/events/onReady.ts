import "dotenv/config";
import { restartsignature } from "../tts/tts";
import { client, handler } from "../index";


/** onReady 핸들러 */
export default function onReady() {
  if (!client.user) return;

  const prefix = client.prefix;
  let actlist: { text: string, time: number }[] = eval(process.env.ACTIVITY!);

  console.log('Ready!', client.user.username);
  console.log('Activity:', JSON.stringify(actlist));
  console.log('로그확인:', client.debug);

  if (process.env.REFRESH_SLASH_COMMAND_ON_READY === 'true') handler.registCachedCommands(client);

  console.log("시그니쳐 불러오는중...");
  restartsignature().then((log) => {
    console.log(log);
  }).catch((err) => {
    console.log("시그니쳐 불러오던중 오류발생");
  });

  client.user.setActivity(actlist[0].text);
  let i = 1;
  let time = actlist[1].time;
  setInterval(() => {
    client.user?.setActivity(actlist[i].text);
    if (++i >= actlist.length) i = 0;
    time = actlist[i].time;
  }, time * 1000);
}