# 🚀 EC2 Deployment Rehberi

AI Film Platform'u Amazon EC2'ye deploy etmek için adım adım rehber.

## 📋 Gereksinimler

### AWS Tarafı
- ✅ EC2 Instance (Ubuntu 22.04 LTS, t3.medium veya üzeri)
- ✅ Elastic IP (public IP için)
- ✅ Security Group (HTTP/HTTPS/SSH portları açık)
- ✅ PostgreSQL EC2 instance veya RDS
- ✅ S3 Bucket (video storage)
- ✅ Domain adı (Route 53 veya başka registrar)

### Lokal Tarafı
- Git repository (GitHub, GitLab, Bitbucket)
- SSH key pair
- Domain DNS kayıtları

## 🔧 Kurulum Adımları

### 1. EC2 Instance Oluşturma

```bash
# AWS Console'dan:
# - AMI: Ubuntu Server 22.04 LTS
# - Instance Type: t3.medium (2 vCPU, 4 GB RAM)
# - Storage: 30 GB gp3
# - Security Group: 
#   * SSH (22) - Your IP
#   * HTTP (80) - 0.0.0.0/0
#   * HTTPS (443) - 0.0.0.0/0
```

### 2. SSH ile Bağlanma

```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### 3. Ana Deployment Script

```bash
# Root olarak çalıştır
sudo su

# Deployment dosyalarını upload et veya wget ile indir
git clone https://github.com/your-repo/aishortfilm.git /tmp/aishortfilm
cd /tmp/aishortfilm/deployment

# Executable yap
chmod +x *.sh

# 1. Sistem kurulumu (PHP, Nginx, Composer, vb.)
./ec2-deploy.sh
```

**Bu script yükler:**
- PHP 8.1 + extensions
- Nginx web server
- Composer
- PostgreSQL client
- Certbot (SSL için)
- Git

### 4. Proje Kurulumu

```bash
# Proje dosyalarını kurulum
./setup-project.sh
```

**Sorular:**
- Git repository URL (opsiyonel)
- Database bağlantısı test edilsin mi?

**Bu script yapar:**
- Git clone veya pull
- Composer dependencies yükleme
- .env dosyası oluşturma
- İzinleri ayarlama
- Log dosyaları oluşturma

### 5. .env Dosyası Konfigürasyonu

```bash
nano /var/www/aishortfilm/backend/.env
```

**Önemli değişkenler:**

```env
# Database (EC2 PostgreSQL)
DB_HOST=your-postgres-ec2-private-ip
DB_PORT=5432
DB_NAME=aishortfilm
DB_USER=aishortfilm_user
DB_PASSWORD=your_strong_password
DB_SSLMODE=require

# JWT
JWT_SECRET=your_random_32_char_string_here_very_strong

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=aishortfilm-videos

# Application
APP_ENV=production
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# CloudFront (opsiyonel)
USE_CLOUDFRONT=true
S3_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
```

### 6. Database Schema Yükleme

```bash
# PostgreSQL'e bağlan
psql -h your-postgres-ec2-ip -U aishortfilm_user -d aishortfilm -f /var/www/aishortfilm/database/schema.sql

# Seed data (opsiyonel)
psql -h your-postgres-ec2-ip -U aishortfilm_user -d aishortfilm -f /var/www/aishortfilm/database/seed.sql
```

### 7. Nginx Konfigürasyonu

```bash
./nginx-config.sh
```

**Sorular:**
- API domain adı (örn: api.yourdomain.com)
- SSL kullanılacak mı? (y/n)

**Bu script yapar:**
- Nginx site config oluşturma
- Rate limiting ayarlama
- SSL hazırlığı
- Site aktifleştirme

### 8. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot ile SSL sertifikası al
certbot --nginx -d api.yourdomain.com

# Otomatik renewal test
certbot renew --dry-run
```

### 9. Monitoring & Backup Kurulumu

```bash
./monitoring-setup.sh
```

**Bu script yapar:**
- Log rotation (14 gün)
- Health check cron (her 5 dk)
- Backup cron (her gün 02:00)
- Systemd monitoring service

### 10. DNS Konfigürasyonu

**Route 53'te (veya domain registrar):**

```
A Record:
  Name: api.yourdomain.com
  Type: A
  Value: your-ec2-elastic-ip
  TTL: 300
```

### 11. Test

```bash
# Health check
curl https://api.yourdomain.com/api/health

# Response:
# {"success":true,"data":{"status":"healthy","timestamp":1234567890}}
```

## 🔒 Güvenlik Kontrol Listesi

- [ ] SSH key-only authentication (password disable)
- [ ] Firewall (UFW) aktif
- [ ] SSL/TLS sertifikası kurulu
- [ ] .env dosyası permissions (600)
- [ ] PostgreSQL SSL bağlantısı
- [ ] Rate limiting aktif
- [ ] AWS IAM minimal permissions
- [ ] S3 bucket private
- [ ] Security headers (Nginx)
- [ ] PHP expose_php = Off

### Güvenlik Sıkılaştırma

```bash
# 1. UFW Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 2. SSH hardening
nano /etc/ssh/sshd_config
# PasswordAuthentication no
# PermitRootLogin no
systemctl restart sshd

# 3. Fail2ban
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# 4. Automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Monitoring

### Log Dosyaları

```bash
# Nginx access log
tail -f /var/log/aishortfilm/nginx-access.log

# Nginx error log
tail -f /var/log/aishortfilm/nginx-error.log

# PHP error log
tail -f /var/log/aishortfilm/php-error.log

# Health check log
tail -f /var/log/aishortfilm/health-check.log
```

### Performans Monitoring

```bash
# Nginx status
systemctl status nginx

# PHP-FPM status
systemctl status php8.1-fpm

# Disk usage
df -h

# Memory usage
free -m

# CPU usage
top

# Active connections
ss -tuln
```

## 🔄 Güncelleme (Update)

```bash
# Proje klasörüne git
cd /var/www/aishortfilm

# Git pull
git pull origin main

# Composer update
cd backend
composer install --no-dev --optimize-autoloader

# Services restart
systemctl restart php8.1-fpm
systemctl reload nginx
```

## 🔧 Troubleshooting

### 502 Bad Gateway

```bash
# PHP-FPM loglarını kontrol et
tail -f /var/log/aishortfilm/php-error.log

# PHP-FPM restart
systemctl restart php8.1-fpm

# Socket kontrolü
ls -la /run/php/php8.1-fpm-aishortfilm.sock
```

### Database Connection Failed

```bash
# .env kontrolü
cat /var/www/aishortfilm/backend/.env | grep DB_

# PostgreSQL bağlantı test
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Security group kontrolü (5432 port açık mı?)
```

### SSL Certificate Error

```bash
# Certbot renewal
certbot renew

# Certificate kontrol
certbot certificates

# Manuel renewal
certbot --nginx -d api.yourdomain.com
```

### Slow Performance

```bash
# PHP-FPM process sayısını artır
nano /etc/php/8.1/fpm/pool.d/aishortfilm.conf
# pm.max_children = 100

systemctl restart php8.1-fpm

# Nginx worker_connections artır
nano /etc/nginx/nginx.conf
# worker_connections 2048;

systemctl reload nginx
```

## 💾 Backup & Restore

### Manuel Backup

```bash
# Backup script çalıştır
/usr/local/bin/aishortfilm-backup.sh
```

### Restore

```bash
# Database restore
gunzip < /var/backups/aishortfilm/db_backup_20240101_020000.sql.gz | psql -h $DB_HOST -U $DB_USER $DB_NAME

# .env restore
cp /var/backups/aishortfilm/env_backup_20240101_020000 /var/www/aishortfilm/backend/.env
```

## 📈 Scaling

### Horizontal Scaling (Multiple Instances)

1. Load Balancer (ALB) oluştur
2. Auto Scaling Group kur
3. Database: RDS Multi-AZ
4. Session: Redis/ElastiCache
5. Static files: S3 + CloudFront

### Vertical Scaling

```bash
# EC2 instance type upgrade
# t3.medium → t3.large → t3.xlarge
```

## 💰 Maliyet Tahmini

**Tek EC2 Instance:**
- EC2 t3.medium: $30/ay
- Elastic IP: $3.60/ay
- EBS 30GB: $3/ay
- **Total: ~$37/ay**

**+ Database & Storage:**
- PostgreSQL EC2 (t3.medium): $30/ay
- S3 (100GB): $2.30/ay
- CloudFront (500GB): $42/ay
- **Total: ~$111/ay**

## 🔗 Useful Commands

```bash
# Nginx reload (config değişikliği sonrası)
nginx -t && systemctl reload nginx

# PHP-FPM restart
systemctl restart php8.1-fpm

# Check PHP version
php -v

# Check Composer version
composer -V

# View cron jobs
crontab -l

# Database connection test
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"

# S3 connection test
aws s3 ls s3://aishortfilm-videos

# API test
curl -I https://api.yourdomain.com/api/health
```

## 📞 Support

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. GitHub Issues açın
3. Dokümantasyonu gözden geçirin

---

**Not:** Bu rehber production-ready bir deployment için hazırlanmıştır. Tüm adımları dikkatlice takip edin ve güvenlik ayarlarını mutlaka yapın.

