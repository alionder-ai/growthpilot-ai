/**
 * Audit Log Viewer Component
 * 
 * Displays authentication audit logs for the current user.
 * Validates Requirements: 15.6
 */

'use client';

import { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle, LogOut, UserPlus, Key, Mail, Trash2 } from 'lucide-react';

interface AuditLog {
  log_id: string;
  user_id: string;
  event_type: string;
  email: string;
  ip_address: string;
  user_agent: string;
  metadata: any;
  created_at: string;
}

const eventTypeLabels: Record<string, string> = {
  login_success: 'Başarılı Giriş',
  login_failed: 'Başarısız Giriş',
  logout: 'Çıkış',
  signup_success: 'Başarılı Kayıt',
  signup_failed: 'Başarısız Kayıt',
  password_reset_request: 'Şifre Sıfırlama Talebi',
  password_reset_success: 'Şifre Sıfırlama Başarılı',
  email_change: 'E-posta Değişikliği',
  account_deleted: 'Hesap Silindi',
};

const eventTypeIcons: Record<string, any> = {
  login_success: CheckCircle,
  login_failed: XCircle,
  logout: LogOut,
  signup_success: UserPlus,
  signup_failed: XCircle,
  password_reset_request: Key,
  password_reset_success: Key,
  email_change: Mail,
  account_deleted: Trash2,
};

const eventTypeColors: Record<string, string> = {
  login_success: 'text-green-600',
  login_failed: 'text-red-600',
  logout: 'text-gray-600',
  signup_success: 'text-blue-600',
  signup_failed: 'text-red-600',
  password_reset_request: 'text-yellow-600',
  password_reset_success: 'text-green-600',
  email_change: 'text-blue-600',
  account_deleted: 'text-red-600',
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/audit-logs?limit=50');
      
      if (!response.ok) {
        throw new Error('Denetim kayıtları yüklenemedi');
      }
      
      const data = await response.json();
      setLogs(data.logs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Güvenlik Denetim Kayıtları</h3>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Henüz denetim kaydı bulunmuyor
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = eventTypeIcons[log.event_type] || Shield;
            const color = eventTypeColors[log.event_type] || 'text-gray-600';
            const label = eventTypeLabels[log.event_type] || log.event_type;

            return (
              <div
                key={log.log_id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{label}</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                      {log.email && (
                        <div>E-posta: {log.email}</div>
                      )}
                      {log.ip_address && (
                        <div>IP Adresi: {log.ip_address}</div>
                      )}
                      {log.metadata?.reason && (
                        <div className="text-red-600">
                          Sebep: {log.metadata.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-sm text-gray-500 mt-4">
        Son 50 denetim kaydı gösteriliyor. Tüm kimlik doğrulama işlemleri güvenlik amacıyla kaydedilir.
      </div>
    </div>
  );
}
