# GrowthPilot AI

Dijital pazarlama danışmanları için yapay zeka destekli kampanya yönetim platformu.

## Özellikler

- Müşteri portföyü yönetimi ve komisyon takibi
- Meta Ads API entegrasyonu ile otomatik kampanya verisi senkronizasyonu
- Google Gemini AI ile günlük aksiyon planları ve strateji önerileri
- Finansal dashboard ile harcama ve gelir trendleri
- Lead kalite takibi ve dönüşüm geri bildirimi
- Sektöre özel kreatif içerik üretici
- Tek tıkla müşteri raporlama (WhatsApp/PDF formatları)

## Teknoloji Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, Shadcn/UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **External APIs**: Meta Graph API, Google Gemini API
- **Deployment**: Vercel

## Kurulum

1. Node.js ve npm'i yükleyin (Node.js 18+ gereklidir)

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment variables'ı ayarlayın:
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyerek gerekli API anahtarlarını ekleyin:
- Supabase URL ve anahtarları
- Meta API kimlik bilgileri
- Google Gemini API anahtarı
- Şifreleme anahtarı

4. Development server'ı başlatın:
```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Komutlar

```bash
# Development
npm run dev          # Development server başlat
npm run build        # Production build oluştur
npm run start        # Production server başlat

# Testing
npm run test         # Unit testleri çalıştır
npm run test:watch   # Test watch mode
npm run lint         # ESLint çalıştır
npm run type-check   # TypeScript type check
```

## Proje Yapısı

```
/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn/UI components
│   └── ...               # Feature components
├── lib/                  # Utility functions
│   ├── supabase/        # Supabase client
│   ├── meta/            # Meta API client
│   ├── gemini/          # Gemini API client
│   └── types/           # TypeScript types
└── supabase/            # Database migrations
```

## Environment Variables

Gerekli environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `META_APP_ID` - Meta App ID
- `META_APP_SECRET` - Meta App Secret
- `GEMINI_API_KEY` - Google Gemini API key
- `ENCRYPTION_KEY` - AES-256 encryption key (32 byte)

## Lisans

Proprietary - Tüm hakları saklıdır.
