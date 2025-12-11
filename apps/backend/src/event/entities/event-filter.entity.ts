import { Field, InputType, registerEnumType } from '@nestjs/graphql';

export enum EventFilterType {
  All = 'ALL',
  Nearby = 'NEARBY',
  Upcoming = 'UPCOMING',
}

@InputType()
export class EventFilterInput {
  @Field(() => EventFilterType, { nullable: true })
  type?: EventFilterType;

  @Field(() => Number, { nullable: true })
  latitude?: number;

  @Field(() => Number, { nullable: true })
  longitude?: number;

  @Field(() => Number, { nullable: true })
  radiusInKm?: number;
}

registerEnumType(EventFilterType, { name: 'EventFilterType' });
