import { getVoiceConnection } from '@discordjs/voice';
import { ChannelType, VoiceState } from 'discord.js';
import { client } from '../index';
import { QDB } from "../databases/Quickdb";

export const voiceStateUpdate = (oldStats: VoiceState, newStats: VoiceState) => {
  if (oldStats) leave(oldStats);
  if (newStats) join(newStats);
  if (oldStats.member?.id === client.user?.id && oldStats.channel && !newStats.channel) {
    getVoiceConnection(oldStats.guild.id)?.disconnect();
    getVoiceConnection(oldStats.guild.id)?.destroy();
  }
}

async function join(newStats: VoiceState) {
  const GDB = await QDB.guild.get(newStats.guild);
  if (GDB.autovc.first.some((autovcDB) => autovcDB.channelID === newStats.channelId)) {
    const obj = GDB!.autovc.first[GDB!.autovc.first.findIndex((autovcDB) => autovcDB.channelID === newStats.channelId)];
    let name = (newStats.member && newStats.member.nickname) ? newStats.member.nickname : newStats.member?.user.username;
    let id = newStats.member!.id;
    const channel = await newStats.guild.channels.create({
      name: `${name} - 음성채널`,
      type: ChannelType.GuildVoice,
      bitrate: newStats.channel?.bitrate ?? 96000,
      userLimit: obj.limit,
      parent: obj.categoryID
    }).catch(() => {
      return undefined;
    });
    if (!channel) return;
    client.setAutovcSecounds(newStats.guild.id, [
      ...client.getAutovcSecounds(newStats.guild.id),
      { id: channel.id, userId: id }
    ]);
    await QDB.guild.set(newStats.guild!, { autovc: GDB.autovc }).then((val) => {
      if (val) newStats.member?.voice.setChannel(channel);
    }).catch(() => {});
  }
}
async function leave(oldStats: VoiceState) {
  if (oldStats.channel?.members.size! < 1) {
    const cid = oldStats.channelId!;
    const autovcSecounds = client.getAutovcSecounds(oldStats.guild.id);
    if (autovcSecounds.some(v => v.id === cid)) {
      oldStats.channel?.delete().catch(() => {});
      client.setAutovcSecounds(oldStats.guild.id, autovcSecounds.filter(v => v.id !== cid));
    }
  }
}