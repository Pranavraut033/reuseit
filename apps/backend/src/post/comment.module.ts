import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';

@Module({
  providers: [CommentResolver, CommentService],
  imports: [PrismaModule],
})
export class CommentModule {}
