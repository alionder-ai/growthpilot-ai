# User Acceptance Testing (UAT) - GrowthPilot AI

Bu dokümantasyon, GrowthPilot AI platformunun tüm kullanıcı hikayelerini ve kabul kriterlerini test etmek için kullanılır.

## Test Durumu Göstergeleri

- ✅ **PASS**: Test başarılı
- ❌ **FAIL**: Test başarısız
- ⏳ **PENDING**: Test beklemede
- ⚠️ **BLOCKED**: Test engellenmiş

---

## Requirement 1: Kullanıcı Kimlik Doğrulama ve Yetkilendirme

**User Story:** As a User, I want to securely authenticate and access only my own data, so that my client information and business data remain private.

### Test Case 1.1: Email/Password Authentication
**Acceptance Criteria:** THE Auth_System SHALL authenticate users via email and password

**Test Steps:**
1. `/login` sayfasına gidin
2. Geçerli email ve password girin
3. "Giriş Yap" butonuna tıklayın

**Expected Result:**
- Kullanıcı dashboard'a yönlendirilir
- Session token oluşturulur
- User bilgileri header'da görünür

**Status:** ⏳

---

### Test Case 1.2: Google OAuth Authentication
**Acceptance Criteria:** THE Auth_System SHALL support OAuth authentication via Google

**Test Steps:**
1. `/login` sayfasına gidin
2. "Google ile Giriş Yap" butonuna tıklayın
3. Google hesabı seçin ve yetkilendirin

**Expected Result:**
- Kullanıcı dashboard'a yönlendirilir
- Google hesabı ile session oluşturulur

**Status:** ⏳

---

### Test Case 1.3: Session Token Creation
**Acceptance Criteria:** WHEN a user successfully authenticates, THE System SHALL create a session token

**Test Steps:**
1. Başarılı giriş yapın
2. Browser developer tools > Application > Cookies kontrol edin

**Expected Result:**
- Session token cookie'de mevcut
- Token expiry date set edilmiş

**Status:** ⏳

---

### Test Case 1.4: Row-Level Security (RLS)
**Acceptance Criteria:** THE Database SHALL enforce RLS policies to restrict data access to authenticated users

**Test Steps:**
1. User A ile giriş yapın ve müşteri oluşturun
2. Logout yapın
3. User B ile giriş yapın
4. Müşteri listesini kontrol edin

**Expected Result:**
- User B, User A'nın müşterilerini göremez
- Her kullanıcı sadece kendi verilerini görür

**Status:** ⏳

---

### Test Case 1.5: Logout Functionality
**Acceptance Criteria:** WHEN a user logs out, THE System SHALL invalidate the session token

**Test Steps:**
1. Giriş yapın
2. "Çıkış Yap" butonuna tıklayın
3. Dashboard'a erişmeyi deneyin

**Expected Result:**
- Session token invalidate edilir
- Kullanıcı login sayfasına yönlendirilir
- Protected routes erişilemez

**Status:** ⏳

---

### Test Case 1.6: Authentication Error Messages
**Acceptance Criteria:** IF authentication fails, THEN THE System SHALL return a descriptive error message

**Test Steps:**
1. Yanlış password ile giriş deneyin
2. Var olmayan email ile giriş deneyin
3. Boş alanlarla giriş deneyin

**Expected Result:**
- "Email veya şifre hatalı" mesajı gösterilir
- "Bu alan zorunludur" validation mesajları
- Türkçe, kullanıcı dostu mesajlar

**Status:** ⏳

---

## Requirement 2: Müşteri Portföyü Yönetimi

**User Story:** As a User, I want to manage my client portfolio, so that I can track multiple clients and their campaigns in one place.

### Test Case 2.1: Create Client
**Acceptance Criteria:** THE System SHALL allow users to create client records with name, industry, and contact information

**Test Steps:**
1. Dashboard'da "Müşteriler" menüsüne gidin
2. "Yeni Müşteri" butonuna tıklayın
3. Name, industry, contact_email, contact_phone girin
4. "Kaydet" butonuna tıklayın

**Expected Result:**
- Müşteri başarıyla oluşturulur
- "Müşteri başarıyla oluşturuldu" toast mesajı
- Müşteri listesinde görünür

**Status:** ⏳

---

### Test Case 2.2: Edit Client
**Acceptance Criteria:** THE System SHALL allow users to edit existing client records

**Test Steps:**
1. Müşteri listesinde "Düzenle" butonuna tıklayın
2. Müşteri bilgilerini değiştirin
3. "Güncelle" butonuna tıklayın

**Expected Result:**
- Müşteri bilgileri güncellenir
- "Müşteri başarıyla güncellendi" mesajı
- Değişiklikler listede görünür

**Status:** ⏳

---

### Test Case 2.3: Delete Client
**Acceptance Criteria:** THE System SHALL allow users to delete client records

**Test Steps:**
1. Müşteri listesinde "Sil" butonuna tıklayın
2. Confirmation dialog'da "Evet, Sil" seçin

**Expected Result:**
- Müşteri silinir
- İlişkili kampanyalar arşivlenir
- "Müşteri başarıyla silindi" mesajı

**Status:** ⏳

---

### Test Case 2.4: Cascade Delete
**Acceptance Criteria:** WHEN a client is deleted, THE System SHALL archive associated campaign data

**Test Steps:**
1. Kampanyası olan bir müşteri oluşturun
2. Müşteriyi silin
3. Kampanya listesini kontrol edin

**Expected Result:**
- Müşteri silinir
- İlişkili kampanyalar da silinir (cascade)
- Database integrity korunur

**Status:** ⏳

---

### Test Case 2.5: Client List Display
**Acceptance Criteria:** THE System SHALL display a list of all clients on the Dashboard

**Test Steps:**
1. Dashboard'da "Müşteriler" sayfasına gidin
2. Müşteri listesini görüntüleyin

**Expected Result:**
- Tüm müşteriler listelenir
- Name, industry, contact bilgileri görünür
- Pagination çalışır (>50 kayıt için)

**Status:** ⏳

---

### Test Case 2.6: Client Data Storage
**Acceptance Criteria:** THE Database SHALL store client records in a Clients table with user_id foreign key

**Test Steps:**
1. Müşteri oluşturun
2. Database'de clients tablosunu kontrol edin

**Expected Result:**
- Client record user_id ile ilişkilendirilmiş
- Foreign key constraint çalışıyor
- RLS policy uygulanmış

**Status:** ⏳

---

## Requirement 3: Komisyon Modeli Tanımlama

**User Story:** As a User, I want to define commission models for each client, so that I can automatically calculate my revenue.

### Test Case 3.1: Set Commission Percentage
**Acceptance Criteria:** THE System SHALL allow users to set a commission percentage for each client

**Test Steps:**
1. Müşteri detay sayfasına gidin
2. "Komisyon Modeli" bölümünde percentage girin (örn: 15.5)
3. "Kaydet" butonuna tıklayın

**Expected Result:**
- Komisyon yüzdesi kaydedilir
- Dashboard'da revenue hesaplamasında kullanılır

**Status:** ⏳

---

### Test Case 3.2: Sales Revenue Basis
**Acceptance Criteria:** THE System SHALL support commission calculation based on client sales revenue

**Test Steps:**
1. Calculation basis olarak "sales_revenue" seçin
2. Commission percentage 20% olarak ayarlayın
3. Sales revenue: ₺10.000 olan kampanya oluşturun

**Expected Result:**
- Calculated commission: ₺2.000
- Dashboard'da doğru gösterilir

**Status:** ⏳

---

### Test Case 3.3: Total Revenue Basis
**Acceptance Criteria:** THE System SHALL support commission calculation based on client total revenue

**Test Steps:**
1. Calculation basis olarak "total_revenue" seçin
2. Commission percentage 15% olarak ayarlayın
3. Total revenue: ₺20.000 olan kampanya oluşturun

**Expected Result:**
- Calculated commission: ₺3.000
- Dashboard'da doğru gösterilir

**Status:** ⏳

---

### Test Case 3.4: Commission Model Storage
**Acceptance Criteria:** WHEN a commission model is defined, THE Database SHALL store it in the Commission_Model table

**Test Steps:**
1. Komisyon modeli oluşturun
2. Database'de commission_models tablosunu kontrol edin

**Expected Result:**
- Record client_id ile ilişkilendirilmiş
- Percentage ve calculation_basis doğru

**Status:** ⏳

---

### Test Case 3.5: Percentage Validation
**Acceptance Criteria:** THE System SHALL validate that commission percentage is between 0 and 100

**Test Steps:**
1. -5% girin ve kaydetmeyi deneyin
2. 150% girin ve kaydetmeyi deneyin
3. 50% girin ve kaydedin

**Expected Result:**
- Negatif değer: "Komisyon yüzdesi 0-100 arasında olmalıdır" hatası
- >100 değer: Aynı hata mesajı
- Geçerli değer: Başarıyla kaydedilir

**Status:** ⏳

---

## Requirement 4: Meta Ads API Entegrasyonu

**User Story:** As a User, I want to connect my Meta Ads accounts, so that campaign data is automatically imported.

### Test Case 4.1: Meta OAuth Flow
**Acceptance Criteria:** THE System SHALL authenticate with Meta_API using OAuth 2.0

**Test Steps:**
1. "Meta Hesabı Bağla" butonuna tıklayın
2. Meta login sayfasında giriş yapın
3. İzinleri onaylayın

**Expected Result:**
- OAuth flow başarıyla tamamlanır
- Callback sayfasına yönlendirilir
- "Meta hesabı başarıyla bağlandı" mesajı

**Status:** ⏳

---

### Test Case 4.2: Token Storage
**Acceptance Criteria:** WHEN a user connects a Meta Ads account, THE System SHALL store the access token securely

**Test Steps:**
1. Meta hesabı bağlayın
2. Database'de meta_tokens tablosunu kontrol edin

**Expected Result:**
- Access token AES-256 ile şifrelenmiş
- Expires_at date set edilmiş
- User_id ile ilişkilendirilmiş

**Status:** ⏳

---

### Test Case 4.3: Campaign Data Retrieval
**Acceptance Criteria:** THE System SHALL retrieve campaign, ad set, and ad level data from Meta_API

**Test Steps:**
1. Meta hesabı bağlayın
2. "Senkronize Et" butonuna tıklayın
3. Kampanya listesini kontrol edin

**Expected Result:**
- Campaigns, ad sets, ads import edilir
- Hierarchical yapı korunur
- Status bilgileri doğru

**Status:** ⏳

---

### Test Case 4.4: Metrics Import
**Acceptance Criteria:** THE System SHALL import the following metrics: spend, ROAS, CTR, CPC, CPM, CPA, frequency, add_to_cart, purchases

**Test Steps:**
1. Kampanya senkronize edin
2. Metrics tablosunu görüntüleyin

**Expected Result:**
- Tüm metrikler import edilmiş
- Değerler doğru formatlanmış (₺1.234,56)
- Date bilgisi mevcut

**Status:** ⏳

---

### Test Case 4.5: Daily Refresh
**Acceptance Criteria:** THE Meta_API SHALL refresh data daily at 00:00 UTC

**Test Steps:**
1. Cron job loglarını kontrol edin
2. 00:00 UTC'de sync çalıştığını doğrulayın

**Expected Result:**
- Cron job her gün 00:00 UTC'de çalışır
- Tüm aktif müşteriler için sync yapılır
- Başarı/hata logları tutulur

**Status:** ⏳

---

### Test Case 4.6: Authentication Failure Notification
**Acceptance Criteria:** IF Meta_API authentication fails, THEN THE System SHALL notify the user to reconnect

**Test Steps:**
1. Meta token'ı manuel olarak invalidate edin
2. Sync çalıştırın

**Expected Result:**
- "Meta hesabınızı yeniden bağlayın" bildirimi
- Notification center'da görünür
- Reconnect butonu çalışır

**Status:** ⏳

---

### Test Case 4.7: Metrics Storage with Timestamp
**Acceptance Criteria:** THE Database SHALL store imported metrics in a Meta_Metrics table with timestamp

**Test Steps:**
1. Metrics import edin
2. Database'de meta_metrics tablosunu kontrol edin

**Expected Result:**
- Her metric record date field'ı var
- Created_at timestamp mevcut
- Ad_id foreign key doğru

**Status:** ⏳

---

## Requirement 5-20: Additional Test Cases

### Requirement 5: Kampanya Verisi Saklama
**Status:** ⏳
- ✓ Campaigns table structure
- ✓ Ad_Sets table structure
- ✓ Ads table structure
- ✓ Meta_Metrics table structure
- ✓ Indexes on date and client_id
- ✓ Foreign key constraints

### Requirement 6: Finans ve Bütçe Dashboard
**Status:** ⏳
- ✓ Total ad spend (current month)
- ✓ Total ad spend (current day)
- ✓ Calculated revenue per client
- ✓ Total revenue across all clients
- ✓ Spending trends chart (30 days)
- ✓ Revenue trends chart (30 days)
- ✓ Client filter functionality

### Requirement 7: Günlük Aksiyon Planı Üretimi
**Status:** ⏳
- ✓ Daily AI generation (01:00 UTC)
- ✓ Top 3 priority actions
- ✓ Action plan display on dashboard
- ✓ Storage in AI_Recommendations table
- ✓ Mark action as complete
- ✓ Context in Gemini prompt

### Requirement 8: Strateji Kartları (Do's & Don'ts)
**Status:** ⏳
- ✓ Frequency > 4 trigger
- ✓ High add_to_cart, low purchases trigger
- ✓ ROAS < 2 trigger
- ✓ CPC increase > 20% trigger
- ✓ Green "Do" / Red "Don't" display
- ✓ Dismiss/archive functionality
- ✓ Storage with all required fields

### Requirement 9: Müşteri Raporlama Modülü
**Status:** ⏳
- ✓ Weekly/monthly report generation
- ✓ Required metrics included
- ✓ WhatsApp text format
- ✓ PDF format
- ✓ Generation within 5 seconds
- ✓ Customizable metrics
- ✓ Report storage in database

### Requirement 10: Kreatif İçerik Üretici
**Status:** ⏳
- ✓ 6 industry support
- ✓ Gemini API integration
- ✓ 3 ad copy variations
- ✓ Video script generation
- ✓ Voiceover script generation
- ✓ Editable text area
- ✓ Save to Creative_Library

### Requirement 11: Lead Kalite Geri Bildirim Sistemi
**Status:** ⏳
- ✓ Lead list with toggle buttons
- ✓ Converted/Not Converted status storage
- ✓ Lead-to-ad foreign key
- ✓ Conversion rate calculation
- ✓ Lead quality in AI prompts
- ✓ Dashboard metrics display

### Requirement 12: Veritabanı Şeması ve İlişkiler
**Status:** ⏳
- ✓ All 13 tables implemented
- ✓ Foreign key constraints
- ✓ Cascade delete configuration
- ✓ RLS policies on all tables

### Requirement 13: Dashboard Arayüz İskeleti
**Status:** ⏳
- ✓ Sidebar navigation (8 links)
- ✓ Header with user profile
- ✓ Overview cards (4 metrics)
- ✓ Responsive design (1024px+)
- ✓ TailwindCSS styling
- ✓ Shadcn/UI components

### Requirement 14: API Hata Yönetimi ve Yeniden Deneme
**Status:** ⏳
- ✓ Meta API retry (3x exponential backoff)
- ✓ Gemini API retry (3x exponential backoff)
- ✓ Error logging and user notification
- ✓ User-friendly error messages
- ✓ Rate limit handling

### Requirement 15: Veri Güvenliği ve Gizlilik
**Status:** ⏳
- ✓ AES-256 token encryption
- ✓ HTTPS transmission
- ✓ RLS policies
- ✓ Bcrypt password hashing (10+ rounds)
- ✓ GDPR data deletion
- ✓ Authentication audit logging

### Requirement 16: Performans ve Ölçeklenebilirlik
**Status:** ⏳
- ✓ Dashboard load < 2 seconds
- ✓ Pagination (>50 records)
- ✓ Connection pooling
- ✓ Cache (5 min TTL)
- ✓ Async report processing

### Requirement 17: Meta Ads Metrik Senkronizasyonu
**Status:** ⏳
- ✓ Daily sync (00:00 UTC)
- ✓ Manual sync trigger
- ✓ Last_synced_at timestamp
- ✓ Sync status display
- ✓ Sync failure handling

### Requirement 18: Gemini API Prompt Yapılandırması
**Status:** ⏳
- ✓ Action plan prompt template
- ✓ Strategy card prompt template
- ✓ Creative generator prompt template
- ✓ 500 token limit (action plans)
- ✓ 300 token limit (strategy cards)
- ✓ 1000 token limit (creative)

### Requirement 19: Çoklu Dil Desteği Hazırlığı
**Status:** ⏳
- ✓ All UI text in Turkish
- ✓ Currency format (₺1.234,56)
- ✓ Date format (DD.MM.YYYY)
- ✓ Turkish locale numbers
- ✓ Language switching (TR/EN)

### Requirement 20: Bildirim Sistemi
**Status:** ⏳
- ✓ ROAS < 1.5 notification
- ✓ Spend > 120% budget notification
- ✓ Meta sync failure notification
- ✓ Notification center display
- ✓ Mark as read functionality
- ✓ Notification storage

---

## UAT Test Execution Guide

### Pre-Test Setup

1. **Environment Preparation**
   ```bash
   # Start development server
   npm run dev
   
   # Verify database connection
   npx supabase status
   
   # Check environment variables
   cat .env.local
   ```

2. **Test Data Preparation**
   - Create test user accounts
   - Prepare sample client data
   - Mock Meta API responses (if needed)
   - Prepare test campaign data

3. **Browser Setup**
   - Use Chrome/Firefox latest version
   - Clear cache and cookies
   - Open developer tools for debugging
   - Enable network throttling (optional)

### Test Execution Process

1. **Sequential Testing**
   - Execute tests in requirement order (1-20)
   - Mark each test as PASS/FAIL/BLOCKED
   - Document any issues found
   - Take screenshots for failures

2. **Issue Reporting**
   ```markdown
   **Issue ID:** UAT-001
   **Requirement:** 1.6
   **Test Case:** Authentication Error Messages
   **Severity:** Medium
   **Description:** Error message not in Turkish
   **Steps to Reproduce:**
   1. Enter wrong password
   2. Click login
   **Expected:** "Email veya şifre hatalı"
   **Actual:** "Invalid credentials"
   **Screenshot:** [attach]
   ```

3. **Regression Testing**
   - After bug fixes, re-test failed cases
   - Verify no new issues introduced
   - Update test status

### Test Completion Criteria

✅ **Ready for Production:**
- All critical tests (Req 1, 2, 4, 6, 15) PASS
- 95%+ of all tests PASS
- No high-severity bugs open
- Performance requirements met
- Security audit completed

⚠️ **Needs Attention:**
- <95% tests PASS
- Critical bugs open
- Performance issues
- Security concerns

❌ **Not Ready:**
- Critical tests FAIL
- Major functionality broken
- Data security issues
- Performance unacceptable

---

## Test Results Summary

### Overall Status: ⏳ PENDING

| Requirement | Total Tests | Pass | Fail | Pending | Blocked |
|-------------|-------------|------|------|---------|---------|
| Req 1: Authentication | 6 | 0 | 0 | 6 | 0 |
| Req 2: Client Management | 6 | 0 | 0 | 6 | 0 |
| Req 3: Commission Models | 5 | 0 | 0 | 5 | 0 |
| Req 4: Meta API | 7 | 0 | 0 | 7 | 0 |
| Req 5: Data Storage | 6 | 0 | 0 | 6 | 0 |
| Req 6: Dashboard | 7 | 0 | 0 | 7 | 0 |
| Req 7: Action Plans | 6 | 0 | 0 | 6 | 0 |
| Req 8: Strategy Cards | 7 | 0 | 0 | 7 | 0 |
| Req 9: Reports | 7 | 0 | 0 | 7 | 0 |
| Req 10: Creative Gen | 7 | 0 | 0 | 7 | 0 |
| Req 11: Lead Management | 6 | 0 | 0 | 6 | 0 |
| Req 12: Database Schema | 4 | 0 | 0 | 4 | 0 |
| Req 13: Dashboard UI | 6 | 0 | 0 | 6 | 0 |
| Req 14: Error Handling | 5 | 0 | 0 | 5 | 0 |
| Req 15: Security | 6 | 0 | 0 | 6 | 0 |
| Req 16: Performance | 5 | 0 | 0 | 5 | 0 |
| Req 17: Meta Sync | 5 | 0 | 0 | 5 | 0 |
| Req 18: Gemini Prompts | 6 | 0 | 0 | 6 | 0 |
| Req 19: Localization | 5 | 0 | 0 | 5 | 0 |
| Req 20: Notifications | 6 | 0 | 0 | 6 | 0 |
| **TOTAL** | **119** | **0** | **0** | **119** | **0** |

**Pass Rate:** 0% (0/119)
**Target:** 95%+

---

## Known Issues

### Critical Issues
*None reported*

### High Priority Issues
*None reported*

### Medium Priority Issues
*None reported*

### Low Priority Issues
*None reported*

---

## Test Sign-Off

### Tester Information
- **Tester Name:** _________________
- **Test Date:** _________________
- **Environment:** Development / Staging / Production
- **Browser:** _________________
- **OS:** _________________

### Approval
- [ ] All critical tests passed
- [ ] All high-priority issues resolved
- [ ] Performance requirements met
- [ ] Security requirements met
- [ ] Documentation complete

**Tester Signature:** _________________
**Date:** _________________

**Product Owner Signature:** _________________
**Date:** _________________

---

## Next Steps

1. **Execute UAT Tests**
   - Assign testers to requirements
   - Execute all test cases
   - Document results

2. **Bug Fixing**
   - Prioritize critical/high bugs
   - Fix and re-test
   - Update test status

3. **Final Validation**
   - Re-run all failed tests
   - Verify bug fixes
   - Complete sign-off

4. **Production Deployment**
   - Deploy to production
   - Monitor for issues
   - User training

---

## Appendix

### Test Environment Details
```
Application URL: http://localhost:3000
Database: Supabase (Test Instance)
Meta API: Mock/Sandbox
Gemini API: Test API Key
```

### Test Accounts
```
Test User 1:
Email: test1@growthpilot.ai
Password: TestPassword123!

Test User 2:
Email: test2@growthpilot.ai
Password: TestPassword123!
```

### Support Contacts
- **Technical Support:** dev@growthpilot.ai
- **Product Owner:** product@growthpilot.ai
- **QA Lead:** qa@growthpilot.ai

