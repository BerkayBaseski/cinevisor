# Gmail SMTP Sorun Giderme

## ❌ "SMTP Error: Could not authenticate" Hatası

Bu hatayı alıyorsanız, aşağıdaki adımları takip edin:

### ✅ Çözüm 1: Yeni App Password Oluştur

1. **2-Step Verification Kontrolü**
   - https://myaccount.google.com/security adresine gidin
   - "2-Step Verification" bölümünün **AÇIK** olduğundan emin olun
   - Eğer kapalıysa, aktif edin ve telefon numaranızı doğrulayın

2. **Eski App Password'leri Sil**
   - https://myaccount.google.com/apppasswords adresine gidin
   - Eski "CineVisor" app password'ünü bulun ve **SİL**
   
3. **Yeni App Password Oluştur**
   - "Select app" → **Mail**
   - "Select device" → **Other (Custom name)**
   - İsim: **CineVisor**
   - **Generate** butonuna tıklayın
   - 16 haneli şifreyi kopyalayın (örnek: `abcd efgh ijkl mnop`)

4. **backend/.env Dosyasını Güncelle**
   ```env
   SMTP_PASS=abcdefghijklmnop
   ```
   **ÖNEMLİ:** Boşlukları kaldırın! Sadece harfler olmalı.

### ✅ Çözüm 2: Gmail Hesap Ayarları

1. **IMAP Erişimini Aktif Et**
   - Gmail'de Settings (⚙️) → See all settings
   - "Forwarding and POP/IMAP" sekmesi
   - "IMAP access" → **Enable IMAP**
   - Save Changes

2. **Şüpheli Aktivite Kontrolü**
   - https://myaccount.google.com/notifications adresine gidin
   - "Critical security alert" var mı kontrol edin
   - Varsa, "Yes, it was me" deyin

### ✅ Çözüm 3: Development Modda Çalış (Email Olmadan)

Email gönderimi şu an için çalışmasa bile sistem kullanılabilir:

1. **Development Mode Aktif**
   ```env
   APP_ENV=development
   ```

2. **Reset Link Console'da Görünür**
   - Forgot password sayfasından email gönder
   - Browser console'u aç (F12)
   - Network tab'ında response'a bak
   - `dev_reset_link` değerini kopyala
   - Bu linki tarayıcıda aç

3. **Backend Log'larını Kontrol Et**
   ```bash
   # Windows (XAMPP)
   tail -f C:\xampp\apache\logs\error.log
   
   # "Password reset link for..." satırını ara
   ```

### ✅ Çözüm 4: Alternatif Email Servisi Kullan

Gmail çalışmıyorsa, alternatif servisler:

#### Mailtrap (Development için - ÜCRETSİZ)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```
- https://mailtrap.io adresinden ücretsiz hesap aç
- Inbox oluştur
- SMTP credentials'ları kopyala

#### SendGrid (Production için - 100 email/gün ücretsiz)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```
- https://sendgrid.com adresinden hesap aç
- API Key oluştur
- SMTP_USER her zaman "apikey" olmalı

## 🔍 Hata Tespiti

### Test Komutu
```bash
php backend/test-email.php
```

### Beklenen Çıktı (Başarılı)
```
✅ SUCCESS! Email sent successfully!
📬 Check your inbox at: your-email@gmail.com
```

### Beklenen Çıktı (Başarısız ama çalışıyor)
```
❌ FAILED! Could not send email.
```
Bu durumda development mode'da `dev_reset_link` kullanabilirsiniz.

## 📝 Sık Sorulan Sorular

### Q: App Password nerede?
**A:** https://myaccount.google.com/apppasswords

### Q: 2-Step Verification nasıl aktif edilir?
**A:** https://myaccount.google.com/security → 2-Step Verification → Get Started

### Q: "App passwords" seçeneği görünmüyor?
**A:** 2-Step Verification'ı önce aktif etmelisiniz.

### Q: Email gönderimi zorunlu mu?
**A:** Hayır! Development modda `dev_reset_link` ile çalışabilirsiniz.

### Q: Production'da ne yapmalıyım?
**A:** SendGrid, Amazon SES veya Mailgun gibi profesyonel email servisleri kullanın.

## ✅ Hızlı Kontrol Listesi

- [ ] 2-Step Verification aktif mi?
- [ ] App Password yeni oluşturuldu mu?
- [ ] App Password boşluksuz mu?
- [ ] SMTP_USER doğru Gmail adresi mi?
- [ ] SMTP_PASS değişkeni doğru mu? (SMTP_PASSWORD değil!)
- [ ] Gmail IMAP aktif mi?
- [ ] Firewall 587 portunu engelliyor mu?

## 🎯 Önerilen Çözüm

**Development için:** Mailtrap kullanın (ücretsiz, kolay, güvenli)
**Production için:** SendGrid veya Amazon SES kullanın

## 📞 Hala Çalışmıyor mu?

1. Backend log'larını kontrol edin
2. `php backend/test-email.php` çalıştırın
3. Development modda `dev_reset_link` kullanın
4. Alternatif email servisi deneyin (Mailtrap)

---

**Not:** Gmail SMTP bazen까지 까다롭ı olabilir. Development için Mailtrap, production için SendGrid önerilir.
