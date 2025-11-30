import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Location } from '~/location/entities/location.entity';
import { Post } from '~/post/entities/post.entity';
import { User } from '~/user/entities/user.entity';

import { EvenParticipant } from './event-participant.entity';

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

  @Field(() => ID)
  creatorId: string;

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

  @Field(() => Location, { nullable: true })
  location?: Location;

  @Field(() => ID)
  locationId: string;

  @Field(() => [EvenParticipant])
  participants: EvenParticipant[];

  @Field(() => [Post])
  posts: Post[];
}
