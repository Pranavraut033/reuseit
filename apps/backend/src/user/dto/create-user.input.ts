import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field(() => String, { description: 'User email address' })
  email: string;

  @Field(() => String, { description: 'User display name' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Username (optional)' })
  username?: string;

  @Field(() => String, { nullable: true, description: 'Phone number' })
  phoneNumber?: string;

  @Field(() => String, { nullable: true, description: 'Avatar URL' })
  avatarUrl?: string;
}
