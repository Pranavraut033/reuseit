import { Injectable, Logger } from '@nestjs/common';

import { GetAIInsightsResult } from './dto/analyze-waste.dto';
import { GetAIInsightsInput } from './dto/analyze-waste.input';
import { getRecyclingInfo } from './services/recycling-rules.service';
import { LlmService } from './services/llm.service';

@Injectable()
export class RecyclingService {
  private readonly logger = new Logger(RecyclingService.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * Get AI insights for waste recycling information
   */
  async getAIInsights(input: GetAIInsightsInput): Promise<GetAIInsightsResult> {
    const { category, recyclingInfo } = input;

    this.logger.log(`Getting AI insights for category: ${category}`);

    // Call the LLM service for AI insights
    const insights = await this.llmService.getAIInsights(category, recyclingInfo);

    this.logger.log(`AI insights retrieved for ${category}`);

    return insights;
  }

  /**
   * Generate natural language instructions based on structured recycling info
   */
  private generateInstructions(recyclingInfo: any): string {
    const { objectName, materials, bin, rules, cityOverride } = recyclingInfo;

    let instructions = `**Recycling Instructions for ${objectName}**\n\n`;

    // Bin assignment
    instructions += `**Disposal Bin:** ${bin}\n\n`;

    // Materials
    if (materials.length > 0) {
      instructions += `**Materials:** ${materials.join(', ')}\n\n`;
    }

    // City-specific notes
    if (cityOverride) {
      instructions += `**Note for ${cityOverride}:** City-specific rules apply.\n\n`;
    }

    // Rules
    instructions += `**How to Prepare:**\n`;
    rules.forEach((rule: string, idx: number) => {
      instructions += `${idx + 1}. ${rule}\n`;
    });

    // General tips
    instructions += `\n**General Tips:**\n`;
    instructions += `- Always check local regulations as rules may vary by district.\n`;
    instructions += `- When in doubt, avoid contamination—use Restmüll as last resort.\n`;
    instructions += `- Clean recyclables reduce processing costs and environmental impact.\n`;

    return instructions;
  }
}
