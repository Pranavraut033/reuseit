import { registerEnumType } from '@nestjs/graphql';

export enum PostType {
  GENERAL = 'GENERAL',
  GIVEAWAY = 'GIVEAWAY',
  EVENT = 'EVENT',
  MEETUP = 'MEETUP',
}

registerEnumType(PostType, { name: 'PostType' });
