import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Post } from '~/post/entities/post.entity';
import { Event } from '~/event/entities/event.entity';
import { LocationType } from './location-type.entity';

@ObjectType()
export class Location {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  address?: string;

  @Field(() => LocationType)
  type: LocationType;

  @Field(() => [Event])
  events: Event[];

  @Field(() => [Post])
  posts: Post[];

  @Field(() => [Float])
  coordinates: number[];

  @Field({ nullable: true })
  googlePlaceId?: string;
}
