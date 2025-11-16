import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Event } from '~/event/entities/event.entity';
import { User } from '~/user/entities/user.entity';
import { UserArticle } from '~/user/entities/user-article.entity';

import { Location } from '../../global/entities/location.entity';
import { Comment } from './comment.entity';

@ObjectType()
export class Post {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  author?: User;

  @Field(() => String)
  title: string;

  @Field(() => String)
  category: string;

  @Field(() => String)
  condition: string;

  @Field(() => [String])
  tags: string[];

  @Field(() => Date, { nullable: true })
  pickupDate?: Date;

  @Field(() => [Comment])
  comments: Comment[];

  @Field()
  content: string;

  @Field(() => [UserArticle])
  userArticles: UserArticle[];

  @Field(() => Event, { nullable: true })
  event?: Event;

  @Field(() => [String])
  images: string[];

  @Field(() => Boolean, { nullable: true })
  likedByCurrentUser?: boolean | null;

  @Field(() => Number)
  likeCount: number;

  @Field(() => Number)
  commentsCount: number;

  @Field(() => Location, { nullable: true })
  location?: Location;
}
