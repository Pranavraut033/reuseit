import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import type { Cache } from 'cache-manager';

import { CacheQuery } from '~/decorators/cache.decorator';

import { GetAIInsightsResult } from './dto/analyze-waste.dto';
import { GetAIInsightsInput } from './dto/analyze-waste.input';
import { RecyclingService } from './recycling.service';

@Resolver()
export class RecyclingResolver {
  constructor(
    private readonly recyclingService: RecyclingService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Query(() => GetAIInsightsResult)
  @CacheQuery((input: GetAIInsightsInput) => `getAIInsights:${JSON.stringify(input)}`, 600)
  getAIInsights(@Args('input') input: GetAIInsightsInput): Promise<GetAIInsightsResult> {
    return this.recyclingService.getAIInsights(input);
  }
}
