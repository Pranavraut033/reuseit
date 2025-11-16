import { Module } from '@nestjs/common';

import { UserArticleResolver } from './user-article.resolver';
import { UserArticleService } from './user-article.service';

@Module({
  providers: [UserArticleResolver, UserArticleService],
})
export class UserArticleModule {}
