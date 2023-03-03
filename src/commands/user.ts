import { client } from "../index";
import { Command } from "../interfaces/Command";
import { GuildMember, EmbedBuilder, ApplicationCommandOptionType, ChatInputApplicationCommandData, CommandInteraction, Message, Guild, TextChannel } from "discord.js";

/**
 * DB
 * const GDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return (message.channel as TextChannel).send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

export default class implements Command {
  /** 해당 명령어 설명 */
  name = "유저";
  visible = true;
  description = "user";
  information = "유저 정보확인";
  aliases: string[] = [ "user" ];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description,
    options: [{
      type: ApplicationCommandOptionType.User,
      name: '유저',
      description: '확인하고싶은 유저 입력',
      required: true
    }]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    const user = interaction.options.data[0]!.user!;
    const member = interaction.guild!.members.cache.get(user.id)!;
    return await interaction.followUp({ embeds: [ this.user(interaction.guild!, member) ] });
  }
  async messageRun(message: Message, args: string[]) {
    if (args[0] && message.guild?.members.cache.some((mem) => mem.id === args[0])) {
      const member = message.guild!.members.cache.get(args[0])!;
      return (message.channel as TextChannel).send({ embeds: [ this.user(message.guild!, member) ] }).then(m => client.msgdelete(m, 4));
    }
    return (message.channel as TextChannel).send({ embeds: [ this.help() ] }).then(m => client.msgdelete(m, 1));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }
  
  format_date(date: number | Date): string {
    return new Intl.DateTimeFormat('ko-KR').format(date);
  }

  user(guild: Guild, member: GuildMember): EmbedBuilder {
    var roles: string = "";
    member?.roles.cache.forEach((role) => {
      if (role && role.name) roles += role.name + '\n';
    });
    return client.mkembed({
      author: { name: guild.name, iconURL: guild.iconURL()! },
      title: `\` ${member.nickname ? member.nickname : member.user.username} \` 정보 ${(member.user.bot) ? '(BOT)' : ''}`,
      thumbnail: member.user.displayAvatarURL(),
      description: `
        \` 아이디 \`
        ${member.user.id}

        \` 태그 \`
        ${member.user.tag}

        \` 서버에 들어온 날짜 \`
        ${this.format_date(member.joinedAt!)}

        \` 역할 \`
        ${roles}
      `
    });
  }
}