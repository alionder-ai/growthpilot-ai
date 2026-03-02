// Legacy compatibility wrapper - delegates to new AI system
import { generateAI, TOKEN_LIMITS } from '@/lib/ai';
import { AIFeature } from '@/lib/ai/config';

export { TOKEN_LIMITS };

export class GeminiClient {
  async generateJSON<T>(
    prompt: string,
    maxTokens: number,
    feature: AIFeature = 'action_plan'
  ): Promise<T> {
    return generateAI<T>(feature, prompt, maxTokens);
  }
  
  async generateContent(prompt: string, maxTokens: number): Promise<string> {
    return generateAI<string>('action_plan', prompt, maxTokens);
  }
}

let clientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!clientInstance) clientInstance = new GeminiClient();
  return clientInstance;
}
