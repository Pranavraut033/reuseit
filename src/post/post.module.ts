import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostResolver } from './post.resolver';
import { CommentModule } from './comment.module';

@Module({
  providers: [PostResolver, PostService],
  imports: [CommentModule],
})
export class PostModule {}
