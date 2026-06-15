import { model, models, Schema, Types } from "mongoose";
import { ChatEnum } from "../../common/enums";
import { IChat, IMessage } from "../../common/interfaces";
import { CommentModel } from "./comment.model";

const messageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: function (this) {
        return this.attachments?.length;
      },
    },
    attachments: { type: [String] },

    reactions: [
      {
        user: { type: Types.ObjectId, ref: "User", required: true },
        type: { type: Number, required: true },
        _id: false,
      },
    ],

    tags: [{ type: Types.ObjectId, ref: "User" }],

    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
  },
);

const chatSchema = new Schema<IChat>({
  participants: [{ type: Types.ObjectId, ref: "User", required: true }],
  type: { type: String, enum: ChatEnum, default: ChatEnum.ovo },

  group: {
    type: String,
    required: function (this) {
      return this.type == ChatEnum.ovm;
    },
  },
  roomId: {
    type: String,
    required: function (this) {
      return this.type == ChatEnum.ovm;
    },
  },
  group_image: { type: String },

  messages: { type: [messageSchema], required: true },

  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  deletedAt: { type: Date },
  restoredAt: { type: Date },
});

// ===== MIDDLEWARE =====

// ======================
// PRE SAVE
// ======================
chatSchema.pre("save", function () {});

// ======================
// PRE UPDATE (SOFT DELETE + RESTORE + PARANOID + CASCADE)
// ======================
chatSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
  let update = this.getUpdate() as any;
  const query = this.getQuery() as any;

  if (!update.$set) update.$set = {};

  // ======================
  // SOFT DELETE
  // ======================
  if (update.deletedAt) {
    update.$set.deletedAt = update.deletedAt;
    delete update.deletedAt;

    update.$unset = {
      ...(update.$unset || {}),
      restoredAt: 1,
    };

    const chat = await this.model.findOne(query);

    if (chat) {
      // cascade soft delete comments
      await CommentModel.updateMany(
        { chatId: chat._id },
        { deletedAt: new Date() },
      );
    }
  }

  // ======================
  // RESTORE
  // ======================
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
      await CommentModel.updateMany(
        { chatId: chat._id, paranoid: false } as any,
        { restoredAt: new Date() },
      );
    }
  }

  this.setUpdate(update);

  // ======================
  // PARANOID FILTER
  // ======================
  if (query.paranoid === false) {
    delete query.paranoid;
    this.setQuery(query);
  } else {
    this.setQuery({
      deletedAt: { $exists: false },
      ...query,
    });
  }
});

// ======================
// PRE DELETE (HARD DELETE + CASCADE)
// ======================
chatSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery() as any;

  // ======================
  // FORCE HARD DELETE
  // ======================
  if (query.force === true) {
    delete query.force;

    const chat = await this.model.findOne(query);

    if (chat) {
      // hard delete comments
      await CommentModel.deleteMany({
        chatId: chat._id,
        force: true,
      } as any);
    }

    this.setQuery(query);
    return;
  }

  // ======================
  // DEFAULT: ONLY HARD DELETE SOFT-DELETED chatS
  // ======================
  this.setQuery({
    deletedAt: { $exists: true },
    ...query,
  });
});

export const chatModel = models.chat || model<IChat>("Chat", chatSchema);
