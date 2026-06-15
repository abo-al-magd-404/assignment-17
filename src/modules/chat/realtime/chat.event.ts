import {
  RedisService,
  redisService,
} from "./../../../common/services/redis.service";
import { Server } from "socket.io";
import { ChatService, chatService } from "./../chat.service";
import { IAuthSocket } from "../../../common/types/express.types";
import { SocketValidation } from "../../../middleware";
import * as validators from "../chat.validation";

export class ChatEvent {
  private redisService: RedisService;
  private chatService: ChatService;
  constructor() {
    this.chatService = chatService;
    this.redisService = redisService;
  }

  sayHi = (socket: IAuthSocket) => {
    return socket.on("SayHi", async (data: { name: string }) => {
      try {
        await SocketValidation<{ name: string }>(validators.sayHi, data);
        console.log({ data });
        const result = this.chatService.sayHi();
        socket.emit("SayHi", result);
      } catch (error) {
        socket.emit("custom_error", error);
      }
    });
  };

  sendMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendMessage",
      async ({ content, sendTo }: { sendTo: string; content: string }) => {
        try {
          console.log({ content, sendTo });
          await this.chatService.sendMessage(
            { content, sendTo },
            socket.data.user,
          );

          io.to(await this.redisService.getSockets(socket.data.user._id)).emit(
            "successMessage",
            { content, sendTo },
          );

          const receiverSocketIds = await this.redisService.getSockets(sendTo);

          if (receiverSocketIds.length) {
            socket
              .to(receiverSocketIds)
              .emit("newMessage", { content, from: socket.data.user });
          }
        } catch (error) {
          socket.emit("custom_error", error);
        }
      },
    );
  };

  sendGroupMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendGroupMessage",
      async ({ content, groupId }: { groupId: string; content: string }) => {
        try {
          console.log({ content, groupId });
          const roomId = await this.chatService.sendGroupMessage(
            { content, groupId },
            socket.data.user,
          );
          io.to(await this.redisService.getSockets(socket.data.user._id)).emit(
            "successMessage",
            { content, sendTo: groupId },
          );
          socket.to(roomId).emit("newMessage", { content, groupId });
        } catch (error) {
          socket.emit("custom_error", error);
        }
      },
    );
  };

  join_room = (socket: IAuthSocket, io: Server) => {
    return socket.on("join_room", async ({ roomId }: { roomId: string }) => {
      try {
        console.log({ socket: socket.data.user._id, roomId });
        socket.join(roomId);
      } catch (error) {
        socket.emit("custom_error", error);
      }
    });
  };
}

export const chatEvent = new ChatEvent();
