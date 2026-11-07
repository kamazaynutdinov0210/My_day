import { Injectable, Logger } from '@nestjs/common';
import type { AIProvider, AIGenerateTextInput, AIResponse, AISummarizeInput, AIClassifyInput } from '@my-day/types';

@Injectable()
export class AiProviderService implements AIProvider {
  readonly id = 'openai-compatible';
  private readonly logger = new Logger(AiProviderService.name);

  async generateText(input: AIGenerateTextInput): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_COMPATIBLE_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      return {
        text: `Template response for: ${input.prompt.slice(0, 120)}`,
        provider: 'template',
        model: 'rule-based',
      };
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: input.prompt }],
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens ?? 512,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI HTTP ${response.status}`);
      }
      const json = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
      const text = json.choices?.[0]?.message?.content ?? '';
      return {
        text,
        provider: 'openai',
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        usage: {
          inputTokens: json.usage?.prompt_tokens ?? 0,
          outputTokens: json.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      this.logger.warn(`AI provider call failed: ${err instanceof Error ? err.message : err}`);
      return {
        text: `Template response for: ${input.prompt.slice(0, 120)}`,
        provider: 'template',
        model: 'rule-based',
      };
    }
  }

  async summarize(input: AISummarizeInput): Promise<AIResponse> {
    return this.generateText({ prompt: `Summarize the following text: ${input.text ?? ''}` });
  }

  async classify(input: AIClassifyInput): Promise<AIResponse> {
    return this.generateText({ prompt: `Classify into [${input.labels.join(', ')}]: ${input.text}` });
  }
}