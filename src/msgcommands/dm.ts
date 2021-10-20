import { client } from "..";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { MsgCommand as Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { MessageActionRow, MessageButton } from "discord.js";
import mkembed from "../function/mkembed";
import MDB from "../database/Mongodb";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** dm 명령어 */
export default class DmCommand implements Command {
  /** 해당 명령어 설명 */
  metadata = {
    name: 'dm',
    description: '봇이 유저에게 개인 메세지 전송',
    aliases: ['디엠']
  };

  /** 실행되는 부분 */
  async run(message: M, args: string[]) {
    if (args[0] && (args[0] !== '명령어' && args[0] !== '도움말' && args[0] !== 'help')) {
      if (args[0].startsWith('<@') && args[0].endsWith('>')) {
        const member = message.guild?.members.cache.get(args[0].replace(/\<|\@|\!|\>/g,''));
        if (member) {
          if (args[1]) {
            const text = args.slice(1).join(' ');
            member.user.send({ content: `${text}\n\n\` - ${message.guild?.name} 에서 ${(message.member && message.member.nickname) ? message.member.nickname : message.member?.user.username} (이)가 전송함. \`` });
            return message.member?.user.send({
              embeds: [
                mkembed({
                  author: { name: message.guild?.name!, iconURL: message.guild?.iconURL()! },
                  title: `\` ${(member.nickname) ? member.nickname : member.user.username} \` 님에게 디엠 전송완료`,
                  description: `\`내용:\` ${text}`,
                  color: 'ORANGE'
                })
              ]
            });
          }
        } else {
          return message.channel.send({
            embeds: [
              mkembed({
                title: `\` dm 유저 오류 \``,
                description: `유저를 찾을수 없습니다.`,
                footer: { text: `도움말: ${client.prefix}도움말` },
                color: 'DARK_RED'
              })
            ]
          }).then(m => client.msgdelete(m, 1));
        }
      } else {
        return message.channel.send({
          embeds: [
            mkembed({
              title: `\` dm 유저 오류 \``,
              description: `유저를 찾을수 없습니다.`,
              footer: { text: `도움말: ${client.prefix}도움말` },
              color: 'DARK_RED'
            })
          ]
        }).then(m => client.msgdelete(m, 1));
      }
    }
    return message.channel.send({
      embeds: [
        mkembed({
          title: `\` dm 명령어 \``,
          description: `
            사용법: ${client.prefix}dm @user text
            예시: ${client.prefix}dm @${client.user?.username} 안녕하세요.
          `,
          footer: { text: `PREFIX: ${client.prefix}` },
          color: 'ORANGE'
        })
      ]
    }).then(m => client.msgdelete(m, 3.2));
  }
}