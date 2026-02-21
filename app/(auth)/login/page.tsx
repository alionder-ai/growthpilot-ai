import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">veya</span>
          </div>
        </div>

        <GoogleAuthButton />

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
