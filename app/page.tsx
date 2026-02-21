import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">GrowthPilot AI</h1>
          <p className="text-lg text-muted-foreground">
            Dijital pazarlama danışmanları için yapay zeka destekli kampanya yönetim platformu
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </main>
  );
}
