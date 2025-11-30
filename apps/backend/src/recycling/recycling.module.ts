import { Module } from '@nestjs/common';

import { RecyclingResolver } from './recycling.resolver';
import { RecyclingService } from './recycling.service';
import { LlmService } from './services/llm.service';

@Module({
  providers: [RecyclingService, RecyclingResolver, LlmService],
  exports: [RecyclingService],
})
export class RecyclingModule {}
