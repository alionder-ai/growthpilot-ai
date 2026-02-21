import { SyncStatus } from '@/lib/types/meta';

/**
 * Gets Meta API connection status for a user
 */
export async function getMetaConnectionStatus(
  supabase: any,
  userId: string
): Promise<SyncStatus> {
  const { data: token, error } = await supabase
    .from('meta_tokens')
    .select('ad_account_id, expires_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error || !token) {
    return {
      isConnected: false,
      lastSyncAt: null,
      adAccountId: null,
      tokenExpiresAt: null,
    };
  }

  const expiresAt = new Date(token.expires_at);
  const isExpired = expiresAt < new Date();

  return {
    isConnected: !isExpired,
    lastSyncAt: token.updated_at,
    adAccountId: token.ad_account_id,
    tokenExpiresAt: token.expires_at,
  };
}

/**
 * Checks if user needs to reconnect Meta account
 */
export async function needsReconnection(
  supabase: any,
  userId: string
): Promise<boolean> {
  const status = await getMetaConnectionStatus(supabase, userId);
  return !status.isConnected;
}
