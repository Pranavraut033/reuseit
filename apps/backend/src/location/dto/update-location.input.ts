import { Field, InputType, PartialType } from '@nestjs/graphql';

import { CreateLocationInput } from './create-location.input';

@InputType()
export class UpdateLocationInput extends PartialType(CreateLocationInput) {
  @Field(() => String)
  id: string;
}
