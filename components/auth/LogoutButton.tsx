'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/contexts/AuthContext';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function LogoutButton({ variant = 'ghost', className }: LogoutButtonProps) {
  const router = useRouter();
  const { signOut } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      {loading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
    </Button>
  );
}
