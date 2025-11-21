import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { UserArticle } from '~/user/entities/user-article.entity';

import { User } from '../user/entities/user.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { Post } from './entities/post.entity';
import {
  PostAuthorLoader,
  PostCommentCountLoader,
  PostCommentsLoader,
  PostEventLoader,
  PostLikeCountLoader,
  PostLocationLoader,
  PostUserArticlesLoader,
} from './post.loader';
import { PostService } from './post.service';

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Mutation(() => Post)
  createPost(
    @Args('createPostInput') createPostInput: CreatePostInput,
    @Context('req') req: { user?: User },
  ) {
    return this.postService.create(createPostInput, req.user?.id);
  }

  @Query(() => [Post], { name: 'posts' })
  async findAll() {
    return this.postService.findAll();
  }

  @Query(() => [Post], { name: 'postsByAuthor' })
  async findByAuthor(@Args('authorId', { type: () => String }) authorId: string) {
    return this.postService.findByAuthor(authorId);
  }

  @Query(() => [Post], { name: 'postsByIds' })
  async findByIds(@Args('ids', { type: () => [String] }) ids: string[]) {
    return this.postService.findByIds(ids);
  }

  @Query(() => Post, { name: 'post' })
  async findOne(@Args('id', { type: () => String }) id: string) {
    return this.postService.findOne(id);
  }

  @Mutation(() => Post)
  updatePost(
    @Args('updatePostInput') updatePostInput: UpdatePostInput,
    @Context('req') req: { user?: User },
  ) {
    return this.postService.update(updatePostInput.id, updatePostInput, req.user?.id);
  }

  @Mutation(() => Post)
  removePost(@Args('id', { type: () => String }) id: string, @Context('req') req: { user?: User }) {
    return this.postService.remove(id, req.user?.id);
  }

  @Mutation(() => Boolean)
  async togglePostLike(
    @Args('postId', { type: () => String }) postId: string,
    @Context('req') req: { user?: User },
  ): Promise<boolean> {
    return this.postService.togglePostLike(postId, req.user?.id);
  }

  // Field resolvers for relations
  @ResolveField('author', () => User, { nullable: true })
  async author(
    @Parent() post: Post & { authorId?: string | null },
    @Loader(PostAuthorLoader) loader: DataLoader<string, User | null>,
  ): Promise<User | null> {
    if (post.anonymous || !post.authorId) {
      return null;
    }
    return loader.load(post.authorId);
  }

  @ResolveField('comments', () => [Post])
  async comments(
    @Parent() post: Post,
    @Loader(PostCommentsLoader) loader: DataLoader<string, Comment[]>,
  ): Promise<Comment[]> {
    return loader.load(post.id);
  }

  @ResolveField('location', () => Location, { nullable: true })
  async location(
    @Parent() post: Post & { locationId?: string | null },
    @Loader(PostLocationLoader) loader: DataLoader<string, Location | null>,
  ): Promise<Location | null> {
    if (!post.locationId) return null;
    return loader.load(post.locationId);
  }

  @ResolveField('event', () => Event, { nullable: true })
  async event(
    @Parent() post: Post & { eventId?: string | null },
    @Loader(PostEventLoader) loader: DataLoader<string, Event | null>,
  ): Promise<Event | null> {
    if (!post.eventId) return null;
    return loader.load(post.eventId);
  }

  @ResolveField('userArticles', () => [UserArticle])
  async userArticles(
    @Parent() post: Post,
    @Loader(PostUserArticlesLoader) loader: DataLoader<string, UserArticle[]>,
  ): Promise<UserArticle[]> {
    return loader.load(post.id);
  }

  @ResolveField('likedByCurrentUser', () => Boolean, { nullable: true })
  async likedByCurrentUser(
    @Parent() post: Post,
    @Context('req') req: { user?: User },
  ): Promise<boolean | null> {
    const userId = req?.user?.id;
    if (!userId) return null;
    return this.postService.isLikedByUser(post.id, userId);
  }

  @ResolveField('commentCount', () => Number)
  async commentCount(
    @Parent() post: Post,
    @Loader(PostCommentCountLoader) loader: DataLoader<string, number>,
  ): Promise<number> {
    return loader.load(post.id);
  }

  @ResolveField('likeCount', () => Number)
  async likeCount(
    @Parent() post: Post,
    @Loader(PostLikeCountLoader) loader: DataLoader<string, number>,
  ): Promise<number> {
    return loader.load(post.id);
  }
}
