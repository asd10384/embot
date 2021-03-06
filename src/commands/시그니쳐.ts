import { client } from "../index";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { Guild, MessageEmbed } from "discord.js";
import { snobj } from "../tts/tts";

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
    return await interaction.editReply({ embeds: await signaturelist(interaction.guild!) });
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send({ embeds: await signaturelist(message.guild!) }).then(m => client.msgdelete(m, 5));
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }
}


export async function signaturelist(guild: Guild): Promise<MessageEmbed[]> {
  let max = 20;
  const tts = client.gettts(guild);
  let page = Math.ceil(snobj.length / 20);
  let embedlist: MessageEmbed[] = [
    client.mkembed({
      title: `**시그니쳐 목록** [ 1/${page} ]`,
      description: `**진한 글씨 밑에있는 문구를 입력해\n시그니쳐를 사용할수 있습니다.**`,
      color: 'ORANGE'
    })
  ];
  snobj.forEach((obj, i) => {
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