import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import { CacheQuery, InvalidateCache } from '~/decorators/cache.decorator';

import { CreateUserArticleInput } from './dto/create-user-article.input';
import { UpdateUserArticleInput } from './dto/update-user-article.input';
import { UserArticle } from './entities/user-article.entity';
import { UserArticleService } from './user-article.service';

@Resolver(() => UserArticle)
export class UserArticleResolver {
  constructor(
    private readonly userArticleService: UserArticleService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Mutation(() => UserArticle)
  @InvalidateCache((result: UserArticle) => [`userArticles`, `userArticle:${result.id}`])
  createUserArticle(
    @Args('createUserArticleInput')
    createUserArticleInput: CreateUserArticleInput,
  ) {
    return this.userArticleService.create(createUserArticleInput);
  }

  @Query(() => [UserArticle], { name: 'userArticle' })
  @CacheQuery(() => 'userArticles', 600)
  findAll() {
    return this.userArticleService.findAll();
  }

  @Query(() => UserArticle, { name: 'userArticle' })
  @CacheQuery((id: number) => `userArticle:${id}`, 600)
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.userArticleService.findOne(id);
  }

  @Mutation(() => UserArticle)
  @InvalidateCache((result: UserArticle) => [`userArticles`, `userArticle:${result.id}`])
  updateUserArticle(
    @Args('updateUserArticleInput')
    updateUserArticleInput: UpdateUserArticleInput,
  ) {
    return this.userArticleService.update(updateUserArticleInput.id, updateUserArticleInput);
  }

  @Mutation(() => UserArticle)
  @InvalidateCache((_result: UserArticle, id: number) => [`userArticles`, `userArticle:${id}`])
  removeUserArticle(@Args('id', { type: () => Int }) id: number) {
    return this.userArticleService.remove(id);
  }
}
