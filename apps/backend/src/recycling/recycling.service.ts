import { Injectable, Logger } from '@nestjs/common';

import { AnalyzeWasteResult } from './dto/analyze-waste.dto';
import { AnalyzeWasteInput } from './dto/analyze-waste.input';
import { FinalizeRecyclingInput } from './dto/finalize-recycling.input';
import { FinalRecyclingResult } from './dto/recycling.dto';
import { LlmService } from './services/llm.service';
import { getRecyclingInfo } from './services/recycling-rules.service';
import { WasteLlmService } from './services/waste-llm.service';

@Injectable()
export class RecyclingService {
  private readonly logger = new Logger(RecyclingService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly wasteLlmService: WasteLlmService,
  ) {}

  /**
   * Finalize recycling analysis by combining:
   * 1. Classification results from mobile TensorFlow
   * 2. Structured recycling rules
   * 3. LLM-generated instructions
   */
  async finalizeRecycling(input: FinalizeRecyclingInput): Promise<FinalRecyclingResult> {
    const { objectName, materials, city, imageBase64 } = input;

    this.logger.log(
      `Finalizing recycling for: ${objectName} (materials: ${materials.join(', ')}, city: ${city || 'N/A'})`,
    );

    // Validate and normalize inputs
    const normalizedObjectName = this.normalizeObjectName(objectName);
    const normalizedMaterials = this.normalizeMaterials(materials);

    // Get structured recycling info from rules
    const recyclingInfo = getRecyclingInfo(normalizedObjectName, normalizedMaterials, city);

    // Generate natural language instructions via LLM
    const instructions = await this.llmService.generateInstructions(recyclingInfo);

    // Optional: Store image for future reference or analysis
    if (imageBase64) {
      this.logger.debug(`Image provided (${imageBase64.length} chars), could store for audit`);
      // TODO: Store in cloud storage if needed
    }

    return {
      objectName: normalizedObjectName,
      materials: normalizedMaterials,
      recycling: {
        objectName: recyclingInfo.objectName,
        materials: recyclingInfo.materials,
        bin: recyclingInfo.bin,
        rules: recyclingInfo.rules,
        cityOverride: recyclingInfo.cityOverride,
      },
      instructions,
    };
  }

  /**
   * Analyze waste using LLM-powered vision and reasoning pipeline
   */
  async analyzeWaste(input: AnalyzeWasteInput): Promise<AnalyzeWasteResult> {
    const { imageBase64, userText } = input;

    this.logger.log(
      `Analyzing waste image with LLM pipeline${userText ? ` (user text: ${userText})` : ''}`,
    );

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Call the waste LLM service
    const result = await this.wasteLlmService.analyzeWaste(imageBuffer, userText);

    this.logger.log(
      `Waste analysis completed: ${result.detections.length} detections, ${result.recycling_plan.length} recycling items`,
    );

    return result;
  }

  /**
   * Normalize object name (trim, lowercase, remove special chars)
   */
  private normalizeObjectName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/gi, '');
  }

  /**
   * Normalize materials array (trim, lowercase, deduplicate)
   */
  private normalizeMaterials(materials: string[]): string[] {
    const normalized = materials.map((m) => m.trim().toLowerCase()).filter((m) => m.length > 0);

    // Deduplicate
    return [...new Set(normalized)];
  }
}
