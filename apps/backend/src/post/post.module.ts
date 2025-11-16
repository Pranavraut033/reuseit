import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CommentModule } from './comment.module';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';

@Module({
  providers: [PostResolver, PostService],
  imports: [CommentModule, PrismaModule],
})
export class PostModule {}
