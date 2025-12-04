import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

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
      include: {
        author: true,
        post: true,
      },
    });

    return comment;
  }

  async findAll() {
    const comments = await this.prisma.comment.findMany({
      include: {
        author: true,
        post: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments;
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        post: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async findByPostId(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      include: {
        author: true,
        post: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
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
      data: {
        content: updateCommentInput.content,
      },
      include: {
        author: true,
        post: true,
      },
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
      include: {
        author: true,
        post: true,
      },
    });

    return comment;
  }
}
