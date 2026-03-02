/**
 * AI Provider Router
 * 
 * This module provides a unified interface for generating AI content
 * across multiple providers. Currently only Groq is implemented.
 */

import { AI_CONFIG, AIFeature } from './config';
import Groq from 'groq-sdk';

export const TOKEN_LIMITS = {
  ACTION_PLAN: 500,
  STRATEGY_CARD: 300,
  CREATIVE_CONTENT: 1000,
  TARGET_AUDIENCE: 2000,
} as const;

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY is not configured');
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}

export async function generateAI<T>(
  feature: AIFeature,
  prompt: string,
  maxTokens: number
): Promise<T> {
  const provider = AI_CONFIG[feature];
  
  switch (provider) {
    case 'groq': {
      const client = getGroqClient();
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      });
      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from Groq API');
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean) as T;
    }
    default:
      throw new Error(`Provider not implemented: ${provider}`);
  }
}

// Re-export types
export { AIFeature } from './config';
