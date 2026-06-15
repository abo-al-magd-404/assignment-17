import { HydratedDocument, PopulateOptions, Types } from "mongoose";
import {
  CreatePostBodyDto,
  ReactPostParamsDto,
  ReactPostQueryDto,
  UpdatePostBodyDto,
  UpdatePostParamsDto,
} from "./post.dto";
import { AssetStorage, IPaginate, IPost, IUser } from "../../common/interfaces";
import {
  cloudinaryService,
  NotificationService,
  notificationService,
  redisService,
  RedisService,
} from "../../common/services";
import { PostRepository, UserRepository } from "../../DB/repository";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exceptions";
import { randomUUID } from "node:crypto";
import { getAvailability } from "../../common/utils/post";
import { PaginateDto } from "../../common/validation";
import { toObjectId } from "../../common/utils/objectId";
import { NotificationModel } from "../../DB/models/notification.model";
import { realtimeGateway, RealtimeGateway } from "../realtime";

export class PostService {
  private populate: PopulateOptions[] = [
    { path: "comments" },
    { path: "createdBy" },
    { path: "tags" },
    { path: "updatedBy" },

    {
      path: "reactions.user",
    },

    {
      path: "comments",
      populate: [
        {
          path: "reply",
          populate: [{ path: "reply" }],
        },
      ],
    },
  ];
  private readonly redis: RedisService;
  private readonly userRepository: UserRepository;
  private readonly postRepository: PostRepository;
  private readonly notification: NotificationService;
  private realTime: RealtimeGateway;
  private readonly cloudinary: AssetStorage;

  constructor() {
    this.redis = redisService;
    this.realTime = realtimeGateway;
    this.userRepository = new UserRepository();
    this.postRepository = new PostRepository();
    this.notification = notificationService;
    this.cloudinary = cloudinaryService;
  }

  private async createNotification(data: {
    title: string;
    body: string;
    senderId: string;
    recipient: string;
  }) {
    return await NotificationModel.create(data);
  }

  async createPost(
    { availability, content, files = [], tags }: CreatePostBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];

    if (tags?.length) {
      const mentionedAccount = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });

      if (mentionedAccount.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts",
        );
      }

      for (const tag of tags) {
        mentions.push(toObjectId(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) => {
          FCM_Tokens.push(token);
        });
      }
    }

    const folderId = randomUUID();
    let attachments: string[] = [];

    if (files?.length) {
      attachments = await this.cloudinary.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }

    const post = await this.postRepository.createOne({
      data: {
        content: content as string,
        attachments,

        tags: mentions,
        folderId,
        availability,

        createdBy: user._id,
      },
    });

    if (!post) {
      if (attachments.length) {
        await this.cloudinary.deleteAssets({
          keys: attachments.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("Fail to create a post");
    }

    if (FCM_Tokens.length) {
      const title = "Post Mention";
      const body = `${user.username} mentioned you in a post`;

      for (const tag of mentions) {
        await this.createNotification({
          title,
          body,
          senderId: user._id.toString(),
          recipient: tag.toString(),
        });
      }

      await this.notification.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title,
          body: JSON.stringify({
            postId: post._id,
          }),
        },
      });
    }

    return post.toJSON();
  }

  async updatePost(
    { postId }: UpdatePostParamsDto,
    {
      availability,
      content,
      files = [],
      removeFiles,
      tags = [],
      removeTags,
    }: UpdatePostBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const post = await this.postRepository.findOne({
      filter: {
        _id: postId,
        createdBy: user._id,
      },
    });

    if (!post) {
      throw new NotFoundException("Fail to find matching post");
    }

    if (
      !post.content &&
      !content &&
      !files?.length &&
      post.attachments?.length == removeFiles?.length
    ) {
      throw new BadRequestException("we can not leave empty post");
    }

    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];

    if (tags?.length) {
      const mentionedAccount = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });

      if (mentionedAccount.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts",
        );
      }

      for (const tag of tags) {
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) => {
          FCM_Tokens.push(token);
        });
      }
    }

    const folderId = post.folderId;
    let attachments: string[] = [];

    if (files?.length) {
      attachments = await this.cloudinary.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }

    const updatedPost = await this.postRepository.findOneAndUpdate({
      filter: {
        _id: postId,
        createdBy: user._id,
      },
      update: [
        {
          $set: {
            content: content || post.content,
            availability: Number(availability || post.availability),
            updatedBy: user._id,
            attachments: {
              $setUnion: [
                {
                  $setDifference: ["$attachments", removeFiles],
                },
                attachments,
              ],
            },
            tags: {
              $setUnion: [
                {
                  $setDifference: [
                    "$tags",
                    removeTags?.map((ele) => {
                      return toObjectId(ele);
                    }),
                  ],
                },
                mentions,
              ],
            },
          },
        },
      ],
    });

    if (!updatedPost) {
      if (attachments.length) {
        await this.cloudinary.deleteAssets({
          keys: attachments.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("Fail to create a post");
    }

    if (removeFiles?.length) {
      await this.cloudinary.deleteAssets({
        keys: removeFiles.map((ele) => {
          return { Key: ele };
        }),
      });
    }

    if (FCM_Tokens.length) {
      const title = "Post Mention Updated";
      const body = `${user.username} mentioned you in an updated post`;

      for (const tag of mentions) {
        await this.createNotification({
          title,
          body,
          senderId: user._id.toString(),
          recipient: tag.toString(),
        });
      }

      await this.notification.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title,
          body: JSON.stringify({
            postId: post._id,
          }),
        },
      });
    }

    return updatedPost.toJSON();
  }

  async postList(
    { page, search, size }: PaginateDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPaginate<IPost>> {
    const posts = await this.postRepository.paginate({
      filter: {
        $or: getAvailability(user),
        ...(search?.length
          ? { content: { $regex: search, $options: "i" } }
          : {}),
      },
      page,
      size,
      options: {
        populate: this.populate,
      },
    });

    return posts;
  }

  async reactPost(
    { postId }: ReactPostParamsDto,
    { react }: ReactPostQueryDto,
    user: HydratedDocument<IUser>,
  ) {
    if (react === undefined || react === null) {
      const post = await this.postRepository.findOneAndUpdate({
        filter: { _id: postId, $or: getAvailability(user) },
        update: { $pull: { reactions: { user: user._id } } },
      });
      if (!post) throw new NotFoundException("Fail to find matching post");
      return post.toJSON();
    }

    await this.postRepository.updateOne({
      filter: { _id: postId },
      update: { $pull: { reactions: { user: user._id } } },
    });

    const post = await this.postRepository.findOneAndUpdate({
      filter: { _id: postId, $or: getAvailability(user) },
      update: {
        $addToSet: { reactions: { user: user._id, type: react } },
      },
      populate: this.populate,
    });

    if (!post) throw new NotFoundException("Fail to find matching post");

    const owner = post.createdBy as HydratedDocument<IUser>;

    const socketIds = await this.redis.getSockets(owner._id);

    if (socketIds.length && react > 0) {
      this.realTime
        .getIo()
        .to(socketIds)
        .emit("reactPost", { postId, userId: user._id, react });
    }

    return post.toJSON();
  }
}

export const postService = new PostService();
