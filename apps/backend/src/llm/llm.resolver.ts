import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import type { Cache } from 'cache-manager';

import { CacheQuery } from '~/decorators/cache.decorator';

import { AIInsights } from './dto/ai-insights.dto';
import { AIInsightsInput } from './dto/ai-insights.input';
import { LlmService } from './llm.service';

@Resolver()
export class LlmResolver {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private llmService: LlmService,
  ) {}

  @Query(() => AIInsights)
  @CacheQuery((input: AIInsightsInput) => `getAIInsights:${JSON.stringify(input)}`, 10)
  AIInsights(@Args('input') input: AIInsightsInput): Promise<AIInsights> {
    return this.llmService.getAIInsights(input.category, input.resultHash || '');
  }
}
