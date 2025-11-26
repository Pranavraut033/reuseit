import { Injectable, Logger } from '@nestjs/common';

import { RecyclingInfo } from '../dto/recycling.dto';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  /**
   * Generate natural language instructions based on structured recycling info
   * Uses LLM to enrich structured rules with clear guidance aligned with German standards
   */
  async generateInstructions(recyclingInfo: RecyclingInfo): Promise<string> {
    const { objectName, materials, bin, rules, cityOverride } = recyclingInfo;

    try {
      // For now, use template-based generation
      // TODO: Replace with actual LLM API call (OpenAI, Anthropic, etc.)
      const instructions = this.buildInstructionsTemplate(recyclingInfo);

      this.logger.log(
        `Generated instructions for ${objectName} (${materials.join(', ')}) -> ${bin}`,
      );

      return instructions;
    } catch (error) {
      this.logger.error(`Failed to generate LLM instructions: ${error.message}`, error.stack);
      // Fallback to basic instructions
      return this.buildFallbackInstructions(recyclingInfo);
    }
  }

  /**
   * Template-based instruction generation (fallback or placeholder)
   */
  private buildInstructionsTemplate(info: RecyclingInfo): string {
    const { objectName, materials, bin, rules, cityOverride } = info;

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
    rules.forEach((rule, idx) => {
      instructions += `${idx + 1}. ${rule}\n`;
    });

    // General tips
    instructions += `\n**General Tips:**\n`;
    instructions += `- Always check local regulations as rules may vary by district.\n`;
    instructions += `- When in doubt, avoid contamination—use Restmüll as last resort.\n`;
    instructions += `- Clean recyclables reduce processing costs and environmental impact.\n`;

    return instructions;
  }

  /**
   * Fallback instructions if LLM or template fails
   */
  private buildFallbackInstructions(info: RecyclingInfo): string {
    return `Dispose of ${info.objectName} in ${info.bin}. Follow local recycling guidelines.`;
  }

  /**
   * Placeholder for future LLM API integration
   * Uncomment and configure when adding OpenAI/Anthropic
   */
  // private async callLlmApi(prompt: string): Promise<string> {
  //   const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  //     },
  //     body: JSON.stringify({
  //       model: 'gpt-4',
  //       messages: [
  //         {
  //           role: 'system',
  //           content:
  //             'You are an expert in German recycling regulations. Provide clear, actionable instructions.',
  //         },
  //         { role: 'user', content: prompt },
  //       ],
  //       max_tokens: 300,
  //       temperature: 0.7,
  //     }),
  //   });
  //
  //   const data = await response.json();
  //   return data.choices[0].message.content;
  // }

  /**
   * Build LLM prompt from structured data
   */
  private buildPrompt(info: RecyclingInfo): string {
    return `
Object: ${info.objectName}
Materials: ${info.materials.join(', ')}
Assigned Bin: ${info.bin}
Rules: ${info.rules.join('; ')}
${info.cityOverride ? `City: ${info.cityOverride}` : ''}

Generate clear, step-by-step recycling instructions for this object in Germany.
Include preparation steps, disposal method, and any important warnings.
Keep instructions concise (3-5 sentences).
    `.trim();
  }
}
