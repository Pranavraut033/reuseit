import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import type { Post as PrismaPost, User as PrismaUser } from '@prisma/client';
import type { Cache } from 'cache-manager';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { CacheQuery, InvalidateCache } from '~/decorators/cache.decorator';

import { User } from '../user/entities/user.entity';
import { CommentAuthorLoader, CommentPostLoader } from './comment.loader';
import { CommentService } from './comment.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { Comment } from './entities/comment.entity';
import { Post } from './entities/post.entity';

@Resolver(() => Comment)
export class CommentResolver {
  constructor(
    private readonly commentService: CommentService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Mutation(() => Comment)
  @InvalidateCache((result: Comment, createCommentInput: CreateCommentInput) => [
    'comments',
    `commentsByPost:${createCommentInput.postId}`,
    `comment:${result.id}`,
  ])
  createComment(
    @Args('createCommentInput') createCommentInput: CreateCommentInput,
    @Context('req') req: { user?: User },
  ) {
    return this.commentService.create(createCommentInput, req.user?.id);
  }

  @Query(() => [Comment], { name: 'comments' })
  @CacheQuery(() => 'comments', 300)
  findAll() {
    return this.commentService.findAll();
  }

  @Query(() => Comment, { name: 'comment' })
  @CacheQuery((id: string) => `comment:${id}`, 300)
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.commentService.findOne(id);
  }

  @Query(() => [Comment], { name: 'commentsByPost' })
  @CacheQuery((postId: string) => `commentsByPost:${postId}`, 300)
  findByPostId(@Args('postId', { type: () => String }) postId: string) {
    return this.commentService.findByPostId(postId);
  }

  @Mutation(() => Comment)
  @InvalidateCache((result: Comment) => [
    'comments',
    `commentsByPost:${result.postId}`,
    `comment:${result.id}`,
  ])
  updateComment(
    @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
    @Context('req') req: { user?: User },
  ) {
    return this.commentService.update(updateCommentInput.id, updateCommentInput, req.user?.id);
  }

  @Mutation(() => Comment)
  @InvalidateCache((result: Comment) => [
    'comments',
    `commentsByPost:${result.postId}`,
    `comment:${result.id}`,
  ])
  removeComment(
    @Args('id', { type: () => String }) id: string,
    @Context('req') req: { user?: User },
  ) {
    return this.commentService.remove(id, req.user?.id);
  }

  // Field resolvers for relations
  @ResolveField('author', () => User, { nullable: true })
  async author(
    @Parent() comment: Comment & { authorId?: string | null },
    @Loader(CommentAuthorLoader) loader: DataLoader<string, PrismaUser | null>,
  ): Promise<PrismaUser | null> {
    if (!comment.authorId) return null;
    return loader.load(comment.authorId);
  }

  @ResolveField('post', () => Post)
  async post(
    @Parent() comment: Comment & { postId: string },
    @Loader(CommentPostLoader) loader: DataLoader<string, PrismaPost | null>,
  ): Promise<PrismaPost | null> {
    return loader.load(comment.postId);
  }
}
