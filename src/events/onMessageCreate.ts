import { QDB } from "../databases/Quickdb";
import { ChannelType, Message } from "discord.js";
import { client, handler } from "..";
import { Logger } from "../utils/Logger";

export const onMessageCreate = async (message: Message) => {
  if (message.author.bot || message.channel.type === ChannelType.DM) return;
  if (message.content.startsWith(client.prefix)) {
    const content = message.content.slice(client.prefix.length).trim();
    const args = content.split(/ +/g);
    const commandName = args.shift()?.toLowerCase();
    const command = handler.commands.get(commandName!) || handler.commands.find((cmd) => cmd.aliases.includes(commandName!));
    try {
      if (!command || !command.messageRun) return handler.err(message, commandName);
      command.messageRun(message, args);
    } catch(error) {
      if (client.debug) Logger.error(error as any); // 오류확인
      handler.err(message, commandName);
    } finally {
      client.msgdelete(message, 0, true);
    }
  } else {
    const GDB = await QDB.guild.get(message.guild!);
    if (GDB.tts.channelId === message.channelId) {
      if (GDB.tts.use) {
        client.gettts(message.guild!).tts(message, message.content);
      }
    }
  }
}