import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NearbyPlace {
  @Field()
  placeId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  vicinity?: string;

  @Field(() => [String], { nullable: true })
  types?: string[];

  @Field({ nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  longitude?: number;

  @Field({ nullable: true })
  photoUrl?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  hours?: string;

  @Field(() => [String], { nullable: true })
  acceptedMaterials?: string[];
}
