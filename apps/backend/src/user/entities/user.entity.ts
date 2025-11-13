// user.dto.ts

import { Field, ID, ObjectType } from '@nestjs/graphql';

import { BadgeAssignment } from './badge-assignment';
import { Comment } from '~/post/entities/comment.entity';
import { EvenParticipant } from '~/event/entities/event-participant.entity';
import { PointsHistory } from './point-history.entity';
import { Post } from '~/post/entities/post.entity';
import { UserArticle } from './user-article.entity';
import { Event } from '~/event/entities/event.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string; // @id @default(auto()) @map("_id") @db.ObjectId

  @Field()
  createdAt: Date; // @default(now())

  @Field()
  updatedAt: Date; // @updatedAt

  @Field({ nullable: true })
  lastLogin?: Date; // DateTime?

  @Field({ nullable: true })
  avatarUrl?: string; // String?

  @Field(() => [BadgeAssignment])
  badges: BadgeAssignment[]; // BadgeAssignment[]

  @Field(() => [Comment])
  comments: Comment[]; // Comment[]

  @Field()
  email: string; // String @unique

  @Field()
  emailVerified: boolean; // Boolean @default(false)

  @Field(() => [Event])
  eventsCreated: Event[]; // Event[] @relation("EventCreator")

  @Field({ nullable: true })
  googleId?: string; // String? @unique

  @Field()
  name: string; // String

  // password: String? (not exposed in GraphQL output DTO)
  // If needed for input DTO, define separately.

  @Field({ nullable: true })
  phoneNumber?: string; // String?

  @Field()
  phoneVerified: boolean; // Boolean @default(false)

  @Field()
  points: number; // Int @default(0)

  @Field(() => [PointsHistory])
  pointsHistory: PointsHistory[]; // PointsHistory[]

  @Field(() => [Post])
  posts: Post[]; // Post[]

  @Field({ nullable: true })
  username?: string; // String? @unique

  @Field(() => [UserArticle])
  userArticle: UserArticle[]; // UserArticle[]

  @Field(() => [EvenParticipant])
  evenParticipant: EvenParticipant[]; // EvenParticipant[]
}
