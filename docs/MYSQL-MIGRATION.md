# MySQL Migration Guide

Bu döküman, projenin MySQL (XAMPP) ve PostgreSQL (EC2) arasında nasıl çalıştığını açıklar.

## 🔄 Dual Database Support

Proje artık hem **MySQL** (local development) hem de **PostgreSQL** (production) destekliyor!

### Database Driver Detection

`.env` dosyasında `DB_DRIVER` değişkeni ile database seçilir:

```env
# MySQL için
DB_DRIVER=mysql

# PostgreSQL için
DB_DRIVER=pgsql
```

## 📊 Farklılıklar ve Çözümler

### 1. ID Return (INSERT)

**PostgreSQL:**
```sql
INSERT INTO users (...) VALUES (...) RETURNING id;
```

**MySQL:**
```sql
INSERT INTO users (...) VALUES (...);
-- Sonra: $db->lastInsertId()
```

**Çözüm:** `DatabaseHelper` sınıfı otomatik olarak doğru yöntemi kullanır.

### 2. Case-Insensitive Search

**PostgreSQL:**
```sql
WHERE title ILIKE :query
```

**MySQL:**
```sql
WHERE LOWER(title) LIKE LOWER(:query)
```

**Çözüm:** `DatabaseHelper::buildILikeCondition()` kullanılır.

### 3. JSON/Array Operations

**PostgreSQL:**
```sql
WHERE tags @> :tags  -- Array contains
```

**MySQL:**
```sql
WHERE JSON_CONTAINS(tags, :tags)  -- JSON contains
```

**Çözüm:** `DatabaseHelper::buildJsonContainsCondition()` kullanılır.

### 4. Tags Storage

**PostgreSQL:**
- Schema'da `TEXT[]` (array) veya `JSON`
- PHP'de array olarak işlenir

**MySQL:**
- Schema'da `JSON` column
- PHP'de JSON string olarak saklanır

**Çözüm:**
- `DatabaseHelper::prepareTags()` - Array'i JSON'a çevirir
- `DatabaseHelper::parseTags()` - JSON'u array'e çevirir

### 5. Boolean Values

**PostgreSQL:**
```sql
WHERE is_active = true
WHERE is_deleted = false
```

**MySQL:**
```sql
WHERE is_active = 1
WHERE is_deleted = 0
```

**Çözüm:** Model dosyalarında otomatik olarak doğru değer kullanılır.

### 6. Conflict Handling

**PostgreSQL:**
```sql
INSERT INTO ... ON CONFLICT (col1, col2) DO NOTHING
```

**MySQL:**
```sql
INSERT IGNORE INTO ...
-- veya
INSERT INTO ... ON DUPLICATE KEY UPDATE ...
```

**Çözüm:** `Like` modelinde otomatik olarak doğru syntax kullanılır.

### 7. Timestamps

**PostgreSQL:**
```sql
SET updated_at = now()
```

**MySQL:**
```sql
SET updated_at = CURRENT_TIMESTAMP
```

**Çözüm:** `DatabaseHelper::getCurrentTimestamp()` kullanılır.

## 📁 Güncellenen Dosyalar

### Config Files
- ✅ `backend/config/database.php` - Dual driver support
- ✅ `backend/config/config.php` - Driver detection

### Utility Files
- ✅ `backend/utils/DatabaseHelper.php` - **YENİ!** Database-agnostic helpers

### Model Files
- ✅ `backend/models/User.php` - MySQL uyumlu
- ✅ `backend/models/Video.php` - MySQL uyumlu
- ✅ `backend/models/Comment.php` - MySQL uyumlu
- ✅ `backend/models/Report.php` - MySQL uyumlu
- ✅ `backend/models/Like.php` - MySQL uyumlu

### Database Schema
- ✅ `database/schema.mysql.sql` - **YENİ!** MySQL schema
- ✅ `database/seed.mysql.sql` - **YENİ!** MySQL test data

### Environment Files
- ✅ `backend/env.example.xampp` - **YENİ!** XAMPP config template

## 🧪 Test Etme

### MySQL (XAMPP)

```powershell
# 1. XAMPP'ı başlat
# 2. Database oluştur
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE aishortfilm"

# 3. Schema import
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < database\schema.mysql.sql

# 4. Test verileri
C:\xampp\mysql\bin\mysql.exe -u root aishortfilm < database\seed.mysql.sql

# 5. Backend başlat
cd backend
php -S localhost:8000

# 6. Test
curl http://localhost:8000/api/
```

### PostgreSQL (Production)

```bash
# 1. Database oluştur
psql -U postgres -c "CREATE DATABASE aishortfilm"

# 2. Schema import
psql -U postgres -d aishortfilm -f database/schema.sql

# 3. Test verileri
psql -U postgres -d aishortfilm -f database/seed.sql

# 4. Test
curl http://localhost/api/
```

## 🔍 DatabaseHelper Kullanımı

### Örnek: Model'de Kullanım

```php
use App\Utils\DatabaseHelper;

class MyModel {
    public function create($data) {
        // ID return
        if (DatabaseHelper::isPostgreSQL()) {
            $sql = "INSERT INTO ... RETURNING id";
            // ...
            $result = $stmt->fetch();
            return $result['id'];
        } else {
            $sql = "INSERT INTO ...";
            // ...
            return $this->db->lastInsertId();
        }
        
        // Boolean values
        $activeValue = DatabaseHelper::isMySQL() ? "1" : "true";
        
        // Tags
        $tagsJson = DatabaseHelper::prepareTags($tags);
        $tagsArray = DatabaseHelper::parseTags($dbTags);
        
        // Timestamp
        $sql = "UPDATE ... SET updated_at = " . DatabaseHelper::getCurrentTimestamp();
    }
}
```

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. UUID Format

- **PostgreSQL:** Native UUID type
- **MySQL:** CHAR(36) - UUID string format

Her ikisi de aynı format kullanır: `550e8400-e29b-41d4-a716-446655440000`

### 2. JSON Functions

MySQL'de JSON functions kullanılırken, PostgreSQL'de array operators kullanılır. `DatabaseHelper` otomatik olarak doğru syntax'ı seçer.

### 3. Boolean Comparisons

PDO boolean binding her iki database'de de çalışır, ama SQL string'lerinde manuel olarak `1/0` veya `true/false` kullanılmalı.

### 4. Case Sensitivity

- **PostgreSQL:** Case-sensitive (default)
- **MySQL:** Collation'a bağlı (utf8mb4_unicode_ci case-insensitive)

ILIKE/LIKE kullanımında `DatabaseHelper` otomatik olarak doğru yöntemi seçer.

## 🚀 Production'a Geçiş

MySQL'den PostgreSQL'e geçiş için:

1. **Schema Migration:**
   ```bash
   # MySQL'den export
   mysqldump -u root aishortfilm > backup.sql
   
   # PostgreSQL'e import (manuel dönüşüm gerekir)
   # veya schema.sql kullan
   ```

2. **Environment Variables:**
   ```env
   DB_DRIVER=pgsql
   DB_HOST=your-ec2-ip
   DB_PORT=5432
   DB_SSLMODE=require
   ```

3. **Test:**
   - Tüm API endpoint'lerini test et
   - Database queries'leri kontrol et
   - Performance test yap

## 📚 Ek Kaynaklar

- [XAMPP Setup Guide](XAMPP-SETUP.md)
- [EC2 Setup Guide](EC2-SETUP.md)
- [Database README](../database/README.md)
- [Config Usage Guide](CONFIG-USAGE.md)

## ✅ Checklist

- [x] Database driver detection
- [x] Dual database support
- [x] Model files updated
- [x] DatabaseHelper utility created
- [x] MySQL schema created
- [x] PostgreSQL schema maintained
- [x] Environment templates created
- [x] Documentation updated

**Status:** ✅ MySQL ve PostgreSQL desteği tamamlandı!

