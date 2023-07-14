import { client } from "../index";
// import { check_permission as ckper, embed_permission as emper } from "../utils/Permission";
import { Command } from "../interfaces/Command";
import { GuildMember, EmbedBuilder, ApplicationCommandOptionType, ChannelType, ChatInputApplicationCommandData, CommandInteraction, Message, Guild, TextChannel } from "discord.js";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction.guild!);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return (message.channel as TextChannel).send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

export default class implements Command {
  /** 해당 명령어 설명 */
  name = "채널이름";
  visible = true;
  description = "내가제작한 자동음성채널의 이름변경";
  information = "내가제작한 자동음성채널의 이름변경";
  aliases = [];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description,
    options: [{
      type: ApplicationCommandOptionType.String,
      name: "채널이름",
      description: "내가제작한 자동음성채널의 변경할이름",
      required: true
    }]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    return await interaction.editReply({ embeds: [ await this.change(interaction.guild!, interaction.member as GuildMember, interaction.options.get("채널이름", true).value as string) ] });
  }
  async messageRun(message: Message, args: string[]) {
    if (args[0]) return (message.channel as TextChannel).send({ embeds: [ await this.change(message.guild!, message.member!, args.join(" ")) ] }).then(m => client.msgdelete(m, 3));
    return (message.channel as TextChannel).send({ embeds: [
      client.mkembed({
        title: `명령어`,
        description: `${client.prefix}채널이름 [변경할채널명]`,
        color: "DarkRed"
      })
    ] }).then(m => client.msgdelete(m, 1));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async change(guild: Guild, member: GuildMember, changeChannelName: string): Promise<EmbedBuilder> {
    const autovcSecounds = client.getAutovcSecounds(guild.id);
    if (!autovcSecounds.some(v => v.userId === member.id)) return client.mkembed({
      title: `자동음성채널을 찾을수없음`,
      description: `<@${member.id}> 님이 만드신 자동음성채널이 없습니다.`,
      color: "DarkRed"
    });
    const voicechannel = member.voice.channel?.type === ChannelType.GuildVoice
      ? member.voice.channel
      : undefined;
    if (
      !voicechannel
      || !autovcSecounds.some(v => v.userId === member.id && v.id === voicechannel.id)
    ) return client.mkembed({
      title: `음성채널을 찾을수없음`,
      description: `제작한 자동음성채널의 음성에 들어간뒤 사용해주세요.`,
      color: "DarkRed"
    });
    const prename = voicechannel.name;
    voicechannel.setName(changeChannelName);
    return client.mkembed({
      title: `채널이름변경완료`,
      description: `변경전: ${prename}\n변경후: ${changeChannelName}`
    });
  }
}