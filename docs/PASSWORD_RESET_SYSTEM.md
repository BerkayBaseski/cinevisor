# Şifre Sıfırlama Sistemi (Password Reset System)

## ✅ Tamamlanan Özellikler

### Backend
- ✅ `password_resets` tablosu oluşturuldu
- ✅ Token tabanlı güvenli şifre sıfırlama
- ✅ Token süresi dolma kontrolü (1 saat)
- ✅ Tek kullanımlık tokenlar
- ✅ Email enumeration koruması

### API Endpoints
1. **POST /api/auth/forgot-password**
   - Email ile şifre sıfırlama talebi
   - Güvenli token oluşturma
   - Development modda reset linki döndürür

2. **POST /api/auth/reset-password**
   - Token ile yeni şifre belirleme
   - Token geçerlilik kontrolü
   - Şifre güvenlik kontrolü (min 8 karakter)

### Frontend Sayfaları
1. **frontend/pages/forgot-password.html**
   - Email girişi
   - Başarı mesajı gösterimi
   - Kullanıcı dostu arayüz

2. **frontend/pages/reset-password.html**
   - Yeni şifre girişi
   - Şifre tekrar girişi
   - Şifre gücü göstergesi (Weak/Medium/Strong)
   - Şifre görünürlük toggle
   - Token geçerlilik kontrolü

## 🔒 Güvenlik Özellikleri

### 1. Email Enumeration Koruması
- Var olmayan email adresleri için de başarı mesajı döner
- Saldırganlar hangi emaillerin sistemde olduğunu öğrenemez

### 2. Token Güvenliği
- 64 karakter uzunluğunda rastgele hex token
- 1 saat geçerlilik süresi
- Tek kullanımlık (used flag ile işaretlenir)
- Veritabanında güvenli şekilde saklanır

### 3. Şifre Güvenliği
- Minimum 8 karakter zorunluluğu
- Şifre gücü kontrolü (zayıf/orta/güçlü)
- Bcrypt ile hashleme

## 📝 Kullanım Akışı

### 1. Şifre Sıfırlama Talebi
```
Kullanıcı → forgot-password.html
  ↓
Email girer
  ↓
Backend → Token oluşturur
  ↓
Email gönderilir (production'da)
  ↓
Development'ta console'da link görünür
```

### 2. Yeni Şifre Belirleme
```
Kullanıcı → Reset linkine tıklar
  ↓
reset-password.html?token=xxx
  ↓
Yeni şifre girer
  ↓
Backend → Token kontrol eder
  ↓
Şifre güncellenir
  ↓
Login sayfasına yönlendirilir
```

## 🧪 Test

### Manuel Test
```bash
# 1. Şifre sıfırlama talebi
curl -X POST http://localhost/AIShortFilm/backend/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aishortfilm.com"}'

# 2. Response'dan token'ı al ve şifreyi sıfırla
curl -X POST http://localhost/AIShortFilm/backend/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE","new_password":"newpassword123"}'
```

### Otomatik Test
```bash
php backend/test-password-reset.php
```

## 🎨 UI Özellikleri

### Forgot Password Sayfası
- ✅ Temiz ve modern tasarım
- ✅ Email input alanı
- ✅ Başarı mesajı animasyonu
- ✅ "Back to login" linki
- ✅ Responsive tasarım

### Reset Password Sayfası
- ✅ Şifre gücü göstergesi (renkli)
  - 🔴 Weak (Zayıf)
  - 🟡 Medium (Orta)
  - 🟢 Strong (Güçlü)
- ✅ Şifre görünürlük toggle (göz ikonu)
- ✅ Şifre tekrar kontrolü
- ✅ Gerçek zamanlı validasyon
- ✅ Kullanıcı dostu hata mesajları

## 📊 Veritabanı Yapısı

```sql
password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  used BOOLEAN DEFAULT FALSE,
  INDEX idx_token (token),
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
)
```

## 🚀 Production Notları

### Email Gönderimi
Production'da email gönderimi için:
```php
// backend/api/auth/forgot-password.php içinde
// TODO kısmını implement edin:

use PHPMailer\PHPMailer\PHPMailer;

function sendPasswordResetEmail($email, $resetLink) {
    $mail = new PHPMailer(true);
    // SMTP ayarları
    $mail->isSMTP();
    $mail->Host = $_ENV['SMTP_HOST'];
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['SMTP_USER'];
    $mail->Password = $_ENV['SMTP_PASS'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    // Email içeriği
    $mail->setFrom('noreply@cinevisor.com', 'CineVisor');
    $mail->addAddress($email);
    $mail->Subject = 'Password Reset Request';
    $mail->Body = "Click here to reset your password: $resetLink";
    
    $mail->send();
}
```

### Güvenlik Ayarları
- ✅ dev_reset_link sadece development'ta döner
- ✅ Token'lar 1 saat sonra otomatik expire olur
- ✅ Kullanılmış tokenlar tekrar kullanılamaz
- ✅ Rate limiting eklenebilir (opsiyonel)

## ✨ Özellikler

- ✅ Güvenli token tabanlı sistem
- ✅ Email enumeration koruması
- ✅ Şifre gücü göstergesi
- ✅ Şifre görünürlük toggle
- ✅ Responsive tasarım
- ✅ Kullanıcı dostu hata mesajları
- ✅ Netflix temalı görünüm
- ✅ Tek kullanımlık tokenlar
- ✅ Otomatik token expiration
- ✅ Development mode desteği

## 🔗 İlgili Dosyalar

**Backend:**
- `backend/migrations/create_password_resets_table.sql`
- `backend/api/auth/forgot-password.php`
- `backend/api/auth/reset-password.php`
- `backend/run-password-resets-migration.php`

**Frontend:**
- `frontend/pages/forgot-password.html`
- `frontend/pages/reset-password.html`
- `frontend/pages/login.html` (forgot password linki)

**Test:**
- `backend/test-password-reset.php`
- `backend/check-users.php`
