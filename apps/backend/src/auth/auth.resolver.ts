import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Public } from './constants';
import { SignInInput } from './dto/signin.input';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth.response';
import { User } from '~/user/entities/user.entity';

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
  async me(@Context('req') req: { user?: User }) {
    return req.user;
  }
}
