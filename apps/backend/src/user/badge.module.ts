import { Module } from '@nestjs/common';

import { PrismaModule } from '~/prisma/prisma.module';

import {
  BadgeAssignmentBadgeLoader,
  BadgeAssignmentUserLoader,
  BadgeLoader,
  BadgeUsersLoader,
} from './badge.loader';
import { BadgeResolver } from './badge.resolver';
import { BadgeService } from './badge.service';

@Module({
  providers: [
    BadgeResolver,
    BadgeService,
    BadgeLoader,
    BadgeUsersLoader,
    BadgeAssignmentBadgeLoader,
    BadgeAssignmentUserLoader,
  ],
  imports: [PrismaModule],
})
export class BadgeModule {}
