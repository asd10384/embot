import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { ApplicationCommandOptionType, ChannelType, EmbedBuilder } from "discord.js";
import MDB from "../database/Mysql";
import { DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import nowdate from "../function/nowdate";
import { signaturelist } from "./시그니쳐";
import { restartsignature } from "../tts/tts";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class TtsCommand implements Command {
  /** 해당 명령어 설명 */
  name = "tts";
  visible = true;
  description = "text to speach";
  information = "TTS 명령어";
  aliases: string[] = [ "ㅅㅅㄴ" ];
  metadata: D = {
    name: this.name,
    description: this.description,
    options: [
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: '채널생성',
        description: 'tts채널 생성',
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'leave',
        description: '봇을 음성에서 내보내기'
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'join',
        description: '봇을 음성에 참가시키기',
        options: [{
          type: ApplicationCommandOptionType.Channel,
          name: 'join_channel',
          description: '참가시킬채널',
          channel_types: [ ChannelType.GuildVoice, ChannelType.GuildStageVoice ],
          required: true
        }]
      },
      {
        type: ApplicationCommandOptionType.SubcommandGroup,
        name: '시그니쳐',
        description: '시그니쳐 관련',
        options: [
          {
            type: ApplicationCommandOptionType.Subcommand,
            name: '목록',
            description: '시그니쳐 확인'
          },
          {
            type: ApplicationCommandOptionType.Subcommand,
            name: "리로드",
            description: "시그니쳐 다시 불러오기"
          }
        ]
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'ban',
        description: '유저 ban',
        options: [{
          type: ApplicationCommandOptionType.User,
          name: '유저',
          description: '유저',
          required: true
        }]
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'unban',
        description: '유저 unban',
        options: [{
          type: ApplicationCommandOptionType.User,
          name: '유저',
          description: '유저',
          required: true
        }]
      }
    ]
  };
  msgmetadata?: { name: string; des: string; }[] = [
    {
      name: "채널생성",
      des: "TTS 채널생성"
    },
    {
      name: "leave",
      des: "봇을 음성에서 내보내기"
    },
    {
      name: "join [Voice Channel]",
      des: "봇을 음성에 참가시키기"
    },
    {
      name: "시그니쳐 목록",
      des: "시그니쳐 확인"
    },
    {
      name: "시그니쳐 리로드",
      des: "시그니쳐 다시 불러오기"
    },
    {
      name: "ban [User] [Number]",
      des: "유저 ban"
    },
    {
      name: "unban [User]",
      des: "유저 unban"
    }
  ];

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    const cmd = interaction.options.data[0];
    if (cmd.name === '채널생성') {
      if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
      return await interaction.editReply({ content: await this.makechannel(interaction) });
    }
    if (cmd.name === 'leave') {
      getVoiceConnection(interaction.guildId!)?.disconnect();
      return await interaction.editReply({ content: '완료' });
    }
    if (cmd.name === 'join') {
      const join_channel = cmd.options ? cmd.options[0]?.channel : undefined;
      if (!join_channel || (join_channel.type !== ChannelType.GuildVoice && join_channel.type !== ChannelType.GuildStageVoice)) return await interaction.editReply({ embeds: [ client.mkembed({
        title: `음성채널을 찾을수없음`,
        color: "DarkRed"
      }) ] });
      joinVoiceChannel({
        adapterCreator: interaction.guild!.voiceAdapterCreator! as DiscordGatewayAdapterCreator,
        channelId: join_channel.id,
        guildId: interaction.guildId!
      });
      return await interaction.editReply({ content: '완료' });
    }
    if (cmd.name === '시그니쳐') {
      if (cmd.options && cmd.options[0]?.name === '목록') return await interaction.editReply({ embeds: await signaturelist(interaction.guild!) });
      if (cmd.options && cmd.options[0]?.name === "리로드") {
        const log = await restartsignature();
        return await interaction.editReply({ content: `${log}` });
      }
    }
    if (cmd.name === 'ban') {
      if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
      const user = interaction.options.getUser("유저", true);
      return await interaction.editReply({ embeds: [ await this.ban(interaction, user.id, -1) ] });
    }
    if (cmd.name === 'unban') {
      if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
      const user = interaction.options.getUser("유저", true);
      return await interaction.editReply({ embeds: [ await this.unban(interaction, user.id) ] });
    }
  }
  async msgrun(message: M, args: string[]) {
    if (args[0] === '채널생성') {
      if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
      await this.makechannel(message);
      return;
    }
    if (args[0] === 'leave') {
      getVoiceConnection(message.guildId!)?.disconnect();
      return;
    }
    if (args[0] === 'join') {
      if (args[1] && message.guild?.channels.cache.some((ch) => ch.id === args[1])) {
        const join_channel = message.guild.channels.cache.get(args[1]);
        if (join_channel) {
          joinVoiceChannel({
            adapterCreator: message.guild.voiceAdapterCreator! as DiscordGatewayAdapterCreator,
            channelId: join_channel.id,
            guildId: message.guildId!
          });
          return;
        }
        return message.channel.send({ content: "채널을 찾을수 없음" }).then(m => client.msgdelete(m, 1));
      }
      return message.channel.send({ content: "채널을 찾을수 없음" }).then(m => client.msgdelete(m, 1));
    }
    if (args[0] === '시그니쳐') {
      if (args[1] === '목록') return await message.channel.send({ embeds: await signaturelist(message.guild!) }).then(m => client.msgdelete(m, 8));
      if (args[1] === "리로드") {
        await restartsignature();
        return message.channel.send({ content: `시그니쳐를 성공적으로 불러왔습니다.` }).then(m => client.msgdelete(m, 2));
      }
    }
    if (args[0] === 'ban') {
      if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
      let uid = (args[1].startsWith("<@") && args[1].endsWith(">")) ? args[1].replace(/\<|\@|\>|\!/g,"") : args[1];
      if (args[1] && message.guild?.members.cache.some((mem) => mem.id === uid)) {
        if (args[2] && parseInt(args[2]) !== NaN) {
          if (parseInt(args[2]) > 0) {
            return message.channel.send({ embeds: [ await this.ban(message, uid, parseInt(args[2])) ] }).then(m => client.msgdelete(m, 2));
          }
        }
        return message.channel.send({ embeds: [ await this.ban(message, uid, -1) ] }).then(m => client.msgdelete(m, 2));
      }
      return message.channel.send({ content: "유저를 찾을수없음" }).then(m => client.msgdelete(m, 1));
    }
    if (args[0] === 'unban') {
      if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
      let uid = (args[1].startsWith("<@") && args[1].endsWith(">")) ? args[1].replace(/\^|\@|\>/g,"") : args[1];
      if (args[1] && message.guild?.members.cache.some((mem) => mem.id === uid)) {
        return message.channel.send({ embeds: [ await this.unban(message, uid) ] }).then(m => client.msgdelete(m, 2));
      }
      return message.channel.send({ content: "유저를 찾을수없음" }).then(m => client.msgdelete(m, 1));
    }
    return message.channel.send({ embeds: [ this.help() ] }).then(m => client.msgdelete(m, 4));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async makechannel(message: I | M): Promise<string> {
    let guildDB = await MDB.get.guild(message.guild!);
    if (!guildDB) return "생성실패: 데이터베이스 오류";
    const channel = await message.guild?.channels.create({
      name: 'TTS채널',
      type: ChannelType.GuildText,
      topic: `봇을 사용한뒤 ${client.prefix}tts leave 명령어를 입력해 내보내 주세요.`
    });
    if (!channel) return "생성실패: 채널생성 오류";
    guildDB.tts.channelId = channel.id;
    channel.send({
      embeds: [
        client.mkembed({
          title: `TTS채널입니다.`,
          description: `**음성채널에 들어가신 뒤\n이곳에 채팅을 입력하시면\n봇( <@${client.user?.id}> )이 음성에\n들어와 채팅을 읽어줍니다.**`
        })
      ]
    });
    return await MDB.update.guild(guildDB.id, { tts: JSON.stringify(guildDB.tts) }).then((val) => {
      if (!val) return "생성실패: 데이터베이스 저장 오류";
      return `<#${channel.id}> 생성 완료`;
    }).catch((err) => {
      return "생성실패: 데이터베이스 저장 오류";
    });
  }

  async ban(message: I | M, userId: string, time: number): Promise<EmbedBuilder> {
    const member = message.guild?.members.cache.get(userId);
    if (member) {
      let userDB = await MDB.get.user(member);
      if (userDB) {
        if (userDB.tts.some((ttsDB) => ttsDB.guildId === message.guildId!)) return client.mkembed({
          title: `\` TTS ban 오류 \``,
          description: `\` ${(member.nickname) ? member.nickname : member.user.username} \` 님은 이미 ban 되어있습니다.`,
          color: "DarkRed"
        });
        userDB.tts.push({
          guildId: message.guildId!,
          time: Date.now()+(time * 1000),
          date: nowdate(),
          inf: (time > 0) ? false : true,
          banforid: message.member!.user.id
        });
        return await MDB.update.user(userDB.id, { tts: JSON.stringify(userDB.tts) }).then((val) => {
          if (!val) return client.mkembed({
            title: `\` 데이터베이스 오류 \``,
            description: `다시 시도해주세요.\n(업데이트 오류)`,
            color: "DarkRed"
          });
          message.guild?.members.cache.get(userDB!.id)?.user.send({
            embeds: [
              client.mkembed({
                author: { name: message.guild?.name!, iconURL: message.guild?.iconURL()! },
                title: `\` TTS ban \``,
                description: `
                  \` 당신은 TTS ban 되었습니다. \`
  
                  당신은 ${message.guild.name} 서버에서
                  ${time < 0 ? "무기한" : `${time}초`} 동안
                  TTS 를 사용할수 없습니다.
  
                  ban한사람 : <@${message.member!.user.id}>
                  ban된시간 : ${nowdate()}
                `,
                color: "Red"
              })
            ]
          });
          return client.mkembed({
            title: `\` TTS ban \``,
            description: `\` ${(member.nickname) ? member.nickname : member.user.username} \` 님을 ban 했습니다.\n시간 : ${time < 0 ? "무기한" : `${time}초`}`
          });
        }).catch((err) => {
          return client.mkembed({
            title: `\` 데이터베이스 오류 \``,
            description: `다시 시도해주세요.\n(업데이트 오류)`,
            color: "DarkRed"
          });
        })
      } else {
        return client.mkembed({
          title: `\` 데이터베이스 오류 \``,
          description: `다시 시도해주세요.\n(불러오기 오류)`,
          color: "DarkRed"
        });
      }
    } else {
      return client.mkembed({
        title: `\` TTS ban 오류 \``,
        description: `유저를 찾을수 없습니다.`,
        color: "DarkRed"
      });
    }
  }
  async unban(message: I | M, userId: string): Promise<EmbedBuilder> {
    const member = message.guild?.members.cache.get(userId);
    if (member) {
      let userDB = await MDB.get.user(member);
      if (userDB) {
        if (userDB.tts.some((ttsDB) => ttsDB.guildId === message.guildId!)) {
          userDB.tts.splice(userDB.tts.findIndex(ttsDB => ttsDB.guildId === message.guildId!), 1);
          return await MDB.update.user(userDB.id, { tts: JSON.stringify(userDB.tts) }).then((val) => {
            if (!val) return client.mkembed({
              title: `\` 데이터베이스 오류 \``,
              description: `다시 시도해주세요.\n(업데이트 오류)`,
              color: "DarkRed"
            });
            message.guild?.members.cache.get(userDB!.id)?.user.send({
              embeds: [
                client.mkembed({
                  author: { name: message.guild?.name!, iconURL: message.guild?.iconURL()! },
                  title: `\` TTS unban \``,
                  description: `
                    \` 당신은 TTS unban 되었습니다. \`
  
                    당신은 ${message.guild.name} 서버에서
                    TTS 를 사용할수 있습니다.
  
                    unban한사람 : <@${message.member!.user.id}>
                    unban된시간 : ${nowdate()}
                  `,
                  color: "Red"
                })
              ]
            });
            return client.mkembed({
              title: `\` TTS unban \``,
              description: `\` ${(member.nickname) ? member.nickname : member.user.username} \` 님을 unban 했습니다.`
            });
          }).catch((err) => {
            return client.mkembed({
              title: `\` 데이터베이스 오류 \``,
              description: `다시 시도해주세요.\n(업데이트 오류)`,
              color: "DarkRed"
            });
          })
        } else {
          return client.mkembed({
            title: `\` TTS unban 오류 \``,
            description: `\` ${(member.nickname) ? member.nickname : member.user.username} \` 님은 이미 unban 되어있습니다.`,
            color: "DarkRed"
          });
        }
      } else {
        return client.mkembed({
          title: `\` 데이터베이스 오류 \``,
          description: `다시 시도해주세요.\n(불러오기 오류)`,
          color: "DarkRed"
        });
      }
    } else {
      return client.mkembed({
        title: `\` TTS ban 오류 \``,
        description: `유저를 찾을수 없습니다.`,
        color: "DarkRed"
      });
    }
  }
}