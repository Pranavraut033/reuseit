import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '~/prisma/prisma.service';

import { AuthService } from './auth.service';

type FirebaseVerifyMock = { verifyIdToken: jest.Mock };
type FirebaseAppMock = { auth: () => FirebaseVerifyMock; options?: Record<string, unknown> };

// Helper to create a minimal firebase app mock. Keep this contract explicit so tests break loudly when AuthService
// starts relying on additional Firebase features.
function createFirebaseAppMock() {
  const verify = jest.fn();
  return { auth: () => ({ verifyIdToken: verify }), options: {} } as FirebaseAppMock;
}

describe('AuthService (isolated)', () => {
  let moduleRef: TestingModule;
  let service: AuthService;
  let firebaseAppMock: FirebaseAppMock;
  let prismaMock: { user: { findFirst: jest.Mock; update: jest.Mock; create: jest.Mock } };
  let jwtMock: Partial<JwtService> & { sign: jest.Mock };

  beforeEach(async () => {
    firebaseAppMock = createFirebaseAppMock();

    prismaMock = {
      user: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    };

    jwtMock = { sign: jest.fn().mockReturnValue('jwt-token') } as Partial<JwtService> & {
      sign: jest.Mock;
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'FIREBASE_APP', useValue: firebaseAppMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  test('signs in existing user and returns token', async () => {
    const decoded = {
      uid: 'g-1',
      email: 'a@e.com',
      name: 'Name',
      picture: 'url',
      email_verified: true,
    };
    firebaseAppMock.auth().verifyIdToken.mockResolvedValue(decoded);

    const existingUser = { id: 'u1', email: 'a@e.com', password: 'x' };
    prismaMock.user.findFirst.mockResolvedValue(existingUser);
    prismaMock.user.update.mockResolvedValue({ ...existingUser, lastLogin: new Date() });

    const res = await service.signIn({ idToken: 'token-1' });

    expect(firebaseAppMock.auth().verifyIdToken).toHaveBeenCalledWith('token-1');
    expect(prismaMock.user.findFirst).toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalled();
    expect(jwtMock.sign).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', email: 'a@e.com' }),
    );
    expect(res).toHaveProperty('token', 'jwt-token');
    expect(res).toHaveProperty('user');
    expect(res.user as Record<string, unknown>).not.toHaveProperty('password');
  });

  test('creates new user when none exists', async () => {
    const decoded = {
      uid: 'g-2',
      email: 'b@e.com',
      name: 'B',
      picture: undefined,
      email_verified: false,
    };
    firebaseAppMock.auth().verifyIdToken.mockResolvedValue(decoded);

    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u2', email: 'b@e.com' });

    const res = await service.signIn({ idToken: 'token-2' });

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(jwtMock.sign).toHaveBeenCalled();
    expect(res.token).toBe('jwt-token');
  });

  test('throws when firebase token invalid', async () => {
    firebaseAppMock.auth().verifyIdToken.mockRejectedValue(new Error('invalid'));

    await expect(service.signIn({ idToken: 'bad' })).rejects.toThrow('Invalid or expired ID token');
  });
});
