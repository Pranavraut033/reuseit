import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AddressComponent {
  @Field()
  longName: string;

  @Field()
  shortName: string;

  @Field(() => [String])
  types: string[];
}

@ObjectType()
export class PlaceDetails {
  @Field()
  placeId: string;

  @Field()
  name: string;

  @Field()
  formattedAddress: string;

  @Field()
  latitude: number;

  @Field()
  longitude: number;

  @Field(() => [AddressComponent])
  addressComponents: AddressComponent[];
}
