import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreatePostInput {
  @Field(() => String, { description: 'Post title' })
  title: string;

  @Field(() => String, { description: 'Post content' })
  content: string;

  @Field(() => String, { description: 'Post category' })
  category: string;

  @Field(() => String, { description: 'Post condition' })
  condition: string;
  @Field(() => [String], { description: 'Post tags' })
  tags: string[];

  @Field(() => Date, { nullable: true, description: 'Pickup date for the post item' })
  pickupDate?: Date;

  @Field(() => [String], { nullable: true, description: 'Post images URLs' })
  images?: string[];

  @Field(() => String, { nullable: true, description: 'Location ID' })
  locationId?: string;

  @Field(() => String, { nullable: true, description: 'Event ID' })
  eventId?: string;
}
