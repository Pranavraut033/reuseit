import { UserModule } from '~/user/user.module';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { AuthResolver } from './auth.resolver';

@Module({
  providers: [AuthService, AuthResolver],
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
