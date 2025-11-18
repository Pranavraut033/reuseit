import { Field, InputType } from '@nestjs/graphql';

import { CreateLocationInput } from '~/location/dto/create-location.input';

@InputType()
export class CreateEventInput {
  @Field(() => String, { description: 'Event title' })
  title: string;

  @Field(() => [String], { description: 'Event image URLs' })
  imageUrl: string[];

  @Field(() => String, { nullable: true, description: 'Event description' })
  description?: string;

  @Field(() => Date, { description: 'Event start time' })
  startTime: Date;

  @Field(() => Date, { nullable: true, description: 'Event end time' })
  endTime?: Date;

  @Field(() => String, {
    description: 'Location ID where the event will take place',
    nullable: true,
  })
  locationId?: string;

  @Field(() => CreateLocationInput, {
    description: 'Location details for the event',
    nullable: true,
  })
  location?: CreateLocationInput;
}
