import { HydratedDocument, Types } from "mongoose";
import { IChat, IUser } from "../../common/interfaces";
import { ChatRepository, UserRepository } from "../../DB/repository";
import { toObjectId } from "../../common/utils/objectId";
import { NotFoundException } from "../../common/exceptions";
import { ChatEnum } from "../../common/enums";
import { randomUUID } from "node:crypto";

export class ChatService {
  private chatRepository: ChatRepository;
  private userRepository: UserRepository;
  constructor() {
    this.chatRepository = new ChatRepository();
    this.userRepository = new UserRepository();
  }

  sayHi = () => {
    return "DONE";
  };

  async getChat(
    participantId: string,
    { page, size }: { page?: string; size?: string },
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    const findOneChatArgs: {
      filter: object;
      options: { populate: { path: string }[] };
      page?: string;
      size?: string;
    } = {
      filter: {
        participants: { $all: [user._id, toObjectId(participantId)] },
      },
      options: {
        populate: [{ path: "participants" }],
      },
    };

    if (page !== undefined) {
      findOneChatArgs.page = page;
    }
    if (size !== undefined) {
      findOneChatArgs.size = size;
    }

    const chat = await this.chatRepository.findOneChat(findOneChatArgs);

    if (!chat) {
      throw new NotFoundException("Fail To Find Matching Conversation");
    }

    return chat.toJSON();
  }

  async sendMessage(
    { content, sendTo }: { content: string; sendTo: string },
    user: HydratedDocument<IUser>,
  ): Promise<void> {
    let chat = await this.chatRepository.findOneAndUpdate({
      filter: {
        participants: { $all: [user._id, toObjectId(sendTo)] },
        type: ChatEnum.ovo,
      },
      update: {
        $addToSet: {
          messages: { content, createdBy: user._id },
        },
      },
    });

    if (!chat) {
      chat = await this.chatRepository.createOne({
        data: {
          participants: [user._id, toObjectId(sendTo)],
          createdBy: user._id,
          type: ChatEnum.ovo,
          messages: [
            {
              content,
              createdBy: user._id,
            },
          ],
        },
      });
    }
  }

  async createGroup(
    {
      participantsIds = [],
      group,
    }: { participantsIds: string[] | Types.ObjectId[]; group: string },
    user: HydratedDocument<IUser>,
    file?: Express.Multer.File,
  ): Promise<IChat> {
    participantsIds = [
      ...new Set(
        participantsIds.map((ele) => {
          return toObjectId(ele as string);
        }),
      ),
    ];

    const users = await this.userRepository.find({
      filter: { _id: { $in: participantsIds }, friends: { $in: [user._id] } },
    });

    if (users.length != participantsIds.length) {
      throw new NotFoundException("Fail to find all participants");
    }

    const roomId = randomUUID();

    const chattingGroup = await this.chatRepository.createOne({
      data: {
        participants: [...participantsIds, user._id],
        createdBy: user._id,
        messages: [],
        type: ChatEnum.ovm,
        group,
        roomId,
      },
    });

    return chattingGroup.toJSON();
  }

  async getGroupChat(
    groupId: string,
    { page, size }: { page?: string; size?: string },
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    const findOneChatArgs: {
      filter: object;
      options: { populate: { path: string }[] };
      page?: string;
      size?: string;
    } = {
      filter: {
        _id: toObjectId(groupId),
        participants: { $in: [user._id] },
        type: ChatEnum.ovm,
      },
      options: {
        populate: [{ path: "participants" }, { path: "messages.createdBy" }],
      },
    };

    if (page !== undefined) {
      findOneChatArgs.page = page;
    }
    if (size !== undefined) {
      findOneChatArgs.size = size;
    }

    const chat = await this.chatRepository.findOneChat(findOneChatArgs);

    if (!chat) {
      throw new NotFoundException("Fail To Find Matching Conversation");
    }

    return chat.toJSON();
  }

  async sendGroupMessage(
    { content, groupId }: { content: string; groupId: string },
    user: HydratedDocument<IUser>,
  ): Promise<string> {
    let chat = await this.chatRepository.findOneAndUpdate({
      filter: {
        _id: toObjectId(groupId),
        participants: { $in: [user._id] },
        type: ChatEnum.ovm,
      },
      update: {
        $addToSet: {
          messages: { content, createdBy: user._id },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException("Fail to find matching group");
    }

    return chat.roomId;
  }
}

export const chatService = new ChatService();
