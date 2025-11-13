import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostResolver } from './post.resolver';
import { CommentModule } from './comment.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [PostResolver, PostService],
  imports: [CommentModule, PrismaModule],
})
export class PostModule {}
