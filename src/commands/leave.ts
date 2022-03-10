import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js";
import { Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import { getVoiceConnection } from "@discordjs/voice";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class ExampleCommand implements Command {
  /** 해당 명령어 설명 */
  name = "leave";
  visible = true;
  description = "tts leave";
  information = "tts leave";
  aliases = [];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    getVoiceConnection(interaction.guildId!)?.disconnect();
    return await interaction.editReply({ content: '완료' });
  }
  async msgrun(message: M, args: string[]) {
    getVoiceConnection(message.guildId!)?.disconnect();
    return;
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }
}