import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FinalizeRecyclingInput {
  @Field()
  objectName: string;

  @Field(() => [String])
  materials: string[];

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  imageBase64?: string;
}
