# EC2 Deployment Rehberi

Bu rehber, AI Short Film platformunu Amazon EC2 üzerinde sıfırdan kurmanız için adım adım talimatlar içerir.

## 📋 Ön Gereksinimler

### 1. AWS Hesabı ve Kaynakları
- [ ] AWS hesabı oluşturulmuş
- [ ] EC2 instance oluşturulmuş (Ubuntu 22.04 LTS önerilir)
- [ ] Minimum: t3.medium (2 vCPU, 4GB RAM)
- [ ] Önerilen: t3.large veya daha büyük
- [ ] Security Group yapılandırılmış:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 5432 (PostgreSQL - sadece local)
- [ ] Elastic IP atanmış (opsiyonel ama önerilir)
- [ ] S3 Bucket oluşturulmuş
- [ ] CloudFront distribution oluşturulmuş (opsiyonel ama önerilir)
- [ ] IAM kullanıcısı ve Access Keys oluşturulmuş

### 2. Domain (Opsiyonel)
- [ ] Domain satın alınmış
- [ ] DNS kayıtları EC2 IP'sine yönlendirilmiş
- [ ] SSL sertifikası için Let's Encrypt kullanılacak

### 3. Yerel Gereksinimler
- [ ] SSH client (Windows için PuTTY veya PowerShell)
- [ ] PEM key dosyası (.pem)
- [ ] Git kurulu
- [ ] Temel Linux komut bilgisi

## 🚀 Hızlı Kurulum (Otomatik)

### Adım 1: EC2'ye Bağlanın

```bash
# Windows PowerShell
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# PuTTY kullanıyorsanız, PEM'i PPK formatına çevirin
```

### Adım 2: Projeyi Klonlayın

```bash
cd /tmp
git clone https://github.com/YOUR_USERNAME/AIShortFilm.git
cd AIShortFilm/deployment
```

### Adım 3: Hızlı Deployment Script'ini Çalıştırın

```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

Script sizden şu bilgileri isteyecek:
- Domain adı (veya IP adresi)
- PostgreSQL şifresi
- AWS S3 bucket adı
- AWS Access Key & Secret Key
- AWS region
- CloudFront URL (opsiyonel)

**Script otomatik olarak:**
1. Sistem güncellemelerini yapar
2. Nginx, PHP, PostgreSQL kurar
3. Veritabanını oluşturur ve yapılandırır
4. Projeyi deploy eder
5. SSL sertifikası kurar (domain varsa)
6. Monitoring araçlarını kurar

## 🔧 Manuel Kurulum (Adım Adım)

Otomatik kurulum yerine manuel kurulum yapmak isterseniz:

### 1. Sistem Güncellemesi ve Temel Paketler

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx postgresql postgresql-contrib php8.1-fpm php8.1-pgsql \
    php8.1-mbstring php8.1-xml php8.1-curl php8.1-zip composer git curl unzip
```

### 2. PostgreSQL Kurulumu

```bash
cd /tmp/AIShortFilm/deployment
chmod +x setup-project.sh
./setup-project.sh
```

Detaylar için: [docs/EC2-SETUP.md](EC2-SETUP.md)

### 3. S3 ve CloudFront Yapılandırması

```bash
# S3 bucket oluşturun
aws s3 mb s3://your-bucket-name --region us-east-1

# CORS yapılandırmasını yükleyin
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://s3-cors.json
```

Detaylar için: [docs/S3-SETUP.md](S3-SETUP.md)

### 4. Nginx Yapılandırması

```bash
cd /tmp/AIShortFilm/deployment
chmod +x nginx-config.sh
sudo ./nginx-config.sh yoursite.com /var/www/aishortfilm
```

### 5. Projeyi Deploy Edin

```bash
chmod +x ec2-deploy.sh
./ec2-deploy.sh
```

### 6. Frontend Yapılandırması

```bash
chmod +x frontend-config.sh
./frontend-config.sh https://api.yoursite.com https://d1234567890.cloudfront.net
```

### 7. Monitoring Kurulumu

```bash
chmod +x monitoring-setup.sh
sudo ./monitoring-setup.sh
```

## 🔐 Güvenlik Yapılandırması

### SSL Sertifikası (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yoursite.com -d www.yoursite.com
```

### Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### PostgreSQL Güvenlik

```bash
# PostgreSQL sadece localhost'tan erişilebilir olmalı
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Bu satırı bulun ve değiştirin:
# host    all             all             0.0.0.0/0               md5
# Şuna:
# host    all             all             127.0.0.1/32            md5
```

## 🔑 Environment Variables

Backend için `.env` dosyasını oluşturun:

```bash
sudo nano /var/www/aishortfilm/backend/.env
```

İçeriği `backend/env.example.ec2` dosyasından kopyalayın ve değerleri doldurun:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aishortfilm
DB_USER=aishortfilm_user
DB_PASSWORD=your_secure_password
DB_SSLMODE=disable

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_here_min_32_chars
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net

# App
APP_ENV=production
APP_DEBUG=false
ALLOWED_ORIGINS=https://yoursite.com,https://www.yoursite.com
```

## 📊 Veritabanı Kurulumu

```bash
# PostgreSQL'e bağlanın
sudo -u postgres psql

# Database oluşturun
CREATE DATABASE aishortfilm;
CREATE USER aishortfilm_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE aishortfilm TO aishortfilm_user;
\q

# Schema'yı yükleyin
cd /var/www/aishortfilm
sudo -u postgres psql -d aishortfilm -f database/schema.sql

# Test verilerini yükleyin (opsiyonel)
sudo -u postgres psql -d aishortfilm -f database/seed.sql
```

## 🧪 Test ve Doğrulama

### 1. Backend API Test

```bash
# Health check
curl http://localhost/api/

# Register test
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

### 2. Frontend Test

Browser'da açın: `http://your-ec2-ip` veya `https://yoursite.com`

### 3. Database Test

```bash
sudo -u postgres psql -d aishortfilm -c "SELECT COUNT(*) FROM users;"
```

### 4. S3 Upload Test

```bash
# Upload test
curl -X POST http://localhost/api/videos/upload/init \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.mp4",
    "filesize": 1024000,
    "content_type": "video/mp4"
  }'
```

## 🔄 Güncelleme ve Maintenance

### Kod Güncellemesi

```bash
cd /var/www/aishortfilm
sudo git pull origin main
sudo composer install --no-dev --optimize-autoloader
sudo systemctl reload php8.1-fpm
sudo systemctl reload nginx
```

### Database Backup

```bash
# Backup oluştur
sudo -u postgres pg_dump aishortfilm > backup_$(date +%Y%m%d).sql

# S3'e yükle
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### Log Kontrolü

```bash
# Nginx logs
sudo tail -f /var/log/nginx/aishortfilm_error.log

# PHP-FPM logs
sudo tail -f /var/log/php8.1-fpm.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

## 📈 Monitoring ve Performans

### CloudWatch Agent (Opsiyonel)

```bash
# CloudWatch Agent kurulumu monitoring-setup.sh ile yapılır
sudo systemctl status amazon-cloudwatch-agent

# Metrikleri görüntüle
aws cloudwatch get-metric-statistics \
  --namespace AIShortFilm \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

### Performance Tuning

#### PHP-FPM

```bash
sudo nano /etc/php/8.1/fpm/pool.d/www.conf

# Ayarları değiştirin:
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
```

#### PostgreSQL

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf

# Memory settings (4GB RAM için):
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 10MB
```

#### Nginx

```bash
sudo nano /etc/nginx/nginx.conf

# Worker processes
worker_processes auto;
worker_connections 2048;

# Caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

## 🐛 Sorun Giderme

### Problem: 502 Bad Gateway

```bash
# PHP-FPM çalışıyor mu?
sudo systemctl status php8.1-fpm

# Socket dosyası var mı?
ls -la /run/php/php8.1-fpm.sock

# Nginx hata loglarını kontrol edin
sudo tail -f /var/log/nginx/error.log
```

### Problem: Database Connection Failed

```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Bağlantı test edin
sudo -u postgres psql -d aishortfilm -c "SELECT 1;"

# .env dosyasını kontrol edin
sudo cat /var/www/aishortfilm/backend/.env | grep DB_
```

### Problem: S3 Upload Failed

```bash
# AWS credentials doğru mu?
aws s3 ls s3://your-bucket-name

# IAM permissions kontrol edin
aws iam get-user

# Backend loglarını kontrol edin
sudo tail -f /var/log/php8.1-fpm.log
```

## 📞 Destek ve Dökümantasyon

- **API Dökümantasyonu**: `docs/API.md`
- **EC2 Setup**: `docs/EC2-SETUP.md`
- **S3 Setup**: `docs/S3-SETUP.md`
- **Database Schema**: `database/README.md`

## ✅ Deployment Checklist

Son kontroller:

- [ ] Tüm environment variables ayarlandı
- [ ] Database migration tamamlandı
- [ ] S3 bucket ve CloudFront yapılandırıldı
- [ ] SSL sertifikası kuruldu
- [ ] Firewall kuralları ayarlandı
- [ ] Backup stratejisi oluşturuldu
- [ ] Monitoring kuruldu
- [ ] Domain DNS kayıtları doğru
- [ ] Frontend config.js güncellendi
- [ ] API endpoints test edildi
- [ ] Video upload/stream test edildi
- [ ] Error handling test edildi
- [ ] Log rotation ayarlandı
- [ ] Performance tuning yapıldı

## 🎉 Tebrikler!

Platformunuz artık production'da! Başarılar dileriz! 🚀

