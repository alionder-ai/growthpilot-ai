# 🚀 GrowthPilot AI - Deployment Checklist

Projenizi GitHub'a yükleyip Vercel'de yayına almak için bu checklist'i takip edin.

---

## ✅ Ön Hazırlık

- [ ] **Xcode Command Line Tools kurulumu** (macOS için)
  ```bash
  xcode-select --install
  ```
  ⏱️ Süre: 5-10 dakika

- [ ] **GitHub hesabı oluşturun** (yoksa)
  - https://github.com/signup

- [ ] **Vercel hesabı oluşturun** (yoksa)
  - https://vercel.com/signup
  - GitHub ile giriş yapın

---

## 📦 1. Git Repository Başlatma

Terminal'de proje klasöründe:

```bash
# 1. Git'i başlat
git init

# 2. Kullanıcı bilgilerini ayarla (ilk kez kullanıyorsanız)
git config --global user.name "Adınız Soyadınız"
git config --global user.email "email@example.com"

# 3. Dosyaları ekle
git add .

# 4. İlk commit
git commit -m "Initial commit: GrowthPilot AI v1.0"
```

✅ **Kontrol:** "X files changed" mesajını gördünüz mü?

---

## 🌐 2. GitHub'a Yükleme

### GitHub'da Repository Oluşturun

- [ ] https://github.com > **"+"** > **"New repository"**
- [ ] Repository name: `growthpilot-ai`
- [ ] Visibility: **Private** (önerilir)
- [ ] ⚠️ **"Initialize with README" seçeneğini İŞARETLEMEYİN**
- [ ] **"Create repository"** butonuna tıklayın

### Local'den GitHub'a Push

```bash
# Remote ekle (KULLANICI_ADINIZ yerine kendi kullanıcı adınızı yazın)
git remote add origin https://github.com/KULLANICI_ADINIZ/growthpilot-ai.git

# Branch'i main olarak ayarla
git branch -M main

# Push et
git push -u origin main
```

### GitHub Authentication

**İlk push sırasında şifre isteyecek:**

**Seçenek 1: Personal Access Token (Kolay)**
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. "Generate new token (classic)"
3. Yetkileri seç: ✅ `repo`, ✅ `workflow`
4. Token'ı kopyala
5. Terminal'de şifre yerine bu token'ı yapıştır

**Seçenek 2: GitHub CLI (Alternatif)**
```bash
brew install gh
gh auth login
```

✅ **Kontrol:** GitHub'da repository'nizde dosyaları görüyor musunuz?

---

## ☁️ 3. Vercel'de Deployment

### Projeyi Import Edin

- [ ] Vercel Dashboard > **"Add New..."** > **"Project"**
- [ ] **"growthpilot-ai"** repository'sini bulun
- [ ] **"Import"** butonuna tıklayın

### Framework Ayarları

- [ ] Framework Preset: **Next.js** (otomatik algılanacak)
- [ ] Build Command: `npm run build` (varsayılan)
- [ ] Output Directory: `.next` (varsayılan)

---

## 🔐 4. Environment Variables

Vercel'de **"Environment Variables"** bölümüne şu değerleri ekleyin:

### Supabase (3 değişken)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - Supabase Dashboard > Project Settings > API > Project URL
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Supabase Dashboard > Project Settings > API > anon public
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - Supabase Dashboard > Project Settings > API > service_role
  - Environments: ✅ Production ✅ Preview ✅ Development

### Meta API (3 değişken)

- [ ] `META_APP_ID`
  - Meta Developer Dashboard > App Settings > App ID
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `META_APP_SECRET`
  - Meta Developer Dashboard > App Settings > App Secret
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `META_REDIRECT_URI`
  - Şimdilik: `https://temporary.vercel.app/api/meta/callback`
  - Deployment sonrası güncelleyeceksiniz
  - Environments: ✅ Production

### Google Gemini (1 değişken)

- [ ] `GEMINI_API_KEY`
  - Google AI Studio > Get API Key
  - Environments: ✅ Production ✅ Preview ✅ Development

### Security (2 değişken)

Terminal'de oluşturun:
```bash
openssl rand -base64 32
```

- [ ] `ENCRYPTION_KEY`
  - Value: Yukarıdaki komutun çıktısı
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] `NEXTAUTH_SECRET`
  - Value: Yukarıdaki komutu tekrar çalıştırın
  - Environments: ✅ Production ✅ Preview ✅ Development

### Application (2 değişken)

- [ ] `NEXT_PUBLIC_APP_URL`
  - Şimdilik: `https://temporary.vercel.app`
  - Deployment sonrası güncelleyeceksiniz
  - Environments: ✅ Production

- [ ] `NODE_ENV`
  - Value: `production`
  - Environments: ✅ Production

**Toplam: 11 environment variable**

---

## 🚀 5. Deploy

- [ ] Tüm environment variables'ı eklediniz mi? ✅
- [ ] **"Deploy"** butonuna tıklayın
- [ ] Build işlemini bekleyin (3-5 dakika)

✅ **Kontrol:** "Congratulations!" mesajını gördünüz mü?

---

## 🔧 6. Deployment Sonrası Ayarlar

### Vercel URL'ini Alın

- [ ] Vercel Dashboard'da projenizin URL'ini kopyalayın
  - Örnek: `https://growthpilot-ai-xyz123.vercel.app`

### Environment Variables'ı Güncelleyin

Vercel Dashboard > Settings > Environment Variables:

- [ ] **META_REDIRECT_URI** değişkenini edit edin
  - Yeni value: `https://VERCEL_URL_INIZ/api/meta/callback`
  - Save

- [ ] **NEXT_PUBLIC_APP_URL** değişkenini edit edin
  - Yeni value: `https://VERCEL_URL_INIZ`
  - Save

- [ ] **Redeploy** butonuna tıklayın

### Meta Developer Dashboard

- [ ] https://developers.facebook.com/apps > Uygulamanız
- [ ] Settings > Basic > **App Domains**
  - Ekle: `growthpilot-ai-xyz123.vercel.app` (kendi URL'iniz)
  - Save Changes

- [ ] Products > Facebook Login > Settings
- [ ] **Valid OAuth Redirect URIs**
  - Ekle: `https://VERCEL_URL_INIZ/api/meta/callback`
  - Save Changes

### Supabase Dashboard

- [ ] Supabase Dashboard > Authentication > URL Configuration
- [ ] **Site URL**
  - Ekle: `https://VERCEL_URL_INIZ`

- [ ] **Redirect URLs**
  - Ekle: `https://VERCEL_URL_INIZ/api/auth/callback`
  - Ekle: `https://VERCEL_URL_INIZ/dashboard`
  - Save

---

## ✅ 7. Test ve Doğrulama

### Health Check

- [ ] Tarayıcıda açın: `https://VERCEL_URL_INIZ/api/health`
- [ ] Yanıt: `{"status": "healthy"}` ✅

### Authentication Test

- [ ] Ana sayfaya gidin: `https://VERCEL_URL_INIZ`
- [ ] **Kayıt Ol** butonuna tıklayın
- [ ] Email ve şifre ile kayıt olun
- [ ] Email doğrulama linkine tıklayın
- [ ] Giriş yapın
- [ ] Dashboard'u görüyor musunuz? ✅

### Cron Jobs

- [ ] Vercel Dashboard > Cron Jobs
- [ ] 3 cron job görüyor musunuz?
  - ✅ Meta Sync (00:00 UTC)
  - ✅ AI Recommendations (01:00 UTC)
  - ✅ Notification Cleanup (02:00 UTC)

---

## 🎉 Tamamlandı!

Projeniz artık canlıda! 🚀

### Sonraki Adımlar

- [ ] İlk müşterinizi ekleyin
- [ ] Meta hesabını bağlayın
- [ ] İlk kampanya senkronizasyonunu yapın
- [ ] Monitoring'i kontrol edin
- [ ] UAT testlerini çalıştırın

---

## 🆘 Sorun mu Yaşıyorsunuz?

Detaylı sorun giderme için: `GITHUB_DEPLOYMENT_GUIDE.md` dosyasına bakın.

**Yaygın Sorunlar:**
- Git permission hatası → Personal Access Token kullanın
- Build hatası → Environment variables'ı kontrol edin
- Meta API hatası → Redirect URI'yi kontrol edin
- Supabase hatası → URL ve key'leri kontrol edin

---

**İyi çalışmalar! 🚀**
