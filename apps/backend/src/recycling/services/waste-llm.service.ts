import { Injectable, Logger } from '@nestjs/common';

export interface AIInsightsResult {
  extra_facts: string[];
  simplified_summary: string;
  motivation_text: string;
}

@Injectable()
export class WasteLlmService {
  private readonly logger = new Logger(WasteLlmService.name);
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
  }

  async getAIInsights(category: string, recyclingInfo: string): Promise<AIInsightsResult> {
    try {
      this.logger.log(`Getting AI insights for category: ${category}`);

      const response = await fetch(`${this.apiUrl}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          recycling_info: recyclingInfo,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as AIInsightsResult;

      this.logger.log(`AI insights retrieved for ${category}`);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get AI insights', error);
      throw new Error(`AI insights failed: ${errorMessage}`);
    }
  }
}
