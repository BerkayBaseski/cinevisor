# 📧 Email Sistemi - Hızlı Başlangıç

## 🚀 5 Dakikada Kurulum

### 1️⃣ Gmail App Password Oluştur

1. https://myaccount.google.com/apppasswords adresine git
2. "Select app" → **Mail** seçin
3. "Select device" → **Other** seçin, "CineVisor" yazın
4. **Generate** butonuna tıklayın
5. 16 haneli şifreyi kopyalayın (örnek: `abcd efgh ijkl mnop`)

> ⚠️ **Not:** 2-Step Verification aktif olmalı!

### 2️⃣ .env Dosyasını Güncelle

`backend/.env` dosyasını açın ve şu satırları güncelleyin:

```env
SMTP_USER=sizin-gmail@gmail.com
SMTP_PASS=abcdefghijklmnop
MAIL_FROM_ADDRESS=sizin-gmail@gmail.com
```

**Önemli:** 
- `SMTP_PASS` kısmına 16 haneli app password'ü yazın (boşluksuz!)
- Normal Gmail şifrenizi değil, app password'ü kullanın

### 3️⃣ Test Et

```bash
php backend/test-email.php
```

Email adresinizi girin ve test emailini kontrol edin!

## ✅ Hazır!

Artık kullanıcılar:
- ✅ "Forgot password?" ile şifre sıfırlama emaili alabilir
- ✅ Profesyonel HTML email şablonları görür
- ✅ 1 saat geçerli reset linkleri alır

## 🆘 Sorun mu var?

### Email gelmiyor?
1. ✅ Spam klasörünü kontrol et
2. ✅ App password'ü boşluksuz yazdığından emin ol
3. ✅ 2-Step Verification aktif mi kontrol et

### "Authentication failed" hatası?
1. ✅ SMTP_USER doğru Gmail adresi mi?
2. ✅ SMTP_PASS app password mu? (normal şifre değil!)
3. ✅ 2-Step Verification aktif mi?

## 📚 Detaylı Bilgi

Daha fazla bilgi için: `EMAIL_SETUP_GUIDE.md`

## 🎉 Tamamlandı!

Email sistemi çalışıyor! Kullanıcılar artık şifrelerini sıfırlayabilir.
