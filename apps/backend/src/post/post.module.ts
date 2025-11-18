import { Module } from '@nestjs/common';

import { LocationModule } from '~/location/location.module';

import { PrismaModule } from '../prisma/prisma.module';
import { CommentModule } from './comment.module';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';

@Module({
  providers: [PostResolver, PostService],
  imports: [CommentModule, PrismaModule, LocationModule],
})
export class PostModule {}
