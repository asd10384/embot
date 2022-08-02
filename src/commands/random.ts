import { client } from "../index";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class ExampleCommand implements Command {
  /** 해당 명령어 설명 */
  name = "랜덤";
  visible = true;
  description = "랜덤으로 숫자뽑기";
  information = "랜덤으로 숫자뽑기";
  aliases: string[] = [ "random" ];
  metadata: D = {
    name: this.name,
    description: this.description,
    options: [
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "주사위",
        description: "1~6중 랜덤"
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "최대입력",
        description: "0~입력한숫자중 랜덤",
        options: [{
          type: ApplicationCommandOptionType.Number,
          name: "입력",
          description: "최대숫자 입력",
          required: true
        }]
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: "최소최대입력",
        description: "입력한최소숫자~입력한최대숫자중 랜덤",
        options: [{
          type: ApplicationCommandOptionType.String,
          name: "입력",
          description: "최소숫자입력/최대숫자입력",
          required: true
        }]
      }
    ]
  };
  msgmetadata?: { name: string; des: string; }[] = [
    {
      name: "주사위",
      des: "1~6중 랜덤"
    },
    {
      name: "최대입력",
      des: "0~입력한숫자중 랜덤"
    },
    {
      name: "최소최대입력",
      des: "입력한최소숫자~입력한최대숫자중 랜덤"
    }
  ];

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    const cmd = interaction.options.data[0];
    if (cmd.name === "주사위") return await interaction.editReply({ embeds: [ this.dice() ] });
    if (cmd.name === "최대입력") return await interaction.editReply({ embeds: [ this.max(interaction.options.get("입력", true).value as number) ] });
    if (cmd.name === "최소최대입력") {
      const get = (interaction.options.get("입력", true).value as string).replace(/ +/g,"").split("/");
      if (get.length < 2) return await interaction.editReply({ embeds: [ client.mkembed({
        title: `최소숫자입력/최대숫자입력`,
        color: "DarkRed"
      }) ] });
      if (parseInt(get[0]) === NaN || parseInt(get[1]) === NaN) return await interaction.editReply({ embeds: [ client.mkembed({
        title: `숫자를 입력해주세요.`,
        color: "DarkRed"
      }) ] });
      return await interaction.editReply({ embeds: [ this.set(parseInt(get[0]), parseInt(get[1])) ] });
    }
  }
  async msgrun(message: M, args: string[]) {
    if (args[0] === "주사위") return message.channel.send({ embeds: [ this.dice() ] }).then(m => client.msgdelete(m, 4));
    if (args[0]) {
      if (parseInt(args[0]) === NaN) return message.channel.send({ embeds: [ client.mkembed({
        title: `\` 숫자를 입력해주세요. \``,
        description: `${client.prefix}랜덤 [숫자] <- 오류`,
        color: "DarkRed"
      }) ] }).then(m => client.msgdelete(m, 1));
      if (args[1]) {
        if (parseInt(args[1]) === NaN) return message.channel.send({ embeds: [ client.mkembed({
          title: `\` 숫자를 입력해주세요. \``,
          description: `${client.prefix}랜덤 [숫자] [숫자] <- 오류`,
          color: "DarkRed"
        }) ] }).then(m => client.msgdelete(m, 1));
        return message.channel.send({ embeds: [ this.set(parseInt(args[0]), parseInt(args[1])) ] }).then(m => client.msgdelete(m, 4));
      }
      return message.channel.send({ embeds: [ this.max(parseInt(args[0])) ] }).then(m => client.msgdelete(m, 4));
    }
    return message.channel.send({ embeds: [ client.mkembed({
      title: `\` 사용법 \``,
      description: `
        ${client.prefix}랜덤 주사위 : 1~6중 선택
        ${client.prefix}랜덤 [숫자] : 0~[숫자]중 선택
        ${client.prefix}랜덤 [숫자] [숫자] : [숫자]~[숫자]중 선택
      `
    }) ] }).then(m => client.msgdelete(m, 5));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  dice(): EmbedBuilder {
    return client.mkembed({
      title: `**🎲 주사위**`,
      description: `**${changenum(random(6, 1))}**`
    });
  }

  max(maxnumber: number): EmbedBuilder {
    return client.mkembed({
      title: `**0 ~ ${maxnumber} 랜덤**`,
      description: `**${changenum(random(maxnumber, 0))}**`
    });
  }

  set(minnumber: number, maxnumber: number): EmbedBuilder {
    return client.mkembed({
      title: `**${minnumber} ~ ${maxnumber} 랜덤**`,
      description: `**${changenum(random(maxnumber, minnumber))}**`
    });
  }
}

function random(max: number, min: number = 0): number {
  return Math.floor(Math.random()*(max-min+1)) + min;
}

function changenum(n: string | number): string {
  let ns = n.toString();
  var output: string[] = [];
  for (let i=0; i<ns.length; i++) {
    output.push(bignum(ns[i]));
  }
  return output.join("");
}

function bignum(n: string | number): string {
  return n == 1 ? "1️⃣"
    : n == 2 ? "2️⃣"
    : n == 3 ? "3️⃣"
    : n == 4 ? "4️⃣"
    : n == 5 ? "5️⃣"
    : n == 6 ? "6️⃣"
    : n == 7 ? "7️⃣"
    : n == 8 ? "8️⃣"
    : n == 9 ? "9️⃣"
    : "0️⃣"
}