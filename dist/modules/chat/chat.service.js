"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const repository_1 = require("../../DB/repository");
const objectId_1 = require("../../common/utils/objectId");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const node_crypto_1 = require("node:crypto");
class ChatService {
    chatRepository;
    userRepository;
    constructor() {
        this.chatRepository = new repository_1.ChatRepository();
        this.userRepository = new repository_1.UserRepository();
    }
    sayHi = () => {
        return "DONE";
    };
    async getChat(participantId, { page, size }, user) {
        const findOneChatArgs = {
            filter: {
                participants: { $all: [user._id, (0, objectId_1.toObjectId)(participantId)] },
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
            throw new exceptions_1.NotFoundException("Fail To Find Matching Conversation");
        }
        return chat.toJSON();
    }
    async sendMessage({ content, sendTo }, user) {
        let chat = await this.chatRepository.findOneAndUpdate({
            filter: {
                participants: { $all: [user._id, (0, objectId_1.toObjectId)(sendTo)] },
                type: enums_1.ChatEnum.ovo,
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
                    participants: [user._id, (0, objectId_1.toObjectId)(sendTo)],
                    createdBy: user._id,
                    type: enums_1.ChatEnum.ovo,
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
    async createGroup({ participantsIds = [], group, }, user, file) {
        participantsIds = [
            ...new Set(participantsIds.map((ele) => {
                return (0, objectId_1.toObjectId)(ele);
            })),
        ];
        const users = await this.userRepository.find({
            filter: { _id: { $in: participantsIds }, friends: { $in: [user._id] } },
        });
        if (users.length != participantsIds.length) {
            throw new exceptions_1.NotFoundException("Fail to find all participants");
        }
        const roomId = (0, node_crypto_1.randomUUID)();
        const chattingGroup = await this.chatRepository.createOne({
            data: {
                participants: [...participantsIds, user._id],
                createdBy: user._id,
                messages: [],
                type: enums_1.ChatEnum.ovm,
                group,
                roomId,
            },
        });
        return chattingGroup.toJSON();
    }
    async getGroupChat(groupId, { page, size }, user) {
        const findOneChatArgs = {
            filter: {
                _id: (0, objectId_1.toObjectId)(groupId),
                participants: { $in: [user._id] },
                type: enums_1.ChatEnum.ovm,
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
            throw new exceptions_1.NotFoundException("Fail To Find Matching Conversation");
        }
        return chat.toJSON();
    }
    async sendGroupMessage({ content, groupId }, user) {
        let chat = await this.chatRepository.findOneAndUpdate({
            filter: {
                _id: (0, objectId_1.toObjectId)(groupId),
                participants: { $in: [user._id] },
                type: enums_1.ChatEnum.ovm,
            },
            update: {
                $addToSet: {
                    messages: { content, createdBy: user._id },
                },
            },
        });
        if (!chat) {
            throw new exceptions_1.NotFoundException("Fail to find matching group");
        }
        return chat.roomId;
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
