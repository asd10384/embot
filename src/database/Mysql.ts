import "dotenv/config";
import { Guild, GuildMember } from "discord.js";
import mysql from "mysql";
import { client } from "../index.js";

const db = mysql.createConnection({
  host: process.env.MYSQL_HOST ? process.env.MYSQL_HOST : 'localhost',
  port: parseInt(process.env.MYSQL_PORT ? process.env.MYSQL_PORT : "3306"),
  user: process.env.MYSQL_USER ? process.env.MYSQL_USER : "root",
  password: process.env.MYSQL_PASSWORD ? process.env.MYSQL_PASSWORD : "",
  database: process.env.MYSQL_DATABASE ? process.env.MYSQL_DATABASE : ""
});
try {
  db.connect();
  console.log(`MYSQL 데이터베이스 연결 성공`);
} catch (err) {
  if (client.debug) console.log(err);
  throw "\nMYSQL 데이터베이스 연결 실패";
}

async function command(text: string): Promise<any> {
  return new Promise((res, rej) => {
    db.query(text, (err, ret) => {
      if (err) return rej(err);
      return res(ret);
    });
  });
}

interface guild_list_type {
  id?: string;
  name?: string;
  prefix?: string;
  role?: string;
  tts?: string;
  autovc?: string;
}
interface guild_first_type {
  id: string;
  name: string;
  prefix: string;
  role: string;
  tts: string;
  autovc: string;
}
export interface guild_type {
  id: string;
  name: string;
  prefix: string;
  role: string[];
  tts: {
    channelId: string;
    use: boolean;
  },
  autovc: {
    first: { channelID: string, categoryID: string, limit: number }[];
    second: string[];
  }
}

interface user_list_type {
  id?: string;
  tag?: string;
  tts?: string;
}
interface user_first_type {
  id: string;
  tag: string;
  tts: string;
}
export interface user_type {
  id: string;
  tag: string;
  tts: {
    guildId: string;
    time: number;
    inf: boolean;
    banforid: string;
    date: string;
  }[];
}

async function get_guildDB(guild: Guild): Promise<guild_type | undefined> {
  const guildDBlist = await command(`select * from guild where id='${guild.id}'`);
  if (guildDBlist.length > 0) {
    let guildDB: guild_first_type = guildDBlist[0];
    if (guildDB.name !== guild.name) guildDB.name = guild.name;
    return {
      id: guildDB.id,
      name: guildDB.name,
      prefix: guildDB.prefix,
      role: JSON.parse(guildDB.role),
      tts: JSON.parse(guildDB.tts),
      autovc: JSON.parse(guildDB.autovc)
    };
  } else {
    return await command(`insert into \`guild\` (${[
      "id",
      "name",
      "prefix",
      "role",
      "tts",
      "autovc"
    ].join(",")}) values('${[
      guild.id.toString(),
      guild.name,
      (process.env.PREFIX) ? process.env.PREFIX : 't;',
      "[]",
      JSON.stringify({
        channelId: "",
        use: true
      }),
      JSON.stringify({
        first: [],
        second: []
      })
    ].join("','")}')`).then((guildDB): guild_type => {
      return {
        id: guild.id.toString(),
        name: guild.name,
        prefix: (process.env.PREFIX) ? process.env.PREFIX : 't;',
        role: [],
        tts: {
          channelId: "",
          use: true
        },
        autovc: {
          first: [],
          second: []
        }
      };
    }).catch((err) => {
      if (client.debug) console.log(err);
      return undefined;
    });
  }
}

async function get_userDB(member: GuildMember): Promise<user_type | undefined> {
  const userDBlist = await command(`select * from user where id='${member.user.id}'`);
  if (userDBlist.length > 0) {
    let userDB: user_first_type = userDBlist[0];
    if (userDB.tag !== member.user.tag) userDB.tag = member.user.tag;
    return {
      id: userDB.id,
      tag: userDB.tag,
      tts: JSON.parse(userDB.tts)
    };
  } else {
    return await command(`insert into \`user\` (${[
      "id",
      "tag",
      "tts"
    ].join(",")}) values('${[
      member.user.id.toString(),
      member.user.tag,
      "[]"
    ].join("','")}')`).then((userDB): user_type => {
      return {
        id: member.user.id.toString(),
        tag: member.user.tag,
        tts: []
      };
    }).catch((err) => {
      if (client.debug) console.log(err);
      return undefined;
    });
  }
}

async function update_guildDB(guildId: string, data: guild_list_type): Promise<boolean> {
  let keys = Object.keys(data);
  let values = Object.values(data);
  let addlist = [];
  for (let i in keys) {
    addlist.push(`${keys[i]}=${
      typeof(values[i]) === "string" ? `'${values[i]}'` : values[i]
    }`);
  }
  return await command(`update guild set ${addlist.join(",")} where id='${guildId}'`).then((val) => {
    return true;
  }).catch((err) => {
    return false;
  });
}

async function update_userDB(userId: string, data: user_list_type): Promise<boolean> {
  let keys = Object.keys(data);
  let values = Object.values(data);
  let addlist = [];
  for (let i in keys) {
    addlist.push(`${keys[i]}=${
      typeof(values[i]) === "string" ? `'${values[i]}'` : values[i]
    }`);
  }
  return await command(`update user set ${addlist.join(",")} where id='${userId}'`).then((val) => {
    return true;
  }).catch((err) => {
    return false;
  });
}

export default {
  get: {
    guild: get_guildDB,
    user: get_userDB
  },
  update: {
    guild: update_guildDB,
    user: update_userDB
  },
  command
};