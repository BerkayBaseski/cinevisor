# Bildirim Sistemi (Notification System)

## ✅ Tamamlanan Özellikler

### Backend
- ✅ `notifications` tablosu oluşturuldu
- ✅ Notification model ve CRUD işlemleri
- ✅ API endpoint'leri:
  - `GET /api/notifications` - Bildirimleri listele
  - `GET /api/notifications/unread-count` - Okunmamış bildirim sayısı
  - `POST /api/notifications/{id}/read` - Bildirimi okundu olarak işaretle
  - `POST /api/notifications/read-all` - Tüm bildirimleri okundu işaretle

### Bildirim Türleri
1. **Like (Beğeni)** - Birisi videonuzu beğendiğinde
2. **Comment (Yorum)** - Birisi videonuza yorum yaptığında
3. **Video Approved (Video Onaylandı)** - Admin videonuzu onayladığında
4. **Video Rejected (Video Reddedildi)** - Admin videonuzu reddedildiğinde

### Otomatik Bildirim Oluşturma
- ✅ `backend/api/likes/like.php` - Beğeni yapıldığında bildirim oluşturur
- ✅ `backend/api/comments/create.php` - Yorum yapıldığında bildirim oluşturur
- ✅ `backend/api/admin/approve.php` - Video onaylandığında bildirim oluşturur
- ✅ `backend/api/admin/reject.php` - Video reddedildiğinde bildirim oluşturur

### Frontend
- ✅ Navbar'da bildirim badge'i (kırmızı sayı göstergesi)
- ✅ `frontend/pages/notifications.html` - Bildirimler sayfası
- ✅ Okunmamış bildirimlerin vurgulanması
- ✅ Bildirime tıklayınca ilgili sayfaya yönlendirme

## 🧪 Test Senaryoları

### 1. Beğeni Bildirimi Testi
```bash
# Bir kullanıcı başka bir kullanıcının videosunu beğendiğinde:
# - Video sahibine "like" türünde bildirim oluşturulur
# - Navbar'daki bildirim badge'i güncellenir
# - Notifications sayfasında görünür
```

### 2. Yorum Bildirimi Testi
```bash
# Bir kullanıcı başka bir kullanıcının videosuna yorum yaptığında:
# - Video sahibine "comment" türünde bildirim oluşturulur
# - Bildirime tıklayınca video sayfasına gider
```

### 3. Video Onay Bildirimi Testi
```bash
# Admin bir videoyu onayladığında:
# - Video sahibine "video_approved" türünde bildirim oluşturulur
# - Mesaj: "Your video '{title}' has been approved!"
```

### 4. Video Red Bildirimi Testi
```bash
# Admin bir videoyu reddedildiğinde:
# - Video sahibine "video_rejected" türünde bildirim oluşturulur
# - Mesaj: "Your video '{title}' was rejected. Reason: {reason}"
```

## 📝 Önemli Notlar

1. **Kendi İşlemleriniz İçin Bildirim Oluşturulmaz**
   - Kendi videonuzu beğenirseniz bildirim oluşturulmaz
   - Kendi videonuza yorum yaparsanız bildirim oluşturulmaz

2. **Gerçek Zamanlı Güncelleme**
   - Navbar badge'i sayfa yüklendiğinde güncellenir
   - `updateNotificationBadge()` fonksiyonu ile manuel güncelleme yapılabilir

3. **Veritabanı Yapısı**
   ```sql
   notifications (
     id, user_id, type, actor_id, video_id, 
     comment_id, message, is_read, created_at
   )
   ```

## 🚀 Kullanım

### Test Bildirimi Oluşturma
```bash
php backend/test-notifications.php
```

### Manuel Bildirim Oluşturma (PHP)
```php
$notificationModel = new \App\Models\Notification();
$notificationModel->create(
    $userId,           // Bildirimi alacak kullanıcı
    'like',            // Bildirim türü
    $actorId,          // İşlemi yapan kullanıcı
    $videoId,          // İlgili video
    $commentId,        // İlgili yorum (opsiyonel)
    $message           // Özel mesaj (opsiyonel)
);
```

## ✨ Özellikler

- ✅ Otomatik bildirim oluşturma
- ✅ Okunmamış bildirim sayacı
- ✅ Bildirim türlerine göre farklı ikonlar ve renkler
- ✅ Bildirime tıklayınca ilgili sayfaya yönlendirme
- ✅ Toplu "tümünü okundu işaretle" özelliği
- ✅ Responsive tasarım
- ✅ Netflix temalı görünüm

## 🎨 Bildirim İkonları

- 💗 **Like**: Kırmızı kalp ikonu
- 💬 **Comment**: Mavi yorum ikonu
- 👤 **Follow**: Yeşil kullanıcı ikonu (gelecekte eklenecek)
- 🎬 **Video**: Sarı video ikonu (onay/red)
