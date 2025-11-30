import { Field, ID, ObjectType } from '@nestjs/graphql';

import { User } from '~/user/entities/user.entity';

import { Post } from './post.entity';

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => User, { nullable: true })
  author?: User;

  @Field(() => ID, { nullable: true })
  authorId?: string;

  @Field()
  content: string;

  @Field(() => Post)
  post: Post;

  @Field(() => ID)
  postId: string;
}
