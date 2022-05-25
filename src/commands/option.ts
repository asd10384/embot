import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D } from "../aliases/discord.js.js";
import { Guild, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
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
export default class OptionCommand implements Command {
  /** 해당 명령어 설명 */
  name = "option";
  visible = true;
  description = "설정";
  information = "설정";
  aliases = [];
  metadata = <D>{
    name: this.name,
    description: this.description,
    options: [
      {
        type: "SUB_COMMAND",
        name: "set-tts-length",
        description: "TTS 글자수 제한 설정",
        options: [{
          type: "NUMBER",
          name: "글자길이",
          description: "TTS 최대 글자수"
        }]
      },
      {
        type: "SUB_COMMAND",
        name: "set-tts-move",
        description: "TTS 음성이동 제한",
        options: [{
          type: "BOOLEAN",
          name: "선택",
          description: "TRUE or FALSE"
        }]
      }
    ]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    const cmd = interaction.options.getSubcommand();
    if (cmd === "set-tts-length") return await interaction.editReply({ embeds: [ await this.setttslength(interaction.guild!, interaction.options.getNumber("글자길이")) ] });
    if (cmd === "set-tts-move") return await interaction.editReply({ embeds: [ await this.setttsmove(interaction.guild!, interaction.options.getBoolean("선택")) ] });
  }
  // async msgrun(message: Message, args: string[]) {
  //   return message.channel.send({ embeds: [
  //     client.mkembed({
  //       title: `/option`,
  //       description: `명령어를 사용해주세요.`,
  //       color: "DARK_RED"
  //     })
  //   ] }).then(m => client.msgdelete(m, 1));
  // }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async setttslength(guild: Guild, length: number | null): Promise<MessageEmbed> {
    const guildDB = await MDB.get.guild(guild);
    if (!guildDB) return client.mkembed({
      title: "데이터베이스오류",
      description: "데이터베이스 연결 실패",
      color: "DARK_RED"
    });
    if (length === null) return client.mkembed({
      title: `현재 TTS 최대글자수`,
      description: `**${guildDB.tts.length ? guildDB.tts.length : 300}**`
    });
    if (length > 1000) return client.mkembed({
      title: "길이오류",
      description: "최대 1000자까지 설정가능",
      color: "DARK_RED"
    });
    if (length < 5) return client.mkembed({
      title: "길이오류",
      description: "최소 5자까지 설정가능",
      color: "DARK_RED"
    });
    let old = guildDB.tts.length ? guildDB.tts.length : 300;
    guildDB.tts.length = length;
    return await MDB.update.guild(guild.id, { tts: JSON.stringify(guildDB.tts) }).then((val) => {
      if (!val) return client.mkembed({
        title: "데이터베이스오류",
        description: "데이터베이스 적용 실패",
        color: "DARK_RED"
      });
      return client.mkembed({
        title: "설정완료",
        description: `TTS 글자 최대길이\n${old} -> ${length}`,
      });
    }).catch((err) => {
      return client.mkembed({
        title: "데이터베이스오류",
        description: "데이터베이스 적용 실패",
        color: "DARK_RED"
      });
    });
  }

  async setttsmove(guild: Guild, move: boolean | null): Promise<MessageEmbed> {
    const tdb = client.gettts(guild);
    if (move === null) return client.mkembed({
      title: `현재 TTS 이동가능`,
      description: `**${tdb.move}**`
    });
    let old = tdb.move;
    tdb.setmove(move);
    return client.mkembed({
      title: `설정완료`,
      description: `TTS 이동가능\n${old} -> ${move}`
    });
  }
}