import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

import { CreateBadgeInput } from './create-badge.input';

@InputType()
export class UpdateBadgeInput extends PartialType(CreateBadgeInput) {
  @Field(() => Int)
  id: number;
}
