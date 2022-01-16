import { client } from "..";
import { VoiceChannel, VoiceState } from 'discord.js';
import MDB from "../database/Mongodb";

/**
 * DB
 * import MDB from "../database/Mongodb";
 * let guildDB = await MDB.get.guild(interaction);
 */

export default function voiceStateUpdate (oldStats: VoiceState, newStats: VoiceState) {
  if (oldStats) leave(oldStats);
  if (newStats) join(newStats);
}

async function join(newStats: VoiceState) {
  let guildDB = await MDB.get.guild(newStats);
  if (guildDB!.autovc.first.some((autovcDB) => autovcDB.channelID === newStats.channelId)) {
    const obj = guildDB!.autovc.first[guildDB!.autovc.first.findIndex((autovcDB) => autovcDB.channelID === newStats.channelId)];
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
}
async function leave(oldStats: VoiceState) {
  if (oldStats.channel?.members.size! < 1) {
    let guildDB = await MDB.get.guild(oldStats);
    if (guildDB!.autovc.second.some((autovcDB) => autovcDB === oldStats.channelId)) {
      guildDB!.autovc.second.splice(guildDB!.autovc.second.findIndex((autoDB) => autoDB === oldStats.channelId), 1);
      guildDB!.save().catch((err) => console.error(err));
      oldStats.channel?.delete();
    }
  }
}