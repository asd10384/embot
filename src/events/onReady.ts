import "dotenv/config";
import { client, handler } from "..";
import { Logger } from "../utils/Logger";

export const onReady = () => {
  if (!client.user) return;
  const prefix = client.prefix;
  let actlist: { text: string, time: number }[] = eval(process.env.ACTIVITY || '[{ "text": `/help`, time: 10 }, { "text": `${prefix}help`, "time": 10 }]');

  Logger.ready(`Ready! ${client.user.username}`);
  Logger.ready(`prefix: ${prefix}`);
  Logger.ready(`Activity: ${JSON.stringify(actlist)}`);
  Logger.ready(`로그확인: ${client.debug}`);

  if (process.env.REFRESH_SLASH_COMMAND_ON_READY === "true") handler.registCachedCommands(client);

  if (actlist.length < 1) return;
  client.user.setActivity(actlist[0].text);
  if (actlist.length < 2) return;
  let i = 1;
  let time = actlist[1].time;
  setInterval(() => {
    client.user?.setActivity(actlist[i].text);
    if (++i >= actlist.length) i = 0;
    time = actlist[i].time;
  }, time * 1000);
}