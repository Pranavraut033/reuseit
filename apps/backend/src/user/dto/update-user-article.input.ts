import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

import { CreateUserArticleInput } from './create-user-article.input';

@InputType()
export class UpdateUserArticleInput extends PartialType(CreateUserArticleInput) {
  @Field(() => Int)
  id: number;
}
