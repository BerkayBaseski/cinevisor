#!/bin/bash

# Quick Deployment Script - Run everything in one go
# Use this for initial setup only

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo "=========================================="
echo "AI Film Platform - Quick Deployment"
echo "=========================================="
echo ""

# Root kontrolü
if [ "$EUID" -ne 0 ]; then 
    print_error "Bu script root olarak çalıştırılmalıdır (sudo ile)"
    exit 1
fi

# Onay al
print_info "Bu script tüm kurulumu otomatik yapacak."
print_info "Domain adı ve credentials hazır olmalı."
echo ""
read -p "Devam etmek istiyor musunuz? (y/n): " CONTINUE

if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
    echo "İptal edildi."
    exit 0
fi

# Bilgileri topla
echo ""
print_info "Kurulum bilgilerini girin:"
echo ""
read -p "Git Repository URL: " GIT_REPO
read -p "API Domain (örn: api.yourdomain.com): " API_DOMAIN
read -p "PostgreSQL Host: " DB_HOST
read -p "PostgreSQL User: " DB_USER
read -sp "PostgreSQL Password: " DB_PASSWORD
echo ""
read -p "AWS Access Key ID: " AWS_ACCESS_KEY
read -sp "AWS Secret Access Key: " AWS_SECRET_KEY
echo ""
read -p "S3 Bucket Name: " S3_BUCKET

echo ""
print_info "Kurulum başlıyor..."
sleep 2

# 1. Sistem kurulumu
print_info "1/7 - Sistem paketleri yükleniyor..."
./ec2-deploy.sh > /tmp/deploy-1.log 2>&1
print_success "Sistem hazır"

# 2. Proje kurulumu
print_info "2/7 - Proje dosyaları kuruluyor..."
export GIT_REPO=$GIT_REPO
./setup-project.sh > /tmp/deploy-2.log 2>&1
print_success "Proje dosyaları hazır"

# 3. .env konfigürasyonu
print_info "3/7 - Environment variables ayarlanıyor..."
cat > /var/www/aishortfilm/backend/.env << EOF
# ============================================
# EC2 PostgreSQL Database
# ============================================
DB_HOST=$DB_HOST
DB_PORT=5432
DB_NAME=aishortfilm
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSLMODE=disable

# ============================================
# JWT Authentication
# ============================================
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800
JWT_ALGORITHM=HS256

# ============================================
# AWS S3 Configuration
# ============================================
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=$S3_BUCKET

# CloudFront CDN (optional)
AWS_CLOUDFRONT_URL=

# S3 Presigned URL expiry (in seconds)
S3_PRESIGNED_EXPIRY=3600

# ============================================
# Application Configuration
# ============================================
APP_ENV=production
APP_DEBUG=false
APP_URL=https://${API_DOMAIN}

# CORS - Multiple domains separated by comma
CORS_ALLOWED_ORIGINS=https://${API_DOMAIN}

# ============================================
# Upload & Security Limits
# ============================================
MAX_FILE_SIZE=524288000
RATE_LIMIT_ENABLED=true
RATE_LIMIT_RPM=100
VIDEO_PATH=videos/
THUMBNAIL_PATH=thumbnails/

# ============================================
# Logging
# ============================================
LOG_LEVEL=error
LOG_PATH=/var/log/aishortfilm/

# ============================================
# Admin
# ============================================
ADMIN_EMAIL=admin@${API_DOMAIN}
EOF

chmod 600 /var/www/aishortfilm/backend/.env
print_success "Environment hazır"

# 4. Nginx konfigürasyonu
print_info "4/7 - Nginx yapılandırılıyor..."
export API_DOMAIN=$API_DOMAIN
export USE_SSL="n"  # İlk kurulumda SSL yok
./nginx-config.sh > /tmp/deploy-4.log 2>&1
print_success "Nginx hazır"

# 5. Database schema
print_info "5/7 - Database schema yükleniyor..."
export PGPASSWORD=$DB_PASSWORD
psql -h $DB_HOST -U $DB_USER -d aishortfilm -f /var/www/aishortfilm/database/schema.sql > /tmp/deploy-5.log 2>&1
print_success "Database hazır"

# 6. Monitoring
print_info "6/7 - Monitoring kurulumu..."
./monitoring-setup.sh > /tmp/deploy-6.log 2>&1
print_success "Monitoring hazır"

# 7. Services restart
print_info "7/7 - Services başlatılıyor..."
systemctl restart php8.1-fpm
systemctl reload nginx
print_success "Services hazır"

echo ""
echo "=========================================="
print_success "Kurulum tamamlandı!"
echo "=========================================="
echo ""
print_info "Önemli Bilgiler:"
echo "  • API URL: http://$API_DOMAIN/api/health"
echo "  • Project Dir: /var/www/aishortfilm"
echo "  • Logs: /var/log/aishortfilm/"
echo ""
print_info "SSL Kurulumu için:"
echo "  sudo certbot --nginx -d $API_DOMAIN"
echo ""
print_info "Test için:"
echo "  curl http://$API_DOMAIN/api/health"
echo ""
print_info "Frontend deployment için:"
echo "  - Vercel/Netlify'da frontend/ klasörünü deploy edin"
echo "  - API_URL değişkenini güncelleyin: https://$API_DOMAIN"
echo ""

# Log dosyalarını göster
print_info "Deployment logları /tmp/deploy-*.log dosyalarında"

