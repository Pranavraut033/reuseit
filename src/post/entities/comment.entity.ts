import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Post } from './post.entity';
import { User } from 'src/user/entities/user.entity';

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => User, { nullable: true })
  author?: User;

  @Field()
  content: string;

  @Field(() => Post)
  post: Post;
}
