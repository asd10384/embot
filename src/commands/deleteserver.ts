import { client } from "../index";
import { check_permission as ckper, embed_permission as emper, check_admin as ckadm } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D } from "../aliases/discord.js.js";
import { Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mysql";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction.guild!);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class privateCommand implements Command {
  /** 해당 명령어 설명 */
  name = "설정한서버에서봇지우기";
  visible = false;
  description = "설정한서버에서봇지우기";
  information = "설정한서버에서봇지우기";
  aliases = [];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async msgrun(message: Message, args: string[]) {
    if (!(await ckadm(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
    return message.channel.send({ embeds: [ this.delete(args) ] }).then(m => client.msgdelete(m, 1.5));
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  delete(args: string[]): MessageEmbed {
    if (args[0]) {
      if (args[1]) {
        const textmsglist = args.slice(1).join(" ").split("#@#");
        const getguild = client.guilds.cache.get(args[0]);
        if (!getguild) return client.mkembed({
          title: `서버를 찾을수없음`,
          color: "DARK_RED"
        });
        const channel = getguild.systemChannel;
        if (channel) channel.send({ embeds: [ client.mkembed({
          title: `\` ${textmsglist[0]} \``,
          description: `${textmsglist[1]}`,
          color: "DARK_RED"
        }) ] });
        getguild.leave().catch((err) => {});
        return client.mkembed({
          title: `${getguild.name}서버`,
          description: `
            아이디: ${getguild.id}
            제목: ${textmsglist[0]}
            내용: ${textmsglist[1]}
          `
        });
      }
    }
    return client.mkembed({
      title: `명령어사용오류`,
      color: "DARK_RED"
    });
  }
}