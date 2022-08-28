import { client, handler } from "../index";
import { ChannelType, Message } from 'discord.js';
import MDB from "../database/Mysql";

export default async function onMessageCreate (message: Message) {
  if (message.author.bot || message.channel.type === ChannelType.DM) return;
  if (message.content.startsWith(client.prefix)) {
    const content = message.content.slice(client.prefix.length).trim();
    const args = content.split(/ +/g);
    const commandName = args.shift()?.toLowerCase();
    const command = handler.commands.get(commandName!) || handler.commands.find((cmd) => cmd.aliases.includes(commandName!));
    try {
      if (!command || !command.msgrun) return handler.err(message, commandName);
      command.msgrun(message, args);
    } catch(error) {
      if (client.debug) console.log(error); // 오류확인
      handler.err(message, commandName);
    } finally {
      if (!commandName || commandName == '' || commandName.replace(/\;| +/g,"") === "") return;
      client.msgdelete(message, 20, true);
    }
  } else {
    const guildDB = await MDB.get.guild(message.guild!);
    if (guildDB?.tts.channelId === message.channelId) {
      if (guildDB.tts.use) {
        client.gettts(message.guild!).tts(message, message.content);
      }
    }
  }
}