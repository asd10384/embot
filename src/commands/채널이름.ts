import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { Guild, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mysql";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction.guild!);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class ExampleCommand implements Command {
  /** 해당 명령어 설명 */
  name = "채널이름";
  visible = true;
  description = "내가제작한 자동음성채널의 이름변경";
  information = "내가제작한 자동음성채널의 이름변경";
  aliases = [];
  metadata = <D>{
    name: this.name,
    description: this.description,
    options: [{
      type: "STRING",
      name: "채널이름",
      description: "내가제작한 자동음성채널의 변경할이름",
      required: true
    }]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: [ await this.change(interaction, interaction.options.getString("채널이름", true)) ] });
  }
  async msgrun(message: M, args: string[]) {
    if (args[0]) return message.channel.send({ embeds: [ await this.change(message, args.join(" ")) ] }).then(m => client.msgdelete(m, 3));
    return message.channel.send({ embeds: [
      client.mkembed({
        title: `명령어`,
        description: `${client.prefix}채널이름 [변경할채널명]`,
        color: "DARK_RED"
      })
    ] }).then(m => client.msgdelete(m, 1));
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async change(message: I | M, changeChannelName: string): Promise<MessageEmbed> {
    const guildDB = await MDB.get.guild(message.guild!);
    if (!guildDB) return client.mkembed({
      title: `데이터베이스를 찾을수없음`,
      description: `다시시도해주세요.`,
      color: "DARK_RED"
    });
    const member = message.member instanceof GuildMember
      ? message.member
      : undefined;
    if (!member) return client.mkembed({
      title: `유저를 찾을수없음`,
      description: `유저를 찾을수 없음`,
      color: "DARK_RED"
    });
    if (!guildDB.autovc.second.some((autovcDB) => autovcDB.userId === member.id)) return client.mkembed({
      title: `자동음성채널을 찾을수없음`,
      description: `<@${member.id}> 님이 만드신 자동음성채널이 없습니다.`,
      color: "DARK_RED"
    });
    const voicechannel = member.voice.channel?.type === "GUILD_VOICE"
      ? member.voice.channel
      : undefined;
    if (
      !voicechannel
      || !guildDB.autovc.second.some((autovcDB) => autovcDB.userId === member.id && autovcDB.id === voicechannel.id)
    ) return client.mkembed({
      title: `음성채널을 찾을수없음`,
      description: `제작한 자동음성채널의 음성에 들어간뒤 사용해주세요.`,
      color: "DARK_RED"
    });
    const prename = voicechannel.name;
    voicechannel.setName(changeChannelName);
    return client.mkembed({
      title: `채널이름변경완료`,
      description: `변경전: ${prename}\n변경후: ${changeChannelName}`
    });
  }
}