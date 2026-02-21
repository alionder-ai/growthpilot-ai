# GrowthPilot AI - Database Migrations

Bu dizin, GrowthPilot AI platformunun Supabase PostgreSQL veritabanı şemasını oluşturan migration dosyalarını içerir.

## Migration Dosyaları

Migration dosyaları kronolojik sırayla uygulanmalıdır:

1. **20240101000000_create_core_tables.sql**
   - Users, Clients, Commission_Models tablolarını oluşturur
   - UUID extension'ı etkinleştirir
   - Foreign key constraints ve indexes tanımlar
   - RLS politikalarını uygular

2. **20240101000001_create_campaign_tables.sql**
   - Campaigns, Ad_Sets, Ads, Meta_Metrics tablolarını oluşturur
   - Cascade delete yapılandırması
   - Date ve client_id indexleri
   - RLS politikalarını uygular

3. **20240101000002_create_support_tables.sql**
   - Leads, AI_Recommendations, Creative_Library, Reports, Notifications, Meta_Tokens tablolarını oluşturur
   - JSONB alanları için yapılandırma
   - Check constraints tanımlar
   - RLS politikalarını uygular

4. **20240101000003_rls_policy_tests.sql**
   - RLS politikalarının dokümantasyonu
   - Test senaryoları
   - Doğrulama sorguları

## Migration'ları Uygulama

### Supabase CLI ile

```bash
# Supabase CLI'yi yükleyin (eğer yüklü değilse)
npm install -g supabase

# Supabase projenize bağlanın
supabase link --project-ref <your-project-ref>

# Migration'ları uygulayın
supabase db push

# Veritabanını sıfırlayın (geliştirme ortamında)
supabase db reset
```

### Supabase Dashboard ile

1. Supabase Dashboard'a gidin
2. SQL Editor'ı açın
3. Her migration dosyasını sırayla kopyalayıp çalıştırın

## Veritabanı Şeması

### Core Tables
- **users**: Kullanıcı bilgileri
- **clients**: Müşteri portföyü
- **commission_models**: Komisyon hesaplama modelleri

### Campaign Tables
- **campaigns**: Meta Ads kampanyaları
- **ad_sets**: Reklam setleri
- **ads**: Tekil reklamlar
- **meta_metrics**: Kampanya metrikleri (spend, ROAS, CTR, vb.)

### Support Tables
- **leads**: Potansiyel müşteriler ve dönüşüm durumu
- **ai_recommendations**: AI tarafından üretilen öneriler
- **creative_library**: Kreatif içerik kütüphanesi
- **reports**: Oluşturulan raporlar
- **notifications**: Kullanıcı bildirimleri
- **meta_tokens**: Şifrelenmiş Meta API access token'ları

## Row-Level Security (RLS)

Tüm tablolarda RLS politikaları etkinleştirilmiştir:

- Kullanıcılar sadece kendi verilerine erişebilir
- `auth.uid()` fonksiyonu ile kullanıcı kimliği doğrulanır
- Foreign key ilişkileri üzerinden veri izolasyonu sağlanır
- Cascade delete ile referans bütünlüğü korunur

## Foreign Key İlişkileri

```
users
  └── clients
      ├── commission_models
      ├── campaigns
      │   └── ad_sets
      │       └── ads
      │           ├── meta_metrics
      │           └── leads
      ├── ai_recommendations
      └── reports
  ├── creative_library
  ├── notifications
  └── meta_tokens
```

## Indexes

Performans için aşağıdaki alanlarda index oluşturulmuştur:

- `user_id` (tüm ilgili tablolarda)
- `client_id` (campaigns, commission_models, ai_recommendations, reports)
- `date` (meta_metrics)
- `ad_id, date` (meta_metrics - composite index)
- `meta_campaign_id`, `meta_ad_set_id`, `meta_ad_id` (Meta API ID'leri)

## Check Constraints

Veri bütünlüğü için check constraints:

- `commission_percentage`: 0-100 arası
- `calculation_basis`: 'sales_revenue' veya 'total_revenue'
- `recommendation_type`: 'action_plan' veya 'strategy_card'
- `priority`: 'high', 'medium', veya 'low'
- `status`: 'active', 'completed', veya 'dismissed'
- `content_type`: 'ad_copy', 'video_script', veya 'voiceover'
- `report_type`: 'weekly' veya 'monthly'
- `type` (notifications): 'roas_alert', 'budget_alert', 'sync_error', veya 'general'

## Yeni Migration Oluşturma

```bash
# Yeni bir migration dosyası oluşturun
npx supabase migration new <migration_name>

# Örnek:
npx supabase migration new add_campaign_budget_field
```

## Notlar

- Migration dosyaları timestamp ile sıralanır (YYYYMMDDHHMMSS)
- Her migration idempotent olmalıdır (birden fazla çalıştırılabilir)
- Production'a geçmeden önce staging ortamında test edin
- Backup almadan production migration'ı çalıştırmayın
