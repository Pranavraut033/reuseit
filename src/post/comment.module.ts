import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [CommentResolver, CommentService],
  imports: [PrismaModule],
})
export class CommentModule {}
