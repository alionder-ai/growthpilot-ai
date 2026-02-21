# Error Handling ve User Experience Implementation

Bu doküman, Task 24 kapsamında uygulanan hata yönetimi ve kullanıcı deneyimi iyileştirmelerini açıklar.

## Genel Bakış

GrowthPilot AI için kapsamlı bir hata yönetimi sistemi uygulandı. Sistem, kullanıcı dostu Türkçe hata mesajları, otomatik yeniden deneme mekanizmaları, form validasyonu ve oturum süresi dolma yönetimi içerir.

## Uygulanan Özellikler

### 1. Kullanıcı Dostu Hata Mesajları (Task 24.1)

**Validates: Requirement 14.4**

#### Dosyalar
- `lib/utils/error-handler.ts` - Merkezi hata yönetimi
- `lib/utils/validation.ts` - Form validasyon mesajları

#### Özellikler
- Tüm API hataları için Türkçe mesajlar
- HTTP durum kodlarına göre özelleştirilmiş mesajlar
- Meta API ve Gemini API için özel hata mesajları
- Veritabanı hatalarını kullanıcı dostu formata çevirme
- Hata loglama ve izleme desteği

#### Kullanım Örneği
```typescript
import { getUserFriendlyErrorMessage, getMetaAPIErrorMessage } from '@/lib/utils/error-handler';

try {
  await someAPICall();
} catch (error) {
  const message = getUserFriendlyErrorMessage(error);
  toast.error('Hata', message);
}
```

### 2. Network Error Handling (Task 24.2)

**Validates: Requirements 14.1, 14.2, 14.3**

#### Dosyalar
- `lib/utils/retry.ts` - Exponential backoff ile yeniden deneme
- `lib/utils/network-error-handler.ts` - Network hata yönetimi
- `components/ui/toast.tsx` - Toast bildirimleri
- `components/ui/toaster.tsx` - Toast container
- `lib/contexts/ToastContext.tsx` - Toast context provider
- `hooks/use-toast.ts` - Toast hook
- `components/ui/error-boundary.tsx` - React error boundary

#### Özellikler
- 3 denemeye kadar otomatik yeniden deneme
- Exponential backoff (1s, 2s, 4s)
- Toast bildirimleri ile kullanıcı bilgilendirme
- Yeniden denenebilir hataları otomatik algılama
- Manuel yeniden deneme seçeneği
- React Error Boundary ile hata yakalama

#### Kullanım Örneği
```typescript
import { withRetry } from '@/lib/utils/retry';
import { useToast } from '@/lib/contexts/ToastContext';

const { toast } = useToast();

try {
  const result = await withRetry(
    () => fetchData(),
    'Data Fetch',
    {
      maxAttempts: 3,
      onRetry: (attempt) => {
        toast.warning('Yeniden deneniyor...', `Deneme ${attempt}/3`);
      }
    }
  );
} catch (error) {
  toast.error('Hata', getUserFriendlyErrorMessage(error));
}
```

#### Toast Kullanımı
```typescript
// App layout'a ToastProvider ekleyin
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  );
}

// Componentlerde kullanım
import { useToast } from '@/lib/contexts/ToastContext';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast.success('Başarılı', 'İşlem tamamlandı');
  };

  const handleError = () => {
    toast.error('Hata', 'Bir hata oluştu');
  };

  const handleWarning = () => {
    toast.warning('Uyarı', 'Dikkat edilmesi gereken bir durum');
  };
}
```

### 3. Form Validation (Task 24.3)

**Validates: Requirement 3.4**

#### Dosyalar
- `components/ui/form-field.tsx` - Validasyonlu form alanları
- `hooks/use-form-validation.ts` - Form validasyon hook
- `lib/utils/validation.ts` - Validasyon fonksiyonları (güncellenmiş)

#### Özellikler
- Inline validasyon mesajları
- Hatalı alanları kırmızı border ile vurgulama
- Real-time validasyon (blur ve change olaylarında)
- Komisyon yüzdesi validasyonu (0-100 arası)
- E-posta, telefon, URL validasyonu
- Özel validasyon kuralları desteği
- Türkçe hata mesajları

#### Kullanım Örneği
```typescript
import { useFormValidation } from '@/hooks/use-form-validation';
import { FormField } from '@/components/ui/form-field';

function ClientForm() {
  const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
    { name: '', email: '', commission: 0 },
    {
      name: { required: true },
      email: { required: true, email: true },
      commission: { required: true, min: 0, max: 100 },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    
    // Submit form
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Müşteri Adı"
        name="name"
        value={values.name}
        onChange={(value) => handleChange('name', value)}
        onBlur={() => handleBlur('name')}
        error={errors.name}
        required
      />
      
      <FormField
        label="E-posta"
        name="email"
        type="email"
        value={values.email}
        onChange={(value) => handleChange('email', value)}
        onBlur={() => handleBlur('email')}
        error={errors.email}
        required
      />
      
      <FormField
        label="Komisyon Yüzdesi"
        name="commission"
        type="number"
        value={values.commission}
        onChange={(value) => handleChange('commission', parseFloat(value))}
        onBlur={() => handleBlur('commission')}
        error={errors.commission}
        required
        helperText="0 ile 100 arasında bir değer giriniz"
      />
    </form>
  );
}
```

### 4. Session Expiration Handling (Task 24.4)

**Validates: Requirement 1.5**

#### Dosyalar
- `lib/utils/session-handler.ts` - Oturum süresi dolma yönetimi
- `hooks/use-session-aware-api.ts` - Oturum kontrolü ile API hook
- `middleware.ts` - Güncellenmiş middleware (returnUrl desteği)

#### Özellikler
- Otomatik oturum süresi dolma algılama
- Login sayfasına yönlendirme ile returnUrl
- Toast bildirimi ile kullanıcı bilgilendirme
- Session-aware fetch wrapper
- Opsiyonel session timeout uyarısı

#### Kullanım Örneği
```typescript
import { useSessionAwareAPI } from '@/hooks/use-session-aware-api';

function MyComponent() {
  const { executeAPI, fetchWithSession } = useSessionAwareAPI();

  const fetchData = async () => {
    try {
      const data = await executeAPI(
        async () => {
          const response = await fetchWithSession('/api/clients');
          return response.json();
        }
      );
      // Use data
    } catch (error) {
      // Error already handled (toast shown, redirected if session expired)
    }
  };
}
```

## Entegrasyon Rehberi

### 1. Root Layout'a Toast Provider Ekleme

```typescript
// app/layout.tsx
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}
```

### 2. API Route'larda Hata Yönetimi

```typescript
// app/api/clients/route.ts
import { NextResponse } from 'next/server';
import { APIError, formatAPIError } from '@/lib/utils/error-handler';

export async function GET(request: Request) {
  try {
    // Your logic here
    const data = await fetchClients();
    return NextResponse.json(data);
  } catch (error) {
    const formattedError = formatAPIError(error);
    return NextResponse.json(
      { error: formattedError.message },
      { status: formattedError.statusCode || 500 }
    );
  }
}
```

### 3. Component'lerde Error Boundary Kullanımı

```typescript
import { ErrorBoundary } from '@/components/ui/error-boundary';

function MyPage() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Hata Mesajları Referansı

### HTTP Durum Kodları
- **400**: "Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin."
- **401**: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın."
- **403**: "Bu işlem için yetkiniz bulunmuyor."
- **404**: "İstenen kaynak bulunamadı."
- **409**: "Bu kayıt zaten mevcut."
- **429**: "Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin."
- **500-504**: "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin."

### Meta API Hataları
- OAuth hatası: "Meta hesap bağlantınız geçersiz. Lütfen hesabınızı yeniden bağlayın."
- Rate limit: "Meta API kullanım limitine ulaşıldı. Lütfen bir süre bekleyip tekrar deneyin."
- Token geçersiz: "Meta erişim anahtarınız geçersiz. Lütfen hesabınızı yeniden bağlayın."
- Token süresi dolmuş: "Meta erişim anahtarınızın süresi dolmuş. Lütfen hesabınızı yeniden bağlayın."

### Gemini API Hataları
- API key hatası: "Yapay zeka servisi yapılandırması hatalı. Lütfen sistem yöneticisiyle iletişime geçin."
- Quota/Rate limit: "Yapay zeka servisi kullanım limitine ulaşıldı. Lütfen daha sonra tekrar deneyin."
- Content policy: "İçerik güvenlik politikası ihlali. Lütfen farklı bir içerik deneyin."
- Token limit: "İçerik çok uzun. Lütfen daha kısa bir içerik deneyin."

### Validasyon Hataları
- Zorunlu alan: "{Alan adı} alanı zorunludur"
- E-posta: "Geçerli bir e-posta adresi giriniz"
- Telefon: "Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX)"
- URL: "Geçerli bir URL giriniz"
- Komisyon: "Komisyon yüzdesi 0 ile 100 arasında olmalıdır"
- Min/Max: "Minimum/Maksimum değer X olmalıdır"
- MinLength/MaxLength: "En az/En fazla X karakter olmalıdır"

## Test Edilmesi Gerekenler

1. **Toast Bildirimleri**
   - Success, error, warning toast'ları görüntüleniyor mu?
   - Toast'lar otomatik kapanıyor mu (5 saniye)?
   - Manuel kapatma çalışıyor mu?

2. **Form Validasyonu**
   - Zorunlu alanlar boş bırakıldığında hata gösteriliyor mu?
   - E-posta, telefon validasyonu çalışıyor mu?
   - Komisyon yüzdesi 0-100 dışında değer kabul etmiyor mu?
   - Hatalı alanlar kırmızı border ile vurgulanıyor mu?

3. **Network Error Handling**
   - API hataları kullanıcı dostu mesajlarla gösteriliyor mu?
   - Yeniden deneme mekanizması çalışıyor mu?
   - Error boundary hataları yakalıyor mu?

4. **Session Expiration**
   - Oturum süresi dolduğunda login'e yönlendiriliyor mu?
   - returnUrl parametresi doğru çalışıyor mu?
   - Toast bildirimi gösteriliyor mu?

## Gelecek İyileştirmeler

1. **Sentry Entegrasyonu**: Hata izleme servisi entegrasyonu
2. **Session Timeout Warning**: Oturum süresi dolmadan önce uyarı
3. **Offline Support**: Çevrimdışı mod desteği
4. **Error Analytics**: Hata istatistikleri ve raporlama
5. **Custom Error Pages**: Özelleştirilmiş hata sayfaları (404, 500, vb.)

## Notlar

- Tüm kullanıcı mesajları Türkçe'dir
- Teknik loglar İngilizce'dir (debugging için)
- Error boundary sadece React render hatalarını yakalar
- API hataları için ayrı error handling gereklidir
- Session expiration middleware tarafından otomatik yönetilir
