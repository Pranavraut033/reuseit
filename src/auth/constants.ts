export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'defaultSecretKeyForJWT', // Use a strong secret key in production
  expiresIn: '90d', // Token expiration time
  refreshTokenExpiresIn: '30d', // Refresh token expiration time
};

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
