import { forwardRef, Module } from '@nestjs/common';

import { PostModule } from '~/post/post.module';
import { PrismaModule } from '~/prisma/prisma.module';
import { UserModule } from '~/user/user.module';

import { UserArticleResolver } from './user-article.resolver';
import { UserArticleService } from './user-article.service';

@Module({
  providers: [UserArticleResolver, UserArticleService],
  imports: [PrismaModule, forwardRef(() => UserModule), PostModule],
})
export class UserArticleModule {}
