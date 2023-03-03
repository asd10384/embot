import { client } from "../index";
import { Command } from "../interfaces/Command";
import { ChatInputApplicationCommandData, CommandInteraction, EmbedBuilder, Message } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

/**
 * DB
 * const GDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return (message.channel as TextChannel).send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

export default class implements Command {
  /** 해당 명령어 설명 */
  name = "leave";
  visible = true;
  description = "tts leave";
  information = "tts leave";
  aliases: string[] = [];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    getVoiceConnection(interaction.guildId!)?.disconnect();
    return await interaction.editReply({ content: '완료' });
  }
  async messageRun(message: Message, _args: string[]) {
    getVoiceConnection(message.guildId!)?.disconnect();
    return;
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }
}