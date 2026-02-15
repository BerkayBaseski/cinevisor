#!/bin/bash

# Project Setup Script for EC2

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

PROJECT_DIR="/var/www/aishortfilm"

echo "=========================================="
echo "Proje Kurulumu"
echo "=========================================="
echo ""

# 1. Git repository klonlama
read -p "Git repository URL'i girin (boş bırakırsanız manuel upload yapacaksınız): " GIT_REPO

if [ ! -z "$GIT_REPO" ]; then
    print_info "Git repository klonlanıyor..."
    
    if [ -d "$PROJECT_DIR/.git" ]; then
        print_info "Repository zaten klonlanmış, güncelleniyor..."
        cd $PROJECT_DIR
        git pull
    else
        rm -rf $PROJECT_DIR
        git clone $GIT_REPO $PROJECT_DIR
    fi
    
    print_success "Repository klonlandı"
fi

cd $PROJECT_DIR

# 2. Backend dependencies
print_info "Backend dependencies yükleniyor..."
cd $PROJECT_DIR/backend

if [ -f "composer.json" ]; then
    composer install --no-dev --optimize-autoloader
    print_success "Composer dependencies yüklendi"
else
    print_error "composer.json bulunamadı!"
fi

# 3. .env dosyası kontrolü
if [ ! -f ".env" ]; then
    print_info ".env dosyası bulunamadı, .env.example'dan kopyalanıyor..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env dosyası oluşturuldu"
        print_info "UYARI: .env dosyasını düzenleyin!"
    elif [ -f "env.example.ec2" ]; then
        cp env.example.ec2 .env
        print_success ".env dosyası oluşturuldu (EC2 template)"
        print_info "UYARI: .env dosyasını düzenleyin!"
    else
        print_error ".env.example dosyası bulunamadı!"
    fi
else
    print_success ".env dosyası mevcut"
fi

# 4. İzinler
print_info "Dosya izinleri ayarlanıyor..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod 600 $PROJECT_DIR/backend/.env 2>/dev/null || true

print_success "İzinler ayarlandı"

# 5. Log dosyaları
print_info "Log dosyaları oluşturuluyor..."
touch /var/log/aishortfilm/php-error.log
touch /var/log/aishortfilm/nginx-access.log
touch /var/log/aishortfilm/nginx-error.log
chown -R www-data:www-data /var/log/aishortfilm
print_success "Log dosyaları oluşturuldu"

# 6. Database kontrolü
echo ""
print_info "Database bağlantısını test etmek ister misiniz? (y/n)"
read -p "> " TEST_DB

if [ "$TEST_DB" = "y" ] || [ "$TEST_DB" = "Y" ]; then
    cd $PROJECT_DIR/backend
    php -r "
        require 'vendor/autoload.php';
        \$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        \$dotenv->load();
        
        try {
            \$pdo = new PDO(
                'pgsql:host=' . \$_ENV['DB_HOST'] . ';port=' . \$_ENV['DB_PORT'] . ';dbname=' . \$_ENV['DB_NAME'],
                \$_ENV['DB_USER'],
                \$_ENV['DB_PASSWORD']
            );
            echo 'Database bağlantısı başarılı!\n';
        } catch (Exception \$e) {
            echo 'Database bağlantı hatası: ' . \$e->getMessage() . '\n';
            exit(1);
        }
    "
    
    if [ $? -eq 0 ]; then
        print_success "Database bağlantısı test edildi"
    else
        print_error "Database bağlantısı başarısız! .env dosyasını kontrol edin"
    fi
fi

echo ""
echo "=========================================="
print_success "Proje kurulumu tamamlandı!"
echo "=========================================="
echo ""
print_info "Sonraki adımlar:"
echo "  1. .env dosyasını düzenleyin: nano $PROJECT_DIR/backend/.env"
echo "  2. Database schema'yı yükleyin: psql -f database/schema.sql"
echo "  3. Nginx'i yeniden başlatın: systemctl restart nginx php8.1-fpm"
echo "  4. API test edin: curl https://your-domain.com/api/health"
echo ""

