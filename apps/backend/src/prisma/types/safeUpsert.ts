import type { Prisma } from '@prisma/client';
import type {
  Badge,
  BadgeAssignment,
  Comment,
  EvenParticipant,
  Event,
  PointsHistory,
  Post,
  User,
  UserArticle,
} from '@prisma/client';

/**
 * Safe Upsert Type Definitions for Prisma Models
 *
 * This file provides type-safe upsert operations for Prisma models.
 *
 * @description
 * To extend safeUpsert for new Prisma models:
 *
 * 1. Add new models to your `schema.prisma`
 * 2. Run `pnpm prisma generate`
 * 3. Update the type mappings in this file:
 *    - Add to `WhereUniqueInput<T>`
 *    - Add to `CreateInput<T>`
 *    - Add to `UpdateInput<T>`
 *    - Add to `ModelType<T>`
 *    - Import the model type from `@prisma/client`
 *
 * @example
 * // Import the new model type
 * import type { YourNewModel } from '@prisma/client';
 *
 * // Update WhereUniqueInput
 * export type WhereUniqueInput<T extends PrismaModelName> =
 *   T extends 'User' ? Prisma.UserWhereUniqueInput :
 *   T extends 'YourNewModel' ? Prisma.YourNewModelWhereUniqueInput :
 *   // ... other types
 *   never;
 *
 * // Update CreateInput
 * export type CreateInput<T extends PrismaModelName> =
 *   T extends 'User' ? Prisma.UserCreateInput :
 *   T extends 'YourNewModel' ? Prisma.YourNewModelCreateInput :
 *   // ... other types
 *   never;
 *
 * // Update UpdateInput
 * export type UpdateInput<T extends PrismaModelName> =
 *   T extends 'User' ? Prisma.UserUpdateInput :
 *   T extends 'YourNewModel' ? Prisma.YourNewModelUpdateInput :
 *   // ... other types
 *   never;
 *
 * // Update ModelType
 * export type ModelType<T extends PrismaModelName> =
 *   T extends 'User' ? User :
 *   T extends 'YourNewModel' ? YourNewModel :
 *   // ... other types
 *   never;
 *
 * @example
 * // Usage in a service
 * import { Injectable } from '@nestjs/common';
 * import { PrismaService } from '~/prisma/prisma.service';
 *
 * @Injectable()
 * export class YourNewService {
 *   constructor(private prismaService: PrismaService) {}
 *
 *   async upsertNewModel(id: string, data: any) {
 *     const record = await this.prismaService.safeUpsert(
 *       'YourNewModel',                    // Model name (must match Prisma.ModelName)
 *       this.prismaService.yourNewModel,   // Model delegate (lowercase)
 *       {
 *         where: { id },                   // Typed as YourNewModelWhereUniqueInput
 *         update: {                        // Typed as YourNewModelUpdateInput
 *           // your update fields
 *         },
 *         create: {                        // Typed as YourNewModelCreateInput
 *           // your create fields
 *         },
 *       },
 *     );
 *
 *     // record is typed as YourNewModel
 *     return record;
 *   }
 * }
 *
 * @remarks
 * Benefits:
 * - Full autocomplete in VS Code
 * - Compile-time type checking
 * - Prevents typos in field names
 * - Ensures required fields are provided
 * - Works with nested creates/updates using connect, create, etc.
 */

/** Prisma model names */
export type PrismaModelName = Prisma.ModelName;

/**
 * Where unique input type for a given Prisma model
 * @template T - The Prisma model name
 */
export type WhereUniqueInput<T extends PrismaModelName> = T extends 'User'
  ? Prisma.UserWhereUniqueInput
  : T extends 'Post'
    ? Prisma.PostWhereUniqueInput
    : T extends 'Event'
      ? Prisma.EventWhereUniqueInput
      : T extends 'Badge'
        ? Prisma.BadgeWhereUniqueInput
        : T extends 'BadgeAssignment'
          ? Prisma.BadgeAssignmentWhereUniqueInput
          : T extends 'Comment'
            ? Prisma.CommentWhereUniqueInput
            : T extends 'PointsHistory'
              ? Prisma.PointsHistoryWhereUniqueInput
              : T extends 'UserArticle'
                ? Prisma.UserArticleWhereUniqueInput
                : T extends 'EvenParticipant'
                  ? Prisma.EvenParticipantWhereUniqueInput
                  : never;

/**
 * Create input type for a given Prisma model
 * @template T - The Prisma model name
 */
export type CreateInput<T extends PrismaModelName> = T extends 'User'
  ? Prisma.UserCreateInput
  : T extends 'Post'
    ? Prisma.PostCreateInput
    : T extends 'Event'
      ? Prisma.EventCreateInput
      : T extends 'Badge'
        ? Prisma.BadgeCreateInput
        : T extends 'BadgeAssignment'
          ? Prisma.BadgeAssignmentCreateInput
          : T extends 'Comment'
            ? Prisma.CommentCreateInput
            : T extends 'PointsHistory'
              ? Prisma.PointsHistoryCreateInput
              : T extends 'UserArticle'
                ? Prisma.UserArticleCreateInput
                : T extends 'EvenParticipant'
                  ? Prisma.EvenParticipantCreateInput
                  : never;

/**
 * Update input type for a given Prisma model
 * @template T - The Prisma model name
 */
export type UpdateInput<T extends PrismaModelName> = T extends 'User'
  ? Prisma.UserUpdateInput
  : T extends 'Post'
    ? Prisma.PostUpdateInput
    : T extends 'Event'
      ? Prisma.EventUpdateInput
      : T extends 'Badge'
        ? Prisma.BadgeUpdateInput
        : T extends 'BadgeAssignment'
          ? Prisma.BadgeAssignmentUpdateInput
          : T extends 'Comment'
            ? Prisma.CommentUpdateInput
            : T extends 'PointsHistory'
              ? Prisma.PointsHistoryUpdateInput
              : T extends 'UserArticle'
                ? Prisma.UserArticleUpdateInput
                : T extends 'EvenParticipant'
                  ? Prisma.EvenParticipantUpdateInput
                  : never;

/**
 * Model type for a given Prisma model name
 * @template T - The Prisma model name
 */
export type ModelType<T extends PrismaModelName> = T extends 'User'
  ? User
  : T extends 'Post'
    ? Post
    : T extends 'Event'
      ? Event
      : T extends 'Badge'
        ? Badge
        : T extends 'BadgeAssignment'
          ? BadgeAssignment
          : T extends 'Comment'
            ? Comment
            : T extends 'PointsHistory'
              ? PointsHistory
              : T extends 'UserArticle'
                ? UserArticle
                : T extends 'EvenParticipant'
                  ? EvenParticipant
                  : never;

/**
 * Options for safe upsert operation
 * @template T - The Prisma model name
 */
export interface SafeUpsertOptions<T extends PrismaModelName> {
  /** Unique identifier to find the record */
  where: WhereUniqueInput<T>;
  /** Data to create if record doesn't exist */
  create: CreateInput<T>;
  /** Data to update if record exists */
  update: UpdateInput<T>;
}

/**
 * Generic Prisma model delegate interface
 * @description Represents the common operations available on Prisma model delegates
 */
export type PrismaModel = {
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  upsert: (args: any) => Promise<any>;
};
