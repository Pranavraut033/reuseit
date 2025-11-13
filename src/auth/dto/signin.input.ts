import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SignInInput {
  @Field(() => String, { description: 'User unique identifier' })
  uid: string;

  @Field(() => String, { description: 'User display name' })
  displayName: string;

  @Field(() => String, { description: 'User email address' })
  email: string;

  @Field(() => Boolean, { description: 'Is email verified' })
  emailVerified: boolean;

  @Field(() => Boolean, { description: 'Is user anonymous' })
  isAnonymous: boolean;

  @Field(() => String, { nullable: true, description: 'User phone number' })
  phoneNumber?: string;

  @Field(() => String, { nullable: true, description: 'User photo URL' })
  photoURL?: string;
}
