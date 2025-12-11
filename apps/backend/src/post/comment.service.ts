import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { NotificationService } from '~/notification/notification.service';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createCommentInput: CreateCommentInput, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to create a comment');
    }

    // Verify that the post exists
    const post = await this.prisma.post.findUnique({
      where: { id: createCommentInput.postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${createCommentInput.postId} not found`);
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentInput.content,
        postId: createCommentInput.postId,
        authorId: userId,
      },
    });

    // Notify post author if not the commenter
    if (post.authorId && post.authorId !== userId) {
      await this.notificationService.sendNotificationToUser(
        post.authorId,
        'New Comment',
        `Your post received a new comment: "${createCommentInput.content.slice(0, 50)}"`,
        { postId: post.id, commentId: comment.id },
      );
    }

    return comment;
  }

  async findAll() {
    const comments = await this.prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async findByPostId(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  async update(id: string, updateCommentInput: UpdateCommentInput, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to update a comment');
    }

    // Check if comment exists and belongs to user
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (existingComment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const comment = await this.prisma.comment.update({
      where: { id },
      data: { content: updateCommentInput.content },
    });

    return comment;
  }

  async remove(id: string, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to delete a comment');
    }

    // Check if comment exists and belongs to user
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (existingComment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const comment = await this.prisma.comment.delete({
      where: { id },
    });

    return comment;
  }
}
