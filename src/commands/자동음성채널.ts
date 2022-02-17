import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { Message, MessageActionRow, MessageButton, MessageEmbed, VoiceChannel } from "discord.js";
import MDB from "../database/Mongodb";
import { ChannelTypes } from "discord.js/typings/enums";

/**
 * DB
 * const guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class 자동음성채널Command implements Command {
  /** 해당 명령어 설명 */
  name = "자동음성채널";
  visible = true;
  description = "자동으로 음성채널 생성";
  information = "자동으로 음성채널 생성";
  aliases = [];
  metadata = <D>{
    name: this.name,
    description: this.description,
    options: [
      {
        type: 'SUB_COMMAND',
        name: '도움말',
        description: 'help'
      },
      {
        type: 'SUB_COMMAND',
        name: '목록',
        description: '등록된 자동음성채널 목록 확인'
      },
      {
        type: 'SUB_COMMAND',
        name: '추가',
        description: '입력한 채널을 자동음성채널에 추가',
        options: [{
          type: "STRING",
          name: "설정",
          description: "[음성채널아이디]/[카테고리아이디]/[숫자]",
          required: true
        }]
      },
      {
        type: 'SUB_COMMAND',
        name: '제거',
        description: '입력한 채널을 자동음성채널에서 제거',
        options: [{
          type: 'CHANNEL',
          name: '채널',
          description: '제거할 채널',
          channel_types: [ ChannelTypes.GUILD_VOICE ],
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
  async slashrun(interaction: I) {
    if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
    const cmd = interaction.options.getSubcommand();
    if (cmd === "도움말") return await interaction.editReply({ embeds: [ this.help() ] });
    if (cmd === "목록") return await interaction.editReply({ embeds: [ await this.getlist(interaction) ] });
    if (cmd === "추가") {
      const args = interaction.options.getString("설정", true).trim().split("/");
      return await interaction.editReply({ embeds: [ await this.add(interaction, args, true) ] });
    }
    if (cmd === "제거") {
      const channel = interaction.options.getChannel("채널", true) as VoiceChannel;
      return await interaction.editReply({ embeds: [ await this.remove(interaction, channel, true) ] });
    }
  }
  async msgrun(message: M, args: string[]) {
    if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
    if (args[0] === "목록") return message.channel.send({ embeds: [ await this.getlist(message) ] }).then(m => client.msgdelete(m, 3));
    if (args[0] === "추가") {
      const newargs = args.slice(1);
      return message.channel.send({ embeds: [ await this.add(message, newargs, false) ] }).then(m => client.msgdelete(m, 3));
    }
    if (args[0] === "제거") {
      if (args[1] && message.guild?.channels.cache.some((ch) => ch.id === args[1] && ch.type === "GUILD_VOICE")) {
        const channel = message.guild.channels.cache.get(args[1])! as VoiceChannel;
        return message.channel.send({ embeds: [ await this.remove(message, channel, false) ] }).then(m => client.msgdelete(m, 2));
      }
    }
    return message.channel.send({ embeds: [ this.help() ] }).then(m => client.msgdelete(m, 4));
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async getlist(message: I | M): Promise<MessageEmbed> {
    const embed = client.mkembed({
      title: `\` 자동음성채널 목록 \``,
      color: 'ORANGE'
    });
    const guildDB = await MDB.get.guild(message);
    guildDB!.autovc.first.forEach((obj) => {
      embed.addField(`<#${obj.categoryID}>`, `<#${obj.channelID}>`, true);
    });
    if (guildDB!.autovc.first.length < 1) embed.addField(`**없음**`, `**없음**`);
    return embed;
  }

  async add(message: I | M, args: string[], checkcmd: boolean): Promise<MessageEmbed> {
    if (args[0] && message.guild?.channels.cache.some((ch) => ch.id === args[0] && ch.type === "GUILD_VOICE")) {
      if (args[1] && message.guild?.channels.cache.some((ch) => ch.id === args[1] && ch.type === "GUILD_CATEGORY")) {
        if (args[2] && parseInt(args[2]) !== NaN) {
          if (parseInt(args[2]) >= 0) {
            const guildDB = await MDB.get.guild(message);
            guildDB!.autovc.first.push({
              channelID: args[0],
              categoryID: args[1],
              limit: parseInt(args[2])
            });
            guildDB!.save().catch((err) => console.error(err));
            return client.mkembed({
              title: `\` 자동음성채널 추가 \``,
              description: `
                앞으로
                <#${args[0]}>
                에 들어가면 새로운 음성채널(최대 ${args[2]}명) 이
                <#${args[1]}>
                에 생성됩니다.
              `,
              footer: { text: `목록: ${(checkcmd) ? "/" : client.prefix}자동음성채널 목록` },
              color: 'ORANGE'
            });
          }
          return client.mkembed({
            title: `\` 자동음성채널 추가 오류 \``,
            description: "숫자는 0이상으로 해야함",
            color: "DARK_RED"
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
      color: 'DARK_RED'
    });
  }

  async remove(message: I | M, channel: VoiceChannel, checkcmd: boolean): Promise<MessageEmbed> {
    const guildDB = await MDB.get.guild(message);
    if (guildDB!.autovc.first.some((autovcDB) => autovcDB.channelID === channel.id)) {
      guildDB!.autovc.first.splice(guildDB!.autovc.first.findIndex((autovcDB) => autovcDB.channelID === channel.id), 1);
      guildDB!.save().catch((err) => console.error(err));
      return client.mkembed({
        title: `\` 자동음성채널 제거 \``,
        description: `<#${channel.id}> 제거 완료`,
        footer: { text: `목록: ${(checkcmd) ? "/" : client.prefix}자동음성채널 목록` },
        color: 'ORANGE'
      });
    }
    return client.mkembed({
      title: `\` 자동음성채널 제거 오류 \``,
      description: `<#${channel.id}> 채널이 등록되어있지 않습니다.`,
      footer: { text: `목록: ${(checkcmd) ? "/" : client.prefix}자동음성채널 목록` },
      color: 'DARK_RED'
    });
  }
}