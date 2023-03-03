import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../utils/Permission";
import { Command } from "../interfaces/Command";
import { ApplicationCommandOptionType, ChannelType, ChatInputApplicationCommandData, CommandInteraction, EmbedBuilder, Guild, Message, VoiceChannel } from "discord.js";
import { QDB } from "../databases/Quickdb";

/**
 * DB
 * const GDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

export default class implements Command {
  /** 해당 명령어 설명 */
  name = "자동음성채널";
  visible = true;
  description = "자동으로 음성채널 생성";
  information = "자동으로 음성채널 생성";
  aliases = [];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description,
    options: [
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: '도움말',
        description: 'help'
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: '목록',
        description: '등록된 자동음성채널 목록 확인'
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: '추가',
        description: '입력한 채널을 자동음성채널에 추가',
        options: [{
          type: ApplicationCommandOptionType.String,
          name: "설정",
          description: "[음성채널아이디]/[카테고리아이디]/[숫자]",
          required: true
        }]
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: '제거',
        description: '입력한 채널을 자동음성채널에서 제거',
        options: [{
          type: ApplicationCommandOptionType.Channel,
          name: '채널',
          description: '제거할 채널',
          channel_types: [ ChannelType.GuildVoice ],
          required: true
        }]
      }
    ]
  };
  msgmetadata?: { name: string; des: string; }[] = [
    {
      name: "도움말",
      des: "help"
    },
    {
      name: "목록",
      des: "등록된 자동음성채널 목록 확인"
    },
    {
      name: "추가 [Voice Channel] [Category Channel] [Number]",
      des: "입력한 채널을 자동음성채널에 추가"
    },
    {
      name: "제거 [Voice Channel]",
      des: "입력한 채널을 자동음성채널에서 제거"
    }
  ];

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    if (!(await ckper(interaction))) return await interaction.followUp({ embeds: [ emper ] });
    const cmd = interaction.options.data[0];
    if (cmd.name === "도움말") return await interaction.followUp({ embeds: [ this.help() ] });
    if (cmd.name === "목록") return await interaction.followUp({ embeds: [ await this.getlist(interaction.guild!) ] });
    if (cmd.name === "추가") {
      const args = (cmd.options![0].value as string).trim().split("/");
      return await interaction.followUp({ embeds: [ await this.add(interaction.guild!, args, true) ] });
    }
    if (cmd.name === "제거") {
      const channel = cmd.options![0].channel as VoiceChannel;
      return await interaction.followUp({ embeds: [ await this.remove(interaction.guild!, channel, true) ] });
    }
    return await interaction.followUp({ embeds: [ this.help() ] });
  }
  async messageRun(message: Message, args: string[]) {
    if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
    if (args[0] === "목록") return message.channel.send({ embeds: [ await this.getlist(message.guild!) ] }).then(m => client.msgdelete(m, 3));
    if (args[0] === "추가") {
      const newargs = args.slice(1);
      return message.channel.send({ embeds: [ await this.add(message.guild!, newargs, false) ] }).then(m => client.msgdelete(m, 3));
    }
    if (args[0] === "제거") {
      if (args[1] && message.guild?.channels.cache.some((ch) => ch.id === args[1] && ch.type === ChannelType.GuildVoice)) {
        const channel = message.guild.channels.cache.get(args[1])! as VoiceChannel;
        return message.channel.send({ embeds: [ await this.remove(message.guild!, channel, false) ] }).then(m => client.msgdelete(m, 2));
      }
    }
    return message.channel.send({ embeds: [ this.help() ] }).then(m => client.msgdelete(m, 4));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async getlist(guild: Guild): Promise<EmbedBuilder> {
    const embed = client.mkembed({
      title: `\` 자동음성채널 목록 \``
    });
    const GDB = await QDB.guild.get(guild);
    GDB.autovc.first.forEach((obj) => {
      embed.addFields([{ name: `<#${obj.categoryID}>`, value: `<#${obj.channelID}>`, inline: true }]);
    });
    if (GDB.autovc.first.length < 1) embed.addFields([{ name: `**없음**`, value: `**없음**` }]);
    return embed;
  }

  async add(guild: Guild, args: string[], checkcmd: boolean): Promise<EmbedBuilder> {
    if (args[0] && guild.channels.cache.some((ch) => ch.id === args[0] && ch.type === ChannelType.GuildVoice)) {
      if (args[1] && guild.channels.cache.some((ch) => ch.id === args[1] && ch.type === ChannelType.GuildCategory)) {
        if (args[2] && !isNaN(args[2] as any)) {
          if (parseInt(args[2]) >= 0) {
            const GDB = await QDB.guild.get(guild);
            GDB.autovc.first.push({
              channelID: args[0],
              categoryID: args[1],
              limit: parseInt(args[2])
            });
            return await QDB.guild.set(guild, { autovc: GDB.autovc }).then((val) => {
              if (!val) return client.mkembed({
                title: `\` 자동음성채널 추가 오류 \``,
                color: "DarkRed"
              });
              return client.mkembed({
                title: `\` 자동음성채널 추가 \``,
                description: `
                  앞으로
                  <#${args[0]}>
                  에 들어가면 새로운 음성채널(최대 ${args[2]}명) 이
                  <#${args[1]}>
                  에 생성됩니다.
                `,
                footer: { text: `목록: ${(checkcmd) ? "/" : client.prefix}자동음성채널 목록` }
              });
            }).catch(() => {
              return client.mkembed({
                title: `\` 자동음성채널 추가 오류 \``,
                color: "DarkRed"
              });
            });
          }
          return client.mkembed({
            title: `\` 자동음성채널 추가 오류 \``,
            description: "숫자는 0이상으로 해야함",
            color: "DarkRed"
          });
        }
      }
    }
    return client.mkembed({
      title: `\` 자동음성채널 추가 명령어 \``,
      description: `
        사용법: ${(checkcmd) ? "/" : client.prefix}자동음성채널 추가 [음성채널아이디] [카테고리아이디] [숫자]
         - [음성채널아이디]는 등록할 채널아이디
         - [카테고리아이디]는 생성된 채널이 들어간 카테고리아이디
         - [숫자]는 생성된 채널의 최대 인원수 (0으로 설정하면 제한없음)
        예시: ${(checkcmd) ? "/" : client.prefix}자동음성채널 추가 789051931590000644${checkcmd ? "/" : " "}789051931590000641${checkcmd ? "/" : " "}3
      `,
      color: 'DarkRed'
    });
  }

  async remove(guild: Guild, channel: VoiceChannel, checkcmd: boolean): Promise<EmbedBuilder> {
    const GDB = await QDB.guild.get(guild);
    if (GDB.autovc.first.some((autovcDB) => autovcDB.channelID === channel.id)) {
      GDB.autovc.first.splice(GDB.autovc.first.findIndex((autovcDB) => autovcDB.channelID === channel.id), 1);
      return await QDB.guild.set(guild, { autovc: GDB.autovc }).then((val) => {
        if (!val) return client.mkembed({
          title: `\` 자동음성채널 제거 오류 \``,
          color: "DarkRed"
        });
        return client.mkembed({
          title: `\` 자동음성채널 제거 \``,
          description: `<#${channel.id}> 제거 완료`,
          footer: { text: `목록: ${(checkcmd) ? "/" : client.prefix}자동음성채널 목록` }
        });
      }).catch(() => {
        return client.mkembed({
          title: `\` 자동음성채널 제거 오류 \``,
          color: "DarkRed"
        });
      });
    }
    return client.mkembed({
      title: `\` 자동음성채널 제거 오류 \``,
      description: `<#${channel.id}> 채널이 등록되어있지 않습니다.`,
      footer: { text: `목록: ${(checkcmd) ? "/" : client.prefix}자동음성채널 목록` },
      color: 'DarkRed'
    });
  }
}