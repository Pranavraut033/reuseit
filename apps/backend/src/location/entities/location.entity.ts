import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

import { Event } from '~/event/entities/event.entity';
import { Post } from '~/post/entities/post.entity';
import { User } from '~/user/entities/user.entity';

import { LocationType } from './location-type.entity';

@ObjectType()
export class Location {
  @Field(() => ID)
  id: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => String)
  street: string;

  @Field(() => String, { nullable: true })
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  additionalInfo?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String)
  country: string;

  @Field(() => String, { nullable: true })
  postalCode?: string;

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

  @Field(() => String, { nullable: true })
  userId?: string;

  @Field(() => User, { nullable: true })
  createdBy?: User;
}
