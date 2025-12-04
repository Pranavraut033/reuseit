import { Injectable, Logger } from '@nestjs/common';
import ollama from 'ollama';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { AIInsights } from './dto/ai-insights.dto';
import { recyclingFactPrompt, userInput } from './prompts/recyclingFacts';

const AIInsightsSchema = z.object({
  extra_facts: z.array(z.string()),
  simplified_summary: z.string(),
  motivation_text: z.string(),
});

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly jsonSchema: any;
  private readonly ollamaModel: string;

  constructor() {
    this.jsonSchema = zodToJsonSchema(AIInsightsSchema as any);

    this.ollamaModel = process.env.OLLAMA_MODEL || 'qwen3:0.6b';
  }

  async getAIInsights(category: string, _result_hash: string): Promise<AIInsights> {
    try {
      this.logger.log(`Getting AI insights for category: ${category}`);

      const response = await ollama.chat({
        model: this.ollamaModel,
        messages: [
          { role: 'system', content: recyclingFactPrompt },
          { role: 'user', content: userInput(category) },
        ],
        format: this.jsonSchema,
      });

      const llmResponse = response.message.content;
      this.logger.log(`LLM response received: ${llmResponse}`);

      const parsed = JSON.parse(llmResponse) as unknown;
      const validated = AIInsightsSchema.parse(parsed);

      this.logger.log(`AI insights retrieved for ${category}`);

      return {
        extra_facts: validated.extra_facts,
        simplified_summary: validated.simplified_summary,
        motivation_text: validated.motivation_text,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get AI insights', error);
      throw new Error(`AI insights failed: ${errorMessage}`);
    }
  }
}
