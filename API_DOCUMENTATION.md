# GrowthPilot AI - API Documentation

Bu dokümantasyon, GrowthPilot AI platformunun tüm API endpoint'lerini, request/response formatlarını ve kullanım örneklerini içerir.

## İçindekiler

1. [Authentication API](#authentication-api)
2. [Client Management API](#client-management-api)
3. [Commission Models API](#commission-models-api)
4. [Campaign API](#campaign-api)
5. [Meta API Integration](#meta-api-integration)
6. [Metrics API](#metrics-api)
7. [AI Recommendations API](#ai-recommendations-api)
8. [Report Generation API](#report-generation-api)
9. [Lead Management API](#lead-management-api)
10. [Notification API](#notification-api)
11. [Creative Library API](#creative-library-api)
12. [User Management API](#user-management-api)
13. [Health Check API](#health-check-api)

## Genel Bilgiler

### Base URL
```
Production: https://your-domain.vercel.app
Development: http://localhost:3000
```

### Authentication
Tüm API endpoint'leri (auth hariç) Supabase session token ile korunmaktadır. Token, cookie veya Authorization header ile gönderilmelidir.

```
Authorization: Bearer <session_token>
```

### Response Format
Tüm API yanıtları JSON formatındadır.

**Başarılı Yanıt:**
```json
{
  "data": { ... },
  "message": "İşlem başarılı"
}
```

**Hata Yanıtı:**
```json
{
  "error": "Hata mesajı",
  "details": { ... }
}
```

### HTTP Status Codes
- `200 OK`: İşlem başarılı
- `201 Created`: Kayıt oluşturuldu
- `400 Bad Request`: Geçersiz istek
- `401 Unauthorized`: Kimlik doğrulama gerekli
- `403 Forbidden`: Yetki yok
- `404 Not Found`: Kayıt bulunamadı
- `500 Internal Server Error`: Sunucu hatası

---

## Authentication API

### POST /api/auth/signup
Yeni kullanıcı kaydı oluşturur.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "Ahmet Yılmaz"
}
```

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "expires_in": 3600
    }
  },
  "message": "Kayıt başarılı"
}
```

**Validation Rules:**
- Email: Geçerli email formatı
- Password: Minimum 8 karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam

---

### POST /api/auth/login
Kullanıcı girişi yapar.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "expires_in": 3600
    }
  },
  "message": "Giriş başarılı"
}
```

**Error Response (401):**
```json
{
  "error": "Email veya şifre hatalı"
}
```

---

### POST /api/auth/logout
Kullanıcı oturumunu sonlandırır.

**Request:** No body required

**Response (200):**
```json
{
  "message": "Çıkış başarılı"
}
```

---

### GET /api/auth/session
Mevcut oturum bilgisini döner.

**Response (200):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "expires_at": "2024-01-15T11:30:00Z"
    }
  }
}
```

**Response (401):**
```json
{
  "error": "Oturum bulunamadı"
}
```

---

## Client Management API

### GET /api/clients
Kullanıcının tüm müşterilerini listeler.

**Query Parameters:**
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt (default: 50)
- `search` (optional): Arama terimi (name veya industry)

**Response (200):**
```json
{
  "data": {
    "clients": [
      {
        "client_id": "uuid",
        "name": "ABC Şirketi",
        "industry": "e-commerce",
        "contact_email": "contact@abc.com",
        "contact_phone": "+90 555 123 4567",
        "created_at": "2024-01-10T09:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

---

### POST /api/clients
Yeni müşteri oluşturur.

**Request Body:**
```json
{
  "name": "ABC Şirketi",
  "industry": "e-commerce",
  "contact_email": "contact@abc.com",
  "contact_phone": "+90 555 123 4567"
}
```

**Response (201):**
```json
{
  "data": {
    "client_id": "uuid",
    "name": "ABC Şirketi",
    "industry": "e-commerce",
    "contact_email": "contact@abc.com",
    "contact_phone": "+90 555 123 4567",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Müşteri başarıyla oluşturuldu"
}
```

**Validation Rules:**
- name: Zorunlu, minimum 2 karakter
- industry: Optional, enum: logistics, e-commerce, beauty, real estate, healthcare, education
- contact_email: Optional, geçerli email formatı
- contact_phone: Optional

---

### PUT /api/clients/[id]
Müşteri bilgilerini günceller.

**Request Body:**
```json
{
  "name": "ABC Şirketi (Güncel)",
  "industry": "e-commerce",
  "contact_email": "new@abc.com",
  "contact_phone": "+90 555 999 8888"
}
```

**Response (200):**
```json
{
  "data": {
    "client_id": "uuid",
    "name": "ABC Şirketi (Güncel)",
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "message": "Müşteri başarıyla güncellendi"
}
```

---

### DELETE /api/clients/[id]
Müşteri kaydını siler (cascade delete ile ilişkili kampanyalar da silinir).

**Response (200):**
```json
{
  "message": "Müşteri ve ilişkili veriler başarıyla silindi"
}
```

**Error Response (404):**
```json
{
  "error": "Müşteri bulunamadı"
}
```

---

## Commission Models API

### POST /api/commission-models
Yeni komisyon modeli oluşturur.

**Request Body:**
```json
{
  "client_id": "uuid",
  "commission_percentage": 15.5,
  "calculation_basis": "sales_revenue"
}
```

**Response (201):**
```json
{
  "data": {
    "model_id": "uuid",
    "client_id": "uuid",
    "commission_percentage": 15.5,
    "calculation_basis": "sales_revenue",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Komisyon modeli oluşturuldu"
}
```

**Validation Rules:**
- commission_percentage: 0-100 arası decimal değer
- calculation_basis: "sales_revenue" veya "total_revenue"

---

### GET /api/commission-models/client/[clientId]
Belirli bir müşterinin komisyon modelini getirir.

**Response (200):**
```json
{
  "data": {
    "model_id": "uuid",
    "client_id": "uuid",
    "commission_percentage": 15.5,
    "calculation_basis": "sales_revenue",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### PUT /api/commission-models/[id]
Komisyon modelini günceller.

**Request Body:**
```json
{
  "commission_percentage": 18.0,
  "calculation_basis": "total_revenue"
}
```

**Response (200):**
```json
{
  "data": {
    "model_id": "uuid",
    "commission_percentage": 18.0,
    "calculation_basis": "total_revenue"
  },
  "message": "Komisyon modeli güncellendi"
}
```

---

## Campaign API

### GET /api/campaigns
Kampanyaları listeler.

**Query Parameters:**
- `client_id` (optional): Belirli bir müşterinin kampanyaları
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt (default: 50)

**Response (200):**
```json
{
  "data": {
    "campaigns": [
      {
        "campaign_id": "uuid",
        "client_id": "uuid",
        "meta_campaign_id": "123456789",
        "campaign_name": "Yaz Kampanyası 2024",
        "status": "ACTIVE",
        "created_at": "2024-01-10T09:00:00Z",
        "ad_sets": [
          {
            "ad_set_id": "uuid",
            "ad_set_name": "Hedef Kitle 1",
            "budget": 5000.00,
            "status": "ACTIVE"
          }
        ]
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 50
    }
  }
}
```

---

### POST /api/campaigns/sync
Manuel kampanya senkronizasyonu başlatır.

**Request Body:**
```json
{
  "client_id": "uuid"
}
```

**Response (200):**
```json
{
  "data": {
    "synced_campaigns": 5,
    "synced_metrics": 150,
    "last_synced_at": "2024-01-15T10:30:00Z"
  },
  "message": "Senkronizasyon başarılı"
}
```

**Error Response (500):**
```json
{
  "error": "Meta API bağlantı hatası",
  "details": "Rate limit exceeded"
}
```

---

## Meta API Integration

### POST /api/meta/connect
Meta Ads hesabı bağlantısı için OAuth akışını başlatır.

**Response (200):**
```json
{
  "data": {
    "auth_url": "https://www.facebook.com/v18.0/dialog/oauth?client_id=..."
  }
}
```

---

### GET /api/meta/callback
Meta OAuth callback endpoint'i (otomatik yönlendirme).

**Query Parameters:**
- `code`: OAuth authorization code
- `state`: CSRF token

**Response:** Redirect to dashboard

---

### POST /api/meta/sync
Tüm aktif müşteriler için Meta API senkronizasyonu (Cron job tarafından çağrılır).

**Response (200):**
```json
{
  "data": {
    "total_clients": 10,
    "successful_syncs": 9,
    "failed_syncs": 1,
    "total_metrics_updated": 450
  },
  "message": "Toplu senkronizasyon tamamlandı"
}
```

---

## Metrics API

### GET /api/metrics/overview
Dashboard için genel metrikleri getirir.

**Query Parameters:**
- `client_id` (optional): Belirli bir müşteri için filtrele
- `period` (optional): "today", "this_month", "last_30_days" (default: "this_month")

**Response (200):**
```json
{
  "data": {
    "total_clients": 25,
    "total_spend": 125000.50,
    "total_revenue": 18750.08,
    "active_campaigns": 42,
    "average_roas": 3.45,
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  }
}
```

---

### GET /api/metrics/trends
Trend verileri (grafikler için).

**Query Parameters:**
- `client_id` (optional): Belirli bir müşteri
- `metric`: "spend", "revenue", "roas", "conversions"
- `days` (optional): Gün sayısı (default: 30)

**Response (200):**
```json
{
  "data": {
    "trends": [
      {
        "date": "2024-01-01",
        "value": 4250.00
      },
      {
        "date": "2024-01-02",
        "value": 4180.50
      }
    ],
    "summary": {
      "total": 125000.50,
      "average": 4166.68,
      "change_percentage": 12.5
    }
  }
}
```

---

## AI Recommendations API

### POST /api/ai/action-plan
Günlük aksiyon planı oluşturur.

**Request Body:**
```json
{
  "client_id": "uuid"
}
```

**Response (200):**
```json
{
  "data": {
    "recommendation_id": "uuid",
    "actions": [
      {
        "action": "Frekansı 5'in üzerinde olan reklamların kreatiflerini yenileyin",
        "priority": "high",
        "expected_impact": "CTR'de %15-20 artış bekleniyor"
      },
      {
        "action": "ROAS'ı 2'nin altında olan kampanyaların bütçesini azaltın",
        "priority": "high",
        "expected_impact": "Toplam karlılıkta %10 iyileşme"
      },
      {
        "action": "Sepete ekleme oranı yüksek ama satın alma düşük reklamlara retargeting ekleyin",
        "priority": "medium",
        "expected_impact": "Dönüşüm oranında %8-12 artış"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### GET /api/ai/recommendations
Kullanıcının tüm AI önerilerini listeler.

**Query Parameters:**
- `type` (optional): "action_plan" veya "strategy_card"
- `status` (optional): "active", "completed", "dismissed"
- `client_id` (optional): Belirli bir müşteri

**Response (200):**
```json
{
  "data": {
    "recommendations": [
      {
        "recommendation_id": "uuid",
        "client_id": "uuid",
        "recommendation_type": "action_plan",
        "content": { ... },
        "priority": "high",
        "status": "active",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### PUT /api/ai/recommendations/[id]
Öneri durumunu günceller.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response (200):**
```json
{
  "data": {
    "recommendation_id": "uuid",
    "status": "completed"
  },
  "message": "Öneri durumu güncellendi"
}
```

---

### POST /api/ai/strategy-cards
Strateji kartları oluşturur.

**Request Body:**
```json
{
  "campaign_id": "uuid"
}
```

**Response (200):**
```json
{
  "data": {
    "recommendation_id": "uuid",
    "do_actions": [
      "Kreatif içeriği yenileyin",
      "Hedef kitleyi daraltın",
      "A/B testi başlatın"
    ],
    "dont_actions": [
      "Bütçeyi artırmayın",
      "Hedef kitleyi genişletmeyin",
      "Teklif stratejisini değiştirmeyin"
    ],
    "reasoning": "Frekans 5'in üzerinde ve CTR düşüyor"
  }
}
```

---

### POST /api/ai/creative
Kreatif içerik üretir.

**Request Body:**
```json
{
  "industry": "e-commerce",
  "content_type": "ad_copy",
  "target_audience": "25-34 yaş kadınlar",
  "objective": "satış artışı",
  "tone": "samimi ve güvenilir"
}
```

**Response (200):**
```json
{
  "data": {
    "variations": [
      {
        "title": "Kış İndirimi Başladı! 🎉",
        "content": "Sevdiğiniz ürünlerde %50'ye varan indirim! Sınırlı stok, hemen alışverişe başlayın.",
        "cta": "Hemen Alışveriş Yap"
      },
      {
        "title": "Gardırobunuzu Yenileyin ✨",
        "content": "Yeni sezon koleksiyonumuz sizleri bekliyor. İlk 100 alışverişe özel hediye!",
        "cta": "Koleksiyonu Keşfet"
      },
      {
        "title": "Ücretsiz Kargo Fırsatı 🚚",
        "content": "150 TL ve üzeri tüm alışverişlerde kargo bizden! Kaçırmayın.",
        "cta": "Alışverişe Başla"
      }
    ]
  }
}
```

---

## Report Generation API

### POST /api/reports/generate
Rapor oluşturur.

**Request Body:**
```json
{
  "client_id": "uuid",
  "report_type": "weekly",
  "period_start": "2024-01-08",
  "period_end": "2024-01-14",
  "format": "pdf",
  "metrics": ["spend", "revenue", "roas", "leads", "cost_per_lead"]
}
```

**Response (200):**
```json
{
  "data": {
    "report_id": "uuid",
    "client_id": "uuid",
    "report_type": "weekly",
    "period_start": "2024-01-08",
    "period_end": "2024-01-14",
    "file_url": "https://storage.example.com/reports/report-uuid.pdf",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Rapor başarıyla oluşturuldu"
}
```

**Validation Rules:**
- report_type: "weekly" veya "monthly"
- format: "whatsapp" veya "pdf"
- metrics: Array, en az 1 metrik seçilmeli

---

### GET /api/reports
Kullanıcının raporlarını listeler.

**Query Parameters:**
- `client_id` (optional): Belirli bir müşteri
- `report_type` (optional): "weekly" veya "monthly"
- `page` (optional): Sayfa numarası

**Response (200):**
```json
{
  "data": {
    "reports": [
      {
        "report_id": "uuid",
        "client_id": "uuid",
        "client_name": "ABC Şirketi",
        "report_type": "weekly",
        "period_start": "2024-01-08",
        "period_end": "2024-01-14",
        "file_url": "https://...",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### GET /api/reports/[id]/download
Rapor dosyasını indirir.

**Response (200):**
- Content-Type: application/pdf veya text/plain
- File download

---

## Lead Management API

### GET /api/leads
Lead'leri listeler.

**Query Parameters:**
- `ad_id` (optional): Belirli bir reklam
- `campaign_id` (optional): Belirli bir kampanya
- `converted_status` (optional): true/false
- `page` (optional): Sayfa numarası

**Response (200):**
```json
{
  "data": {
    "leads": [
      {
        "lead_id": "uuid",
        "ad_id": "uuid",
        "ad_name": "Reklam 1",
        "lead_source": "facebook_form",
        "contact_info": {
          "name": "Ayşe Yılmaz",
          "email": "ayse@example.com",
          "phone": "+90 555 123 4567"
        },
        "converted_status": true,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-16T14:20:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50
    }
  }
}
```

---

### PUT /api/leads/[id]/status
Lead dönüşüm durumunu günceller.

**Request Body:**
```json
{
  "converted_status": true
}
```

**Response (200):**
```json
{
  "data": {
    "lead_id": "uuid",
    "converted_status": true,
    "updated_at": "2024-01-16T14:20:00Z"
  },
  "message": "Lead durumu güncellendi"
}
```

---

### GET /api/leads/conversion-rates
Dönüşüm oranlarını getirir.

**Query Parameters:**
- `campaign_id` (optional): Belirli bir kampanya
- `ad_id` (optional): Belirli bir reklam

**Response (200):**
```json
{
  "data": {
    "by_campaign": [
      {
        "campaign_id": "uuid",
        "campaign_name": "Yaz Kampanyası",
        "total_leads": 150,
        "converted_leads": 45,
        "conversion_rate": 30.0
      }
    ],
    "by_ad": [
      {
        "ad_id": "uuid",
        "ad_name": "Reklam 1",
        "total_leads": 50,
        "converted_leads": 18,
        "conversion_rate": 36.0
      }
    ]
  }
}
```

---

## Notification API

### GET /api/notifications
Kullanıcının bildirimlerini listeler.

**Query Parameters:**
- `read_status` (optional): true/false
- `type` (optional): "roas_alert", "budget_alert", "sync_error", "general"
- `limit` (optional): Kayıt sayısı (default: 50)

**Response (200):**
```json
{
  "data": {
    "notifications": [
      {
        "notification_id": "uuid",
        "message": "ABC Şirketi kampanyasında ROAS 1.5'in altına düştü",
        "type": "roas_alert",
        "read_status": false,
        "created_at": "2024-01-15T10:30:00Z"
      },
      {
        "notification_id": "uuid",
        "message": "Günlük harcama bütçenin %125'ine ulaştı",
        "type": "budget_alert",
        "read_status": false,
        "created_at": "2024-01-15T09:15:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

---

### PUT /api/notifications/[id]/read
Bildirimi okundu olarak işaretler.

**Response (200):**
```json
{
  "data": {
    "notification_id": "uuid",
    "read_status": true
  },
  "message": "Bildirim okundu olarak işaretlendi"
}
```

---

### POST /api/notifications/cleanup
Eski okunmuş bildirimleri temizler (Cron job tarafından çağrılır).

**Response (200):**
```json
{
  "data": {
    "deleted_count": 127
  },
  "message": "Eski bildirimler temizlendi"
}
```

---

## Creative Library API

### POST /api/creative-library
Üretilen kreatif içeriği kütüphaneye kaydeder.

**Request Body:**
```json
{
  "industry": "e-commerce",
  "content_type": "ad_copy",
  "content_text": "Kış İndirimi Başladı! 🎉\n\nSevdiğiniz ürünlerde %50'ye varan indirim..."
}
```

**Response (201):**
```json
{
  "data": {
    "creative_id": "uuid",
    "user_id": "uuid",
    "industry": "e-commerce",
    "content_type": "ad_copy",
    "content_text": "Kış İndirimi Başladı! 🎉...",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "İçerik kütüphaneye kaydedildi"
}
```

---

### GET /api/creative-library
Kullanıcının kreatif kütüphanesini listeler.

**Query Parameters:**
- `industry` (optional): Sektör filtresi
- `content_type` (optional): "ad_copy", "video_script", "voiceover"
- `page` (optional): Sayfa numarası

**Response (200):**
```json
{
  "data": {
    "creatives": [
      {
        "creative_id": "uuid",
        "industry": "e-commerce",
        "content_type": "ad_copy",
        "content_text": "Kış İndirimi Başladı! 🎉...",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 35,
      "page": 1,
      "limit": 20
    }
  }
}
```

---

## User Management API

### GET /api/users/me
Mevcut kullanıcı bilgilerini getirir.

**Response (200):**
```json
{
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### DELETE /api/users/me
Kullanıcı hesabını ve tüm ilişkili verileri siler (GDPR uyumlu).

**Response (200):**
```json
{
  "message": "Hesabınız ve tüm verileriniz kalıcı olarak silindi"
}
```

**Warning:** Bu işlem geri alınamaz. Tüm müşteriler, kampanyalar, metrikler, raporlar ve diğer veriler silinir.

---

## Health Check API

### GET /api/health
Sistem sağlık durumunu kontrol eder.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "meta_api": "available",
    "gemini_api": "available"
  }
}
```

---

## Audit Logs API

### GET /api/audit-logs
Güvenlik denetim loglarını listeler (admin kullanıcılar için).

**Query Parameters:**
- `event_type` (optional): "login", "logout", "failed_login"
- `start_date` (optional): Başlangıç tarihi
- `end_date` (optional): Bitiş tarihi
- `page` (optional): Sayfa numarası

**Response (200):**
```json
{
  "data": {
    "logs": [
      {
        "log_id": "uuid",
        "user_id": "uuid",
        "event_type": "login",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "success": true,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "limit": 50
    }
  }
}
```

---

## Error Codes

### Common Error Codes

| Code | Açıklama | Çözüm |
|------|----------|-------|
| `AUTH_001` | Geçersiz kimlik bilgileri | Email ve şifrenizi kontrol edin |
| `AUTH_002` | Oturum süresi doldu | Lütfen tekrar giriş yapın |
| `AUTH_003` | Yetkisiz erişim | Bu işlem için yetkiniz yok |
| `CLIENT_001` | Müşteri bulunamadı | Geçerli bir müşteri ID'si girin |
| `CLIENT_002` | Müşteri zaten mevcut | Farklı bir isim kullanın |
| `CAMPAIGN_001` | Kampanya bulunamadı | Geçerli bir kampanya ID'si girin |
| `META_001` | Meta API bağlantı hatası | Meta hesabınızı yeniden bağlayın |
| `META_002` | Rate limit aşıldı | Lütfen birkaç dakika bekleyin |
| `GEMINI_001` | AI API hatası | Lütfen daha sonra tekrar deneyin |
| `REPORT_001` | Rapor oluşturulamadı | Tarih aralığını kontrol edin |
| `VALIDATION_001` | Geçersiz veri formatı | Gönderilen verileri kontrol edin |

---

## Rate Limiting

### API Rate Limits

- **Genel API**: 100 istek/dakika per kullanıcı
- **Meta API Sync**: 200 istek/saat per kullanıcı (Meta tarafından sınırlandırılmış)
- **Gemini API**: 60 istek/dakika (Google tarafından sınırlandırılmış)
- **Report Generation**: 10 rapor/saat per kullanıcı

**Rate Limit Aşıldığında:**
```json
{
  "error": "Rate limit aşıldı",
  "retry_after": 60,
  "limit": 100,
  "remaining": 0
}
```

---

## Webhook Events (Gelecek Özellik)

### Planlanmış Webhook Events

- `campaign.sync.completed`: Kampanya senkronizasyonu tamamlandı
- `recommendation.created`: Yeni AI önerisi oluşturuldu
- `report.generated`: Rapor oluşturuldu
- `notification.created`: Yeni bildirim oluşturuldu
- `lead.converted`: Lead dönüşüm durumu güncellendi

---

## Best Practices

### Authentication
- Session token'ları güvenli bir şekilde saklayın (httpOnly cookies)
- Token'ları her istekte Authorization header'da gönderin
- Expired token durumunda kullanıcıyı login sayfasına yönlendirin

### Error Handling
- Tüm API hatalarını yakalayın ve kullanıcı dostu mesajlar gösterin
- Network hatalarında retry mekanizması kullanın
- Kritik hatalarda kullanıcıyı bilgilendirin

### Performance
- Pagination kullanarak büyük veri setlerini parçalara bölün
- Cache mekanizmasından yararlanın (5 dakika TTL)
- Gereksiz API çağrılarından kaçının

### Security
- API key'leri asla client-side kodda saklamayın
- HTTPS kullanın (production'da zorunlu)
- Input validation her zaman backend'de yapın
- RLS politikalarına güvenin, ekstra authorization kontrolleri ekleyin

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Client management
- Campaign sync
- AI recommendations
- Report generation
- Lead management
- Notification system

---

## Support

API ile ilgili sorularınız için:
- Email: support@growthpilot.ai
- Documentation: https://docs.growthpilot.ai
- Status Page: https://status.growthpilot.ai

