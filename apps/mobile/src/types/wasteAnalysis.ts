// Local types for waste analysis (not from GraphQL)
export interface WasteDetection {
  name: string;
  confidence: number;
  bbox: number[];
  class_id: number;
}

export interface AIInsights {
  extra_facts: string[];
  simplified_summary: string;
  motivation_text: string;
}

export interface RecyclingPlanItem {
  item_name: string;
  material_type: string;
  category: string;
  german_bin: string;
  is_pfand: boolean;
  recycling_instructions: string;
  reuse_ideas: string;
  notes_germany: string;
  preparation_steps?: string[];
  environmental_benefits?: string;
  ai_insights?: AIInsights | null;
}

export interface AnalyzeWasteResult {
  detections: WasteDetection[];
  recycling_plan: RecyclingPlanItem[];
}
