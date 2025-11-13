import { ObjectType, Field, ID } from '@nestjs/graphql';
import { BadgeAssignment } from './badge-assignment';

@ObjectType()
export class Badge {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  criteria?: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  iconUrl?: string;

  @Field()
  name: string;

  @Field(() => [BadgeAssignment])
  users: BadgeAssignment[];
}
