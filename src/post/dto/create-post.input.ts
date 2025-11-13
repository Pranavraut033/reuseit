import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreatePostInput {
  @Field(() => String, { description: 'Post content' })
  content: string;

  @Field(() => [String], { nullable: true, description: 'Post images URLs' })
  images?: string[];

  @Field(() => String, { nullable: true, description: 'Location ID' })
  locationId?: string;

  @Field(() => String, { nullable: true, description: 'Event ID' })
  eventId?: string;
}
