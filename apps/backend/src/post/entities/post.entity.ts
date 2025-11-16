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

  @Field()
  likes: number;

  @Field(() => Boolean, { nullable: true })
  likedByCurrentUser?: boolean | null;

  @Field(() => Location, { nullable: true })
  location?: Location;
}
