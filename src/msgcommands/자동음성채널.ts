import { client } from "..";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { MsgCommand as Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { GuildChannel, MessageActionRow, MessageButton, ThreadChannel, VoiceChannel } from "discord.js";
import mkembed from "../function/mkembed";
import MDB from "../database/Mongodb";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 자동음성채널 명령어 */
export default class 자동음성채널Command implements Command {
  /** 해당 명령어 설명 */
  metadata = {
    name: '자동음성채널',
    description: '자동음성채널 명령어',
    aliases: []
  };

  /** 실행되는 부분 */
  async run(message: M, args: string[]) {
    if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
    let guildDB = await MDB.get.guild(message);
    let channel: GuildChannel | ThreadChannel | undefined;
    if (args[1]) {
      channel = message.guild?.channels.cache.get(args[1]);
      if (channel && channel.type !== 'GUILD_VOICE') {
        return message.channel.send({
          embeds: [
            mkembed({
              title: `\` 채널 오류 \``,
              description: `입력한 채널은 음성채널이 아닙니다.`,
              footer: { text: `도움말: ${client.prefix}자동음성채널 도움말` },
              color: 'DARK_RED'
            })
          ]
        }).then(m => client.msgdelete(m, 1));
      }
    }
    if (args[0] === '목록') {
      const embed = mkembed({
        title: `\` 자동음성채널 목록 \``,
        color: 'ORANGE'
      });
      guildDB!.autovc.first.forEach((obj) => {
        embed.addField(`<#${obj.categoryID}>`, `<#${obj.channelID}>`, true);
      });
      if (guildDB!.autovc.first.length < 1) embed.addField(`**없음**`, `**없음**`);
      return message.channel.send({ embeds: [ embed ] }).then(m => client.msgdelete(m, 3));
    }
    if (args[0] === '추가' || args[0] === '생성') {
      if (channel) {
        let same: boolean = false;
        guildDB!.autovc.first.forEach((obj) => {
          if (obj.channelID === channel?.id) same = true;
        });
        if (same) return message.channel.send({
          embeds: [
            mkembed({
              title: `\` 채널 오류 \``,
              description: `입력한 채널은 이미 자동음성채널에 등록된 채널입니다.\n${client.prefix}자동음성채널 목록\n명령어를 이용해 확인하실수 있습니다.`,
              footer: { text: `도움말: ${client.prefix}자동음성채널 도움말` },
              color: 'DARK_RED'
            })
          ]
        }).then(m => client.msgdelete(m, 1));
        if (args[2]) {
          let category = message.guild?.channels.cache.get(args[2]);
          if (category && category.type !== 'GUILD_CATEGORY') return message.channel.send({
            embeds: [
              mkembed({
                title: `\` 카테고리 오류 \``,
                description: `입력한 카테고리는 카테고리가 아닙니다.`,
                footer: { text: `도움말: ${client.prefix}자동음성채널 추가` },
                color: 'DARK_RED'
              })
            ]
          }).then(m => client.msgdelete(m, 1));
          if (args[3]) {
            let number = parseInt(args[3], 10);
            if (!number && number !== 0) return message.channel.send({
              embeds: [
                mkembed({
                  title: `\` 숫자 오류 \``,
                  description: `입력한 숫자는 숫자가 아닙니다.`,
                  footer: { text: `도움말: ${client.prefix}자동음성채널 추가` },
                  color: 'DARK_RED'
                })
              ]
            }).then(m => client.msgdelete(m, 1));
            if (number < 0 || number > 99) return message.channel.send({
              embeds: [
                mkembed({
                  title: `\` 숫자 오류 \``,
                  description: `숫자는 0~99 사이의 숫자를 입력해야합니다.`,
                  footer: { text: `도움말: ${client.prefix}자동음성채널 추가` },
                  color: 'DARK_RED'
                })
              ]
            }).then(m => client.msgdelete(m, 1));
            guildDB!.autovc.first.push({
              channelID: channel.id,
              categoryID: category?.id!,
              limit: number
            });
            guildDB!.save().catch((err) => console.error(err));
            return message.channel.send({
              embeds: [
                mkembed({
                  title: `\` 자동음성채널 추가 \``,
                  description: `
                    앞으로
                    <#${channel.id}>
                    에 들어가면 새로운 음성채널이
                    <#${category?.id}>
                    에 생성됩니다.
                  `,
                  footer: { text: `도움말: ${client.prefix}자동음성채널 도움말` },
                  color: 'ORANGE'
                })
              ]
            }).then(m => client.msgdelete(m, 2.5));
          }
        }
      }
      return message.channel.send({
        embeds: [
          mkembed({
            title: `\` 자동음성채널 추가 명령어 \``,
            description: `
              사용법: ${client.prefix}자동음성채널 추가 [음성채널아이디] [카테고리아이디] [숫자]
               - [음성채널아이디]는 등록할 채널아이디
               - [카테고리아이디]는 생성된 채널이 들어간 카테고리아이디
               - [숫자]는 생성된 채널의 최대 인원수 (0으로 설정하면 제한없음)
              예시: ${client.prefix}자동음성채널 추가 789051931590000644 789051931590000641 3
            `,
            color: 'DARK_RED'
          })
        ]
      }).then(m => client.msgdelete(m, 4));
    }
    if (args[0] === '제거') {
      if (channel) {
        let same: boolean = false;
        let list: { channelID: string, categoryID: string, limit: number }[] = [];
        guildDB!.autovc.first.forEach((obj) => {
          if (channel!.id !== obj.channelID) {
            list.push(obj);
          } else {
            same = true;
          }
        });
        if (same) {
          guildDB!.autovc.first = list;
          guildDB!.save().catch((err) => console.error(err));
          return message.channel.send({
            embeds: [
              mkembed({
                title: `\` 자동음성채널 제거 \``,
                description: `<#${channel!.id}> 제거 완료`,
                footer: { text: `목록: ${client.prefix}자동음성채널 목록` },
                color: 'ORANGE'
              })
            ]
          }).then(m => client.msgdelete(m, 2));
        } else {
          return message.channel.send({
            embeds: [
              mkembed({
                title: `\` 자동음성채널 제거 오류 \``,
                description: `<#${channel!.id}> 채널이 등록되어있지 않습니다.`,
                footer: { text: `목록: ${client.prefix}자동음성채널 목록` },
                color: 'DARK_RED'
              })
            ]
          }).then(m => client.msgdelete(m, 1));
        }
      }
      return message.channel.send({
        embeds: [
          mkembed({
            title: `\` 자동음성채널 제거 오류 \``,
            description: `채널을 입력해주세요.\n사용법: ${client.prefix}자동음성채널 제거 [음성채널아이디]\n예시: ${client.prefix}자동음성채널 제거 789051931590000644`,
            color: 'DARK_RED'
          })
        ]
      }).then(m => client.msgdelete(m, 1));
    }
    return message.channel.send({
      embeds: [
        mkembed({
          title: `\` 자동음성채널 명령어 \``,
          description: `
            ${client.prefix}자동음성채널 목록
             : 등록된 자동음성채널 목록 확인
            ${client.prefix}자동음성채널 추가
             : 입력한 채널을 자동음성채널에 추가
            ${client.prefix}자동음성채널 제거
             : 입력한 채널을 자동음성채널에서 제거
          `,
          color: 'ORANGE'
        })
      ]
    }).then(m => client.msgdelete(m, 3.5));
  }
}