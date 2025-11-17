import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

import { Event } from '~/event/entities/event.entity';
import { Post } from '~/post/entities/post.entity';

import { LocationType } from './location-type.entity';

@ObjectType()
export class Location {
  @Field(() => ID)
  id: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => String)
  address: string;

  @Field(() => String, { nullable: true })
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  additionalInfo?: string;

  @Field(() => String)
  city: string;

  @Field(() => String)
  country: string;

  @Field(() => Int)
  postalCode: number;

  @Field(() => LocationType)
  type: LocationType;

  @Field(() => [Event])
  events: Event[];

  @Field(() => [Post])
  posts: Post[];

  @Field(() => [Float])
  coordinates: number[];

  @Field(() => String, { nullable: true })
  googlePlaceId?: string;
}
