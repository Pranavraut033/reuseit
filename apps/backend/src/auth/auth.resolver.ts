import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CurrentUser } from '~/decorators/CurrentUser';
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

  @Query(() => User, { nullable: true })
  me(@CurrentUser() user?: User) {
    return user;
  }
}
