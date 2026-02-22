import { createServerClient } from '@/lib/supabase/server';

export type AuditEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'signup_success'
  | 'signup_failed'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'email_change'
  | 'account_deleted';

export interface AuditLogData {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logAuthEvent(
  eventType: AuditEventType,
  data: AuditLogData
): Promise<void> {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: data.userId || null,
        event_type: eventType,
        email: data.email || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        metadata: data.metadata || null,
      });
    
    if (error) {
      console.error('Error logging audit event:', error);
    }
  } catch (error) {
    console.error('Error in logAuthEvent:', error);
  }
}

export async function logLoginSuccess(
  userId: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('login_success', {
    userId,
    email,
    ipAddress,
    userAgent,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logLoginFailed(
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('login_failed', {
    email,
    ipAddress,
    userAgent,
    metadata: {
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logLogout(
  userId: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('logout', {
    userId,
    email,
    ipAddress,
    userAgent,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logSignupSuccess(
  userId: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('signup_success', {
    userId,
    email,
    ipAddress,
    userAgent,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logSignupFailed(
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('signup_failed', {
    email,
    ipAddress,
    userAgent,
    metadata: {
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logPasswordResetRequest(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('password_reset_request', {
    email,
    ipAddress,
    userAgent,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logPasswordResetSuccess(
  userId: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('password_reset_success', {
    userId,
    email,
    ipAddress,
    userAgent,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logEmailChange(
  userId: string,
  oldEmail: string,
  newEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('email_change', {
    userId,
    email: newEmail,
    ipAddress,
    userAgent,
    metadata: {
      old_email: oldEmail,
      new_email: newEmail,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logAccountDeleted(
  userId: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuthEvent('account_deleted', {
    userId,
    email,
    ipAddress,
    userAgent,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserAuditLogs:', error);
    return [];
  }
}

export async function getRecentFailedLogins(
  email: string,
  minutes: number = 15
): Promise<number> {
  try {
    const supabase = await createServerClient();
    
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);
    
    const { data, error } = await supabase
      .from('audit_logs')
      .select('log_id')
      .eq('event_type', 'login_failed')
      .eq('email', email)
      .gte('created_at', cutoffTime.toISOString());
    
    if (error) {
      console.error('Error fetching failed login attempts:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error in getRecentFailedLogins:', error);
    return 0;
  }
}

export function getIpAddress(headers: Headers): string | undefined {
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-client-ip',
  ];
  
  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      return value.split(',')[0].trim();
    }
  }
  
  return undefined;
}

export function getUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined;
}
