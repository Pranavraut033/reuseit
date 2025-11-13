import { Field, ID, ObjectType } from '@nestjs/graphql';

import { User } from '~/user/entities/user.entity';
import { Event } from './event.entity';

@ObjectType()
export class EvenParticipant {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => Event)
  event: Event;

  @Field(() => User)
  user: User;
}
