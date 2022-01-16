import { config } from "dotenv";
import { Document, model, Schema } from "mongoose";
config();

export interface user_type extends Document {
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

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, default: "" },
  tag: { type: String, required: true, default: "" },
  nickname: { type: String, default: "" },
  tts: { type: Array, default: [] }
});

export const user_model = model<user_type>(`User`, UserSchema);