import { client } from "../index";
// import { check_permission as ckper, embed_permission as emper } from "../utils/Permission";
import { Command } from "../interfaces/Command";
import { Guild, EmbedBuilder, ApplicationCommandOptionType, ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
import { QDB } from "../databases/Quickdb";

/**
 * DB
 * let GDB = await MDB.get.guild(interaction.guild!);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return (message.channel as TextChannel).send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class implements Command {
  /** 해당 명령어 설명 */
  name = "option";
  visible = true;
  description = "설정";
  information = "설정";
  aliases: string[] = [  ];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description,
    options: [
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "set-tts-length",
        description: "TTS 글자수 제한 설정",
        options: [{
          type: ApplicationCommandOptionType.Number,
          name: "글자길이",
          description: "TTS 최대 글자수"
        }]
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "set-tts-move",
        description: "TTS 음성이동 제한",
        options: [{
          type: ApplicationCommandOptionType.Boolean,
          name: "선택",
          description: "TRUE or FALSE"
        }]
      }
    ]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    const cmd = interaction.options.data[0];
    if (cmd.name === "set-tts-length") return await interaction.followUp({ embeds: [ await this.setttslength(interaction.guild!, cmd.options ? cmd.options[0]?.value as number : null) ] });
    if (cmd.name === "set-tts-move") return await interaction.followUp({ embeds: [ await this.setttsmove(interaction.guild!, cmd.options ? cmd.options[0]?.value as boolean : null) ] });
    return await interaction.followUp({ embeds: [ this.help() ] });
  }
  // async msgrun(message: Message, args: string[]) {
  //   return (message.channel as TextChannel).send({ embeds: [
  //     client.mkembed({
  //       title: `/option`,
  //       description: `명령어를 사용해주세요.`,
  //       color: "DarkRed"
  //     })
  //   ] }).then(m => client.msgdelete(m, 1));
  // }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async setttslength(guild: Guild, length: number | null): Promise<EmbedBuilder> {
    const GDB = await QDB.guild.get(guild);
    if (length === null) return client.mkembed({
      title: `현재 TTS 최대글자수`,
      description: `**${GDB.tts.length ? GDB.tts.length : 300}**`
    });
    if (length > 1000) return client.mkembed({
      title: "길이오류",
      description: "최대 1000자까지 설정가능",
      color: "DarkRed"
    });
    if (length < 5) return client.mkembed({
      title: "길이오류",
      description: "최소 5자까지 설정가능",
      color: "DarkRed"
    });
    let old = GDB.tts.length ? GDB.tts.length : 300;
    return await QDB.guild.set(guild, { tts: {
      ...GDB.tts,
      length: length
    } }).then((val) => {
      if (!val) return client.mkembed({
        title: "데이터베이스오류",
        description: "데이터베이스 적용 실패",
        color: "DarkRed"
      });
      return client.mkembed({
        title: "설정완료",
        description: `TTS 글자 최대길이\n${old} -> ${length}`,
      });
    }).catch(() => {
      return client.mkembed({
        title: "데이터베이스오류",
        description: "데이터베이스 적용 실패",
        color: "DarkRed"
      });
    });
  }

  async setttsmove(guild: Guild, move: boolean | null): Promise<EmbedBuilder> {
    const tdb = client.gettts(guild);
    if (move === null) return client.mkembed({
      title: `현재 TTS 이동가능`,
      description: `**${tdb.move ? "활성화" : "비활성화"}**`
    });
    let old = tdb.move;
    tdb.setmove(move);
    return client.mkembed({
      title: `설정완료`,
      description: `TTS 이동가능\n${old ? "활성화" : "비활성화"} -> ${move ? "활성화" : "비활성화"}`
    });
  }
}