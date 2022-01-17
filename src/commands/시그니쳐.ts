import { client } from "..";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import { getsignature } from "../tts/signature";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class 시그니쳐Command implements Command {
  /** 해당 명령어 설명 */
  name = "시그니쳐";
  visible = true;
  description = "시그니쳐 목록";
  information = "시그니쳐 목록";
  aliases = [ "signature" ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: await signaturelist() });
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send({ embeds: await signaturelist() }).then(m => client.msgdelete(m, 5));
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }
}


export async function signaturelist(): Promise<MessageEmbed[]> {
  let max = 20;
  const sig = await getsignature();
  let page = Math.ceil(sig[0].length / 20);
  let embedlist: MessageEmbed[] = [
    client.mkembed({
      title: `**시그니쳐 목록** [ 1/${page} ]`,
      description: `**진한 글씨 밑에있는 문구를 입력해\n시그니쳐를 사용할수 있습니다.**`,
      color: 'ORANGE'
    })
  ];
  sig[0].forEach((obj, i) => {
    if (!embedlist[Math.floor(i / max)]) embedlist[Math.floor(i / max)] = client.mkembed({
      title: `**시그니쳐 목록** [ ${Math.floor(i / max) + 1}/${page} ]`,
      color: 'ORANGE'
    }) 
    embedlist[Math.floor(i / max)].addField(`**${obj.url.replace(/.+\//g, '')}**`, `- ${obj.name.join('\n- ')}`, true);
  });
  embedlist.push(
    client.mkembed({
      description: `**진한 글씨 밑에있는 문구를 입력해\n시그니쳐를 사용할수 있습니다.**`,
      color: 'ORANGE'
    })
  );
  return embedlist;
}