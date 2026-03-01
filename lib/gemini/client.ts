import { GoogleGenerativeAI } from '@google/generative-ai';

// Token limits for different content types
export const TOKEN_LIMITS = {
  ACTION_PLAN: 500,
  STRATEGY_CARD: 300,
  CREATIVE_CONTENT: 1000,
  TARGET_AUDIENCE: 2000,
} as const;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Gemini API client wrapper with retry logic and token limit enforcement
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
    this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate content with exponential backoff retry logic
   * Special handling for rate limit (429) errors with longer backoff
   */
  async generateContent(
    prompt: string,
    maxTokens: number = TOKEN_LIMITS.ACTION_PLAN
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
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

        return text;
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's a rate limit error (429)
        const isRateLimitError = errorMessage.includes('429') || 
                                 errorMessage.includes('quota') || 
                                 errorMessage.includes('rate limit');
        
        // Log error for monitoring
        console.error(`Gemini API attempt ${attempt + 1} failed:`, errorMessage);

        // Don't retry on last attempt
        if (attempt < MAX_RETRIES - 1) {
          // Use longer backoff for rate limit errors: 3s, 6s, 12s
          // Regular errors: 1s, 2s, 4s
          const baseBackoff = isRateLimitError ? 3000 : INITIAL_BACKOFF_MS;
          const backoffMs = baseBackoff * Math.pow(2, attempt);
          
          console.log(`Retrying after ${backoffMs}ms (attempt ${attempt + 2}/${MAX_RETRIES})...`);
          await this.sleep(backoffMs);
        } else if (isRateLimitError) {
          // Provide user-friendly error for rate limits
          throw new Error('API rate limit exceeded. Please try again in a few moments.');
        }
      }
    }

    // All retries failed
    throw new Error(
      `Gemini API failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  /**
   * Generate content with JSON response parsing
   * Robust extraction of JSON from various markdown formats
   */
  async generateJSON<T>(
    prompt: string,
    maxTokens: number = TOKEN_LIMITS.ACTION_PLAN
  ): Promise<T> {
    const response = await this.generateContent(prompt, maxTokens);
    
    try {
      // Clean response text - remove markdown code blocks and extra whitespace
      let cleanedText = response.trim();
      
      // Remove markdown code blocks (```json...``` or ```...```)
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '');
      cleanedText = cleanedText.replace(/\n?```\s*$/i, '');
      cleanedText = cleanedText.trim();
      
      // Parse JSON
      return JSON.parse(cleanedText) as T;
    } catch (error) {
      console.error('Failed to parse Gemini JSON response:', response);
      console.error('Parse error:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
