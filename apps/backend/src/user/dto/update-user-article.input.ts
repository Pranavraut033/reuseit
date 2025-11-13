import { CreateUserArticleInput } from './create-user-article.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateUserArticleInput extends PartialType(
  CreateUserArticleInput,
) {
  @Field(() => Int)
  id: number;
}
