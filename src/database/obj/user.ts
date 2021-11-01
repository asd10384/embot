import { config } from "dotenv";
import { Document, model, Schema } from "mongoose";
config();

export interface user_type extends Document {
  id: string,
  tag: string,
  nickname: string,
  tts: {
    istts: boolean,
    time: number,
    banforid: string,
    date: string
  }
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true },
  tag: { type: String, required: true },
  nickname: { type: String },
  tts: {
    istts: { type: Boolean },
    time: { type: Number },
    banforid: { type: String },
    date: { type: String }
  }
});

export const user_model = model<user_type>('User', UserSchema);