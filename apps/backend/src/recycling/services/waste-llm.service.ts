import { Injectable, Logger } from '@nestjs/common';

export interface WasteDetectionResult {
  detections: Array<{
    name: string;
    confidence: number;
    bbox: number[];
    class_id: number;
  }>;
  recycling_plan: Array<{
    item_name: string;
    material_type: string;
    category: string;
    german_bin: string;
    is_pfand: boolean;
    recycling_instructions: string;
    reuse_ideas: string;
    notes_germany: string;
  }>;
  latency_ms: {
    detector: number;
    reasoner: number;
    total: number;
  };
  models: {
    vision: string;
    llm: string;
  };
}

@Injectable()
export class WasteLlmService {
  private readonly logger = new Logger(WasteLlmService.name);
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = process.env.WASTE_LLM_SERVICE_URL || 'http://localhost:8000';
  }

  async analyzeWaste(imageBuffer: Buffer, userText?: string): Promise<WasteDetectionResult> {
    try {
      // Create form data for multipart upload
      const formData = new FormData();
      // Convert Buffer to Uint8Array for Blob with proper content type
      const uint8Array = new Uint8Array(imageBuffer);
      formData.append('image', new Blob([uint8Array], { type: 'image/jpeg' }), 'waste.jpg');

      if (userText) {
        formData.append('user_text', userText);
      }

      this.logger.log(`Calling waste LLM service at ${this.apiUrl}/analyze`);

      const response = await fetch(`${this.apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as WasteDetectionResult;

      this.logger.log(`Waste analysis completed in ${data.latency_ms.total}ms`);

      // Validate and sanitize the response data
      const sanitizedData = this.sanitizeWasteDetectionResult(data);

      // Log if any fallbacks were applied
      const originalPlanCount = data.recycling_plan.length;
      const sanitizedPlanCount = sanitizedData.recycling_plan.length;
      if (originalPlanCount !== sanitizedPlanCount) {
        this.logger.warn(
          `Recycling plan count mismatch: ${originalPlanCount} -> ${sanitizedPlanCount}`,
        );
      }

      return sanitizedData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to analyze waste with LLM service', error);
      throw new Error(`Waste analysis failed: ${errorMessage}`);
    }
  }

  private sanitizeWasteDetectionResult(data: WasteDetectionResult): WasteDetectionResult {
    return {
      ...data,
      detections: data.detections.map((detection) => ({
        name: detection.name || 'unknown',
        confidence: detection.confidence || 0,
        bbox: detection.bbox || [0, 0, 0, 0],
        class_id: detection.class_id || 0,
      })),
      recycling_plan: data.recycling_plan.map((item) => ({
        item_name: item.item_name || 'Unknown Item',
        material_type: item.material_type || 'Unknown Material',
        category: item.category || 'residual',
        german_bin: item.german_bin || 'Restmüll',
        is_pfand: item.is_pfand ?? false,
        recycling_instructions:
          item.recycling_instructions || 'Please check local recycling guidelines',
        reuse_ideas: item.reuse_ideas || 'Check local reuse centers',
        notes_germany: item.notes_germany || 'Follow local German recycling regulations',
      })),
    };
  }
}
