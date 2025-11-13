import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { User } from '../user/entities/user.entity';

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
  findAll() {
    return this.postService.findAll();
  }

  @Query(() => [Post], { name: 'postsByAuthor' })
  findByAuthor(@Args('authorId', { type: () => String }) authorId: string) {
    return this.postService.findByAuthor(authorId);
  }

  @Query(() => Post, { name: 'post' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.postService.findOne(id);
  }

  @Mutation(() => Post)
  updatePost(
    @Args('updatePostInput') updatePostInput: UpdatePostInput,
    @Context('req') req: { user?: User },
  ) {
    return this.postService.update(
      updatePostInput.id,
      updatePostInput,
      req.user?.id,
    );
  }

  @Mutation(() => Post)
  removePost(
    @Args('id', { type: () => String }) id: string,
    @Context('req') req: { user?: User },
  ) {
    return this.postService.remove(id, req.user?.id);
  }

  @Mutation(() => Post)
  likePost(
    @Args('postId', { type: () => String }) postId: string,
    @Context('req') req: { user?: User },
  ) {
    return this.postService.likePost(postId, req.user?.id);
  }

  @ResolveField(() => Boolean, { name: 'likedByCurrentUser', nullable: true })
  async likedByCurrentUser(
    @Parent() post: Post,
    @Context('req') req: { user?: User },
  ) {
    const userId = req?.user?.id;
    return this.postService.isLikedByUser(post.id, userId);
  }
}
