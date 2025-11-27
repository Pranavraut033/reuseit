import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AnalyzeWasteInput {
  @Field()
  imageBase64: string;

  @Field({ nullable: true })
  userText?: string;
}
