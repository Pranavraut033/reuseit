import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '~/user/entities/user.entity';
import { EvenParticipant } from './event-participant.entity';
import { Post } from '~/post/entities/post.entity';
import { Location } from '~/global/entities/location.entity';

@ObjectType()
export class Event {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User)
  creator: User;

  @Field()
  title: string;

  @Field(() => [String])
  imageUrl: string[];

  @Field({ nullable: true })
  description?: string;

  @Field()
  startTime: Date;

  @Field({ nullable: true })
  endTime?: Date;

  @Field(() => Location)
  location: Location;

  @Field(() => EvenParticipant, { nullable: true })
  participants?: EvenParticipant;

  @Field(() => [Post])
  post: Post[];
}
