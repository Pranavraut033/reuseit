import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AIInsights {
  @Field(() => [String])
  extra_facts: string[];

  @Field()
  simplified_summary: string;

  @Field()
  motivation_text: string;
}
