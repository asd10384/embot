import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import format_date from "../function/format";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class UserCommand implements Command {
  /** 해당 명령어 설명 */
  name = "유저";
  visible = true;
  description = "user";
  information = "유저 정보확인";
  aliases = [ "user" ];
  metadata = <D>{
    name: this.name,
    description: this.description,
    options: [{
      type: 'USER',
      name: '유저',
      description: '확인하고싶은 유저 입력',
      required: true
    }]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    const user = interaction.options.getUser("유저", true);
    const member = interaction.guild!.members.cache.get(user.id)!;
    return await interaction.editReply({ embeds: [ this.user(interaction, member) ] });
  }
  async msgrun(message: M, args: string[]) {
    if (args[0] && message.guild?.members.cache.some((mem) => mem.id === args[0])) {
    const member = message.guild!.members.cache.get(args[0])!;
    return message.channel.send({ embeds: [ this.user(message, member) ] }).then(m => client.msgdelete(m, 4));
    }
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  user(message: I | M, member: GuildMember): MessageEmbed {
    var roles: string = "";
    member?.roles.cache.forEach((role) => {
      if (role && role.name) roles += role.name + '\n';
    });
    return client.mkembed({
      author: { name: message.guild!.name, iconURL: message.guild!.iconURL()! },
      title: `\` ${member.nickname ? member.nickname : member.user.username} \` 정보 ${(member.user.bot) ? '(BOT)' : ''}`,
      thumbnail: member.user.displayAvatarURL(),
      description: `
        \` 아이디 \`
        ${member.user.id}

        \` 태그 \`
        ${member.user.tag}

        \` 서버에 들어온 날짜 \`
        ${format_date(member.joinedAt!)}

        \` 역할 \`
        ${roles}
      `,
      color: 'ORANGE'
    });
  }
}