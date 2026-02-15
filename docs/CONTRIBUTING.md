# Katkıda Bulunma Rehberi

AI Short Film Platform'a katkıda bulunmak istediğiniz için teşekkürler! 🎉

## Nasıl Katkıda Bulunabilirim?

### 1. Issue Bildirme

Bug veya feature request için:
1. [Issues](https://github.com/yourusername/aishortfilm/issues) sayfasına gidin
2. Benzer bir issue olmadığını kontrol edin
3. Net bir başlık ve açıklama ile issue oluşturun

### 2. Pull Request Gönderme

1. **Fork yapın**
```bash
git clone https://github.com/yourusername/aishortfilm.git
```

2. **Feature branch oluşturun**
```bash
git checkout -b feature/amazing-feature
```

3. **Değişikliklerinizi yapın**
- Kod standartlarına uyun
- Test ekleyin
- Commit mesajlarını anlamlı yazın

4. **Commit yapın**
```bash
git commit -m "feat: add amazing feature"
```

5. **Push yapın**
```bash
git push origin feature/amazing-feature
```

6. **Pull Request açın**
- Değişikliklerinizi detaylı açıklayın
- İlgili issue'yu referans gösterin
- Screenshots ekleyin (UI değişiklikleri için)

## Kod Standartları

### PHP
- PSR-12 standartlarına uyun
- Type hints kullanın
- Docblocks ekleyin

```php
/**
 * Create a new video record
 *
 * @param string $title Video title
 * @return string|null Video ID
 */
public function create(string $title): ?string {
    // ...
}
```

### JavaScript
- ES6+ syntax kullanın
- Async/await tercih edin
- Meaningful variable names

```javascript
async function loadVideos(sort = 'newest') {
  try {
    const response = await api.getVideos({ sort });
    // ...
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### CSS
- BEM metodolojisi
- CSS variables kullanın
- Mobile-first approach

## Commit Mesaj Formatı

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Yeni özellik
- `fix`: Bug fix
- `docs`: Dokümantasyon
- `style`: Kod formatı
- `refactor`: Kod refactoring
- `test`: Test ekleme
- `chore`: Build/tooling değişiklikleri

**Örnek:**
```
feat(video): add video download feature

- Add download button to video player
- Implement signed URL generation
- Add permission checks

Closes #123
```

## Test

Pull request göndermeden önce testlerin çalıştığından emin olun:

```bash
# Backend tests
cd backend
composer test

# E2E tests
npm run test:e2e
```

## Code Review Süreci

1. Maintainer'lar PR'ınızı gözden geçirecek
2. Değişiklik istekleri gelebilir
3. Onaylandıktan sonra merge edilecek
4. Contributors listesine ekleneceksiniz!

## İletişim

- GitHub Issues
- Discord: [community link]
- Email: contribute@aishortfilm.com

## Davranış Kuralları

- Saygılı olun
- Yapıcı geri bildirim verin
- Farklı görüşlere açık olun
- Topluluk kurallarına uyun

Teşekkürler! 🙏

