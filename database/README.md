# Database Kurulum Rehberi

## Desteklenen Veritabanları

- **MySQL 8.0+** / MariaDB 10.5+ (XAMPP/Local Development)
- **PostgreSQL 12+** (EC2/Production)

## MySQL Kurulumu (XAMPP - Local Development)

### 1. XAMPP MySQL'e bağlanın
```powershell
C:\xampp\mysql\bin\mysql.exe -u root
```

### 2. Veritabanı oluşturun
```sql
CREATE DATABASE aishortfilm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aishortfilm;
exit;
```

### 3. Schema'yı yükleyin
```powershell
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < schema.mysql.sql
```

### 4. Seed verilerini yükleyin (opsiyonel)
```powershell
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < seed.mysql.sql
```

## PostgreSQL Kurulumu (EC2 - Production)

### 1. PostgreSQL'e bağlanın
```bash
psql -U postgres
```

### 2. Veritabanı oluşturun
```sql
CREATE DATABASE aishortfilm;
\c aishortfilm
```

### 3. Schema'yı yükleyin
```bash
psql -U postgres -d aishortfilm -f schema.sql
```

### 4. Seed verilerini yükleyin (opsiyonel)
```bash
psql -U postgres -d aishortfilm -f seed.sql
```

## Test Kullanıcıları

Seed verilerini yüklediyseniz, aşağıdaki test kullanıcılarını kullanabilirsiniz:

**Admin:**
- Email: admin@aishortfilm.com
- Password: Admin123!
- Role: admin

**Creator:**
- Email: creator@aishortfilm.com
- Password: Admin123!
- Role: creator

**User:**
- Email: user@aishortfilm.com
- Password: Admin123!
- Role: user

## Backup & Restore

### MySQL (XAMPP)

**Backup:**
```powershell
C:\xampp\mysql\bin\mysqldump.exe -u root aishortfilm > backup.sql
```

**Restore:**
```powershell
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < backup.sql
```

### PostgreSQL (EC2)

**Backup:**
```bash
pg_dump -U postgres aishortfilm > backup.sql
```

**Restore:**
```bash
psql -U postgres aishortfilm < backup.sql
```

## Dosyalar

### MySQL (XAMPP/Local)
- `schema.mysql.sql` - MySQL database schema
- `seed.mysql.sql` - MySQL test verileri

### PostgreSQL (EC2/Production)
- `schema.sql` - PostgreSQL database schema
- `seed.sql` - PostgreSQL test verileri

