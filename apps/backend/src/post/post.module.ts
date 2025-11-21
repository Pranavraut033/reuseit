import { Module } from '@nestjs/common';

import { LocationModule } from '~/location/location.module';
import { PointsModule } from '~/points/points.module';

import { PrismaModule } from '../prisma/prisma.module';
import { CommentAuthorLoader, CommentPostLoader } from './comment.loader';
import { CommentModule } from './comment.module';
import {
  PostAuthorLoader,
  PostCommentCountLoader,
  PostCommentsLoader,
  PostEventLoader,
  PostLikeCountLoader,
  PostLikedByUserLoader,
  PostLoader,
  PostLocationLoader,
  PostUserArticlesLoader,
} from './post.loader';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';

@Module({
  providers: [
    PostResolver,
    PostService,
    PostLoader,
    PostAuthorLoader,
    PostCommentsLoader,
    PostLocationLoader,
    PostEventLoader,
    PostUserArticlesLoader,
    PostLikeCountLoader,
    PostCommentCountLoader,
    PostLikedByUserLoader,
    CommentAuthorLoader,
    CommentPostLoader,
  ],
  imports: [CommentModule, PrismaModule, LocationModule, PointsModule],
})
export class PostModule {}
