import Link from 'next/link';
import { SignupForm } from '@/components/auth/SignupForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">GrowthPilot AI</h1>
          <p className="mt-2 text-gray-600">
            Dijital pazarlama yönetim platformu
          </p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-gray-600">
          Zaten hesabınız var mı?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
