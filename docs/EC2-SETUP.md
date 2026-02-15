# 🖥️ EC2 PostgreSQL Kurulum Rehberi

## AWS EC2 Instance Oluşturma

### 1. EC2 Instance Başlatma

```bash
# AWS Console → EC2 → Launch Instance
# AMI: Ubuntu 22.04 LTS
# Instance Type: t3.medium (2 vCPU, 4 GB RAM) - minimum
# Storage: 30 GB gp3 SSD
```

### 2. Security Group Ayarları

```
Inbound Rules:
- SSH (22) - Your IP
- PostgreSQL (5432) - Application server IP veya security group
- HTTPS (443) - Optional
```

### 3. EC2'ye Bağlanma

```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

## PostgreSQL Kurulumu

### 1. PostgreSQL Kurulumu

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib-15

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### 2. PostgreSQL Yapılandırması

```bash
# PostgreSQL'e geçiş
sudo -u postgres psql

# Database ve user oluşturma
CREATE DATABASE aishortfilm;
CREATE USER aishortfilm_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE aishortfilm TO aishortfilm_user;

# Connection limit ayarları
ALTER USER aishortfilm_user CONNECTION LIMIT 100;

\q
```

### 3. Uzaktan Erişim Yapılandırması

```bash
# postgresql.conf düzenleme
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Aşağıdaki satırları bulup değiştirin:
```conf
listen_addresses = '*'
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 4. pg_hba.conf Güvenlik Ayarları

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Ekleyin:
```conf
# Application server'ın IP'si
host    aishortfilm    aishortfilm_user    your-app-server-ip/32    md5

# Veya güvenlik grubu kullanıyorsanız subnet
host    aishortfilm    aishortfilm_user    10.0.0.0/16              md5

# SSL zorunlu yapmak için
hostssl all            all                 0.0.0.0/0                md5
```

### 5. PostgreSQL Restart

```bash
sudo systemctl restart postgresql
```

## SSL Certificate (Opsiyonel ama Önerilen)

### 1. Self-signed Certificate

```bash
# Certificate oluşturma
sudo -u postgres openssl req -new -x509 -days 365 -nodes \
  -text -out /etc/postgresql/15/main/server.crt \
  -keyout /etc/postgresql/15/main/server.key \
  -subj "/CN=aishortfilm-db"

# İzinler
sudo chmod og-rwx /etc/postgresql/15/main/server.key
```

### 2. postgresql.conf'a SSL ekle

```conf
ssl = on
ssl_cert_file = '/etc/postgresql/15/main/server.crt'
ssl_key_file = '/etc/postgresql/15/main/server.key'
```

Restart: `sudo systemctl restart postgresql`

## Schema Yükleme

```bash
# Schema dosyasını EC2'ye kopyalama
scp -i "your-key.pem" database/schema.sql ubuntu@your-ec2-ip:~/

# EC2'de schema yükleme
sudo -u postgres psql -d aishortfilm -f schema.sql

# Seed data (opsiyonel)
sudo -u postgres psql -d aishortfilm -f seed.sql
```

## Backup Yapılandırması

### 1. Otomatik Backup Script

```bash
sudo nano /usr/local/bin/backup-postgres.sh
```

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="aishortfilm"
DB_USER="aishortfilm_user"
S3_BUCKET="s3://aishortfilm-backups"

mkdir -p $BACKUP_DIR

# Backup
PGPASSWORD="your_password" pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz $S3_BUCKET/database/

# Keep only last 7 days locally
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# Executable yap
sudo chmod +x /usr/local/bin/backup-postgres.sh

# Crontab (her gün 2:00'de)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-postgres.sh >> /var/log/postgres-backup.log 2>&1
```

## Monitoring

### 1. PostgreSQL Stats

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('aishortfilm'));

-- Top queries
SELECT pid, age(clock_timestamp(), query_start), usename, query 
FROM pg_stat_activity 
WHERE query != '<IDLE>' AND query NOT ILIKE '%pg_stat_activity%' 
ORDER BY query_start desc;

-- Cache hit ratio (should be > 99%)
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit)  as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

### 2. CloudWatch Integration (Opsiyonel)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure metrics
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

## Performance Tuning

### 1. Connection Pooling (PgBouncer)

```bash
sudo apt install -y pgbouncer

sudo nano /etc/pgbouncer/pgbouncer.ini
```

```ini
[databases]
aishortfilm = host=localhost port=5432 dbname=aishortfilm

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
```

### 2. Restart PgBouncer

```bash
sudo systemctl restart pgbouncer
sudo systemctl enable pgbouncer
```

**Backend .env'de:**
```
DB_HOST=your-ec2-ip
DB_PORT=6432  # PgBouncer port
```

## Güvenlik Checklist

- [ ] PostgreSQL şifreleri güçlü
- [ ] pg_hba.conf sadece gerekli IP'lere açık
- [ ] SSL aktif
- [ ] Firewall (Security Group) doğru yapılandırılmış
- [ ] Daily backup aktif
- [ ] Monitoring kurulu
- [ ] Connection pooling aktif
- [ ] Log rotation yapılandırılmış

## Test Connection

Backend server'dan:
```bash
php -r "
  \$db = new PDO('pgsql:host=your-ec2-ip;port=5432;dbname=aishortfilm;sslmode=require', 
                 'aishortfilm_user', 
                 'your_password');
  echo 'Connected successfully!';
"
```

## Troubleshooting

**Connection refused:**
```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Port dinliyor mu?
sudo netstat -plnt | grep 5432

# Firewall?
sudo ufw status
```

**Too many connections:**
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < current_timestamp - INTERVAL '5 minutes';
```

**Slow queries:**
```sql
-- Enable slow query log
ALTER DATABASE aishortfilm SET log_min_duration_statement = 1000; -- 1 second
```

## Estimated Costs

**EC2 Instance (t3.medium):**
- On-Demand: ~$30/month
- Reserved (1 year): ~$20/month

**Storage (30GB gp3):**
- ~$2.40/month

**Backup (S3):**
- ~$1-2/month

**Total: ~$32-35/month**

---

💡 **Pro Tip:** Production'da RDS PostgreSQL kullanmak daha kolay olabilir (auto-backup, patching, monitoring) ama maliyeti 2-3x daha fazla.

