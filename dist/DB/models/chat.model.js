"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const comment_model_1 = require("./comment.model");
const messageSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: function () {
            return this.attachments?.length;
        },
    },
    attachments: { type: [String] },
    reactions: [
        {
            user: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
            type: { type: Number, required: true },
            _id: false,
        },
    ],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
});
const chatSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Types.ObjectId, ref: "User", required: true }],
    type: { type: String, enum: enums_1.ChatEnum, default: enums_1.ChatEnum.ovo },
    group: {
        type: String,
        required: function () {
            return this.type == enums_1.ChatEnum.ovm;
        },
    },
    roomId: {
        type: String,
        required: function () {
            return this.type == enums_1.ChatEnum.ovm;
        },
    },
    group_image: { type: String },
    messages: { type: [messageSchema], required: true },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
});
chatSchema.pre("save", function () { });
chatSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
    let update = this.getUpdate();
    const query = this.getQuery();
    if (!update.$set)
        update.$set = {};
    if (update.deletedAt) {
        update.$set.deletedAt = update.deletedAt;
        delete update.deletedAt;
        update.$unset = {
            ...(update.$unset || {}),
            restoredAt: 1,
        };
        const chat = await this.model.findOne(query);
        if (chat) {
            await comment_model_1.CommentModel.updateMany({ chatId: chat._id }, { deletedAt: new Date() });
        }
    }
    if (update.restoredAt) {
        update.$set.restoredAt = update.restoredAt;
        delete update.restoredAt;
        update.$unset = {
            ...(update.$unset || {}),
            deletedAt: 1,
        };
        this.setQuery({
            ...query,
            deletedAt: { $exists: true },
        });
        const chat = await this.model.findOne({
            ...query,
            paranoid: false,
        });
        if (chat) {
            await comment_model_1.CommentModel.updateMany({ chatId: chat._id, paranoid: false }, { restoredAt: new Date() });
        }
    }
    this.setUpdate(update);
    if (query.paranoid === false) {
        delete query.paranoid;
        this.setQuery(query);
    }
    else {
        this.setQuery({
            deletedAt: { $exists: false },
            ...query,
        });
    }
});
chatSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
    const query = this.getQuery();
    if (query.force === true) {
        delete query.force;
        const chat = await this.model.findOne(query);
        if (chat) {
            await comment_model_1.CommentModel.deleteMany({
                chatId: chat._id,
                force: true,
            });
        }
        this.setQuery(query);
        return;
    }
    this.setQuery({
        deletedAt: { $exists: true },
        ...query,
    });
});
exports.chatModel = mongoose_1.models.chat || (0, mongoose_1.model)("Chat", chatSchema);
