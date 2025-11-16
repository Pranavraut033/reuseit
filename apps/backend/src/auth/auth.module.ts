import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { FirebaseModule } from '~/firebase/firebase.module';
import { UserModule } from '~/user/user.module';

import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';

@Module({
  providers: [AuthService, AuthResolver],
  imports: [
    UserModule,
    FirebaseModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
