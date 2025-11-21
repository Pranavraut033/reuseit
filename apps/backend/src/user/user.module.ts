import { Module } from '@nestjs/common';

import { PrismaModule } from '~/prisma/prisma.module';

import { BadgeModule } from './badge.module';
import { PointModule } from './point/point.module';
import {
  UserArticlesLoader,
  UserBadgesLoader,
  UserCommentsLoader,
  UserEventParticipationsLoader,
  UserEventsLoader,
  UserLoader,
  UserPointsHistoryLoader,
  UserPostsLoader,
} from './user.loader';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { UserArticleModule } from './user-article.module';

@Module({
  providers: [
    UserResolver,
    UserService,
    UserLoader,
    UserPostsLoader,
    UserCommentsLoader,
    UserBadgesLoader,
    UserEventsLoader,
    UserEventParticipationsLoader,
    UserPointsHistoryLoader,
    UserArticlesLoader,
  ],
  imports: [PointModule, BadgeModule, UserArticleModule, PrismaModule],
  exports: [UserService],
})
export class UserModule {}
