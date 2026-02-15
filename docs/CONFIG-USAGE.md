# Configuration Usage Guide

Bu döküman, `backend/config/` klasöründeki yapılandırma dosyalarının nasıl kullanılacağını açıklar.

## 📁 Config Dosyaları

### 1. `config/config.php`
Merkezi yapılandırma yöneticisi. Tüm environment variables'ları yükler ve merkezi bir API sağlar.

### 2. `config/database.php`
PostgreSQL veritabanı bağlantısı için singleton sınıf.

### 3. `config/cors.php`
CORS headers ve security headers yönetimi.

## 🔧 Config Sınıfını Kullanma

### Temel Kullanım

```php
<?php

require_once __DIR__ . '/config/config.php';

use App\Config\Config;

// Config instance'ı al
$config = Config::getInstance();

// Environment değerlerini oku
$dbHost = $config->get('database.host');
$s3Bucket = $config->get('aws.s3_bucket');
$jwtSecret = $config->get('jwt.secret');
$isProduction = $config->isProduction();

// Default değer ile oku
$maxSize = $config->get('upload.max_file_size', 524288000);
```

### Environment Detection

```php
$config = Config::getInstance();

if ($config->isProduction()) {
    // Production-only kod
    error_reporting(0);
    ini_set('display_errors', 0);
}

if ($config->isDevelopment()) {
    // Development-only kod
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

if ($config->isDebug()) {
    // Debug mode aktif
    var_dump($config->all());
}
```

### Configuration Validation

Application bootstrap'inde config validation yapın:

```php
$config = Config::getInstance();
$errors = $config->validate();

if (!empty($errors)) {
    foreach ($errors as $error) {
        error_log($error);
    }
    die("Configuration errors detected. Check logs.");
}
```

## 🗄️ Database Kullanımı

```php
<?php

use App\Config\Database;

// Database instance'ı al
$db = Database::getInstance();
$conn = $db->getConnection();

// Query çalıştır
$stmt = $conn->prepare("SELECT * FROM users WHERE email = :email");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

// Transaction kullanımı
try {
    $db->beginTransaction();
    
    // İşlemler...
    $stmt1 = $conn->prepare("INSERT INTO videos ...");
    $stmt1->execute([...]);
    
    $stmt2 = $conn->prepare("UPDATE users ...");
    $stmt2->execute([...]);
    
    $db->commit();
} catch (Exception $e) {
    $db->rollback();
    throw $e;
}
```

## 🌐 CORS Configuration

`cors.php` otomatik olarak include edilmelidir (genellikle `index.php`'de):

```php
<?php
// backend/index.php

require_once __DIR__ . '/config/cors.php';

// CORS headers otomatik olarak set edildi
// OPTIONS requests otomatik olarak handle edildi

// Rest of your code...
```

### Environment Variables ile CORS Ayarı

`.env` dosyasında:

```env
# Development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Production
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com

# Tüm domainlere izin ver (NOT RECOMMENDED)
CORS_ALLOWED_ORIGINS=*
```

## 📝 Environment Variables Checklist

### Required (Production)

- ✅ `DB_HOST` - PostgreSQL sunucu adresi
- ✅ `DB_PASSWORD` - Güçlü database şifresi
- ✅ `JWT_SECRET` - En az 32 karakter
- ✅ `JWT_REFRESH_SECRET` - En az 32 karakter
- ✅ `AWS_ACCESS_KEY_ID` - AWS IAM kullanıcı key
- ✅ `AWS_SECRET_ACCESS_KEY` - AWS IAM kullanıcı secret
- ✅ `AWS_S3_BUCKET` - S3 bucket adı
- ✅ `CORS_ALLOWED_ORIGINS` - İzin verilen domain'ler

### Optional (Defaults Provided)

- `DB_PORT` (default: 5432)
- `DB_NAME` (default: aishortfilm)
- `DB_USER` (default: postgres)
- `DB_SSLMODE` (default: prefer)
- `AWS_REGION` (default: us-east-1)
- `JWT_EXPIRY` (default: 3600)
- `JWT_REFRESH_EXPIRY` (default: 604800)
- `MAX_FILE_SIZE` (default: 524288000)
- `RATE_LIMIT_RPM` (default: 100)

## 🔒 Security Best Practices

### 1. Environment Variables

```bash
# .env dosyasını güvenli izinlerle sakla
chmod 600 backend/.env

# Git'e commit etme
echo "backend/.env" >> .gitignore
```

### 2. JWT Secrets

```bash
# Güçlü random secret'lar oluştur
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

### 3. Database Credentials

```bash
# Güçlü şifre kullan
DB_PASSWORD=$(openssl rand -base64 24)

# PostgreSQL'i sadece localhost'tan erişilebilir yap
# /etc/postgresql/14/main/pg_hba.conf:
# host    all    all    127.0.0.1/32    md5
```

### 4. CORS Configuration

```env
# Wildcard kullanma (production'da)
# KÖTÜ: CORS_ALLOWED_ORIGINS=*

# Specific domainleri listele
# İYİ: CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 📊 Config Hierarchy

```
1. Environment Variables (.env file)
   ↓
2. Config Class (config/config.php)
   ↓
3. Application Code
```

Environment variables her zaman önceliklidir. Config sınıfı sadece default değerler sağlar.

## 🧪 Testing Configuration

### Development Environment

```bash
# .env dosyasını kopyala
cp backend/env.example.ec2 backend/.env

# Test değerleri ile doldur
nano backend/.env

# Config'i test et
php -r "
require 'backend/config/config.php';
\$config = App\\Config\\Config::getInstance();
var_dump(\$config->all());
"
```

### Production Validation

```bash
# Production sunucuda config'i validate et
cd /var/www/aishortfilm
php -r "
require 'backend/config/config.php';
\$config = App\\Config\\Config::getInstance();
\$errors = \$config->validate();
if (empty(\$errors)) {
    echo 'Config OK\n';
} else {
    foreach (\$errors as \$error) {
        echo \$error . \"\n\";
    }
}
"
```

## 🔄 Runtime Config Updates

Config değerleri application runtime'da değiştirilemez. Environment variables değiştirilirse, PHP-FPM restart gerekir:

```bash
# .env dosyasını güncelle
sudo nano /var/www/aishortfilm/backend/.env

# PHP-FPM restart et
sudo systemctl restart php8.1-fpm
```

## 📚 Advanced Usage

### Custom Config Values

Config sınıfını extend edebilirsiniz:

```php
namespace App\Config;

class CustomConfig extends Config {
    public function getEmailConfig(): array {
        return [
            'host' => $this->get('smtp.host'),
            'port' => $this->get('smtp.port'),
            'user' => $this->get('smtp.user'),
            'password' => $this->get('smtp.password'),
        ];
    }
}
```

### Caching Config

Production'da config'i cache'lemek için:

```php
// cache-config.php
$config = Config::getInstance();
file_put_contents(
    '/tmp/config.cache',
    serialize($config->all())
);

// Load from cache
$config = unserialize(file_get_contents('/tmp/config.cache'));
```

## 🆘 Troubleshooting

### Config Not Loading

```bash
# Environment variables yüklü mü kontrol et
php -r "var_dump(getenv('DB_HOST'));"

# .env dosyası okunuyor mu?
php -r "
var_dump(is_readable('backend/.env'));
var_dump(file_get_contents('backend/.env'));
"
```

### CORS Errors

```bash
# CORS ayarlarını kontrol et
curl -I -X OPTIONS http://localhost/api/videos \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"

# Response'da şunları kontrol edin:
# - Access-Control-Allow-Origin
# - Access-Control-Allow-Methods
# - Access-Control-Allow-Headers
```

### Database Connection Failed

```bash
# Config'i kontrol et
php -r "
require 'backend/config/database.php';
try {
    \$db = App\\Config\\Database::getInstance();
    echo 'Connection OK\n';
} catch (Exception \$e) {
    echo 'Error: ' . \$e->getMessage() . \"\n\";
}
"
```

## 📖 Additional Resources

- [EC2 Setup Guide](EC2-SETUP.md)
- [S3 Setup Guide](S3-SETUP.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)
- [API Documentation](API.md)

