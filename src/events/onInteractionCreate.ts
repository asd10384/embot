import { slash } from '..';
import { Interaction } from 'discord.js';

export default async function onInteractionCreate (interaction: Interaction) {
  if (!interaction.isCommand()) return;

  /**
   * 명령어 친사람만 보이게 설정
   * ephemeral: true
   */
  await interaction.deferReply({ ephemeral: true }).catch(() => {});
  slash.runCommand(interaction);
}