/**
 * Meta API Integration
 * 
 * This module provides complete Meta Ads API integration including:
 * - OAuth authentication flow
 * - Campaign, Ad Set, and Ad data fetching
 * - Metrics retrieval and parsing
 * - AES-256 token encryption
 * - Exponential backoff retry logic
 * - Error handling and user notifications
 */

export * from './client';
export * from './metrics';
export * from './sync';
export * from './status';
