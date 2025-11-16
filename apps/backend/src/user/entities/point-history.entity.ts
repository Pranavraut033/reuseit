import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

import { User } from './user.entity';

@ObjectType()
export class PointsHistory {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => Int)
  amount: number;

  @Field()
  reason: string;

  @Field(() => User)
  user: User;
}
