import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Cache } from 'cache-manager';

import { CacheQuery, InvalidateCache } from '~/decorators/cache.decorator';

import { BadgeService } from './badge.service';
import { CreateBadgeInput } from './dto/create-badge.input';
import { UpdateBadgeInput } from './dto/update-badge.input';
import { Badge } from './entities/badge.entity';

@Resolver(() => Badge)
export class BadgeResolver {
  constructor(
    private readonly badgeService: BadgeService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Mutation(() => Badge)
  @InvalidateCache((result: Badge) => [`badges`, `badge:${result.id}`])
  createBadge(@Args('createBadgeInput') createBadgeInput: CreateBadgeInput) {
    return this.badgeService.create(createBadgeInput);
  }

  @Query(() => [Badge], { name: 'badge' })
  @CacheQuery(() => 'badges', 600)
  findAll() {
    return this.badgeService.findAll();
  }

  @Query(() => Badge, { name: 'badge' })
  @CacheQuery((id: number) => `badge:${id}`, 600)
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.badgeService.findOne(id);
  }

  @Mutation(() => Badge)
  @InvalidateCache((result: Badge) => [`badges`, `badge:${result.id}`])
  updateBadge(@Args('updateBadgeInput') updateBadgeInput: UpdateBadgeInput) {
    return this.badgeService.update(updateBadgeInput.id, updateBadgeInput);
  }

  @Mutation(() => Badge)
  @InvalidateCache((_result: Badge, id: number) => [`badges`, `badge:${id}`])
  removeBadge(@Args('id', { type: () => Int }) id: number) {
    return this.badgeService.remove(id);
  }
}
