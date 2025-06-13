import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { GoogleSignInInput } from './dto/google-signin.input';
import { PrismaService } from 'src/prisma/prisma.service';
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
  async googleSignIn({
    uid: googleId,
    displayName: name,
    email,
    emailVerified,
    phoneNumber,
    photoURL: avatarUrl,
  }: GoogleSignInInput) {
    const user = await this.prismaService.user.upsert({
      where: { googleId },
      update: {
        name,
        email,
        emailVerified,
        phoneNumber,
        avatarUrl,
        lastLogin: new Date(),
      },
      create: { googleId, name, email, emailVerified, phoneNumber, avatarUrl },
    });

    const { password: _remove, ...result } = user;
    console.log({ result });

    const token = this.jwtService.sign({ userId: user.id, email: user.email });

    return { user: result, token: token }; // Token generation logic can be added later
  }
}
