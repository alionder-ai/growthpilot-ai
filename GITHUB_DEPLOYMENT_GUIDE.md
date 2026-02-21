# GitHub ve Vercel Deployment Rehberi

## 🚀 Hızlı Başlangıç

Bu rehber, GrowthPilot AI projenizi GitHub'a yükleyip Vercel'de yayına almanız için adım adım talimatlar içerir.

---

## 📋 Ön Hazırlık

### 1. Xcode Command Line Tools Kurulumu (macOS)

Terminal'de şu komutu çalıştırın:

```bash
xcode-select --install
```

Açılan pencereden "Install" butonuna tıklayın ve kurulumun tamamlanmasını bekleyin (5-10 dakika).

**Alternatif:** Eğer kurulum penceresi açılmazsa:
```bash
sudo rm -rf /Library/Developer/CommandLineTools
xcode-select --install
```

---

## 📦 Adım 1: Git Repository Başlatma

Terminal'de proje klasörünüzde şu komutları sırayla çalıştırın:

```bash
# Git repository'sini başlat
git init

# Git kullanıcı bilgilerinizi ayarlayın (ilk kez kullanıyorsanız)
git config --global user.name "Adınız Soyadınız"
git config --global user.email "email@example.com"

# Tüm dosyaları staging area'ya ekle
git add .

# İlk commit'i oluştur
git commit -m "Initial commit: GrowthPilot AI v1.0"
```

✅ **Başarılı olursa:** "X files changed" mesajını göreceksiniz.

---

## 🌐 Adım 2: GitHub Repository Oluşturma

### 2.1 GitHub'da Yeni Repository Oluşturun

1. https://github.com adresine gidin
2. Sağ üstteki **"+"** butonuna tıklayın
3. **"New repository"** seçin
4. Repository bilgilerini doldurun:
   - **Repository name:** `growthpilot-ai`
   - **Description:** "Dijital pazarlama danışmanları için AI destekli kampanya yönetim platformu"
   - **Visibility:** Private (önerilir) veya Public
   - ⚠️ **"Initialize this repository with a README" seçeneğini İŞARETLEMEYİN**
5. **"Create repository"** butonuna tıklayın

### 2.2 Local Repository'yi GitHub'a Bağlayın

GitHub'da oluşturduğunuz repository sayfasında gösterilen komutları kopyalayın:

```bash
# GitHub repository'sini remote olarak ekle
git remote add origin https://github.com/KULLANICI_ADINIZ/growthpilot-ai.git

# Ana branch'i main olarak ayarla
git branch -M main

# Kodu GitHub'a push et
git push -u origin main
```

**Not:** `KULLANICI_ADINIZ` yerine kendi GitHub kullanıcı adınızı yazın.

### 2.3 GitHub Authentication

İlk push sırasında GitHub kimlik doğrulaması isteyecek:

**Seçenek 1: Personal Access Token (Önerilen)**

1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. "Generate new token (classic)" butonuna tıklayın
3. Token'a bir isim verin (örn: "GrowthPilot Deployment")
4. Şu yetkileri seçin:
   - ✅ `repo` (tüm alt seçenekler)
   - ✅ `workflow`
5. "Generate token" butonuna tıklayın
6. Token'ı kopyalayın (bir daha göremezsiniz!)
7. Terminal'de şifre sorduğunda bu token'ı yapıştırın

**Seçenek 2: GitHub CLI (Alternatif)**

```bash
# GitHub CLI'yi kur (Homebrew ile)
brew install gh

# GitHub'a giriş yap
gh auth login

# Talimatları takip edin (browser üzerinden giriş yapacaksınız)
```

---

## ☁️ Adım 3: Vercel'de Deployment

### 3.1 Vercel Hesabı Oluşturun

1. https://vercel.com adresine gidin
2. **"Sign Up"** butonuna tıklayın
3. **"Continue with GitHub"** seçeneğini seçin
4. GitHub hesabınızla giriş yapın ve yetkilendirin

### 3.2 Projeyi Import Edin

1. Vercel Dashboard'da **"Add New..."** > **"Project"** seçin
2. GitHub repository'leriniz listelenecek
3. **"growthpilot-ai"** repository'sini bulun
4. **"Import"** butonuna tıklayın

### 3.3 Proje Ayarlarını Yapın

**Framework Preset:** Next.js (otomatik algılanacak)

**Build Settings:** (Varsayılan ayarları kullanın)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Root Directory:** `./` (değiştirmeyin)

### 3.4 Environment Variables Ekleyin

**"Environment Variables"** bölümünde şu değişkenleri ekleyin:

#### Supabase Değişkenleri

```
NEXT_PUBLIC_SUPABASE_URL
```
**Value:** Supabase Dashboard > Project Settings > API > Project URL
**Environments:** ✅ Production ✅ Preview ✅ Development

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**Value:** Supabase Dashboard > Project Settings > API > anon public key
**Environments:** ✅ Production ✅ Preview ✅ Development

```
SUPABASE_SERVICE_ROLE_KEY
```
**Value:** Supabase Dashboard > Project Settings > API > service_role key
**Environments:** ✅ Production ✅ Preview ✅ Development

#### Meta API Değişkenleri

```
META_APP_ID
```
**Value:** Meta Developer Dashboard > App Settings > App ID
**Environments:** ✅ Production ✅ Preview ✅ Development

```
META_APP_SECRET
```
**Value:** Meta Developer Dashboard > App Settings > App Secret
**Environments:** ✅ Production ✅ Preview ✅ Development

```
META_REDIRECT_URI
```
**Value:** `https://your-project.vercel.app/api/meta/callback`
(Deployment sonrası güncelleyeceksiniz)
**Environments:** ✅ Production

#### Google Gemini API

```
GEMINI_API_KEY
```
**Value:** Google AI Studio > Get API Key
**Environments:** ✅ Production ✅ Preview ✅ Development

#### Security Keys

```
ENCRYPTION_KEY
```
**Value:** Terminal'de oluşturun: `openssl rand -base64 32`
**Environments:** ✅ Production ✅ Preview ✅ Development

```
NEXTAUTH_SECRET
```
**Value:** Terminal'de oluşturun: `openssl rand -base64 32`
**Environments:** ✅ Production ✅ Preview ✅ Development

#### Application URL

```
NEXT_PUBLIC_APP_URL
```
**Value:** `https://your-project.vercel.app`
(Deployment sonrası güncelleyeceksiniz)
**Environments:** ✅ Production

```
NODE_ENV
```
**Value:** `production`
**Environments:** ✅ Production

### 3.5 Deploy Edin

1. Tüm environment variables'ı ekledikten sonra
2. **"Deploy"** butonuna tıklayın
3. Build işleminin tamamlanmasını bekleyin (3-5 dakika)

✅ **Başarılı olursa:** "Congratulations!" mesajını göreceksiniz

---

## 🔧 Adım 4: Deployment Sonrası Ayarlar

### 4.1 Vercel URL'ini Alın

Deployment tamamlandıktan sonra:
1. Vercel Dashboard'da projenizin URL'ini kopyalayın
2. Örnek: `https://growthpilot-ai-xyz123.vercel.app`

### 4.2 Environment Variables'ı Güncelleyin

Vercel Dashboard > Settings > Environment Variables:

1. **META_REDIRECT_URI** değişkenini bulun
   - Edit butonuna tıklayın
   - Value: `https://VERCEL_URL_INIZ/api/meta/callback`
   - Save edin

2. **NEXT_PUBLIC_APP_URL** değişkenini bulun
   - Edit butonuna tıklayın
   - Value: `https://VERCEL_URL_INIZ`
   - Save edin

3. **Redeploy** butonuna tıklayın (değişikliklerin uygulanması için)

### 4.3 Meta Developer Dashboard'u Güncelleyin

1. https://developers.facebook.com/apps adresine gidin
2. Uygulamanızı seçin
3. **Settings > Basic** bölümüne gidin
4. **App Domains** alanına Vercel domain'inizi ekleyin:
   ```
   growthpilot-ai-xyz123.vercel.app
   ```
5. **Save Changes** butonuna tıklayın
6. **Products > Facebook Login > Settings** bölümüne gidin
7. **Valid OAuth Redirect URIs** alanına ekleyin:
   ```
   https://growthpilot-ai-xyz123.vercel.app/api/meta/callback
   ```
8. **Save Changes** butonuna tıklayın

### 4.4 Supabase Redirect URL'lerini Güncelleyin

1. Supabase Dashboard > Authentication > URL Configuration
2. **Site URL** alanına Vercel URL'inizi ekleyin:
   ```
   https://growthpilot-ai-xyz123.vercel.app
   ```
3. **Redirect URLs** alanına ekleyin:
   ```
   https://growthpilot-ai-xyz123.vercel.app/api/auth/callback
   https://growthpilot-ai-xyz123.vercel.app/dashboard
   ```
4. **Save** butonuna tıklayın

---

## ✅ Adım 5: Test ve Doğrulama

### 5.1 Health Check

Tarayıcınızda şu URL'yi açın:
```
https://VERCEL_URL_INIZ/api/health
```

✅ **Başarılı:** `{"status": "healthy"}` yanıtını görmelisiniz

### 5.2 Authentication Test

1. Ana sayfaya gidin: `https://VERCEL_URL_INIZ`
2. **Kayıt Ol** butonuna tıklayın
3. Email ve şifre ile kayıt olun
4. Email doğrulama linkine tıklayın (Supabase email'i kontrol edin)
5. Giriş yapın ve dashboard'u görün

### 5.3 Cron Jobs Kontrolü

Vercel Dashboard > Cron Jobs bölümünde şu job'ları görmelisiniz:
- ✅ Meta Sync (00:00 UTC)
- ✅ AI Recommendations (01:00 UTC)
- ✅ Notification Cleanup (02:00 UTC)

---

## 🔄 Kod Güncellemeleri için Git Workflow

Kod değişikliklerini GitHub'a push ettiğinizde Vercel otomatik deploy edecek:

```bash
# Değişiklikleri staging area'ya ekle
git add .

# Commit oluştur
git commit -m "Açıklayıcı commit mesajı"

# GitHub'a push et
git push origin main
```

Vercel otomatik olarak:
1. Yeni commit'i algılayacak
2. Build işlemini başlatacak
3. Test edecek
4. Production'a deploy edecek

---

## 🎯 Hızlı Komut Referansı

### Encryption Key Oluşturma
```bash
openssl rand -base64 32
```

### Git Komutları
```bash
git status                    # Değişiklikleri görüntüle
git add .                     # Tüm değişiklikleri ekle
git commit -m "mesaj"         # Commit oluştur
git push origin main          # GitHub'a push et
git log --oneline             # Commit geçmişini görüntüle
```

### Vercel CLI (Opsiyonel)
```bash
# Vercel CLI'yi kur
npm i -g vercel

# Giriş yap
vercel login

# Deploy et
vercel --prod
```

---

## 🆘 Sorun Giderme

### Problem: "Permission denied (publickey)"

**Çözüm:** Personal Access Token kullanın (Adım 2.3)

### Problem: Build hatası

**Çözüm:**
1. Vercel Dashboard > Deployments > Failed deployment
2. Build logs'u inceleyin
3. Eksik environment variable var mı kontrol edin

### Problem: "Module not found"

**Çözüm:**
1. `package.json` dosyasını kontrol edin
2. Vercel'de "Redeploy" yapın

### Problem: Meta API bağlantı hatası

**Çözüm:**
1. Meta Developer Dashboard'da Redirect URI'yi kontrol edin
2. Environment variables'ı kontrol edin
3. Meta App'in "Live" modda olduğundan emin olun

### Problem: Supabase bağlantı hatası

**Çözüm:**
1. Supabase URL ve key'leri kontrol edin
2. RLS policies'in aktif olduğundan emin olun
3. Supabase Dashboard > Database > Connection pooling ayarlarını kontrol edin

---

## 📚 Ek Kaynaklar

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **GitHub Docs:** https://docs.github.com
- **Supabase Docs:** https://supabase.com/docs
- **Meta API Docs:** https://developers.facebook.com/docs

---

## 🎉 Tebrikler!

GrowthPilot AI platformunuz artık canlıda! 🚀

**Sonraki Adımlar:**
1. ✅ UAT testlerini çalıştırın
2. ✅ Monitoring ve alerts'leri kontrol edin
3. ✅ İlk müşterinizi ekleyin
4. ✅ Meta hesabını bağlayın
5. ✅ İlk kampanya senkronizasyonunu yapın

---

**Hazırlayan:** Kiro AI  
**Tarih:** 21 Şubat 2026  
**Versiyon:** 1.0
