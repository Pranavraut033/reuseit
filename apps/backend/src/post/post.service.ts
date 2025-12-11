import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { LocationService } from '~/location/location.service';
import { PointsService } from '~/points/points.service';

import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PostFilterInput, PostFilterType, PostType } from './entities/post-type.entity';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationService: LocationService,
    private readonly pointsService: PointsService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createPostInput: CreatePostInput, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to create a post');
    }

    const locationId = await this.locationService.verifyOrCreate(
      createPostInput.locationId,
      createPostInput.location,
      true,
    );

    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        category: createPostInput.category,
        condition: createPostInput.condition,
        description: createPostInput.description,
        eventId: createPostInput.eventId,
        images: createPostInput.images || [],
        locationId,
        pickupDate: createPostInput.pickupDate,
        tags: createPostInput.tags,
        title: createPostInput.title,
      },
    });

    await this.pointsService.addPoints(userId, 'CREATE_POST');

    await this.notificationService.sendNotificationToUser(
      userId,
      'Post Created',
      `Your post "${post.title}" was created successfully!`,
      { postId: post.id },
    );

    return post;
  }

  async findByIds(ids: string[]) {
    const posts = await this.prisma.post.findMany({
      where: { id: { in: ids } },
    });

    return posts;
  }

  async isLikedByUser(postId: string, userId: string | undefined): Promise<boolean> {
    if (!userId) return false;

    const existingLike = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    return !!existingLike;
  }

  async findAll(limit?: number, offset?: number, postFilter?: PostFilterInput) {
    let postType: PostType | undefined;
    let locationIds: string[] | undefined;

    if (postFilter?.type === PostFilterType.Giveaway) {
      postType = PostType.GIVEAWAY;
    } else if (postFilter?.type === PostFilterType.Requests) {
      postType = PostType.REQUESTS;
    } else if (postFilter?.type === PostFilterType.All) {
      postType = undefined;
    }

    // Handle nearby filter
    if (postFilter?.type === PostFilterType.Nearby && postFilter.latitude && postFilter.longitude) {
      const radiusInKm = postFilter.radiusInKm || 5; // Default 5km radius
      const nearbyLocations = await this.locationService.findNearBy(
        postFilter.latitude,
        postFilter.longitude,
        radiusInKm,
      );
      if (nearbyLocations && Array.isArray(nearbyLocations)) {
        locationIds = nearbyLocations.map((loc: any) => loc._id);
      }
    }

    const whereClause: any = {};
    if (postType) {
      whereClause.postType = postType;
    }
    if (locationIds) {
      whereClause.locationId = { in: locationIds };
    }

    const posts = await this.prisma.post.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return posts;
  }

  async findByAuthor(authorId: string) {
    const posts = await this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });

    return posts;
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: string, updatePostInput: UpdatePostInput, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to update a post');
    }

    // Check if post exists and belongs to user
    const existingPost = await this.prisma.post.findUnique({ where: { id } });

    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        description: updatePostInput.description,
        images: updatePostInput.images,
        locationId: updatePostInput.locationId,
        eventId: updatePostInput.eventId,
      },
    });

    return post;
  }

  async remove(id: string, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to delete a post');
    }

    // Check if post exists and belongs to user
    const existingPost = await this.prisma.post.findUnique({ where: { id } });

    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    const post = await this.prisma.post.delete({
      where: { id },
    });

    return post;
  }

  async togglePostLike(postId: string, userId: string | undefined): Promise<boolean> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to like a post');
    }

    // Check post exists
    const existingPost = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!existingPost) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Use the compound unique index (userId, postId) to find existing like
    const existingLike = await this.prisma.like.findUnique({
      where: {
        // prisma auto-generates the compound unique field name as userId_postId
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
    } else {
      await this.prisma.like.create({ data: { userId, postId } });
    }

    return !existingLike;
  }

  getCommentCount(postId: string): Promise<number> {
    return this.prisma.comment.count({ where: { postId } });
  }

  getLikeCount(postId: string): Promise<number> {
    return this.prisma.like.count({ where: { postId } });
  }
}
