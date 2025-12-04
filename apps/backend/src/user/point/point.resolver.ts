import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Cache } from 'cache-manager';

import { CacheQuery, InvalidateCache } from '~/decorators/cache.decorator';

import { CreatePointInput } from './dto/create-point.input';
import { UpdatePointInput } from './dto/update-point.input';
import { Point } from './entities/point.entity';
import { PointService } from './point.service';

@Resolver(() => Point)
export class PointResolver {
  constructor(
    private readonly pointService: PointService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Mutation(() => Point)
  @InvalidateCache(() => [`points`])
  createPoint(@Args('createPointInput') createPointInput: CreatePointInput) {
    return this.pointService.create(createPointInput);
  }

  @Query(() => [Point], { name: 'point' })
  @CacheQuery(() => 'points', 600)
  findAll() {
    return this.pointService.findAll();
  }

  @Query(() => Point, { name: 'point' })
  @CacheQuery((id: number) => `point:${id}`, 600)
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.pointService.findOne(id);
  }

  @Mutation(() => Point)
  @InvalidateCache(() => [`points`])
  updatePoint(@Args('updatePointInput') updatePointInput: UpdatePointInput) {
    return this.pointService.update(updatePointInput.id, updatePointInput);
  }

  @Mutation(() => Point)
  @InvalidateCache((_result: string, id: number) => [`points`, `point:${id}`])
  removePoint(@Args('id', { type: () => Int }) id: number) {
    return this.pointService.remove(id);
  }
}
