import { MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";

export const onmessageReactionAdd = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
  if (user.bot) return;
  if (!reaction.message.guildId) return;

  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();

  // const name = reaction.emoji.name;

  // 추가해서 사용
}