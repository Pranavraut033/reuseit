import { Args, Query, Resolver } from '@nestjs/graphql';

import { AnalyzeWasteResult } from './dto/analyze-waste.dto';
import { AnalyzeWasteInput } from './dto/analyze-waste.input';
import { FinalizeRecyclingInput } from './dto/finalize-recycling.input';
import { FinalRecyclingResult } from './dto/recycling.dto';
import { RecyclingService } from './recycling.service';

@Resolver()
export class RecyclingResolver {
  constructor(private readonly recyclingService: RecyclingService) {}

  @Query(() => FinalRecyclingResult)
  finalizeRecycling(@Args('input') input: FinalizeRecyclingInput): Promise<FinalRecyclingResult> {
    return this.recyclingService.finalizeRecycling(input);
  }

  @Query(() => AnalyzeWasteResult)
  analyzeWaste(@Args('input') input: AnalyzeWasteInput): Promise<AnalyzeWasteResult> {
    return this.recyclingService.analyzeWaste(input);
  }
}
