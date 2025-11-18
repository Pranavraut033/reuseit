import { Field, InputType } from '@nestjs/graphql';

import { CreateLocationInput } from '~/location/dto/create-location.input';

@InputType()
export class CreatePostInput {
  @Field(() => String, { description: 'Post title' })
  title: string;

  @Field(() => String, { description: 'Post description' })
  description: string;

  @Field(() => String, { nullable: true, description: 'Post category' })
  category?: string;

  @Field(() => String, { nullable: true, description: 'Post condition' })
  condition?: string;
  @Field(() => [String], { description: 'Post tags' })
  tags: string[];

  @Field(() => Date, { nullable: true, description: 'Pickup date for the post item' })
  pickupDate?: Date;

  @Field(() => [String], { nullable: true, description: 'Post images URLs' })
  images?: string[];

  @Field(() => String, { nullable: true, description: 'Location ID' })
  locationId?: string;

  @Field(() => CreateLocationInput, { nullable: true, description: 'Location details' })
  location?: CreateLocationInput;

  @Field(() => String, { nullable: true, description: 'Event ID' })
  eventId?: string;

  @Field(() => Boolean, { description: 'Whether the post is created anonymously' })
  anonymous: boolean;
}
