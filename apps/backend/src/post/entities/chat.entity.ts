import { Field, ID, ObjectType } from '@nestjs/graphql';

import { User } from '~/user/entities/user.entity';

import { ChatMessage } from './chat-message.entity';
import { Post } from './post.entity';

@ObjectType()
export class Chat {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Post)
  post: Post;

  @Field(() => User)
  requester: User;

  @Field(() => User)
  author: User;

  @Field(() => [ChatMessage])
  messages: ChatMessage[];

  postId: string;
  requesterId: string;
  authorId: string;
}
