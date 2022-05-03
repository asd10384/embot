import { Guild } from "discord.js";
import "dotenv/config";
import MDB from "../database/Mysql";

/** onReady 핸들러 */
export default function guildDelete(guild: Guild) {
  MDB.get.guild(guild).then((guildDB) => {
    if (guildDB) MDB.command(`delete from guild where id='${guildDB.id}'`).then((val) => {
      console.log(`서버 삭제 성공: ${guildDB.name}`);
    }).catch((err) => {
      console.log(`서버를 삭제 실패: 발견하지 못함`);
    });
  }).catch((err) => {
    console.log(`서버를 삭제 실패: 발견하지 못함`);
  });
}