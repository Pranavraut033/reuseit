import { Module } from '@nestjs/common';
import { UserArticleService } from './user-article.service';
import { UserArticleResolver } from './user-article.resolver';

@Module({
  providers: [UserArticleResolver, UserArticleService],
})
export class UserArticleModule {}
