import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PlaceAutocompletePrediction {
  @Field()
  description: string;

  @Field()
  placeId: string;

  @Field(() => [String], { nullable: true })
  types?: string[];
}
