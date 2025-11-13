import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Comment } from './comment.entity';
import { Location } from '../../global/entities/location.entity';
import { User } from 'src/user/entities/user.entity';
import { UserArticle } from 'src/user/entities/user-article.entity';
import { Event } from 'src/event/entities/event.entity';

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
