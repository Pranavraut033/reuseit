import { Module } from '@nestjs/common';

import { LocationModule } from '~/location/location.module';
import { NotificationModule } from '~/notification/notification.module';
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
    CommentAuthorLoader,
    CommentPostLoader,
    PostAuthorLoader,
    PostCommentCountLoader,
    PostCommentsLoader,
    PostEventLoader,
    PostLikeCountLoader,
    PostLikedByUserLoader,
    PostLoader,
    PostLocationLoader,
    PostResolver,
    PostService,
    PostUserArticlesLoader,
  ],
  imports: [CommentModule, PrismaModule, LocationModule, PointsModule, NotificationModule],
})
export class PostModule {}
