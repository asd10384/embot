import { client } from "..";
import { VoiceChannel, VoiceState } from 'discord.js';
import MDB from "../database/Mongodb";

/**
 * DB
 * import MDB from "../database/Mongodb";
 * let guildDB = await MDB.get.guild(interaction);
 */

export default async function voiceStateUpdate (oldStats: VoiceState, newStats: VoiceState) {
  if (oldStats) leave(oldStats);
  if (newStats) join(newStats);
}

async function join(newStats: VoiceState) {
  let guildDB = await MDB.get.guild(newStats);
  guildDB!.autovc.first.forEach(async(obj) => {
    if (newStats.channelId === obj.channelID) {
      let name = (newStats.member && newStats.member.nickname) ? newStats.member.nickname : newStats.member?.user.username;
      const channel = await newStats.guild.channels.create(`${name} - 음성채널`, {
        type: 'GUILD_VOICE',
        bitrate: 96000,
        userLimit: obj.limit,
        parent: obj.categoryID
      });
      guildDB!.autovc.second.push(channel.id);
      guildDB!.save().catch((err) => console.error(err));
      newStats.member?.voice.setChannel(channel);
    }
  });
}
async function leave(oldStats: VoiceState) {
  let guildDB = await MDB.get.guild(oldStats);
  if (oldStats.channel?.members.size! < 1) {
    let list: string[] = [];
    guildDB!.autovc.second.forEach((channelID) => {
      if (oldStats.channelId === channelID) {
        oldStats.channel?.delete();
      } else {
        list.push(channelID);
      }
    });
    guildDB!.autovc.second = list;
    guildDB!.save().catch((err) => console.error(err));
  }
}