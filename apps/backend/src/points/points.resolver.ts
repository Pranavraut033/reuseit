import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import type { Cache } from 'cache-manager';

import { CacheQuery } from '~/decorators/cache.decorator';
import { CurrentUser, User } from '~/decorators/CurrentUser';

import { PointsHistory } from './dto/point-history.entity';
import { PointsService } from './points.service';

@Resolver(() => PointsHistory)
export class PointResolver {
  constructor(
    private readonly pointService: PointsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Query()
  @CacheQuery((_user?: User) => `pointHistories:${_user?.id || 'anonymous'}`, 300)
  async pointHistories(@CurrentUser() user?: User) {
    if (!user) {
      return [];
    }

    return this.pointService.getPointHistories(user?.id);
  }
}
