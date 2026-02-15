# Gmail SMTP Email Kurulum Rehberi

## 📧 Gmail SMTP ile Email Gönderimi

CineVisor platformunda şifre sıfırlama ve hoş geldin emaillerini göndermek için Gmail SMTP kullanıyoruz.

## 🔧 Kurulum Adımları

### 1. Gmail App Password Oluşturma

Gmail hesabınızdan uygulama şifresi oluşturmanız gerekiyor:

#### Adım 1: Google Hesap Ayarları
1. Google hesabınıza giriş yapın
2. [Google Account Security](https://myaccount.google.com/security) sayfasına gidin

#### Adım 2: 2-Step Verification (2 Adımlı Doğrulama)
1. "2-Step Verification" bölümüne tıklayın
2. Eğer aktif değilse, 2 adımlı doğrulamayı aktif edin
3. Telefon numaranızı doğrulayın

#### Adım 3: App Password Oluşturma
1. Google hesap ayarlarına geri dönün
2. "Security" > "2-Step Verification" > "App passwords" bölümüne gidin
3. Veya direkt bu linke gidin: https://myaccount.google.com/apppasswords
4. "Select app" dropdown'ından "Mail" seçin
5. "Select device" dropdown'ından "Other (Custom name)" seçin
6. İsim olarak "CineVisor" yazın
7. "Generate" butonuna tıklayın
8. **16 haneli şifreyi kopyalayın** (örnek: `abcd efgh ijkl mnop`)

### 2. .env Dosyasını Güncelleme

`backend/.env` dosyasını açın ve aşağıdaki değerleri güncelleyin:

```env
# ============================================
# Email Configuration (Gmail SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sizin-gmail-adresiniz@gmail.com
SMTP_PASS=abcdefghijklmnop

# Email gönderen bilgileri
MAIL_FROM_ADDRESS=sizin-gmail-adresiniz@gmail.com
MAIL_FROM_NAME=CineVisor

# Frontend URL
FRONTEND_URL=http://localhost/AIShortFilm/frontend
```

**Önemli Notlar:**
- `SMTP_USER`: Gmail adresinizi yazın (örnek: `myemail@gmail.com`)
- `SMTP_PASS`: Oluşturduğunuz 16 haneli app password'ü yazın (boşluksuz)
- `MAIL_FROM_ADDRESS`: Gönderen email adresi (genelde SMTP_USER ile aynı)
- `MAIL_FROM_NAME`: Email'de görünecek gönderen ismi

### 3. Test Etme

Email sistemini test etmek için:

```bash
php backend/test-email.php
```

Veya tarayıcıdan:
1. `frontend/pages/forgot-password.html` sayfasına gidin
2. Gmail adresinizi girin
3. "Send Reset Link" butonuna tıklayın
4. Gmail inbox'ınızı kontrol edin

## 📝 Email Şablonları

### Password Reset Email
- ✅ Profesyonel HTML tasarım
- ✅ Netflix temalı renkler
- ✅ Responsive tasarım
- ✅ 1 saat geçerlilik uyarısı
- ✅ Plain text alternatifi

### Welcome Email (Opsiyonel)
- ✅ Hoş geldin mesajı
- ✅ Platform özelliklerinin tanıtımı
- ✅ "Start Exploring" butonu

## 🔒 Güvenlik

### Gmail App Password Güvenliği
- ✅ App password sadece bu uygulama için kullanılır
- ✅ Ana Gmail şifrenizi paylaşmıyorsunuz
- ✅ İstediğiniz zaman iptal edebilirsiniz
- ✅ 2-Step Verification ile korunur

### .env Dosyası Güvenliği
- ⚠️ `.env` dosyasını asla Git'e commit etmeyin
- ⚠️ `.gitignore` dosyasında `.env` olduğundan emin olun
- ⚠️ Production'da farklı credentials kullanın

## 🚨 Sorun Giderme

### "Authentication failed" Hatası
**Çözüm:**
1. 2-Step Verification'ın aktif olduğundan emin olun
2. App password'ü doğru kopyaladığınızdan emin olun (boşluksuz)
3. SMTP_USER'ın doğru Gmail adresi olduğundan emin olun

### "Could not connect to SMTP host" Hatası
**Çözüm:**
1. İnternet bağlantınızı kontrol edin
2. Firewall'un 587 portunu engellemediğinden emin olun
3. SMTP_HOST'un `smtp.gmail.com` olduğundan emin olun

### Email Gelmiyor
**Kontrol Listesi:**
- ✅ Spam klasörünü kontrol edin
- ✅ Gmail'de "Less secure app access" kapalı olmalı (App password kullanıyorsanız)
- ✅ Backend log'larını kontrol edin: `error_log("Email sent...")`
- ✅ Gmail'de "Sent" klasörünü kontrol edin

### Gmail Günlük Limit
Gmail'in günlük email gönderim limiti vardır:
- **Ücretsiz Gmail:** 500 email/gün
- **Google Workspace:** 2000 email/gün

Production'da yüksek hacimli email için:
- SendGrid
- Amazon SES
- Mailgun
gibi servisleri kullanabilirsiniz.

## 📊 Email Gönderim İstatistikleri

Backend log'larında email gönderimlerini takip edebilirsiniz:

```bash
# Windows (XAMPP)
tail -f C:\xampp\apache\logs\error.log

# Linux/Mac
tail -f /var/log/apache2/error.log
```

## 🎨 Email Şablonlarını Özelleştirme

Email şablonlarını düzenlemek için:
- `backend/utils/EmailService.php` dosyasını açın
- `getPasswordResetTemplate()` veya `getWelcomeTemplate()` metodlarını düzenleyin
- HTML/CSS ile istediğiniz tasarımı yapın

## 🔄 Alternatif Email Servisleri

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
```

## ✅ Kurulum Tamamlandı!

Email sistemi artık çalışır durumda. Kullanıcılar:
1. "Forgot password?" linkine tıklayabilir
2. Email adreslerini girebilir
3. Inbox'larında şifre sıfırlama linki alabilir
4. Yeni şifre belirleyebilir

## 📞 Destek

Sorun yaşarsanız:
1. Backend log'larını kontrol edin
2. `.env` dosyasındaki ayarları kontrol edin
3. Gmail App Password'ün doğru olduğundan emin olun
4. Test script'ini çalıştırın: `php backend/test-email.php`
