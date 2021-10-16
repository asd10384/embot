import { client } from "..";
import { SlashCommand as Command } from "../interfaces/Command";
import { I, D } from "../aliases/discord.js.js";
import { MessageActionRow, MessageButton } from "discord.js";
import mkembed from "../function/mkembed";
import format_date from "../function/format";

/** 유저 명령어 */
export default class UserCommand implements Command {
  /** 해당 명령어 설명 */
  metadata = <D>{
    name: 'user',
    description: '유저 정보 확인',
    options: [{
      type: 'USER',
      name: '유저',
      description: '확인하고싶은 유저 입력',
      required: true
    }]
  };

  /** 실행되는 부분 */
  async run(interaction: I) {
    const userid = interaction.options.getUser('유저', true).id;
    const member = interaction.guild?.members.cache.get(userid);
    const servername = interaction.guild?.name;
    const servericon = interaction.guild?.iconURL();
    const isbot = member?.user.bot;
    const name = (member?.nickname) ? member?.nickname : member?.user.username;
    const tag = member?.user.tag;
    const avatar = member?.user.displayAvatarURL();
    const joindate = format_date(member?.joinedAt!);
    let roles: string = '';
    member?.roles.cache.forEach((role) => {
      if (role && role.name) roles += role.name + '\n';
    });
    await interaction.editReply({
      embeds: [
        mkembed({
          author: { name: servername!, iconURL: servericon!, url: servericon! },
          title: `\` ${name} \` 정보 ${(isbot) ? '(BOT)' : ''}`,
          thumbnail: avatar!,
          description: `
            \` 아이디 \`
            ${userid}

            \` 태그 \`
            ${tag}

            \` 서버에 들어온 날짜 \`
            ${joindate}

            \` 역할 \`
            ${roles}
          `,
          color: 'ORANGE'
        })
      ]
    });
  }
}