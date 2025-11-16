import { Module } from '@nestjs/common';

import { BadgeModule } from './badge.module';
import { PointModule } from './point/point.module';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { UserArticleModule } from './user-article.module';

@Module({
  providers: [UserResolver, UserService],
  imports: [PointModule, BadgeModule, UserArticleModule],
  exports: [UserService],
})
export class UserModule {}
