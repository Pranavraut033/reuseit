import { Module } from '@nestjs/common';

import { PrismaModule } from '~/prisma/prisma.module';

import { UserArticlePostLoader, UserArticleUserLoader } from './user-article.loader';
import { UserArticleResolver } from './user-article.resolver';
import { UserArticleService } from './user-article.service';

@Module({
  providers: [
    UserArticleResolver,
    UserArticleService,
    UserArticleUserLoader,
    UserArticlePostLoader,
  ],
  imports: [PrismaModule],
})
export class UserArticleModule {}
