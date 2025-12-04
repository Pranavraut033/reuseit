import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';

import { PrismaService } from '~/prisma/prisma.service';
import { UserService } from '~/user/user.service';

import { Public } from './constants';
import { SignInInput } from './dto/signin.input';

@Injectable()
export class AuthService {
  constructor(
    @Inject('FIREBASE_APP') private firebaseApp: admin.app.App,
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
  async signIn({ idToken }: SignInInput) {
    // Verify the Firebase ID token to ensure authenticity
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await this.firebaseApp.auth().verifyIdToken(idToken);
    } catch (err) {
      throw new Error('Invalid or expired ID token', { cause: err });
    }

    const googleId = decoded.uid;
    const name = (decoded as unknown as { name?: string }).name || '';
    const emailRaw = (decoded.email || '').trim();
    const email = emailRaw || `${googleId}@auth.local`;
    const emailVerified = !!decoded.email_verified;
    const phoneNumber = decoded.phone_number || undefined;
    const avatarUrl = decoded.picture || undefined;

    const user = await this.prismaService.safeUpsert('User', this.prismaService.user, {
      where: { googleId },
      update: {
        name,
        email,
        emailVerified,
        phoneNumber,
        avatarUrl,
        lastLogin: new Date(),
      },
      create: {
        googleId,
        name,
        email,
        emailVerified,
        phoneNumber,
        avatarUrl,
      },
    });

    const { password: _remove, ...result } = user;

    const token = this.jwtService.sign({ userId: user.id, email: user.email });

    return { user: result, token: token };
  }
}
