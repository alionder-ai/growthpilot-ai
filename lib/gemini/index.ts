/**
 * Gemini API integration module
 * Exports client, prompt utilities, cache, and error handling
 */

export { GeminiClient, getGeminiClient, TOKEN_LIMITS } from './client';
export {
  buildActionPlanPrompt,
  buildStrategyCardPrompt,
  buildCreativePrompt,
  buildTargetAudiencePrompt,
  buildLeadQualityContext,
  type ActionPlanContext,
  type ActionPlanResponse,
  type StrategyCardContext,
  type StrategyCardResponse,
  type CreativeContext,
  type CreativeResponse,
  type CreativeVariation,
} from './prompts';
export {
  cacheRecommendation,
  getCachedRecommendation,
  clearCache,
  clearExpiredCache,
  getCacheStats,
} from './cache';
export {
  executeWithFallback,
  getUserFriendlyErrorMessage,
  logGeminiError,
  GeminiAPIError,
} from './error-handler';
