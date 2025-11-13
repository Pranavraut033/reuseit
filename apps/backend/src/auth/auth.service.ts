import { Injectable } from '@nestjs/common';
import { UserService } from '~/user/user.service';
import { SignInInput } from './dto/signin.input';
import { PrismaService } from '~/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Public } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne({ email: username });

    if (user && user.password === pass) {
      const { password: _remove, ...result } = user;
      return result;
    }

    return null;
  }

  @Public()
  async signIn({
    uid: googleId,
    displayName: name,
    email,
    emailVerified,
    phoneNumber,
    photoURL: avatarUrl,
  }: SignInInput) {
    // Some providers (e.g., phone auth) may not supply an email. Ensure uniqueness and non-null.
    const normalizedEmail = (email || '').trim() || `${googleId}@auth.local`;

    const user = await this.prismaService.safeUpsert(
      'User',
      this.prismaService.user,
      {
        where: { googleId },
        update: {
          name,
          email: normalizedEmail,
          emailVerified,
          phoneNumber,
          avatarUrl,
          lastLogin: new Date(),
        },
        create: {
          googleId,
          name,
          email: normalizedEmail,
          emailVerified,
          phoneNumber,
          avatarUrl,
        },
      },
    );

    const { password: _remove, ...result } = user;

    const token = this.jwtService.sign({ userId: user.id, email: user.email });

    return { user: result, token: token }; // Token generation logic can be added later
  }
}
