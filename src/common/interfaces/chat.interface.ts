import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { ChatEnum } from "../enums";

export interface IMessage {
  content?: string;
  attachments?: string[];

  reactions?: {
    user: Types.ObjectId | IUser;
    type: number;
  }[];
  tags?: Types.ObjectId[] | IUser[];

  createdBy: Types.ObjectId | IUser;

  createdAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
  updatedAt?: Date;
}

export interface IChat {
  participants?: Types.ObjectId[] | IUser[];
  createdBy: Types.ObjectId | IUser;
  messages: IMessage[];
  type: ChatEnum;

  group: string;
  group_image: string;
  roomId: string;

  createdAt: Date;
  deletedAt?: Date;
  restoredAt?: Date;
  updatedAt?: Date;
}
