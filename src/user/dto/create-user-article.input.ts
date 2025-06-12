import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserArticleInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
