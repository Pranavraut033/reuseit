import { forwardRef, Module } from '@nestjs/common';

import { PrismaModule } from '~/prisma/prisma.module';
import { UserModule } from '~/user/user.module';

import { BadgeAssignmentBadgeLoader, BadgeLoader, BadgeUsersLoader } from './badge.loader';
import { BadgeResolver } from './badge.resolver';
import { BadgeService } from './badge.service';

@Module({
  providers: [
    BadgeResolver,
    BadgeService,
    BadgeLoader,
    BadgeUsersLoader,
    BadgeAssignmentBadgeLoader,
  ],
  imports: [PrismaModule, forwardRef(() => UserModule)],
})
export class BadgeModule {}
