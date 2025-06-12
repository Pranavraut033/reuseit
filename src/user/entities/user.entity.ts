// user.dto.ts

import { Field, ID, ObjectType } from '@nestjs/graphql';

import { BadgeAssignment } from './badge-assignment';
import { Comment } from 'src/post/entities/comment.entity';
import { EvenParticipant } from 'src/event/entities/event-participant.entity';
import { PointsHistory } from './point-history.entity';
import { Post } from 'src/post/entities/post.entity';
import { UserArticle } from './user-article.entity';
import { Event } from 'src/event/entities/event.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => [BadgeAssignment])
  badges: BadgeAssignment[];

  @Field(() => [Comment])
  comments: Comment[];

  @Field()
  email: string;

  @Field()
  emailVerified: boolean;

  @Field(() => [Event])
  eventsCreated: Event[];

  @Field({ nullable: true })
  googleId?: string;

  @Field()
  name: string;

  // Password should not be exposed in a DTO used for output
  // You may want to create separate input DTOs if needed

  @Field()
  phoneNumber: string;

  @Field()
  phoneVerified: boolean;

  @Field()
  points: number;

  @Field(() => [PointsHistory])
  pointsHistory: PointsHistory[];

  @Field(() => [Post])
  posts: Post[];

  @Field({ nullable: true })
  username?: string;

  @Field(() => [UserArticle])
  userArticle: UserArticle[];

  @Field(() => [EvenParticipant])
  evenParticipant: EvenParticipant[];
}
