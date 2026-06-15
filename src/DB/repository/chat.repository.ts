import {
  FlattenMaps,
  HydratedDocument,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
} from "mongoose";
import { IChat } from "../../common/interfaces";
import { chatModel } from "../models";
import { DatabaseRepository } from "./base.repository";

export class ChatRepository extends DatabaseRepository<IChat> {
  constructor() {
    super(chatModel);
  }

  async findOneChat({
    filter,
    projection,
    options,
    page,
    size,
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: false }) | null | undefined;
    page?: string;
    size?: string;
  }): Promise<HydratedDocument<IChat> | null>;

  async findOneChat({
    filter,
    projection,
    options,
    page,
    size,
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: (QueryOptions<IChat> & { lean?: true }) | null | undefined;
    page?: string;
    size?: string;
  }): Promise<null | FlattenMaps<IChat>>;

  async findOneChat({
    filter,
    projection,
    options,
    page = "1",
    size = "5",
  }: {
    filter?: QueryFilter<IChat>;
    projection?: ProjectionType<IChat> | null | undefined;
    options?: QueryOptions<IChat> | null | undefined;
    page?: string | number;
    size?: string | number;
  }): Promise<HydratedDocument<IChat> | FlattenMaps<IChat> | null> {
    page = parseInt(page as string);
    size = parseInt(size as string);

    const doc = this.model.findOne(filter, {
      messages: { $slice: [-page * size, size] },
    });

    if (options?.populate) doc.populate(options.populate as PopulateOptions[]);

    if (options?.lean) doc.lean(options.lean);

    return await doc.exec();
  }
}
