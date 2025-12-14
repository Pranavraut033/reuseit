import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

import { Event } from '~/event/entities/event.entity';
import { Location } from '~/location/entities/location.entity';
import { User } from '~/user/entities/user.entity';
import { UserArticle } from '~/user/entities/user-article.entity';

import { Comment } from './comment.entity';
import { Chat } from './chat.entity';
import { Like } from './like.entity';
import { PostType } from './post-type.entity';

@ObjectType()
export class Post {
  @Field(() => ID)
  id: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  author?: User;

  @Field(() => ID, { nullable: true })
  authorId?: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  category?: string;

  @Field(() => String, { nullable: true })
  condition?: string;

  @Field(() => [String])
  tags: string[];

  @Field(() => GraphQLISODateTime, { nullable: true })
  pickupDate?: Date;

  @Field(() => [Chat])
  chats: Chat[];

  @Field(() => String, { description: 'Post description' })
  description: string;

  @Field(() => [UserArticle])
  userArticles: UserArticle[];

  @Field(() => Event, { nullable: true })
  event?: Event;

  @Field(() => ID, { nullable: true })
  eventId?: string;

  @Field(() => [String])
  images: string[];

  @Field(() => [Like])
  likes: Like[];

  @Field(() => Boolean, { nullable: true })
  likedByCurrentUser?: boolean | null;

  @Field(() => Number)
  likeCount: number;

  @Field(() => Number)
  chatCount: number;

  @Field(() => Location, { nullable: true })
  location?: Location;

  @Field(() => ID, { nullable: true })
  locationId?: string;

  @Field(() => Boolean)
  anonymous: boolean;

  @Field(() => PostType)
  postType: PostType;
}
