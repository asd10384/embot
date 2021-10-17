import { config } from "dotenv";
import { I, M } from "../aliases/discord.js";
import { connect } from "mongoose";
import { guild_type, guild_model } from "./obj/guild";
import { VoiceState } from "discord.js";

config();

const mongodb_url = process.env.MONGODB_URL;
connect(mongodb_url!, (err) => {
  if (err) return console.error(err);
  console.log(`mongodb 연결 성공`);
});
const out = {
  module: {
    guild: guild_model
  },
  get: {
    guild: get_guild
  }
};

export default out;

async function get_guild(msg: M | I | VoiceState) {
  let guildDB: guild_type | null = await guild_model.findOne({ id: msg.guild?.id! });
  if (guildDB) {
    return guildDB;
  } else {
    if (msg.guild?.id) {
      let data = {
        id: msg.guild?.id,
        name: (msg.guild?.name) ? msg.guild.name : '',
        prefix: (process.env.PREFIX) ? process.env.PREFIX : 'm;',
        role: [],
        tts: {
          channelID: '',
          use: true
        },
        autovc: {
          first: [],
          second: []
        }
      };
      const guildDB: guild_type = new guild_model(data);
      await guildDB.save().catch((err: any) => console.error(err));
      return guildDB;
    } else {
      return console.error('guildID를 찾을수 없음');
    }
  }
}