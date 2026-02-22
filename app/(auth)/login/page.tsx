import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">GrowthPilot AI</h1>
          <p className="mt-2 text-gray-600">
            Dijital pazarlama yönetim platformu
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-gray-600">
          Hesabınız yok mu?{' '}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Kayıt olun
          </Link>
        </p>
      </div>
    </div>
  );
}
