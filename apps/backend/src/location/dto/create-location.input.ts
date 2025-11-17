import { Field, InputType } from '@nestjs/graphql';

import { LocationType } from '../entities/location-type.entity';

@InputType()
export class CreateLocationInput {
  @Field(() => String, { description: 'Location address' })
  address: string;
  @Field(() => String, { description: 'Location line 2', nullable: true })
  addressLine2?: string;
  @Field(() => String, { nullable: true, description: 'Additional address information' })
  additionalInfo?: string;
  @Field(() => String, { description: 'City' })
  city: string;
  @Field(() => String, { description: 'Country' })
  country: string;
  @Field(() => Number, { description: 'Postal code' })
  postalCode: number;
  @Field(() => [Number], { description: 'Coordinates [longitude, latitude]' })
  coordinates: number[];
  @Field(() => String, { nullable: true, description: 'Google Place ID' })
  googlePlaceId?: string;
  @Field(() => String, { description: 'Location type' })
  type: LocationType;
}
