import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetAIInsightsInput {
  @Field()
  category: string;

  @Field()
  recyclingInfo: string;
}
