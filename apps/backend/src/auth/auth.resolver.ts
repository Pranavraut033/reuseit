import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';

import { User } from '~/user/entities/user.entity';

import { AuthService } from './auth.service';
import { Public } from './constants';
import { AuthResponse } from './dto/auth.response';
import { SignInInput } from './dto/signin.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  async signIn(@Args('data', { type: () => SignInInput }) data: SignInInput) {
    return this.authService.signIn(data);
  }

  // Returns the currently authenticated user
  @Query(() => User)
  me(@Context('req') req: { user?: User }) {
    return req.user;
  }
}
