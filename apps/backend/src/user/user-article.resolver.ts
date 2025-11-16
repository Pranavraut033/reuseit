import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserArticleService } from './user-article.service';
import { UserArticle } from './entities/user-article.entity';
import { CreateUserArticleInput } from './dto/create-user-article.input';
import { UpdateUserArticleInput } from './dto/update-user-article.input';

@Resolver(() => UserArticle)
export class UserArticleResolver {
  constructor(private readonly userArticleService: UserArticleService) {}

  @Mutation(() => UserArticle)
  createUserArticle(
    @Args('createUserArticleInput')
    createUserArticleInput: CreateUserArticleInput,
  ) {
    return this.userArticleService.create(createUserArticleInput);
  }

  @Query(() => [UserArticle], { name: 'userArticle' })
  findAll() {
    return this.userArticleService.findAll();
  }

  @Query(() => UserArticle, { name: 'userArticle' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.userArticleService.findOne(id);
  }

  @Mutation(() => UserArticle)
  updateUserArticle(
    @Args('updateUserArticleInput')
    updateUserArticleInput: UpdateUserArticleInput,
  ) {
    return this.userArticleService.update(updateUserArticleInput.id, updateUserArticleInput);
  }

  @Mutation(() => UserArticle)
  removeUserArticle(@Args('id', { type: () => Int }) id: number) {
    return this.userArticleService.remove(id);
  }
}
