import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AIInsightsInput {
  @Field()
  category: string;

  @Field({ nullable: true })
  recyclingInfo?: string;

  @Field({ nullable: true })
  resultHash?: string;
}
