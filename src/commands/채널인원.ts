import { client } from "../index";
// import { check_permission as ckper, embed_permission as emper } from "../utils/Permission";
import { Command } from "../interfaces/Command";
import { GuildMember, EmbedBuilder, ApplicationCommandOptionType, ChannelType, ChatInputApplicationCommandData, CommandInteraction, Message, Guild, TextChannel } from "discord.js";
import { QDB } from "../databases/Quickdb";

/**
 * DB
 * let GDB = await MDB.get.guild(interaction.guild!);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return (message.channel as TextChannel).send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

export default class implements Command {
  /** 해당 명령어 설명 */
  name = "채널인원";
  visible = true;
  description = "내가제작한 자동음성채널의 인원설정";
  information = "내가제작한 자동음성채널의 인원설정";
  aliases = [];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description,
    options: [{
      type: ApplicationCommandOptionType.Integer,
      name: "인원수",
      description: "내가제작한 자동음성채널의 변경할 인원수",
      required: true
    }]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    return await interaction.editReply({ embeds: [ await this.change(interaction.guild!, interaction.member as GuildMember, interaction.options.get("인원수", true).value as number) ] });
  }
  async messageRun(message: Message, args: string[]) {
    if (args[0]) {
      if (!isNaN(args[0] as any)) {
        const limitsize = Number(args[0]);
        if (limitsize <= 0) return (message.channel as TextChannel).send({ embeds: [
          client.mkembed({
            title: `인원수 설정 오류`,
            description: `1보다 낮게 설정할수 없습니다.`,
            color: "DarkRed"
          })
        ] });
        if (limitsize > 99) return (message.channel as TextChannel).send({ embeds: [
          client.mkembed({
            title: `인원수 설정 오류`,
            description: `99보다 크게 설정할수 없습니다.`,
            color: "DarkRed"
          })
        ] });
        return (message.channel as TextChannel).send({ embeds: [ await this.change(message.guild!, message.member!, limitsize) ] }).then(m => client.msgdelete(m, 3));
      }
    }
    return (message.channel as TextChannel).send({ embeds: [
      client.mkembed({
        title: `명령어`,
        description: `${client.prefix}채널인원 [변경할인원수]`,
        color: "DarkRed"
      })
    ] }).then(m => client.msgdelete(m, 1));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async change(guild: Guild, member: GuildMember, changeChannelMemberSize: number): Promise<EmbedBuilder> {
    const GDB = await QDB.guild.get(guild);
    if (!GDB) return client.mkembed({
      title: `데이터베이스를 찾을수없음`,
      description: `다시시도해주세요.`,
      color: "DarkRed"
    });
    if (!GDB.autovc.second.some((autovcDB) => autovcDB.userId === member.id)) return client.mkembed({
      title: `자동음성채널을 찾을수없음`,
      description: `<@${member.id}> 님이 만드신 자동음성채널이 없습니다.`,
      color: "DarkRed"
    });
    const voicechannel = member.voice.channel?.type === ChannelType.GuildVoice
      ? member.voice.channel
      : undefined;
    if (
      !voicechannel
      || !GDB.autovc.second.some((autovcDB) => autovcDB.userId === member.id && autovcDB.id === voicechannel.id)
    ) return client.mkembed({
      title: `음성채널을 찾을수없음`,
      description: `제작한 자동음성채널의 음성에 들어간뒤 사용해주세요.`,
      color: "DarkRed"
    });
    const prename = voicechannel.userLimit;
    voicechannel.setUserLimit(changeChannelMemberSize);
    return client.mkembed({
      title: `채널인원수변경완료`,
      description: `변경전: ${prename}\n변경후: ${changeChannelMemberSize}`
    });
  }
}