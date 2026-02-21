import { createServerClient } from '@/lib/supabase/server';

export type NotificationType = 'roas_alert' | 'budget_alert' | 'sync_error' | 'general';

interface CreateNotificationParams {
  userId: string;
  message: string;
  type: NotificationType;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  message,
  type,
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      message,
      type,
      read_status: false,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error creating notification:', error);
    return { success: false, error: 'Bildirim oluşturulurken beklenmeyen bir hata oluştu' };
  }
}

/**
 * Check ROAS and create notification if below threshold
 */
export async function checkROASAndNotify(
  userId: string,
  campaignName: string,
  roas: number,
  threshold: number = 1.5
): Promise<void> {
  if (roas < threshold) {
    await createNotification({
      userId,
      message: `${campaignName} kampanyasının ROAS değeri ${roas.toFixed(2)} seviyesine düştü (Eşik: ${threshold})`,
      type: 'roas_alert',
    });
  }
}

/**
 * Check daily spend against budget and create notification if exceeded
 */
export async function checkBudgetAndNotify(
  userId: string,
  campaignName: string,
  dailySpend: number,
  averageDailyBudget: number,
  threshold: number = 1.2
): Promise<void> {
  const budgetThreshold = averageDailyBudget * threshold;
  
  if (dailySpend > budgetThreshold) {
    const percentageOver = ((dailySpend / averageDailyBudget - 1) * 100).toFixed(0);
    await createNotification({
      userId,
      message: `${campaignName} kampanyasının günlük harcaması ortalama bütçenin %${percentageOver} üzerinde (${dailySpend.toFixed(2)} TRY / ${averageDailyBudget.toFixed(2)} TRY)`,
      type: 'budget_alert',
    });
  }
}

/**
 * Create notification for Meta API sync failure
 */
export async function notifySyncError(
  userId: string,
  errorMessage: string
): Promise<void> {
  await createNotification({
    userId,
    message: `Meta API senkronizasyonu başarısız oldu: ${errorMessage}`,
    type: 'sync_error',
  });
}
