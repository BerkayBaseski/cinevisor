# 🚀 Deployment Rehberi

## Üretim Ortamı Hazırlığı

### Güvenlik Kontrol Listesi

- [ ] `.env` dosyasında production değerler kullanın
- [ ] JWT secret'ı güçlü bir değere değiştirin (min 32 karakter)
- [ ] Database şifrelerini güçlendirin
- [ ] AWS IAM kullanıcı izinlerini minimal tutun
- [ ] HTTPS/SSL sertifikası yapılandırın
- [ ] CORS ayarlarını production domain'e göre ayarlayın
- [ ] Rate limiting değerlerini optimize edin
- [ ] Error reporting'i production mode'a alın

## Backend Deployment

### Seçenek 1: DigitalOcean Droplet

#### 1. Sunucu Kurulumu
```bash
# Ubuntu 22.04 LTS droplet oluşturun (min 2GB RAM)
ssh root@your-server-ip

# Güncellemeleri yapın
apt update && apt upgrade -y

# PHP ve extensions
apt install -y php8.1 php8.1-fpm php8.1-pgsql php8.1-mbstring \
  php8.1-xml php8.1-curl php8.1-zip composer

# Nginx
apt install -y nginx

# PostgreSQL
apt install -y postgresql postgresql-contrib
```

#### 2. Database Kurulumu
```bash
sudo -u postgres psql

CREATE DATABASE aishortfilm;
CREATE USER aishortfilm_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE aishortfilm TO aishortfilm_user;
\q

# Schema yükle
psql -U aishortfilm_user -d aishortfilm -f schema.sql
```

#### 3. Proje Kurulumu
```bash
cd /var/www
git clone your-repo aishortfilm
cd aishortfilm/backend

composer install --no-dev --optimize-autoloader

# Environment dosyası
cp .env.example .env
nano .env  # Production değerleri girin

# İzinler
chown -R www-data:www-data /var/www/aishortfilm
chmod -R 755 /var/www/aishortfilm
chmod 600 .env
```

#### 4. Nginx Yapılandırması
```bash
nano /etc/nginx/sites-available/aishortfilm-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/aishortfilm/backend;
    
    index index.php;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/aishortfilm-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 5. SSL Kurulumu (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

### Seçenek 2: AWS ECS/Fargate

#### Dockerfile
```dockerfile
FROM php:8.1-fpm

RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/ .
RUN composer install --no-dev --optimize-autoloader

EXPOSE 9000
CMD ["php-fpm"]
```

## Frontend Deployment

### Seçenek 1: Vercel

```bash
cd frontend
npm install -g vercel

# İlk deployment
vercel

# Production
vercel --prod
```

`vercel.json`:
```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Seçenek 2: Netlify

```bash
cd frontend
npm install -g netlify-cli

netlify init
netlify deploy --prod
```

`netlify.toml`:
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Seçenek 3: AWS S3 + CloudFront

```bash
# S3 bucket oluştur ve upload et
aws s3 mb s3://aishortfilm-frontend
aws s3 sync frontend/ s3://aishortfilm-frontend --acl public-read

# CloudFront distribution oluştur
aws cloudfront create-distribution \
  --origin-domain-name aishortfilm-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

## Database Yedekleme

### Otomatik Yedekleme Script

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/aishortfilm"
DB_NAME="aishortfilm"
DB_USER="aishortfilm_user"

mkdir -p $BACKUP_DIR

# Backup
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# S3'e yükle
aws s3 cp $BACKUP_DIR/backup_$DATE.sql s3://aishortfilm-backups/

# 7 günden eski backupları sil
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

```bash
# Executable yap
chmod +x /usr/local/bin/backup-db.sh

# Crontab ekle (her gün 3:00'te)
crontab -e
0 3 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1
```

## Monitoring & Logging

### CloudWatch (AWS)

```bash
# CloudWatch Agent kurulum
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb
```

### Application Logging

```php
// backend/config/logger.php
function logError($message, $context = []) {
    $log = [
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => $message,
        'context' => $context
    ];
    error_log(json_encode($log), 3, '/var/log/aishortfilm/app.log');
}
```

## Performance Optimization

### PHP-FPM Tuning

```bash
nano /etc/php/8.1/fpm/pool.d/www.conf
```

```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500
```

### Database Connection Pooling

```sql
-- PostgreSQL config
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

### CDN Configuration

**CloudFront:**
- Origin: S3 bucket (frontend) + API domain
- Cache TTL: 1 gün (statik), 0 (API)
- Gzip compression: Aktif
- HTTP/2: Aktif

## Rollback Stratejisi

```bash
# Git üzerinden önceki versiyona dön
cd /var/www/aishortfilm
git fetch --all
git checkout tags/v1.0.0  # Stabil versiyona dön

# Database restore
psql -U aishortfilm_user aishortfilm < backup_20240101_030000.sql

# Services restart
systemctl restart php8.1-fpm
systemctl restart nginx
```

## Health Check

```bash
# API health check
curl https://api.yourdomain.com/api/health

# Database check
psql -U aishortfilm_user -d aishortfilm -c "SELECT 1;"

# Disk usage
df -h

# Memory usage
free -m
```

## Tahmini Maliyetler (Aylık)

### Küçük Ölçek (100 kullanıcı)
- **DigitalOcean Droplet** (2GB): $12
- **PostgreSQL** (managed): $15
- **AWS S3** (100GB): $3
- **CloudFront** (1TB transfer): $85
- **Toplam**: ~$115/ay

### Orta Ölçek (1000 kullanıcı)
- **DigitalOcean Droplet** (4GB): $24
- **PostgreSQL** (managed): $50
- **AWS S3** (500GB): $12
- **CloudFront** (5TB transfer): $425
- **Toplam**: ~$511/ay

## Support

Deployment sorunları için:
- GitHub Issues
- Discord: [community link]
- Email: devops@aishortfilm.com

