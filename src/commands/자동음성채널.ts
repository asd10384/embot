import { client } from "..";
import { SlashCommand as Command } from "../interfaces/Command";
import { I, D } from "../aliases/discord.js.js";
import { MessageActionRow, MessageButton } from "discord.js";
import mkembed from "../function/mkembed";
import MDB from "../database/Mongodb";
import { ChannelTypes } from "discord.js/typings/enums";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 */

/** 자동음성채널 명령어 */
export default class ExampleCommand implements Command {
  /** 해당 명령어 설명 */
  metadata = <D>{
    name: '자동음성채널',
    description: '자동으로 음성채널 생성',
    options: [
      {
        type: 'SUB_COMMAND',
        name: '목록',
        description: '등록된 자동음성채널 목록 확인'
      },
      {
        type: 'SUB_COMMAND',
        name: '추가',
        description: '입력한 채널을 자동음성채널에 추가'
      },
      {
        type: 'SUB_COMMAND',
        name: '제거',
        description: '입력한 채널을 자동음성채널에서 제거',
        options: [{
          type: 'CHANNEL',
          name: '채널',
          description: '제거할 채널',
          channel_types: [ChannelTypes.GUILD_VOICE],
          required: true
        }]
      }
    ]
  };

  /** 실행되는 부분 */
  async run(interaction: I) {
    const cmd = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('채널');
    let guildDB = await MDB.get.guild(interaction);
    if (cmd === '목록') {
      const embed = mkembed({
        title: `\` 자동음성채널 목록 \``,
        color: 'ORANGE'
      });
      guildDB!.autovc.first.forEach((obj) => {
        embed.addField(`<#${obj.categoryID}>`, `<#${obj.channelID}>`, true);
      });
      if (guildDB!.autovc.first.length < 1) embed.addField(`**없음**`, `**없음**`);
      await interaction.editReply({ embeds: [ embed ] });
    }
    if (cmd === '추가') {
      await interaction.editReply({
        embeds: [
          mkembed({
            title: `\` 자동음성채널 추가 \``,
            description: `이 명령어는 기본 명령어로 사용해주세요.\n사용법: ${client.prefix}자동음성채널 추가`,
            color: 'DARK_RED'
          })
        ]
      });
    }
    if (cmd === '제거') {
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
        await interaction.editReply({
          embeds: [
            mkembed({
              title: `\` 자동음성채널 제거 \``,
              description: `<#${channel!.id}> 제거 완료`,
              footer: { text: `목록: /자동음성채널 목록` },
              color: 'ORANGE'
            })
          ]
        });
      } else {
        await interaction.editReply({
          embeds: [
            mkembed({
              title: `\` 자동음성채널 제거 오류 \``,
              description: `<#${channel!.id}> 채널이 등록되어있지 않습니다.`,
              footer: { text: `목록: /자동음성채널 목록` },
              color: 'DARK_RED'
            })
          ]
        });
      }
    }
  }
}