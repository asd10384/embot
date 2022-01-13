import { client } from "..";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { MsgCommand as Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js";
import { MessageActionRow, MessageButton } from "discord.js";
import { DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import mkembed from "../function/mkembed";
import MDB from "../database/Mongodb";
import { getsignature } from "../tts/signature";
import { check_timer } from "../tts/timer";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** TTS 명령어 */
export default class TtsCommand implements Command {
  /** 해당 명령어 설명 */
  metadata = {
    name: 'tts',
    description: 'text to speach',
    aliases: ['ㅅㅅㄴ']
  };

  /** 실행되는 부분 */
  async run(message: M, args: string[]) {
    if (args[0] === '채널생성') {
      if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
      let guildDB = await MDB.get.guild(message);
      const channel = await message.guild?.channels.create('TTS채널', {
        type: 'GUILD_TEXT',
        topic: `봇을 사용한뒤 ${client.prefix}tts leave 명령어를 입력해 내보내 주세요.`
      });
      guildDB!.tts.channelID = channel?.id!;
      guildDB!.save();
      return channel?.send({
        embeds: [
          mkembed({
            title: `TTS채널입니다.`,
            description: `**음성채널에 들어가신 뒤\n이곳에 채팅을 입력하시면\n봇( <@${client.user?.id}> )이 음성에\n들어와 채팅을 읽어줍니다.**`,
            color: 'ORANGE'
          })
        ]
      });
    }
    if (args[0] === 'leave' || args[0] === 'l') {
      return getVoiceConnection(message.guildId!)?.disconnect();
    }
    if (args[0] === 'join' || args[0] === 'j') {
      const join_channel = message.guild?.channels.cache.get(args[1]);
      if (join_channel && join_channel.id) {
        if (join_channel.isVoice()) {
          let guildID = message.guildId!;
          return joinVoiceChannel({
            adapterCreator: message.guild?.voiceAdapterCreator! as DiscordGatewayAdapterCreator,
            channelId: join_channel.id,
            guildId: guildID
          });
        } else {
          return message.channel.send({
            embeds: [
              mkembed({
                title: `채널에는 음성채널만 가능`,
                footer: { text: `PREFIX: ${client.prefix}` },
                color: 'DARK_RED'
              })
            ]
          }).then(m => client.msgdelete(m, 1));
        }
      }
      return message.channel.send({
        embeds: [
          mkembed({
            title: `채널을 찾을수없습니다.`,
            description: `사용법: ${client.prefix}tts join [voice channel id]\n예시: ${client.prefix}tts join 789051931590000644`,
            footer: { text: `PREFIX: ${client.prefix}` },
            color: 'DARK_RED'
          })
        ]
      }).then(m => client.msgdelete(m, 1));
    }
    if (args[0] === '시그니쳐') {
      if (args[1] === '목록' || args[1] === '확인') {
        const embed = mkembed({
          title: `\` 시그니쳐 확인 \``,
          footer: { text: '전체 목록' },
          color: 'ORANGE'
        });
        const embed2 = mkembed({
          description: `**진한 글씨 밑에있는 문구를 입력해\n시그니쳐를 사용할수 있습니다.**`,
          footer: { text: '이 메세지는 곧 삭제됩니다.' },
          color: 'ORANGE'
        });
        const sig = await getsignature();
        sig[0].forEach((obj) => {
          embed.addField(`**${obj.url.replace(/.+\//g, '')}**`, `- ${obj.name.join('\n- ')}`, true);
        });
        return message.channel.send({ embeds: [ embed, embed2 ] }).then(m => client.msgdelete(m, 4));
      }
    }
    if (args[0] === 'check') {
      if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
      if (args[1] === 'timer') {
        const map = check_timer(message.guild!.id);
        if (map.check && map.map) {
          return message.member?.user.send({
            embeds: [
              mkembed({
                title: `\` TTS \` 타이머`,
                description: `
                  **타이머 :** ${map.map.start}
                  **시간 :** ${map.map.time}
                  **분초 :** ${Math.floor(map.map.time / 60)}분 ${map.map.time % 60}초
                `,
                color: 'ORANGE'
              })
            ]
          }).then(m => client.msgdelete(m, 3));
        } else {
          return message.member?.user.send({
            embeds: [
              mkembed({
                title: `\` TTS \` 타이머`,
                description: `실행되고있지않음`,
                color: 'ORANGE'
              })
            ]
          }).then(m => client.msgdelete(m, 3));
        }
      }
    }
    message.channel.send({
      embeds: [
        mkembed({
          title: `\` TTS \` 명령어`,
          description: `
            **${client.prefix}tts 채널생성**
             : tts채널 생성
            **${client.prefix}tts join**
             : 봇을 음성에 참가시키기
            **${client.prefix}tts leave**
             : 봇을 음성에서 내보내기
            **${client.prefix}tts 시그니쳐 목록**
             : 시그니쳐 목록 확인
          `,
          footer: { text: `PREFIX: ${client.prefix}` },
          color: 'ORANGE'
        })
      ]
    }).then(m => client.msgdelete(m, 2));
  }
}