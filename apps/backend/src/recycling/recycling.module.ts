import { Module } from '@nestjs/common';

import { RecyclingResolver } from './recycling.resolver';
import { RecyclingService } from './recycling.service';
import { LlmService } from './services/llm.service';
import { WasteLlmService } from './services/waste-llm.service';

@Module({
  providers: [RecyclingService, RecyclingResolver, LlmService, WasteLlmService],
  exports: [RecyclingService],
})
export class RecyclingModule {}
