import { Injectable, Logger } from '@nestjs/common';
import { AIInsights } from './dto/ai-insights.dto';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
  }

  async getAIInsights(category: string, result_hash: string): Promise<AIInsights> {
    try {
      this.logger.log(`Getting AI insights for category: ${category}`);

      const response = await fetch(`${this.apiUrl}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, result_hash }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as AIInsights;

      this.logger.log(`AI insights retrieved for ${category}`);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get AI insights', error);
      throw new Error(`AI insights failed: ${errorMessage}`);
    }
  }
}
