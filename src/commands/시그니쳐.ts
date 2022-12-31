import { client } from "../index";
import { Command } from "../interfaces/Command";
import { EmbedBuilder, ChatInputApplicationCommandData, CommandInteraction, Message } from "discord.js";
import { snobj } from "../tts/ttsClass";

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
  name = "시그니쳐";
  visible = true;
  description = "시그니쳐 목록";
  information = "시그니쳐 목록";
  aliases: string[] = [ "signature" ];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    return await interaction.followUp({ embeds: await signaturelist() });
  }
  async messageRun(message: Message, _args: string[]) {
    return message.channel.send({ embeds: await signaturelist() }).then(m => client.msgdelete(m, 5));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }
}


export async function signaturelist(): Promise<EmbedBuilder[]> {
  let max = 20;
  let page = Math.ceil(snobj.length / 20);
  let embedlist: EmbedBuilder[] = [
    client.mkembed({
      title: `**시그니쳐 목록** [ 1/${page} ]`,
      description: `**진한 글씨 밑에있는 문구를 입력해\n시그니쳐를 사용할수 있습니다.**`
    })
  ];
  snobj.forEach((obj, i) => {
    if (!embedlist[Math.floor(i / max)]) embedlist[Math.floor(i / max)] = client.mkembed({
      title: `**시그니쳐 목록** [ ${Math.floor(i / max) + 1}/${page} ]`
    }) 
    embedlist[Math.floor(i / max)].addFields([{ name: `**${obj.url.replace(/.+\//g, '')}**`, value: `- ${obj.name.join('\n- ')}`, inline: true }]);
  });
  embedlist.push(
    client.mkembed({
      description: `**진한 글씨 밑에있는 문구를 입력해\n시그니쳐를 사용할수 있습니다.**`
    })
  );
  return embedlist;
}