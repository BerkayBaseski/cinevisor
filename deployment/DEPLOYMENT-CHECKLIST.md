# 🚀 EC2 Deployment Checklist

Deployment öncesi ve sonrası kontrol listesi.

## ⏱️ Deployment Öncesi

### AWS Hazırlık
- [ ] EC2 instance oluşturuldu (Ubuntu 22.04, t3.medium+)
- [ ] Elastic IP atandı
- [ ] Security Group yapılandırıldı (22, 80, 443 portları)
- [ ] SSH key pair indirildi
- [ ] PostgreSQL EC2/RDS hazır
- [ ] S3 bucket oluşturuldu (private)
- [ ] IAM user oluşturuldu (S3 permissions)
- [ ] CloudFront distribution oluşturuldu (opsiyonel)

### Domain & DNS
- [ ] Domain satın alındı
- [ ] Route 53'te hosted zone oluşturuldu
- [ ] A record hazırlandı (henüz eklenmedi)

### Lokal Hazırlık
- [ ] Git repository hazır
- [ ] Tüm kodlar commit edildi
- [ ] .gitignore kontrol edildi (.env dosyası ignore'da)
- [ ] Database schema.sql hazır
- [ ] README ve dokümantasyon güncel

## 🔧 Deployment Adımları

### 1. EC2'ye Bağlanma
```bash
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```
- [ ] SSH bağlantısı başarılı

### 2. Deployment Dosyalarını Upload
```bash
# Lokal makineden
scp -i "your-key.pem" -r deployment/ ubuntu@your-ec2-ip:/home/ubuntu/

# Veya git clone
git clone https://github.com/your-repo/aishortfilm.git /tmp/aishortfilm
```
- [ ] Dosyalar upload edildi

### 3. Ana Kurulum
```bash
cd /home/ubuntu/deployment
chmod +x *.sh
sudo ./ec2-deploy.sh
```
- [ ] Sistem paketleri yüklendi
- [ ] PHP 8.1 yüklendi
- [ ] Nginx yüklendi
- [ ] Composer yüklendi

### 4. Proje Kurulumu
```bash
sudo ./setup-project.sh
```
- [ ] Git repository klonlandı
- [ ] Composer dependencies yüklendi
- [ ] .env dosyası oluşturuldu

### 5. Environment Konfigürasyonu
```bash
sudo nano /var/www/aishortfilm/backend/.env
```

**Kontrol edilecekler:**
- [ ] DB_HOST doğru
- [ ] DB_USER ve DB_PASSWORD doğru
- [ ] JWT_SECRET değiştirildi (32+ karakter)
- [ ] AWS credentials doğru
- [ ] S3_BUCKET adı doğru
- [ ] API_URL ve APP_URL doğru
- [ ] CORS_ALLOWED_ORIGINS doğru

### 6. Database Setup
```bash
export PGPASSWORD='your_password'
psql -h your-db-host -U aishortfilm_user -d aishortfilm -f /var/www/aishortfilm/database/schema.sql
```
- [ ] Schema yüklendi
- [ ] Seed data yüklendi (opsiyonel)
- [ ] Bağlantı test edildi

### 7. Nginx Konfigürasyonu
```bash
sudo ./nginx-config.sh
```
- [ ] Domain adı girildi
- [ ] Nginx config oluşturuldu
- [ ] Nginx test başarılı (`nginx -t`)
- [ ] Nginx reload edildi

### 8. DNS Kayıtları
Route 53 veya domain registrar'da:
```
A Record:
  Name: api.yourdomain.com
  Value: your-ec2-elastic-ip
  TTL: 300
```
- [ ] A record eklendi
- [ ] DNS propagation beklendi (5-30 dk)
- [ ] `nslookup api.yourdomain.com` ile test edildi

### 9. SSL Sertifikası
```bash
sudo certbot --nginx -d api.yourdomain.com
```
- [ ] Email adresi girildi
- [ ] Terms of Service kabul edildi
- [ ] Sertifika başarıyla alındı
- [ ] Auto-renewal test edildi (`certbot renew --dry-run`)

### 10. Monitoring & Backup
```bash
sudo ./monitoring-setup.sh
```
- [ ] Logrotate yapılandırıldı
- [ ] Health check cron eklendi
- [ ] Backup cron eklendi
- [ ] Cron jobs test edildi (`crontab -l`)

### 11. Frontend Deployment
**Vercel/Netlify:**
- [ ] Frontend klasörü yüklendi
- [ ] `js/api.js` dosyasında API_URL güncellendi
- [ ] Build settings yapılandırıldı
- [ ] Deploy edildi
- [ ] Custom domain eklendi (opsiyonel)

### 12. Final Test
```bash
# API health check
curl https://api.yourdomain.com/api/health

# Response: {"success":true,"data":{"status":"healthy",...}}
```
- [ ] API health check başarılı
- [ ] Frontend'den API'ye erişim var
- [ ] Kayıt/login çalışıyor
- [ ] Video upload çalışıyor (S3'e gidiyor)
- [ ] Video playback çalışıyor
- [ ] Comment/like çalışıyor

## 🔒 Güvenlik Kontrolleri

### System Security
- [ ] SSH password authentication disabled
- [ ] SSH root login disabled
- [ ] UFW firewall aktif
- [ ] Fail2ban kurulu ve aktif
- [ ] Automatic security updates aktif

### Application Security
- [ ] .env dosyası permissions 600
- [ ] JWT secret güçlü ve unique
- [ ] Database passwords güçlü (16+ karakter)
- [ ] AWS IAM user minimal permissions
- [ ] S3 bucket private
- [ ] CORS doğru yapılandırılmış
- [ ] Rate limiting aktif
- [ ] SQL injection koruması test edildi

### SSL/TLS
- [ ] HTTPS zorunlu (HTTP redirect)
- [ ] SSL Labs test (A+ rating)
- [ ] Certificate auto-renewal çalışıyor

## 📊 Performance Kontrolleri

### Backend
- [ ] PHP-FPM pool size optimize edildi
- [ ] Nginx worker connections yeterli
- [ ] Database connection pooling aktif (PgBouncer)
- [ ] Response time < 500ms (basit istekler)

### Database
- [ ] Indexes oluşturuldu
- [ ] Connection limit yeterli
- [ ] Slow query log aktif
- [ ] Backup schedule çalışıyor

### Storage
- [ ] S3 lifecycle rules yapılandırıldı
- [ ] CloudFront cache çalışıyor
- [ ] Presigned URLs expire süresi doğru

## 🧪 Fonksiyonel Test

### Auth
- [ ] Kayıt çalışıyor
- [ ] Login çalışıyor
- [ ] Logout çalışıyor
- [ ] Token refresh çalışıyor
- [ ] Password validation çalışıyor

### Video
- [ ] Upload init alınıyor
- [ ] S3'e direct upload çalışıyor
- [ ] Upload complete işleniyor
- [ ] Video listesi geliyor
- [ ] Video detay geliyor
- [ ] Stream URL alınıyor
- [ ] Video oynatma çalışıyor
- [ ] Download çalışıyor (izin verilmişse)

### Interactions
- [ ] Yorum ekleme çalışıyor
- [ ] Yorum listeleme çalışıyor
- [ ] Yorum silme çalışıyor
- [ ] Like/unlike çalışıyor
- [ ] Like count güncelleniyor

### Admin
- [ ] Pending videos listeleniyor
- [ ] Video approve çalışıyor
- [ ] Video reject çalışıyor
- [ ] Reports listeleniyor

## 📈 Monitoring Setup

### Logs
- [ ] Nginx access log yazıyor
- [ ] Nginx error log yazıyor
- [ ] PHP error log yazıyor
- [ ] Health check log yazıyor
- [ ] Log rotation çalışıyor

### Alerts (Opsiyonel)
- [ ] Disk space alert
- [ ] Memory usage alert
- [ ] CPU usage alert
- [ ] API error rate alert
- [ ] Database connection alert

### Backup
- [ ] Database backup çalışıyor
- [ ] Backup S3'e upload oluyor
- [ ] Eski backuplar temizleniyor
- [ ] Restore test edildi

## 📝 Dokümantasyon

- [ ] .env.example güncellendi
- [ ] README.md güncellendi
- [ ] API dokümantasyonu güncel
- [ ] Deployment rehberi tamamlandı
- [ ] Troubleshooting section eklendi

## 🎯 Go-Live Checklist

Son kontroller:
- [ ] Tüm testler başarılı
- [ ] Güvenlik kontrolleri tamamlandı
- [ ] Monitoring çalışıyor
- [ ] Backup çalışıyor
- [ ] Team bilgilendirildi
- [ ] Emergency rollback planı hazır

## 🎉 Post-Deployment

Deployment sonrası:
- [ ] Announcement/duyuru yapıldı
- [ ] First users test etti
- [ ] Analytics kuruldu (opsiyonel)
- [ ] Error tracking aktif (Sentry vs.)
- [ ] Performance baseline kaydedildi
- [ ] Team'e credentials paylaşıldı (güvenli şekilde)

---

## 📞 Emergency Contacts

**Sorun yaşarsanız:**
- System Admin: your-email@domain.com
- AWS Support: support case açın
- Database Admin: db-admin@domain.com

**Rollback Plan:**
```bash
# Previous version'a dön
cd /var/www/aishortfilm
git checkout previous-tag

# Services restart
systemctl restart php8.1-fpm nginx

# Database restore (if needed)
gunzip < /var/backups/aishortfilm/db_backup_YYYYMMDD.sql.gz | psql ...
```

---

**Not:** Bu checklist'i deployment sırasında PDF olarak print edip elle işaretleyebilirsiniz.

