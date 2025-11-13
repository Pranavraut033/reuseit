import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { PointModule } from './point/point.module';
import { BadgeModule } from './badge.module';
import { UserArticleModule } from './user-article.module';

@Module({
  providers: [UserResolver, UserService],
  imports: [PointModule, BadgeModule, UserArticleModule],
  exports: [UserService],
})
export class UserModule {}
