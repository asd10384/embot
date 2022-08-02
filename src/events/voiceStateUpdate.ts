import { client } from "../index";
import { ChannelType, VoiceState } from 'discord.js';
import MDB from "../database/Mysql";

export default function voiceStateUpdate (oldStats: VoiceState, newStats: VoiceState) {
  if (oldStats) leave(oldStats);
  if (newStats) join(newStats);
}

async function join(newStats: VoiceState) {
  let guildDB = await MDB.get.guild(newStats.guild);
  if (!guildDB) return;
  if (guildDB.autovc.first.some((autovcDB) => autovcDB.channelID === newStats.channelId)) {
    const obj = guildDB!.autovc.first[guildDB!.autovc.first.findIndex((autovcDB) => autovcDB.channelID === newStats.channelId)];
    let name = (newStats.member && newStats.member.nickname) ? newStats.member.nickname : newStats.member?.user.username;
    let id = newStats.member!.id;
    let roles = guildDB.role
    const channel = await newStats.guild.channels.create({
      name: `${name} - 음성채널`,
      type: ChannelType.GuildVoice,
      bitrate: newStats.channel?.bitrate ?? 96000,
      userLimit: obj.limit,
      parent: obj.categoryID
    }).catch((err) => {
      return undefined;
    });
    if (!channel) return;
    guildDB.autovc.second.push({
      id: channel.id,
      userId: id
    });
    return await MDB.update.guild(guildDB.id, { autovc: JSON.stringify(guildDB.autovc) }).then((val) => {
      if (!val) return;
      newStats.member?.voice.setChannel(channel);
      return;
    }).catch((err) => {
      return;
    });
  }
}
async function leave(oldStats: VoiceState) {
  if (oldStats.channel?.members.size! < 1) {
    let guildDB = await MDB.get.guild(oldStats.guild);
    if (!guildDB) return;
    if (guildDB.autovc.second.some((autovcDB) => autovcDB.id === oldStats.channelId)) {
      guildDB.autovc.second.splice(guildDB!.autovc.second.findIndex((autoDB) => autoDB.id === oldStats.channelId), 1);
      return await MDB.update.guild(guildDB.id, { autovc: JSON.stringify(guildDB.autovc) }).then((val) => {
        if (!val) return;
        oldStats.channel?.delete();
        return;
      }).catch((err) => {
        return;
      });
    }
  }
}