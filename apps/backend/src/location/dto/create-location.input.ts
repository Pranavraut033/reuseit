import { Field, InputType } from '@nestjs/graphql';

import { LocationType } from '../entities/location-type.entity';

@InputType()
export class CreateLocationInput {
  @Field(() => String, { description: 'Street address' })
  street: string;
  @Field(() => String, { description: 'Location line 2', nullable: true })
  addressLine2?: string;
  @Field(() => String, { nullable: true, description: 'Additional address information' })
  additionalInfo?: string;
  @Field(() => String, { description: 'City', nullable: true })
  city?: string;
  @Field(() => String, { description: 'Country' })
  country: string;
  @Field(() => String, { description: 'Postal code', nullable: true })
  postalCode?: string;
  @Field(() => [Number], { description: 'Coordinates [longitude, latitude]' })
  coordinates: number[];
  @Field(() => String, { nullable: true, description: 'Google Place ID' })
  googlePlaceId?: string;
  @Field(() => String, { description: 'Location type' })
  type: LocationType;
}
