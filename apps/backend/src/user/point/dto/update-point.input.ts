import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

import { CreatePointInput } from './create-point.input';

@InputType()
export class UpdatePointInput extends PartialType(CreatePointInput) {
  @Field(() => Int)
  id: number;
}
