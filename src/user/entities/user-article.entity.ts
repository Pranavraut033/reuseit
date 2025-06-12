import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Post } from 'src/post/entities/post.entity';
import { User } from './user.entity';

@ObjectType()
export class UserArticle {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  imageUrl: string[];

  @Field(() => User)
  user: User;

  @Field(() => Post, { nullable: true })
  post?: Post;
}
