import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WasteDetection {
  @Field()
  name: string;

  @Field()
  confidence: number;

  @Field(() => [Number])
  bbox: number[];

  @Field()
  class_id: number;
}

@ObjectType()
export class RecyclingPlanItem {
  @Field()
  item_name: string;

  @Field()
  material_type: string;

  @Field()
  category: string;

  @Field()
  german_bin: string;

  @Field()
  is_pfand: boolean;

  @Field()
  recycling_instructions: string;

  @Field()
  reuse_ideas: string;

  @Field()
  notes_germany: string;
}

@ObjectType()
export class LatencyMetrics {
  @Field()
  detector: number;

  @Field()
  reasoner: number;

  @Field()
  total: number;
}

@ObjectType()
export class ModelInfo {
  @Field()
  vision: string;

  @Field()
  llm: string;
}

@ObjectType()
export class AnalyzeWasteResult {
  @Field(() => [WasteDetection])
  detections: WasteDetection[];

  @Field(() => [RecyclingPlanItem])
  recycling_plan: RecyclingPlanItem[];

  @Field(() => LatencyMetrics)
  latency_ms: LatencyMetrics;

  @Field(() => ModelInfo)
  models: ModelInfo;
}
