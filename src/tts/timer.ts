import { client } from "..";
import { getVoiceConnection } from "@discordjs/voice";

export function set_timer(guildID: string, start: boolean, time?: number) {
  client.ttstimer.set(guildID, { start: start, time: (time) ? time : client.ttstimertime });
}

setInterval(() => {
  client.ttstimer.forEach((map, guildID) => {
    if (map.start) {
      map.time = map.time-5;
      if (map.time <= 0) {
        if (getVoiceConnection(guildID)) {
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