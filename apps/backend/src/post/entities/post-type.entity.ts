import { Field, InputType, registerEnumType } from '@nestjs/graphql';

export enum PostType {
  GIVEAWAY = 'GIVEAWAY',
  REQUESTS = 'REQUESTS',
}

export enum PostFilterType {
  All = 'ALL',
  Nearby = 'NEARBY',
  Giveaway = 'GIVEAWAY',
  Requests = 'REQUESTS',
}

@InputType()
export class PostFilterInput {
  @Field(() => PostFilterType, { nullable: true })
  type?: PostFilterType;

  @Field(() => Number, { nullable: true })
  latitude?: number;

  @Field(() => Number, { nullable: true })
  longitude?: number;

  @Field(() => Number, { nullable: true })
  radiusInKm?: number;
}

registerEnumType(PostType, { name: 'PostType' });
registerEnumType(PostFilterType, { name: 'PostFilterType' });
