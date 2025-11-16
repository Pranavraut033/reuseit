import { Field, InputType, PartialType } from '@nestjs/graphql';

import { CreateEventInput } from './create-event.input';

@InputType()
export class UpdateEventInput extends PartialType(CreateEventInput) {
  @Field(() => String)
  id: string;
}
