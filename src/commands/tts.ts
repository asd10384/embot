import { client } from "..";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { SlashCommand as Command } from "../interfaces/Command";
import { I, D } from "../aliases/discord.js";
import { MessageActionRow, MessageButton } from "discord.js";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import mkembed from "../function/mkembed";
import MDB from "../database/Mongodb";
import { signature_obj } from "../tts/signature";
import { ChannelTypes } from "discord.js/typings/enums";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 */

/** TTS 명령어 */
export default class TtsCommand implements Command {
  /** 해당 명령어 설명 */
  metadata = <D>{
    name: 'tts',
    description: 'text to speach',
    options: [
      {
        type: 'SUB_COMMAND',
        name: '채널생성',
        description: 'tts채널 생성',
      },
      {
        type: 'SUB_COMMAND',
        name: 'leave',
        description: '봇을 음성에서 내보내기'
      },
      {
        type: 'SUB_COMMAND',
        name: 'join',
        description: '봇을 음성에 참가시키기',
        options: [{
          type: 'CHANNEL',
          name: 'join_channel',
          description: '참가시킬채널',
          channel_types: [ChannelTypes.GUILD_VOICE, ChannelTypes.GUILD_STAGE_VOICE],
          required: true
        }]
      },
      {
        type: 'SUB_COMMAND_GROUP',
        name: '시그니쳐',
        description: '시그니쳐 관련',
        options: [{
          type: 'SUB_COMMAND',
          name: '목록',
          description: '시그니쳐 확인'
        }]
      }
    ]
  };

  /** 실행되는 부분 */
  async run(interaction: I) {
    const cmdgrp = interaction.options.getSubcommandGroup(false);
    const cmd = interaction.options.getSubcommand(false);
    const join_channel = interaction.options.getChannel('join_channel', false);
    if (cmd === '채널생성') {
      if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
      let guildDB = await MDB.get.guild(interaction);
      const channel = await interaction.guild?.channels.create('TTS채널', {
        type: 'GUILD_TEXT',
        topic: `봇을 사용한뒤 ${client.prefix}tts leave 명령어를 입력해 내보내 주세요.`
      });
      guildDB!.tts.channelID = channel?.id!;
      guildDB!.save();
      await interaction.editReply({ content: `<#${channel?.id!}> 생성 완료` });
      channel?.send({
        embeds: [
          mkembed({
            title: `TTS채널입니다.`,
            description: `**음성채널에 들어가신 뒤\n이곳에 채팅을 입력하시면\n봇( <@${client.user?.id}> )이 음성에\n들어와 채팅을 읽어줍니다.**`,
            color: 'ORANGE'
          })
        ]
      });
    }
    if (cmd === 'leave') {
      getVoiceConnection(interaction.guildId!)?.disconnect();
      await interaction.editReply({ content: '완료' });
    }
    if (cmd === 'join') {
      if (join_channel && join_channel.id) {
        let guildID = interaction.guildId!;
        joinVoiceChannel({
          adapterCreator: interaction.guild?.voiceAdapterCreator!,
          channelId: join_channel.id,
          guildId: guildID
        });
        await interaction.editReply({ content: '완료' });
      }
    }
    if (cmdgrp === '시그니쳐') {
      if (cmd === '목록') {
        const embed = mkembed({
          title: `\` 시그니쳐 확인 \``,
          footer: { text: '전체 목록' },
          color: 'ORANGE'
        });
        const embed2 = mkembed({
          description: `**진한 글씨 밑에있는 문구를 입력해\n시그니쳐를 사용할수 있습니다.**`,
          color: 'ORANGE'
        });
        signature_obj.forEach((obj) => {
          embed.addField(`**${obj.url.replace(/.+\//g, '')}**`, `- ${obj.name.join('\n- ')}`, true);
        });
        return await interaction.editReply({ embeds: [ embed, embed2 ] });
      }
    }
  }
}