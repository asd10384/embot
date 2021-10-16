import { client } from "..";
import { MsgCommand as Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import mkembed from "../function/mkembed";
import format_date from "../function/format";

/** 유저 명령어 */
export default class UserCommand implements Command {
  /** 해당 명령어 설명 */
  metadata = {
    name: 'user',
    description: '유저 정보 확인',
    aliases: ['유저']
  };

  /** 실행되는 부분 */
  async run(message: M, args: string[]) {
    if (args[0] && (args[0].startsWith('<@') && args[0].endsWith('>'))) {
      const userid = args[0].replace(/\<|\@|\!|\>/g,'');
      const member = message.guild?.members.cache.get(userid);
      const servername = message.guild?.name;
      const servericon = message.guild?.iconURL();
      const isbot = member?.user.bot;
      const name = (member?.nickname) ? member?.nickname : member?.user.username;
      const tag = member?.user.tag;
      const avatar = member?.user.displayAvatarURL();
      const joindate = format_date(member?.joinedAt!);
      let roles: string = '';
      member?.roles.cache.forEach((role) => {
        if (role && role.name) roles += role.name + '\n';
      });
      return message.channel.send({
        embeds: [
          mkembed({
            author: { name: servername!, iconURL: servericon!, url: servericon! },
            title: `\` ${name} \` 정보 ${(isbot) ? '(BOT)' : ''}`,
            thumbnail: avatar!,
            description: `
              \` 아이디 \`
              ${userid}

              \` 태그 \`
              ${tag}

              \` 서버에 들어온 날짜 \`
              ${joindate}

              \` 역할 \`
              ${roles}
            `,
            color: 'ORANGE'
          })
        ]
      }).then(m => client.msgdelete(m, 2.2));
    }
    return message.channel.send({
      embeds: [
        mkembed({
          title: `사용법: ${client.prefix}user @user`,
          description: `예시: ${client.prefix}user @${client.user?.username}`,
          footer: { text: `PREFIX: ${client.prefix}` },
          color: 'DARK_RED'
        })
      ]
    }).then(m => client.msgdelete(m, 1));
  }
}