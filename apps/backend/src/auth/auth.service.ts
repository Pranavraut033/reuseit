import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';

import { PrismaService } from '~/prisma/prisma.service';

import { SignInInput } from './dto/signin.input';

@Injectable()
export class AuthService {
  constructor(
    @Inject('FIREBASE_APP') private firebaseApp: admin.app.App,
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signIn({ idToken }: SignInInput) {
    // Verify the Firebase ID token to ensure authenticity
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await this.firebaseApp.auth().verifyIdToken(idToken);
    } catch (err) {
      throw new Error('Invalid or expired ID token', { cause: err });
    }

    const emailRaw = (decoded.email || '').trim();

    const userData = {
      googleId: decoded.uid,
      name: (decoded as unknown as { name?: string }).name || '',
      email: emailRaw || `${decoded.uid}@auth.local`,
      emailVerified: !!decoded.email_verified,
      phoneNumber: decoded.phone_number || undefined,
      avatarUrl: decoded.picture || undefined,
      lastLogin: new Date(),
    };

    let user = await this.prismaService.user.findFirst({
      where: { OR: [{ googleId: userData.googleId }, { email: userData.email }] },
    });

    console.log({ user });

    if (user) {
      user = await this.prismaService.user.update({
        where: { id: user.id },
        data: { ...userData, name: undefined },
      });
    } else {
      user = await this.prismaService.user.create({
        data: userData,
      });
    }

    const { password: _remove, ...result } = user;

    const token = this.jwtService.sign({ userId: user.id, email: user.email });

    return { user: result, token: token };
  }
}
