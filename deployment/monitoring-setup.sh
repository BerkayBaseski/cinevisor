#!/bin/bash

# Monitoring and Backup Setup for AI Film Platform

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

echo "=========================================="
echo "Monitoring & Backup Kurulumu"
echo "=========================================="
echo ""

# 1. Log rotation
print_info "Logrotate yapılandırılıyor..."

cat > /etc/logrotate.d/aishortfilm << 'EOF'
/var/log/aishortfilm/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1
        systemctl reload php8.1-fpm > /dev/null 2>&1
    endscript
}
EOF

print_success "Logrotate yapılandırıldı"

# 2. Health check script
print_info "Health check script oluşturuluyor..."

cat > /usr/local/bin/aishortfilm-health-check.sh << 'EOF'
#!/bin/bash

# Health Check Script
API_URL="${API_URL:-http://localhost/api/health}"
LOG_FILE="/var/log/aishortfilm/health-check.log"

# Health check
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")

if [ "$response" -eq 200 ]; then
    echo "[$(date)] OK - API is healthy (HTTP $response)" >> "$LOG_FILE"
else
    echo "[$(date)] ERROR - API health check failed (HTTP $response)" >> "$LOG_FILE"
    
    # Nginx ve PHP-FPM'i restart et
    systemctl restart php8.1-fpm
    systemctl reload nginx
    
    echo "[$(date)] Services restarted" >> "$LOG_FILE"
fi
EOF

chmod +x /usr/local/bin/aishortfilm-health-check.sh
print_success "Health check script oluşturuldu"

# 3. Backup script
print_info "Backup script oluşturuluyor..."

cat > /usr/local/bin/aishortfilm-backup.sh << 'EOF'
#!/bin/bash

# Backup Script for AI Film Platform
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/aishortfilm"
DB_NAME="${DB_NAME:-aishortfilm}"
DB_USER="${DB_USER:-aishortfilm_user}"
DB_HOST="${DB_HOST:-localhost}"
S3_BUCKET="${S3_BUCKET:-}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# 1. Database backup
if [ ! -z "$PGPASSWORD" ]; then
    export PGPASSWORD="$PGPASSWORD"
    pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"
    echo "[$(date)] Database backup created: db_backup_$DATE.sql.gz"
fi

# 2. .env backup
cp /var/www/aishortfilm/backend/.env "$BACKUP_DIR/env_backup_$DATE"
echo "[$(date)] .env backup created"

# 3. Upload to S3 (if configured)
if [ ! -z "$S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_DIR/db_backup_$DATE.sql.gz" "s3://$S3_BUCKET/backups/database/"
    echo "[$(date)] Backup uploaded to S3"
fi

# 4. Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "env_backup_*" -mtime +7 -delete
echo "[$(date)] Old backups cleaned"

echo "[$(date)] Backup completed successfully"
EOF

chmod +x /usr/local/bin/aishortfilm-backup.sh
print_success "Backup script oluşturuldu"

# 4. Cron jobs
print_info "Cron jobs ekleniyor..."

# Health check her 5 dakikada bir
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/aishortfilm-health-check.sh") | crontab -

# Backup her gün 02:00'de
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/aishortfilm-backup.sh") | crontab -

print_success "Cron jobs eklendi"

# 5. Systemd service for monitoring (optional)
print_info "Systemd service oluşturuluyor..."

cat > /etc/systemd/system/aishortfilm-monitor.service << 'EOF'
[Unit]
Description=AI Film Platform Monitoring Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/aishortfilm-health-check.sh
Restart=always
RestartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
# systemctl enable aishortfilm-monitor.service
# systemctl start aishortfilm-monitor.service

print_success "Systemd service oluşturuldu (henüz aktif değil)"

echo ""
echo "=========================================="
print_success "Monitoring kurulumu tamamlandı!"
echo "=========================================="
echo ""
print_info "Yapılandırılan işlemler:"
echo "  ✓ Logrotate (14 günlük log tutma)"
echo "  ✓ Health check (her 5 dakikada)"
echo "  ✓ Otomatik backup (her gün 02:00)"
echo "  ✓ Systemd monitoring service"
echo ""
print_info "Cron jobs kontrol:"
echo "  crontab -l"
echo ""
print_info "Log dosyaları:"
echo "  /var/log/aishortfilm/health-check.log"
echo "  /var/log/aishortfilm/nginx-access.log"
echo "  /var/log/aishortfilm/nginx-error.log"
echo "  /var/log/aishortfilm/php-error.log"
echo ""

