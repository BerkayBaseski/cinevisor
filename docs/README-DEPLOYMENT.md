# 🚀 EC2 Deployment - Hızlı Başlangıç

AI Film Platform'u Amazon EC2'ye deploy etmek için hızlı başlangıç rehberi.

## 📦 Deployment Dosyaları

Projede `deployment/` klasöründe tüm gerekli scriptler hazır:

```
deployment/
├── ec2-deploy.sh              # Ana sistem kurulumu
├── nginx-config.sh            # Nginx konfigürasyonu  
├── setup-project.sh           # Proje dosyaları kurulumu
├── monitoring-setup.sh        # Monitoring & backup
├── quick-deploy.sh            # Tek komutla kurulum
├── README.md                  # Detaylı deployment rehberi
├── DEPLOYMENT-CHECKLIST.md    # Deployment checklist
└── frontend-config.js         # Frontend API konfigürasyonu
```

## ⚡ Hızlı Kurulum (5 Adım)

### 1. EC2 Instance Hazırlığı

**AWS Console'da:**
- AMI: Ubuntu Server 22.04 LTS
- Instance Type: t3.medium (2 vCPU, 4GB RAM)
- Storage: 30 GB gp3
- Security Group: SSH (22), HTTP (80), HTTPS (443)

### 2. SSH Bağlantısı

```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### 3. Deployment Scriptlerini Upload

```bash
# Lokal makinenizden
scp -i "your-key.pem" -r deployment/ ubuntu@your-ec2-ip:/home/ubuntu/

# EC2'de
cd /home/ubuntu/deployment
chmod +x *.sh
```

### 4. Otomatik Kurulum

```bash
sudo ./quick-deploy.sh
```

**Script şunları sorar:**
- Git repository URL
- API domain (api.yourdomain.com)
- PostgreSQL credentials
- AWS credentials
- S3 bucket name

**Script şunları yapar:**
- ✅ Tüm sistem paketlerini yükler
- ✅ Projeyi klonlar
- ✅ .env dosyasını oluşturur
- ✅ Nginx'i yapılandırır
- ✅ Database schema'yı yükler
- ✅ Monitoring'i kurar

### 5. SSL & Test

```bash
# SSL sertifikası al
sudo certbot --nginx -d api.yourdomain.com

# Test et
curl https://api.yourdomain.com/api/health
```

## 🎯 Manuel Kurulum (Adım Adım)

Daha fazla kontrol için:

```bash
# 1. Sistem kurulumu
sudo ./ec2-deploy.sh

# 2. Proje dosyaları
sudo ./setup-project.sh

# 3. .env dosyasını düzenle
sudo nano /var/www/aishortfilm/backend/.env

# 4. Database
psql -h your-db -U user -d aishortfilm -f /var/www/aishortfilm/database/schema.sql

# 5. Nginx
sudo ./nginx-config.sh

# 6. Monitoring
sudo ./monitoring-setup.sh

# 7. SSL
sudo certbot --nginx -d api.yourdomain.com
```

## 🌐 Frontend Deployment

### Vercel (Önerilen)

```bash
# 1. Vercel CLI yükle
npm i -g vercel

# 2. Frontend klasöründe
cd frontend

# 3. API URL'i güncelle
nano js/api.js
# API_URL = 'https://api.yourdomain.com/api'

# 4. Deploy
vercel --prod
```

### Netlify

```bash
# 1. Netlify CLI yükle
npm i -g netlify-cli

# 2. Frontend klasöründe
cd frontend

# 3. API URL'i güncelle
nano js/api.js

# 4. Deploy
netlify deploy --prod --dir=.
```

## 🔧 Önemli Konfigürasyonlar

### 1. .env Dosyası

```env
# /var/www/aishortfilm/backend/.env

DB_HOST=your-postgres-ec2-ip
DB_PASSWORD=strong_password_here
JWT_SECRET=random_32_char_string
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=aishortfilm-videos
API_URL=https://api.yourdomain.com
```

### 2. DNS Kayıtları (Route 53)

```
A Record:
  Name: api.yourdomain.com
  Value: your-ec2-elastic-ip
  TTL: 300
```

### 3. S3 CORS

```json
[{
  "AllowedOrigins": ["https://yourdomain.com"],
  "AllowedMethods": ["GET", "PUT", "POST"],
  "AllowedHeaders": ["*"]
}]
```

## ✅ Deployment Kontrolü

```bash
# API test
curl https://api.yourdomain.com/api/health

# SSL test
curl -I https://api.yourdomain.com

# Services status
systemctl status nginx php8.1-fpm

# Logs
tail -f /var/log/aishortfilm/nginx-error.log
```

## 📊 Monitoring

```bash
# Health check log
tail -f /var/log/aishortfilm/health-check.log

# Backup kontrol
ls -la /var/backups/aishortfilm/

# Cron jobs
crontab -l
```

## 🔄 Güncelleme

```bash
cd /var/www/aishortfilm
git pull origin main
cd backend
composer install --no-dev
systemctl restart php8.1-fpm
systemctl reload nginx
```

## 🆘 Troubleshooting

### 502 Bad Gateway
```bash
systemctl restart php8.1-fpm
tail -f /var/log/aishortfilm/php-error.log
```

### Database Connection Failed
```bash
# .env kontrolü
cat /var/www/aishortfilm/backend/.env | grep DB_

# Test
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### SSL Certificate Error
```bash
certbot renew
certbot certificates
```

## 📚 Detaylı Dokümantasyon

- **`deployment/README.md`** - Tam deployment rehberi
- **`deployment/DEPLOYMENT-CHECKLIST.md`** - Checklist
- **`docs/EC2-SETUP.md`** - PostgreSQL EC2 kurulumu
- **`docs/S3-SETUP.md`** - S3 & CloudFront setup
- **`docs/DEPLOYMENT.md`** - Genel deployment bilgileri

## 💰 Tahmini Maliyet

**Minimal Setup:**
- EC2 t3.medium: $30/ay
- PostgreSQL EC2: $30/ay  
- S3 (100GB): $2.30/ay
- CloudFront (500GB): $42/ay
- **Toplam: ~$105/ay**

## 🎓 Öneriler

✅ **ÖNERİLEN:**
- SSL/HTTPS kullanın
- CloudFront CDN kullanın
- Otomatik backup aktif
- Monitoring aktif
- Strong passwords
- Regular updates

❌ **YAPMAYIN:**
- Root user kullanmayın
- .env dosyasını commit etmeyin
- Default passwords bırakmayın
- SSL olmadan production'a almayın
- Backup yapmadan değişiklik yapmayın

## 📞 Destek

- **GitHub Issues**: [Proje issues](https://github.com/your-repo/issues)
- **Dokümantasyon**: `deployment/` klasörü
- **Email**: your-email@domain.com

---

**🚀 Başarılı Deployments!**

Sorularınız için deployment klasöründeki README.md dosyasına bakın.

