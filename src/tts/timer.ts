import { client } from "../index";
import { getVoiceConnection } from "@discordjs/voice";

export function set_timer(guildID: string, start: boolean, time?: number) {
  client.ttstimer.set(guildID, { start: start, time: (time) ? time : client.ttstimertime });
}
export function check_timer(guildID: string) {
  const map = client.ttstimer.get(guildID);
  return {
    check: (map) ? true : false,
    map: map
  }
}

setInterval(() => {
  client.ttstimer.forEach((map, guildID) => {
    if (map.start) {
      map.time = map.time-5;
      if (map.time <= 0) {
        const bvcb = getbotchannelboolen(guildID);
        const getvoicechannel = getVoiceConnection(guildID);
        if (bvcb && getvoicechannel) {
          getVoiceConnection(guildID)!.disconnect();
          set_timer(guildID, false);
        } else {
          set_timer(guildID, true);
        }
      } else {
        set_timer(guildID, true, map.time);
      }
    }
  });
}, 5000);

function getbotchannelboolen(guildID: string) {
  if (client.guilds.cache.get(guildID)?.me?.voice.channelId) return true;
  return false;
}