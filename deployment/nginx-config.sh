#!/bin/bash

# Nginx Configuration Script for AI Film Platform

set -e

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Domain adını sor
echo "=========================================="
echo "Nginx Konfigürasyon"
echo "=========================================="
echo ""
read -p "API domain adını girin (örn: api.yourdomain.com): " API_DOMAIN
read -p "SSL kullanılacak mı? (y/n): " USE_SSL

# Nginx config dosyası oluştur
print_info "Nginx konfigürasyonu oluşturuluyor..."

if [ "$USE_SSL" = "y" ] || [ "$USE_SSL" = "Y" ]; then
    # SSL ile config
    cat > /etc/nginx/sites-available/aishortfilm << EOF
# HTTP - HTTPS'e yönlendir
server {
    listen 80;
    listen [::]:80;
    server_name $API_DOMAIN;
    
    # Let's Encrypt validation için
    location /.well-known/acme-challenge/ {
        root /var/www/aishortfilm;
    }
    
    # Diğer tüm istekleri HTTPS'e yönlendir
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $API_DOMAIN;
    
    root /var/www/aishortfilm/backend;
    index index.php;
    
    # SSL Sertifikaları (Let's Encrypt tarafından oluşturulacak)
    ssl_certificate /etc/letsencrypt/live/$API_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$API_DOMAIN/privkey.pem;
    
    # SSL Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;
    
    # Client body size
    client_max_body_size 2048M;
    client_body_timeout 300s;
    
    # Logging
    access_log /var/log/aishortfilm/nginx-access.log;
    error_log /var/log/aishortfilm/nginx-error.log;
    
    # API Routes
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm-aishortfilm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
        
        fastcgi_read_timeout 300s;
        fastcgi_send_timeout 300s;
        fastcgi_connect_timeout 300s;
        
        fastcgi_buffer_size 128k;
        fastcgi_buffers 256 16k;
        fastcgi_busy_buffers_size 256k;
        fastcgi_temp_file_write_size 256k;
    }
    
    # Gizli dosyaları engelle
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # .env dosyasını engelle
    location ~ /\.env {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Composer dosyalarını engelle
    location ~ /(composer\.json|composer\.lock) {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF
else
    # SSL olmadan config (sadece geliştirme için)
    cat > /etc/nginx/sites-available/aishortfilm << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $API_DOMAIN;
    
    root /var/www/aishortfilm/backend;
    index index.php;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client body size
    client_max_body_size 2048M;
    client_body_timeout 300s;
    
    # Logging
    access_log /var/log/aishortfilm/nginx-access.log;
    error_log /var/log/aishortfilm/nginx-error.log;
    
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm-aishortfilm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
        
        fastcgi_read_timeout 300s;
    }
    
    location ~ /\. {
        deny all;
    }
}
EOF
fi

# Site'ı aktifleştir
ln -sf /etc/nginx/sites-available/aishortfilm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx test
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    print_success "Nginx konfigürasyonu tamamlandı ve yüklendi"
    
    if [ "$USE_SSL" = "y" ] || [ "$USE_SSL" = "Y" ]; then
        echo ""
        print_info "SSL sertifikası almak için şu komutu çalıştırın:"
        echo "  sudo certbot --nginx -d $API_DOMAIN"
    fi
else
    echo "Nginx konfigürasyonunda hata var!"
    exit 1
fi

