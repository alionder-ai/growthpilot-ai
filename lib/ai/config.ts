/**
 * AI Provider Configuration
 * 
 * This module defines the multi-provider infrastructure for AI features.
 * Currently only Groq is implemented, but the architecture supports
 * future providers like Gemini, Claude and OpenAI.
 */

export type AIProvider = 'groq' | 'gemini' | 'claude' | 'openai';

export type AIFeature = 
  | 'target_audience'
  | 'action_plan'
  | 'strategy_card'
  | 'creative'
  | 'recommendations'
  | 'media_buyer';

/**
 * Feature-to-provider mapping
 * 
 * Maps each AI feature to its designated provider.
 * Currently all features use Groq.
 */
export const AI_CONFIG: Record<AIFeature, AIProvider> = {
  target_audience: 'groq',
  action_plan: 'groq',
  strategy_card: 'groq',
  creative: 'groq',
  recommendations: 'groq',
  media_buyer: 'groq',
};
