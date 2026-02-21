/**
 * Meta Token Storage
 * 
 * Handles secure storage and retrieval of Meta API access tokens with AES-256 encryption.
 * Validates Requirements: 4.2, 15.1
 */

import { createServerClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/utils/encryption';

export interface MetaToken {
  token_id: string;
  user_id: string;
  encrypted_access_token: string;
  ad_account_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface StoredTokenData {
  accessToken: string;
  adAccountId: string;
  expiresAt: Date;
}

/**
 * Store a Meta API access token with encryption
 * 
 * @param userId - The user ID
 * @param accessToken - The plaintext access token from Meta API
 * @param adAccountId - The Meta ad account ID
 * @param expiresAt - Token expiration date
 * @returns The stored token record
 */
export async function storeMetaToken(
  userId: string,
  accessToken: string,
  adAccountId: string,
  expiresAt: Date
): Promise<MetaToken> {
  const supabase = createServerClient();
  
  try {
    // Encrypt the access token
    const encryptedToken = encrypt(accessToken);
    
    // Check if token already exists for this user and ad account
    const { data: existingToken } = await supabase
      .from('meta_tokens')
      .select('token_id')
      .eq('user_id', userId)
      .eq('ad_account_id', adAccountId)
      .single();
    
    if (existingToken) {
      // Update existing token
      const { data, error } = await supabase
        .from('meta_tokens')
        .update({
          encrypted_access_token: encryptedToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('token_id', existingToken.token_id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating Meta token:', error);
        throw new Error('Token güncellenemedi');
      }
      
      return data;
    } else {
      // Insert new token
      const { data, error } = await supabase
        .from('meta_tokens')
        .insert({
          user_id: userId,
          encrypted_access_token: encryptedToken,
          ad_account_id: adAccountId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error storing Meta token:', error);
        throw new Error('Token kaydedilemedi');
      }
      
      return data;
    }
  } catch (error) {
    console.error('Error in storeMetaToken:', error);
    throw error;
  }
}

/**
 * Retrieve and decrypt a Meta API access token
 * 
 * @param userId - The user ID
 * @param adAccountId - The Meta ad account ID (optional, returns first token if not provided)
 * @returns The decrypted token data or null if not found
 */
export async function getMetaToken(
  userId: string,
  adAccountId?: string
): Promise<StoredTokenData | null> {
  const supabase = createServerClient();
  
  try {
    let query = supabase
      .from('meta_tokens')
      .select('*')
      .eq('user_id', userId);
    
    if (adAccountId) {
      query = query.eq('ad_account_id', adAccountId);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      return null;
    }
    
    // Check if token is expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.warn('Meta token expired for user:', userId);
      return null;
    }
    
    // Decrypt the access token
    const accessToken = decrypt(data.encrypted_access_token);
    
    return {
      accessToken,
      adAccountId: data.ad_account_id,
      expiresAt,
    };
  } catch (error) {
    console.error('Error retrieving Meta token:', error);
    return null;
  }
}

/**
 * Delete a Meta API access token
 * 
 * @param userId - The user ID
 * @param adAccountId - The Meta ad account ID (optional, deletes all tokens if not provided)
 */
export async function deleteMetaToken(
  userId: string,
  adAccountId?: string
): Promise<void> {
  const supabase = createServerClient();
  
  try {
    let query = supabase
      .from('meta_tokens')
      .delete()
      .eq('user_id', userId);
    
    if (adAccountId) {
      query = query.eq('ad_account_id', adAccountId);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error deleting Meta token:', error);
      throw new Error('Token silinemedi');
    }
  } catch (error) {
    console.error('Error in deleteMetaToken:', error);
    throw error;
  }
}

/**
 * Check if a Meta token exists and is valid
 * 
 * @param userId - The user ID
 * @param adAccountId - The Meta ad account ID (optional)
 * @returns True if a valid token exists
 */
export async function hasValidMetaToken(
  userId: string,
  adAccountId?: string
): Promise<boolean> {
  const token = await getMetaToken(userId, adAccountId);
  return token !== null;
}

/**
 * Get all Meta tokens for a user
 * 
 * @param userId - The user ID
 * @returns Array of decrypted token data
 */
export async function getAllMetaTokens(userId: string): Promise<StoredTokenData[]> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('meta_tokens')
      .select('*')
      .eq('user_id', userId);
    
    if (error || !data) {
      return [];
    }
    
    // Decrypt all tokens and filter out expired ones
    const tokens: StoredTokenData[] = [];
    
    for (const record of data) {
      const expiresAt = new Date(record.expires_at);
      
      // Skip expired tokens
      if (expiresAt < new Date()) {
        continue;
      }
      
      try {
        const accessToken = decrypt(record.encrypted_access_token);
        tokens.push({
          accessToken,
          adAccountId: record.ad_account_id,
          expiresAt,
        });
      } catch (error) {
        console.error('Error decrypting token:', error);
        // Skip tokens that can't be decrypted
        continue;
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('Error retrieving all Meta tokens:', error);
    return [];
  }
}
