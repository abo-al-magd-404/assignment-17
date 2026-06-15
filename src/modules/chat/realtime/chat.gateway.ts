import { ChatEvent, chatEvent } from "./chat.event";
import { Server } from "socket.io";
import { IAuthSocket } from "../../../common/types/express.types";

export class ChatGateway {
  private chatEvent: ChatEvent;
  constructor() {
    this.chatEvent = chatEvent;
  }

  registerEvents = (socket: IAuthSocket, io: Server) => {
    this.chatEvent.sayHi(socket);
    this.chatEvent.sendMessage(socket, io);
    this.chatEvent.sendGroupMessage(socket, io);
    this.chatEvent.join_room(socket, io);
  };
}

export const chatGateway = new ChatGateway();
