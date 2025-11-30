import { Field, ID, ObjectType } from '@nestjs/graphql';

import { User } from '~/user/entities/user.entity';

import { Post } from './post.entity';

@ObjectType()
export class Like {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => User)
  user: User;

  @Field(() => ID)
  userId: string;

  @Field(() => Post)
  post: Post;

  @Field(() => ID)
  postId: string;
}
