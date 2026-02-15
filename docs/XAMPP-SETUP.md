# XAMPP + MySQL Local Development Setup

Bu rehber, AI Short Film platformunu XAMPP ve MySQL ile local development ortamında çalıştırmak için gerekli adımları içerir.

## 📋 Gereksinimler

- Windows 10/11
- XAMPP 8.0+ (PHP 8.0+, MySQL 8.0+)
- Git
- VS Code veya herhangi bir code editor

## 🚀 Hızlı Kurulum

### 1. XAMPP Kurulumu

1. **XAMPP İndir ve Kur**
   - [XAMPP İndirme Sayfası](https://www.apachefriends.org/download.html)
   - PHP 8.0 veya üzeri versiyonu seçin
   - Installer'ı çalıştırın
   - Kurulum dizini: `C:\xampp` (önerilen)

2. **XAMPP Control Panel'i Başlat**
   - Apache ve MySQL'i başlatın
   - Her ikisi de yeşil yanmalı

### 2. Projeyi Klonlayın

```powershell
# Desktop veya istediğiniz bir dizine
cd C:\Users\YourUsername\Desktop
git clone https://github.com/YOUR_USERNAME/AIShortFilm.git
cd AIShortFilm
```

### 3. Environment Variables Ayarla

```powershell
# .env dosyasını oluştur
cd backend
copy env.example.xampp .env
```

`.env` dosyasını düzenleyin:

```env
# Database
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aishortfilm
DB_USER=root
DB_PASSWORD=

# JWT Secrets (geliştirme için basit değerler)
JWT_SECRET=development_secret_key_min_32_characters_long_abc
JWT_REFRESH_SECRET=refresh_secret_key_min_32_characters_long_xyz

# AWS (test için geçici değerler, gerçek yükleme için güncelleyin)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
AWS_S3_BUCKET=test-bucket

# App
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### 4. Database Oluştur

#### Option A: phpMyAdmin (GUI)

1. Tarayıcıda açın: `http://localhost/phpmyadmin`
2. "New" butonuna tıklayın
3. Database adı: `aishortfilm`
4. Collation: `utf8mb4_unicode_ci`
5. "Create" butonuna tıklayın

#### Option B: MySQL Command Line

```powershell
# XAMPP MySQL'e bağlan
cd C:\xampp\mysql\bin
.\mysql.exe -u root

# Database oluştur
CREATE DATABASE aishortfilm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aishortfilm;
exit;
```

### 5. Schema ve Test Verilerini Yükle

```powershell
# Backend dizininde değilseniz
cd C:\Users\YourUsername\Desktop\AIShortFilm

# Schema'yı import et
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < database\schema.mysql.sql

# Test verilerini import et (opsiyonel)
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < database\seed.mysql.sql
```

### 6. Composer Dependencies Kur

```powershell
# Backend dizinine git
cd backend

# Composer kurulu değilse:
# https://getcomposer.org/download/

# Dependencies'leri kur
composer install
```

### 7. Backend'i Başlat

#### Option A: PHP Built-in Server (Önerilen)

```powershell
# Backend dizininde
cd C:\Users\YourUsername\Desktop\AIShortFilm\backend
php -S localhost:8000
```

#### Option B: XAMPP htdocs Klasörü

```powershell
# Projeyi htdocs'a kopyala veya symlink oluştur
# Admin olarak PowerShell:
New-Item -ItemType SymbolicLink -Path "C:\xampp\htdocs\aishortfilm" -Target "C:\Users\YourUsername\Desktop\AIShortFilm"

# Tarayıcıda aç:
# http://localhost/aishortfilm/backend/
```

### 8. API Test

Tarayıcıda veya Postman'de:

```
GET http://localhost:8000/api/
```

Beklenen yanıt:
```json
{
  "success": true,
  "message": "AI Short Film API is running",
  "version": "1.0.0"
}
```

### 9. Frontend'i Aç

#### Option A: Doğrudan HTML (Basit Test)

```powershell
# Frontend dizininde index.html'i çift tıkla
start frontend\index.html
```

#### Option B: Live Server (VS Code)

1. VS Code'da Live Server extension'ı kur
2. `frontend/index.html`'i aç
3. Sağ tık → "Open with Live Server"
4. `http://localhost:5500` otomatik açılır

#### Option C: XAMPP htdocs

```
http://localhost/aishortfilm/frontend/
```

## 🔧 Yapılandırma

### XAMPP php.ini Ayarları

PHP ayarlarını optimize edin:

1. XAMPP Control Panel → Apache → Config → php.ini
2. Şu satırları bulun ve değiştirin:

```ini
upload_max_filesize = 500M
post_max_size = 500M
max_execution_time = 300
memory_limit = 512M
max_input_time = 300

# Extension'ları aktifleştir (başındaki ; işaretini kaldır)
extension=curl
extension=mbstring
extension=openssl
extension=pdo_mysql
```

3. Apache'yi restart edin

### MySQL my.ini Ayarları

Büyük dosya yüklemeleri için:

1. `C:\xampp\mysql\bin\my.ini` dosyasını düzenle
2. [mysqld] bölümünde:

```ini
max_allowed_packet = 500M
innodb_buffer_pool_size = 512M
```

3. MySQL'i restart edin

## 📊 Database Yönetimi

### phpMyAdmin

```
http://localhost/phpmyadmin
```

### MySQL Command Line

```powershell
# Bağlan
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm

# Tabloları listele
SHOW TABLES;

# Users'ı göster
SELECT * FROM users;

# Videos'u göster
SELECT * FROM videos;

# Exit
exit;
```

### Backup Oluştur

```powershell
# Backup
C:\xampp\mysql\bin\mysqldump.exe -u root aishortfilm > backup.sql

# Restore
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < backup.sql
```

## 🧪 Test Kullanıcıları

Schema ile birlikte şu kullanıcılar oluşturulur:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@aishortfilm.com | Admin123! | admin |
| creative_ai | creator1@aishortfilm.com | Admin123! | creator |
| future_films | creator2@aishortfilm.com | Admin123! | creator |
| film_lover | user1@aishortfilm.com | Admin123! | user |
| tech_enthusiast | user2@aishortfilm.com | Admin123! | user |

## 🐛 Sorun Giderme

### Problem: Apache Port 80 Kullanımda

```
Error: Apache shutdown unexpectedly.
Port 80 in use by another service
```

**Çözüm 1: Port Değiştir**
1. XAMPP Control Panel → Apache → Config → httpd.conf
2. `Listen 80` → `Listen 8080` olarak değiştir
3. `ServerName localhost:80` → `ServerName localhost:8080`
4. Apache'yi restart et
5. Artık `http://localhost:8080` kullan

**Çözüm 2: Conflicting Service'i Durdur**
- Genellikle Skype veya IIS kullanıyor
- Task Manager'dan durdur veya kapat

### Problem: MySQL Port 3306 Kullanımda

```
Error: MySQL shutdown unexpectedly.
Port 3306 in use
```

**Çözüm:**
1. XAMPP Control Panel → MySQL → Config → my.ini
2. `port=3306` → `port=3307` olarak değiştir
3. `.env` dosyasında `DB_PORT=3307` yap
4. MySQL'i restart et

### Problem: Database Connection Failed

```php
SQLSTATE[HY000] [1045] Access denied for user 'root'@'localhost'
```

**Çözüm:**
1. `.env` dosyasını kontrol et:
   - `DB_DRIVER=mysql`
   - `DB_HOST=localhost`
   - `DB_USER=root`
   - `DB_PASSWORD=` (boş, XAMPP default)
2. MySQL XAMPP'ta çalışıyor mu kontrol et
3. phpMyAdmin'den test et

### Problem: Composer Not Found

```
'composer' is not recognized as an internal or external command
```

**Çözüm:**
1. Composer'ı indir: https://getcomposer.org/Composer-Setup.exe
2. Installer'ı çalıştır
3. PowerShell/CMD'yi kapat ve tekrar aç
4. Test et: `composer --version`

### Problem: PHP Not Found

```
'php' is not recognized as an internal or external command
```

**Çözüm:**
1. PHP'yi PATH'e ekle:
   - Windows Search → "Environment Variables"
   - System Properties → Environment Variables
   - Path'i düzenle
   - Yeni ekle: `C:\xampp\php`
2. CMD/PowerShell'i kapat ve tekrar aç
3. Test: `php -v`

### Problem: CORS Error

```
Access to fetch at 'http://localhost:8000/api/...' has been blocked by CORS policy
```

**Çözüm:**
- `.env` dosyasında frontend URL'yi ekle:
  ```env
  CORS_ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
  ```
- Backend'i restart et

### Problem: 500 Internal Server Error

**Çözüm:**
1. PHP error log'ları kontrol et:
   - `C:\xampp\apache\logs\error.log`
   - `C:\xampp\php\logs\php_error_log`
2. `.env` dosyası doğru mu kontrol et
3. `backend/.env` var mı kontrol et (`.env.example` değil!)

## 📝 Development Workflow

### Günlük Geliştirme

```powershell
# 1. XAMPP'ı başlat (Apache + MySQL)
# XAMPP Control Panel'den

# 2. Backend'i başlat
cd C:\Users\YourUsername\Desktop\AIShortFilm\backend
php -S localhost:8000

# 3. Frontend'i aç
# VS Code Live Server veya tarayıcıda index.html

# 4. Kod değişikliklerini yap

# 5. Test et
# API: http://localhost:8000/api/
# Frontend: http://localhost:5500
```

### Database Değişiklikleri

```powershell
# Schema değişikliği yaptıysan
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < database\schema.mysql.sql

# Test verilerini yenile
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < database\seed.mysql.sql
```

### Git Workflow

```powershell
# Değişiklikleri commit et
git add .
git commit -m "feat: add new feature"

# Remote'a push et
git push origin main

# .env dosyası asla commit edilmemeli!
# .gitignore'da zaten var
```

## 🚀 Production'a Geçiş

XAMPP development bittiğinde:

1. **PostgreSQL + EC2 için hazırla:**
   ```env
   DB_DRIVER=pgsql
   DB_HOST=your-ec2-ip
   DB_PORT=5432
   ```

2. **Schema'yı PostgreSQL'e çevir:**
   - `database/schema.sql` kullan (PostgreSQL versiyonu)

3. **Deployment guide'ı takip et:**
   - `docs/DEPLOYMENT-GUIDE.md`
   - `docs/EC2-SETUP.md`

## 📚 Ek Kaynaklar

- [XAMPP Documentation](https://www.apachefriends.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [PHP Manual](https://www.php.net/manual/en/)
- [Project README](../README.md)
- [API Documentation](API.md)

## ✅ Kurulum Checklist

- [ ] XAMPP kuruldu (Apache + MySQL çalışıyor)
- [ ] Proje klonlandı
- [ ] `backend/.env` oluşturuldu ve düzenlendi
- [ ] Database `aishortfilm` oluşturuldu
- [ ] Schema import edildi (`schema.mysql.sql`)
- [ ] Test verileri import edildi (`seed.mysql.sql`)
- [ ] Composer dependencies kuruldu
- [ ] Backend başlatıldı (`php -S localhost:8000`)
- [ ] API test edildi (`http://localhost:8000/api/`)
- [ ] Frontend açıldı ve test edildi
- [ ] Test kullanıcısı ile giriş yapıldı

Tüm checkler ✅ ise, development ortamınız hazır! 🎉

