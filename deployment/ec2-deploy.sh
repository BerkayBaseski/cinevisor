#!/bin/bash

# AI Short Film Platform - EC2 Deployment Script
# Bu script Ubuntu 22.04 LTS için hazırlanmıştır

set -e  # Hata durumunda durur

echo "=========================================="
echo "AI Film Platform - EC2 Deployment"
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonksiyonlar
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Root kontrolü
if [ "$EUID" -ne 0 ]; then 
    print_error "Bu script root olarak çalıştırılmalıdır (sudo ile)"
    exit 1
fi

print_info "Sistem güncelleniyor..."
apt update && apt upgrade -y
print_success "Sistem güncellendi"

# 1. PHP ve gerekli extensionlar
print_info "PHP 8.1 ve extensionlar yükleniyor..."
apt install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt update

apt install -y \
    php8.1 \
    php8.1-fpm \
    php8.1-pgsql \
    php8.1-mbstring \
    php8.1-xml \
    php8.1-curl \
    php8.1-zip \
    php8.1-gd \
    php8.1-bcmath

print_success "PHP 8.1 yüklendi"

# 2. Composer
print_info "Composer yükleniyor..."
if [ ! -f /usr/local/bin/composer ]; then
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
    print_success "Composer yüklendi"
else
    print_info "Composer zaten yüklü"
fi

# 3. Nginx
print_info "Nginx yükleniyor..."
apt install -y nginx
systemctl enable nginx
print_success "Nginx yüklendi"

# 4. PostgreSQL Client (Eğer remote PostgreSQL kullanılacaksa)
print_info "PostgreSQL client yükleniyor..."
apt install -y postgresql-client
print_success "PostgreSQL client yüklendi"

# 5. Git
print_info "Git yükleniyor..."
apt install -y git
print_success "Git yüklendi"

# 6. Certbot (SSL için)
print_info "Certbot yükleniyor..."
apt install -y certbot python3-certbot-nginx
print_success "Certbot yüklendi"

# 7. Proje dizini oluşturma
PROJECT_DIR="/var/www/aishortfilm"
print_info "Proje dizini oluşturuluyor: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p $PROJECT_DIR
    print_success "Proje dizini oluşturuldu"
else
    print_info "Proje dizini zaten mevcut"
fi

# 8. Gerekli dizinleri oluştur
mkdir -p /var/log/aishortfilm
mkdir -p /var/backups/aishortfilm

print_success "Log ve backup dizinleri oluşturuldu"

# 9. PHP-FPM yapılandırması
print_info "PHP-FPM yapılandırılıyor..."
cat > /etc/php/8.1/fpm/pool.d/aishortfilm.conf << 'EOF'
[aishortfilm]
user = www-data
group = www-data
listen = /run/php/php8.1-fpm-aishortfilm.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500
pm.process_idle_timeout = 10s

php_admin_value[error_log] = /var/log/aishortfilm/php-error.log
php_admin_flag[log_errors] = on
php_admin_value[memory_limit] = 256M
php_admin_value[upload_max_filesize] = 2048M
php_admin_value[post_max_size] = 2048M
php_admin_value[max_execution_time] = 300
EOF

systemctl restart php8.1-fpm
print_success "PHP-FPM yapılandırıldı"

# 10. Izinler
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

print_success "İzinler ayarlandı"

echo ""
echo "=========================================="
print_success "Kurulum tamamlandı!"
echo "=========================================="
echo ""
print_info "Sonraki adımlar:"
echo "  1. Projeyi $PROJECT_DIR dizinine klonlayın veya upload edin"
echo "  2. Backend dizininde 'composer install --no-dev' çalıştırın"
echo "  3. .env dosyasını yapılandırın"
echo "  4. Nginx konfigürasyonunu ayarlayın (nginx-config.sh'yi çalıştırın)"
echo "  5. SSL sertifikası için certbot çalıştırın"
echo ""

