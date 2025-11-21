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

  @Field(() => Post)
  post: Post;
}
