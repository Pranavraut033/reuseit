import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SignInInput {
  @Field(() => String, { description: 'Firebase ID token (JWT) obtained after client auth' })
  idToken: string;
}
