import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PrismaService } from '../prisma/prisma.service';
import { Post } from './entities/post.entity';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostInput: CreatePostInput, userId: string | undefined): Promise<Post> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to create a post');
    }

    const post = await this.prisma.post.create({
      data: {
        content: createPostInput.content,
        images: createPostInput.images || [],
        authorId: userId,
        locationId: createPostInput.locationId,
        eventId: createPostInput.eventId,
      },
      include: {
        author: true,
        comments: true,
        location: true,
        event: true,
        userArticles: true,
      },
    });

    return post as any;
  }

  async isLikedByUser(postId: string, userId: string | undefined): Promise<boolean> {
    if (!userId) return false;

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return !!existingLike;
  }

  async findAll(): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      include: {
        author: true,
        comments: {
          include: {
            author: true,
          },
        },
        location: true,
        event: true,
        userArticles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return posts as any;
  }

  async findByAuthor(authorId: string): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: { authorId },
      include: {
        author: true,
        comments: {
          include: {
            author: true,
          },
        },
        location: true,
        event: true,
        userArticles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return posts as any;
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        comments: {
          include: {
            author: true,
          },
        },
        location: true,
        event: true,
        userArticles: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post as any;
  }

  async update(
    id: string,
    updatePostInput: UpdatePostInput,
    userId: string | undefined,
  ): Promise<Post> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to update a post');
    }

    // Check if post exists and belongs to user
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        content: updatePostInput.content,
        images: updatePostInput.images,
        locationId: updatePostInput.locationId,
        eventId: updatePostInput.eventId,
      },
      include: {
        author: true,
        comments: true,
        location: true,
        event: true,
        userArticles: true,
      },
    });

    return post as any;
  }

  async remove(id: string, userId: string | undefined): Promise<Post> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to delete a post');
    }

    // Check if post exists and belongs to user
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    const post = await this.prisma.post.delete({
      where: { id },
      include: {
        author: true,
        comments: true,
        location: true,
        event: true,
        userArticles: true,
      },
    });

    return post as any;
  }

  async likePost(postId: string, userId: string | undefined): Promise<Post> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to like a post');
    }

    // Check post exists
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Use the compound unique index (userId, postId) to find existing like
    const existingLike = await this.prisma.like.findUnique({
      where: {
        // prisma auto-generates the compound unique field name as userId_postId
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let updatedPost;

    if (existingLike) {
      // Unlike: delete the Like and decrement post.likes (not going below 0)
      const [, post] = await this.prisma.$transaction([
        this.prisma.like.delete({ where: { id: existingLike.id } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
          include: {
            author: true,
            comments: true,
            location: true,
            event: true,
            userArticles: true,
          },
        }),
      ]);

      updatedPost = post;
    } else {
      // Like: create a Like and increment post.likes
      const [, post] = await this.prisma.$transaction([
        this.prisma.like.create({ data: { userId, postId } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likes: { increment: 1 } },
          include: {
            author: true,
            comments: true,
            location: true,
            event: true,
            userArticles: true,
          },
        }),
      ]);

      updatedPost = post;
    }

    if (!updatedPost) {
      throw new NotFoundException(`Post with ID ${postId} not found after like toggle`);
    }

    return updatedPost;
  }
}
