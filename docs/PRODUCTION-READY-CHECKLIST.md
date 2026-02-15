# Production Ready Checklist 🚀

EC2'de production deployment öncesi tamamlanması gereken tüm adımlar.

## ✅ 1. Backend Configuration

### Config Files

- [x] **`backend/config/config.php`** - Merkezi configuration sınıfı oluşturuldu
  - Environment variables management
  - Config validation
  - Production/development detection
  
- [x] **`backend/config/database.php`** - EC2 PostgreSQL için optimize edildi
  - SSL support
  - Connection pooling
  - Timeout settings
  - UTC timezone
  
- [x] **`backend/config/cors.php`** - Production CORS güvenliği eklendi
  - Multiple origin support
  - Security headers
  - Preflight handling
  - Environment-based configuration

### Environment Variables

- [ ] `.env` dosyası oluşturuldu (`backend/.env`)
- [ ] `DB_HOST` - PostgreSQL sunucu adresi
- [ ] `DB_PASSWORD` - Güçlü şifre (min 16 karakter)
- [ ] `JWT_SECRET` - Random string (min 32 karakter)
- [ ] `JWT_REFRESH_SECRET` - Farklı random string (min 32 karakter)
- [ ] `AWS_ACCESS_KEY_ID` - AWS IAM key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS IAM secret
- [ ] `AWS_S3_BUCKET` - S3 bucket adı
- [ ] `AWS_CLOUDFRONT_URL` - CloudFront domain (opsiyonel)
- [ ] `CORS_ALLOWED_ORIGINS` - Frontend domain(ler)
- [ ] `APP_ENV=production` - Production mode
- [ ] `APP_DEBUG=false` - Debug kapalı

### Güvenlik

```bash
# .env dosya izinleri
chmod 600 /var/www/aishortfilm/backend/.env

# Ownership
chown www-data:www-data /var/www/aishortfilm/backend/.env

# Git'e commit edilmemeli
# .gitignore'da backend/.env var mı kontrol et
```

## ✅ 2. Frontend Configuration

### Config File

- [x] **`frontend/js/config.js`** - Oluşturuldu
  - API URL auto-detection
  - CloudFront CDN support
  - S3 fallback
  - Video/thumbnail URL helpers

### HTML Pages

- [x] Tüm HTML sayfalarına `config.js` eklendi
- [x] Font Awesome CDN linkleri eklendi
- [x] Emoji'ler icon'lara çevrildi

### Deployment

- [ ] Frontend domain belirlendi
- [ ] `frontend/js/config.js` güncellendi:
  - `apiBaseUrl` - Backend API URL
  - `cdnUrl` - CloudFront URL (opsiyonel)
  - `s3Url` - S3 bucket URL (opsiyonel)

## ✅ 3. AWS Resources

### EC2 Instance

- [ ] EC2 instance oluşturuldu
  - Ubuntu 22.04 LTS
  - Minimum: t3.medium (2 vCPU, 4GB RAM)
  - Önerilen: t3.large veya daha büyük
- [ ] Elastic IP atandı
- [ ] Security Group yapılandırıldı:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 5432 (PostgreSQL - sadece internal)
- [ ] SSH key pair indirildi (.pem)

### S3 Bucket

- [ ] S3 bucket oluşturuldu
- [ ] Bucket policy yapılandırıldı (private)
- [ ] CORS configuration yüklendi
- [ ] Lifecycle rules set edildi (opsiyonel)

### CloudFront (Opsiyonel)

- [ ] CloudFront distribution oluşturuldu
- [ ] S3 bucket origin olarak eklendi
- [ ] Cache behaviors yapılandırıldı
- [ ] Custom domain eklendi (opsiyonel)

### IAM

- [ ] IAM user oluşturuldu
- [ ] S3 permissions verildi:
  - `s3:PutObject`
  - `s3:GetObject`
  - `s3:DeleteObject`
  - `s3:ListBucket`
- [ ] Access key + secret key oluşturuldu
- [ ] MFA aktive edildi (önerilir)

## ✅ 4. Database Setup

### PostgreSQL Installation

- [ ] PostgreSQL 14+ kuruldu
- [ ] Database oluşturuldu (`aishortfilm`)
- [ ] User oluşturuldu (`aishortfilm_user`)
- [ ] Güçlü şifre belirlendi
- [ ] Schema yüklendi (`database/schema.sql`)

### Security

```bash
# PostgreSQL sadece localhost'tan erişilebilir
sudo nano /etc/postgresql/14/main/pg_hba.conf
# host    all    all    127.0.0.1/32    md5

# PostgreSQL restart
sudo systemctl restart postgresql
```

### Backup

- [ ] Backup stratejisi oluşturuldu
- [ ] Cron job kuruldu (günlük backup)
- [ ] S3'e otomatik yükleme yapılandırıldı

## ✅ 5. Nginx Configuration

- [ ] Nginx kuruldu
- [ ] Site configuration oluşturuldu
- [ ] PHP-FPM upstream yapılandırıldı
- [ ] Static file serving optimizasyonu
- [ ] Gzip compression aktif
- [ ] Client max body size set edildi (500M+)

### SSL/TLS

- [ ] Let's Encrypt kuruldu
- [ ] SSL certificate oluşturuldu
- [ ] Auto-renewal aktif
- [ ] HTTPS redirect yapılandırıldı
- [ ] SSL labs test yapıldı (A+ rating)

```bash
# SSL kurulum
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## ✅ 6. PHP Configuration

- [ ] PHP 8.1+ kuruldu
- [ ] PHP-FPM yapılandırıldı
- [ ] Extensions yüklendi:
  - php-pgsql
  - php-mbstring
  - php-xml
  - php-curl
  - php-zip
- [ ] Composer kuruldu
- [ ] Dependencies yüklendi (`composer install --no-dev`)

### PHP Settings

```ini
# /etc/php/8.1/fpm/php.ini
upload_max_filesize = 500M
post_max_size = 500M
max_execution_time = 300
memory_limit = 512M
```

## ✅ 7. Monitoring & Logging

### CloudWatch Agent (Opsiyonel)

- [ ] CloudWatch agent kuruldu
- [ ] Metrics yapılandırıldı
- [ ] Log streams oluşturuldu
- [ ] Alarms set edildi

### Local Logging

- [ ] Log directory oluşturuldu (`/var/log/aishortfilm/`)
- [ ] Log rotation yapılandırıldı
- [ ] Error logs izleniyor

```bash
# Log rotation
sudo nano /etc/logrotate.d/aishortfilm

# Monitor logs
tail -f /var/log/nginx/aishortfilm_error.log
tail -f /var/log/php8.1-fpm.log
```

## ✅ 8. Deployment

### Initial Deployment

```bash
# Quick deploy script kullan
cd /tmp
git clone YOUR_REPO_URL AIShortFilm
cd AIShortFilm/deployment
chmod +x quick-deploy.sh
sudo ./quick-deploy.sh
```

### Manual Deployment

1. [ ] Projeyi klonla
2. [ ] Dependencies kur
3. [ ] .env oluştur
4. [ ] Database schema yükle
5. [ ] Nginx yapılandır
6. [ ] SSL kur
7. [ ] Services restart

### Future Updates

```bash
# Git pull ve restart
cd /var/www/aishortfilm
git pull origin main
composer install --no-dev
sudo systemctl reload php8.1-fpm
sudo systemctl reload nginx
```

## ✅ 9. Testing

### API Tests

```bash
# Health check
curl https://yourdomain.com/api/

# Register test
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'

# Login test
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Frontend Tests

- [ ] Login/Register çalışıyor
- [ ] Video upload çalışıyor
- [ ] Video playback çalışıyor
- [ ] Comments çalışıyor
- [ ] Likes çalışıyor
- [ ] Responsive design kontrol edildi

### Performance Tests

- [ ] Page load times < 3s
- [ ] API response times < 500ms
- [ ] Video streaming smooth
- [ ] No memory leaks
- [ ] Database queries optimized

## ✅ 10. Security Hardening

### Firewall

```bash
# UFW aktive et
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Fail2Ban

```bash
# Fail2ban kur
sudo apt install fail2ban -y

# SSH brute force protection
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Security Headers

- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: DENY
- [x] X-XSS-Protection: 1; mode=block
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Content-Security-Policy (customize based on needs)

### File Permissions

```bash
# Project ownership
sudo chown -R www-data:www-data /var/www/aishortfilm

# Secure permissions
sudo find /var/www/aishortfilm -type d -exec chmod 755 {} \;
sudo find /var/www/aishortfilm -type f -exec chmod 644 {} \;

# .env extra secure
sudo chmod 600 /var/www/aishortfilm/backend/.env
```

## ✅ 11. DNS Configuration

- [ ] A record: `yourdomain.com` → EC2 IP
- [ ] A record: `www.yourdomain.com` → EC2 IP
- [ ] A record: `api.yourdomain.com` → EC2 IP (opsiyonel)
- [ ] DNS propagation tamamlandı (24-48 saat)

## ✅ 12. Final Checks

### Performance

- [ ] PHP opcache aktif
- [ ] Nginx gzip compression aktif
- [ ] Database indexes oluşturuldu
- [ ] CloudFront caching yapılandırıldı

### Monitoring

- [ ] Uptime monitoring kuruldu
- [ ] Error alerts yapılandırıldı
- [ ] Disk space monitoring
- [ ] Memory/CPU monitoring

### Documentation

- [ ] API documentation güncel
- [ ] Deployment procedures dökümante edildi
- [ ] Emergency contacts listelendi
- [ ] Backup/restore procedures yazıldı

### Backup Verification

- [ ] Database backup test edildi
- [ ] S3 backup verification
- [ ] Restore procedure test edildi

## 🎉 Go Live!

Tüm checklistler tamamlandıktan sonra:

1. [ ] Final production test
2. [ ] Team'e bildirim
3. [ ] Marketing'e haber ver
4. [ ] Social media announcement
5. [ ] Monitor first 24 hours closely

## 📞 Emergency Contacts

**DevOps**: [Your phone]
**AWS Support**: [Support plan link]
**Database Admin**: [Contact]

## 📚 Resources

- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
- [CONFIG-USAGE.md](CONFIG-USAGE.md)
- [EC2-SETUP.md](EC2-SETUP.md)
- [S3-SETUP.md](S3-SETUP.md)
- [API.md](API.md)

---

**Last Updated**: November 2025
**Version**: 1.0.0
**Status**: Production Ready ✅

