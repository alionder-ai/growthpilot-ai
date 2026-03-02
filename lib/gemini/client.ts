import { GoogleGenerativeAI } from '@google/generative-ai';

// Token limits for different content types
export const TOKEN_LIMITS = {
  ACTION_PLAN: 500,
  STRATEGY_CARD: 300,
  CREATIVE_CONTENT: 1000,
  TARGET_AUDIENCE: 2000,
} as const;

/**
 * Gemini API client wrapper - SINGLE REQUEST, NO RETRY
 */
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.client = new GoogleGenerativeAI(key);
    this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
  }

  /**
   * Generate content - SINGLE API CALL, NO RETRY
   * If it fails, it throws immediately
   */
  async generateContent(
    prompt: string,
    maxTokens: number = TOKEN_LIMITS.ACTION_PLAN,
    useJsonMode: boolean = false
  ): Promise<string> {
    try {
      console.log('[GEMINI CLIENT] Making SINGLE API call to Gemini...');
      
      // SINGLE API CALL - This is the ONLY place where Gemini API is called
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      });

      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      console.log('[GEMINI CLIENT] ✓ Received response from Gemini API');
      return text;
    } catch (error) {
      console.error('[GEMINI CLIENT] FATAL ERROR:', error);
      console.error('[GEMINI CLIENT] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'N/A'
      });
      throw error; // Re-throw immediately, no retry
    }
  }

  /**
   * Generate content with JSON response
   * Uses Gemini's native JSON mode (responseMimeType: "application/json")
   */
  async generateJSON<T>(
    prompt: string,
    maxTokens: number = TOKEN_LIMITS.ACTION_PLAN
  ): Promise<T> {
    // Use JSON mode - Gemini will return pure JSON
    const response = await this.generateContent(prompt, maxTokens, true);
    
    try {
      // Direct parse - response is already valid JSON from Gemini
      return JSON.parse(response) as T;
    } catch (error) {
      console.error('[GEMINI CLIENT] JSON PARSE ERROR');
      console.error('[GEMINI CLIENT] Raw response:', response);
      console.error('[GEMINI CLIENT] Parse error:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }
}

// Singleton instance
let geminiClient: GeminiClient | null = null;

/**
 * Get or create Gemini client instance
 */
export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    geminiClient = new GeminiClient();
  }
  return geminiClient;
}

/**
 * Convenience function to generate content using the singleton client
 */
export async function generateContent(
  prompt: string,
  maxTokens: number = TOKEN_LIMITS.ACTION_PLAN
): Promise<string> {
  const client = getGeminiClient();
  return client.generateContent(prompt, maxTokens);
}

/**
 * Convenience function to generate JSON using the singleton client
 */
export async function generateJSON<T>(
  prompt: string,
  maxTokens: number = TOKEN_LIMITS.ACTION_PLAN
): Promise<T> {
  const client = getGeminiClient();
  return client.generateJSON<T>(prompt, maxTokens);
}
