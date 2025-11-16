import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';

import { User } from '../user/entities/user.entity';
import { CommentService } from './comment.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { Comment } from './entities/comment.entity';

@Resolver(() => Comment)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

  @Mutation(() => Comment)
  createComment(
    @Args('createCommentInput') createCommentInput: CreateCommentInput,
    @Context('req') req: { user?: User },
  ) {
    return this.commentService.create(createCommentInput, req.user?.id);
  }

  @Query(() => [Comment], { name: 'comments' })
  findAll() {
    return this.commentService.findAll();
  }

  @Query(() => Comment, { name: 'comment' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.commentService.findOne(id);
  }

  @Query(() => [Comment], { name: 'commentsByPost' })
  findByPostId(@Args('postId', { type: () => String }) postId: string) {
    return this.commentService.findByPostId(postId);
  }

  @Mutation(() => Comment)
  updateComment(
    @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
    @Context('req') req: { user?: User },
  ) {
    return this.commentService.update(updateCommentInput.id, updateCommentInput, req.user?.id);
  }

  @Mutation(() => Comment)
  removeComment(
    @Args('id', { type: () => String }) id: string,
    @Context('req') req: { user?: User },
  ) {
    return this.commentService.remove(id, req.user?.id);
  }
}
