'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, CheckCircle, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileSettingsProps {
  user: User;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Şifre değiştirilemedi');
      }

      setSuccess('Şifreniz başarıyla değiştirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Çıkış hatası:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil Ayarları</h1>
        <p className="text-gray-600 mt-2">
          Hesap bilgilerinizi ve güvenlik ayarlarınızı yönetin
        </p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Hesap Bilgileri
          </CardTitle>
          <CardDescription>
            Oturum açmış kullanıcı bilgileriniz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4" />
              E-posta Adresi
            </Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md border">
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              E-posta adresinizi değiştirmek için destek ekibiyle iletişime geçin
            </p>
          </div>

          <div>
            <Label className="text-gray-700">Kullanıcı ID</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md border">
              <p className="text-xs font-mono text-gray-600">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Şifre Değiştir
          </CardTitle>
          <CardDescription>
            Hesabınızın güvenliği için güçlü bir şifre kullanın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Mevcut Şifre</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                placeholder="Mevcut şifrenizi girin"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="new-password">Yeni Şifre</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                placeholder="En az 6 karakter"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Yeni şifrenizi tekrar girin"
                className="mt-2"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-900">Oturum Yönetimi</CardTitle>
          <CardDescription>
            Hesabınızdan güvenli bir şekilde çıkış yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="w-full sm:w-auto"
          >
            Çıkış Yap
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
