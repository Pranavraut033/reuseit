import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Badge } from './badge.entity';
import { User } from './user.entity';

@ObjectType()
export class BadgeAssignment {
  @Field(() => ID)
  id: string;

  @Field()
  awardedAt: Date;

  @Field(() => Badge)
  badge: Badge;

  @Field(() => ID)
  badgeId: string;

  @Field(() => User)
  user: User;

  @Field(() => ID)
  userId: string;
}
