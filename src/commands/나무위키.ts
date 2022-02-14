import { client } from "..";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D } from "../aliases/discord.js.js";
import { Message, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 */

/** 핑 명령어 */
export default class 나무위키Command implements Command {
  /** 해당 명령어 설명 */
  name = "나무위키";
  visible = true;
  description = "나무위키 검색";
  information = "나무위키 검색";
  aliases = [  ];
  metadata = <D>{
    name: this.name,
    description: this.description,
    options: [{
      type: "STRING",
      name: "검색",
      description: "나무위키에 검색할 이름",
      required: true
    }]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: [ this.search(interaction.options.getString("검색", true)) ] });
  }
  async msgrun(message: Message, args: string[]) {
    return message.channel.send({ embeds: [ this.search(args[0]) ] }).then(m => client.msgdelete(m, 3));
  }

  search(text: string | undefined): MessageEmbed {
    if (!text || text.length === 0) return client.mkembed({
      title: "검색할 내용을 적어주세요.",
      color: "DARK_RED"
    });
    return client.mkembed({
      title: `**\` ${text} \`**`,
      description: `[${text} 나무위키](https://namu.wiki/w/${text})`,
      url: `https://namu.wiki/w/${text}`
    });
  }
}