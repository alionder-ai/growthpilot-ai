/**
 * Account Settings Component
 * 
 * Allows users to manage their account including GDPR-compliant data deletion.
 * Validates Requirements: 15.5
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Trash2 } from 'lucide-react';
import { AuditLogViewer } from './AuditLogViewer';

export function AccountSettings() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    // Require user to type "SİL" to confirm
    if (confirmText !== 'SİL') {
      setError('Lütfen "SİL" yazarak onaylayın');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Hesap silinemedi');
      }

      // Account deleted successfully
      // Redirect to home page
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Hesap silinemedi');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hesap Ayarları</h2>
        <p className="text-gray-600 mt-2">
          Hesabınızı ve verilerinizi yönetin
        </p>
      </div>

      {/* Account Information */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Hesap Bilgileri</h3>
        <div className="space-y-4">
          <div>
            <Label>E-posta</Label>
            <p className="text-sm text-gray-600 mt-1">
              E-posta adresinizi değiştirmek için destek ekibiyle iletişime geçin.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Tehlikeli Bölge
        </h3>
        <p className="text-sm text-red-700 mb-4">
          Bu işlemler geri alınamaz. Lütfen dikkatli olun.
        </p>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Hesabı Sil
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hesabınızı silmek istediğinizden emin misiniz?</DialogTitle>
              <DialogDescription className="space-y-3 pt-4">
                <div className="flex items-start gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Bu işlem geri alınamaz!</p>
                    <p className="text-sm mt-1">
                      Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md text-sm">
                  <p className="font-semibold mb-2">Silinecek veriler:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Tüm müşteriler ve kampanyalar</li>
                    <li>Tüm reklam verileri ve metrikler</li>
                    <li>Tüm AI önerileri ve aksiyon planları</li>
                    <li>Tüm raporlar ve kreatif içerikler</li>
                    <li>Tüm potansiyel müşteri verileri</li>
                    <li>Meta API bağlantıları</li>
                    <li>Hesap bilgileri ve oturum verileri</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Label htmlFor="confirm-delete">
                    Onaylamak için <span className="font-bold">SİL</span> yazın:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="SİL"
                    className="mt-2"
                    disabled={isDeleting}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setConfirmText('');
                  setError(null);
                }}
                disabled={isDeleting}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'SİL'}
              >
                {isDeleting ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* GDPR Information */}
      <div className="border rounded-lg p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-2">Veri Koruma Hakları</h3>
        <p className="text-sm text-gray-700 mb-3">
          KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Verilerinize erişim hakkı</li>
          <li>Verilerinizi düzeltme hakkı</li>
          <li>Verilerinizi silme hakkı (unutulma hakkı)</li>
          <li>Veri taşınabilirliği hakkı</li>
          <li>İşlemeye itiraz etme hakkı</li>
        </ul>
        <p className="text-sm text-gray-600 mt-3">
          Bu haklarınızı kullanmak için yukarıdaki "Hesabı Sil" butonunu kullanabilir
          veya destek ekibiyle iletişime geçebilirsiniz.
        </p>
      </div>

      {/* Audit Logs */}
      <div className="border rounded-lg p-6">
        <AuditLogViewer />
      </div>
    </div>
  );
}
