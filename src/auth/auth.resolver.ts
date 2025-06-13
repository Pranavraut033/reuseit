import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Public } from './constants';
import { GoogleSignInInput } from './dto/google-signin.input';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth.response';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  async googleSignIn(
    @Args('data', { type: () => GoogleSignInInput }) data: GoogleSignInInput,
  ) {
    console.log({ data });

    return this.authService.googleSignIn(data);
  }
}
