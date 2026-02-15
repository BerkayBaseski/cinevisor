Proje Özeti (kısa)

Kullanıcıların kayıt olup AI ile oluşturulmuş kısa filmleri yükleyebildiği, izleyebildiği, yorumlayıp beğenebildiği bir web platformu.
Tech stack (MVP): Frontend: HTML/CSS/Vanilla JS (responsive, black theme) — Backend: PHP 8.x (REST API) — DB: PostgreSQL — Storage: AWS S3 — Transcoding: FFmpeg (opsiyonel işçi).

1. Hedefler & MVP Kapsamı

Hedef: 1–2 hafta içinde çalışır MVP (kullanıcı auth, video presigned upload → S3, video oynatma, yorum/beğeni, admin onay).
MVP içerir:

Email/password kayıt + JWT auth (refresh token)

Video yükleme (frontend → presigned S3 upload), metadata kaydı

Video oynatma (S3 public veya signed URL / HLS hedeflenebilir)

Yorum (CRUD basit: create, read, delete by owner/admin)

Beğeni (like/unlike)

Admin panel: onay / silme

Dark theme frontend

Kabul kriterleri (örnek):

Bir kullanıcı kaydolup giriş yapmalı (e-posta doğrulama opsiyonel MVP).

Bir kullanıcı 1 GB’tan küçük .mp4 yükleyebilmeli; dosya S3’e yüklenip DB’de record oluşmalı.

Bir video oynatılabilir olmalı (signed URL ile en az 1 dakika oynatma).

Bir kullanıcı login iken yorum/like yapabilmeli.

2. Fonksiyonel Gereksinimler (detaylı)
Kullanıcı & Auth

Kayıt: POST /api/auth/register {email, username, password}

Giriş: POST /api/auth/login {email, password} → döner access_token (JWT, 15–60dk) ve refresh_token (long)

Oturum yönetimi: refresh token endpoint, logout (revoke refresh)

Parola saklama: password_hash(..., PASSWORD_BCRYPT) (PHP)

Roller: user, creator (upload izni), moderator, admin

Video (Film) Yönetimi

Upload init (presigned): POST /api/videos/init → body: {title, description, tags[], allow_download, duration_estimate} → döner {uploadId, presignedUrl, s3_key}

Upload callback: POST /api/videos/complete {uploadId, s3_key, size_bytes, duration_seconds} → tetiklediğinde backend transcoder job queue’ye koyar (opsiyonel)

Metadata: videos tablosu store (owner_id, s3_key, thumbnail_url, status: pending/approved/published, allow_download, created_at)

Delete: owner veya admin delete (soft delete + hard delete lifecycle)

Etkileşimler

Comment: POST /api/videos/:id/comments {text}

Get comments: GET /api/videos/:id/comments?limit=&page=

Like/Unlike: POST /api/videos/:id/like / DELETE /api/videos/:id/like

Download: GET /api/videos/:id/download → backend validates permission, returns signed S3 URL (expires short)

Arama ve Filtre

GET /api/videos?sort=newest|popular|likes&tags=...&q=...&page=&limit=

Moderasyon

Report: POST /api/videos/:id/report {reason, details}

Admin endpoints: list pending videos, approve, reject, ban user

3. Non-functional Gereksinimler (NFR)

Performans: 500 aktif kullanıcı hedefi; CDN (CloudFront/Cloudflare) ile ölçeklendirilecek.

Güvenlik: HTTPS zorunlu, JWT, rate limiting (IP ve API key), CSRF koruma (form endpoints), strong password policy.

Depolama: S3 (versioning + lifecycle kuralları); eski videoları Glacier/archives planı.

Yedek: PostgreSQL günlük snapshot; DB yedekleme otomatik (RDS veya pg_dump cron).

İzleme: Logs → CloudWatch / ELK; hata takibi: Sentry.

Erişilebilirlik: Kontrast, keyboard nav, semantic HTML.

4. Veri Model – PostgreSQL (SQL DDL örneği)

Aşağıdaki SQL, başlangıç için kullanılabilir. UUID kullanımı önerilir.

-- extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[], -- array of tags
  s3_key TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  duration_seconds INT,
  size_bytes BIGINT,
  allow_download BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- pending | approved | rejected | deleted
  views BIGINT DEFAULT 0,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

-- likes (for videos)
CREATE TABLE video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- comment likes
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id),
  user_id UUID REFERENCES users(id),
  reason TEXT,
  details TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- indexes
CREATE INDEX idx_videos_owner ON videos(owner_id);
CREATE INDEX idx_videos_status_created ON videos(status, created_at DESC);
CREATE INDEX idx_videos_tags ON videos USING GIN (tags);
CREATE INDEX idx_comments_video ON comments(video_id);


AC: Tablolar oluşturulup örnek veriyle ilişkiler test edilecek (user → video → comment → like).

5. API Taslağı (REST) — Örnek uç noktalar, JWT header gereksinimi

Auth

POST /api/auth/register → {email, username, password}

POST /api/auth/login → {email, password} → {access_token, refresh_token}

POST /api/auth/refresh → {refresh_token} → new access token

POST /api/auth/logout → revoke refresh

Videos

POST /api/videos/init (auth) → body: {title, description, tags, allow_download, estimated_duration} → returns {uploadId, presignedUrl, s3_key}

POST /api/videos/complete (auth) → body: {uploadId, s3_key, size_bytes, duration_seconds}

GET /api/videos → list (filters)

GET /api/videos/:id → metadata

GET /api/videos/:id/stream → returns signed S3 URL or HLS manifest

GET /api/videos/:id/download (auth) → returns signed S3 download URL (expires)

DELETE /api/videos/:id (auth owner/admin)

Interactions

POST /api/videos/:id/comments (auth) {content}

GET /api/videos/:id/comments

POST /api/videos/:id/like (auth)

DELETE /api/videos/:id/like (auth)

POST /api/videos/:id/report (auth) {reason, details}

Admin

GET /api/admin/videos/pending (auth moderator/admin)

POST /api/admin/videos/:id/approve (auth)

POST /api/admin/videos/:id/reject (auth {reason})

AC: API endpoints Postman koleksiyonu hazırlanacak; temel flows (register->login->init upload->complete->stream) test edilecek.

6. Upload Akışı (presigned URL) — Örnek Akış & PHP kod snippet

Neden: Sunucunun bant genişliğini korumak, doğrudan S3’a upload yapmak için presigned PUT kullan.

Adımlar

Kullanıcı frontend’den POST /api/videos/init çağırır (auth). Backend:

Oluşturur s3_key = videos/{user_id}/{uuid}.mp4

DB => create upload kaydı (uploadId, s3_key, owner_id, status='init')

AWS SDK kullanarak presigned PUT URL oluşturur (ör. 1 saat geçerli)

Döner {uploadId, presignedUrl, s3_key}

Frontend fetch(presignedUrl, {method: 'PUT', body: file}) yapar (chunked upload gerekliyse multipart veya tus/Resumable).

Frontend POST /api/videos/complete ile bildirir. Backend:

Validate: HEAD request to S3 to confirm object size/type (or rely on s3 event)

Update DB: videos row created/updated with size, duration (if provided)

Trigger transcoder job (FFmpeg worker) → generate thumbnails + HLS segments (opsiyonel)

status => pending (awaiting moderation) or published if auto

PHP (AWS SDK) presigned örnek (kodu mutlaka Composer ile aws/aws-sdk-php kurulmuş olmalı)
use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Aws\S3\PostObjectV4;

$s3 = new S3Client([
  'version' => 'latest',
  'region' => 'eu-central-1',
  'credentials' => [
    'key' => getenv('AWS_KEY'),
    'secret' => getenv('AWS_SECRET'),
  ]
]);

$bucket = getenv('S3_BUCKET');
$key = "videos/{$userId}/{$uuid}.mp4";
$cmd = $s3->getCommand('PutObject', [
  'Bucket' => $bucket,
  'Key' => $key,
  'ACL' => 'private',
  'ContentType' => 'video/mp4'
]);

$presignedUrl = (string) $s3->createPresignedRequest($cmd, '+60 minutes')->getUri();


AC: Presigned URL ile frontend’den .mp4 dosya yüklenebilmeli; backend complete çağrısı s3 presence doğrulamalı.

7. Transcoding & Playback (opsiyonel ama önerilir)

MVP: Direkt MP4 oynatma (HTML5 <video> tag) — signed S3 URL kullan. (Basit, hızlı)

Gelişmiş: FFmpeg ile HLS/DASH transcode; farklı bitrateler; CDN cache.

Trigger: videos:complete event → transcoder container (k8s/ECS/worker) çalışır → output HLS segments kaydedilir s3_key/hls/ → manifest.m3u8 → CDN.

AC: Eğer HLS yapılırsa video sayfası .m3u8 oynatmalı (HLS.js video.js). MVP için mp4 signed URL'ı yeterli.

8. Güvenlik & İzinler

HTTPS her yerde.

JWT: access token (kısa), refresh token (DB’de blacklist destekli).

Rate limit: API başına IP bazlı (ör. 100 req/min), upload throttle (öğrenci).

File validation: yapısal MIME + magic bytes kontrol (video/mp4), dosya boyutu max 2GB.

Malware scan: Lambda/worker ile ClamAV taraması veya 3rd party.

S3 IAM: uygulama IAM user sadece PutObject/GetObject için minimal izin; presigned URL’lar kullanıcıya verilir.

Signed URLs: Download/stream URL’ları kısa ömürlü (örn. 60s–5dk).

AC: Unauthorized user upload/download yapamaz; signed URL only via backend.

9. Yedekleme / Backup / Ops

Postgres: günlük snapshot; point-in-time recovery (RDS).

S3: versioning ON, lifecycle rule: 90 gün -> Glacier.

DB backup test: aylık restore testi.

Monitoring: CPU, memory, DB connections, S3 errors; Alerts (Slack/email).

Logging: Access logs (S3), application logs (structured JSON).

10. Deployment & Hosting Önerisi

Frontend: Vercel / Netlify / S3 + CloudFront (static site)

Backend (PHP):

Small scale: DigitalOcean App Platform veya Heroku (PHP buildpack)

Scalable: AWS ECS Fargate veya EC2 + Nginx + PHP-FPM

DB: Amazon RDS for PostgreSQL (managed) or DigitalOcean Managed DB

Transcoder: ECS / Docker worker (FFmpeg) veya serverless Lambda (kısıtlı)

CDN: CloudFront veya Cloudflare / BunnyCDN

Tahmini başlangıç aylık maliyet (küçük MVP):

S3 depolama 100GB + 1TB traffic: ~$25–$60

RDS small instance: ~$15–$50

App server (1 small droplet): $5–$20

CDN: $10–$50
Toplam: ~$60–$200 / ay (kullanıma göre değişir).

11. Test & QA

Unit tests (PHPUnit) — API handlers

Integration tests: upload flow, DB writes, presigned url validation

E2E: Selenium / Playwright (register->login->upload->play->comment->like)

Load test: 500 concurrent viewers (kullanıcı senaryosu) via k6 / locust (özellikle CDN ile).

AC: E2E testi başarılı (kayıt, yükle, oynat, yorum, like) otomatikleştirilmiş.

12. Hızlı Görev Listesi (Cursor’a verilecek, öncelik sırasına göre)

Aşağıyı doğrudan Cursor’a verek geliştirmeyi başlat.

Sprint 0 — Altyapı & Boilerplate (1–2 gün)

Repo oluştur (monorepo: /frontend, /backend, /infra)

CI: GitHub Actions (lint, phpunit, deploy to staging)

Deploy static frontend skeleton to Netlify/Vercel (black theme base)

Provision PostgreSQL (RDS or DO Managed) & S3 bucket (versioning on)

Add env secrets management (AWS keys, DB URL, JWT secret)

Sprint 1 — Auth + Users (2–3 gün)

Implement register/login/logout with JWT (refresh token stored in DB)

Create users table migration + seed admin user

Frontend register/login pages (simple forms)

Acceptance: user can register + login + see profile page.

Sprint 2 — Upload Flow (3–4 gün)

Backend POST /api/videos/init => create upload record + presigned URL

Frontend upload page => direct PUT to presigned URL (show progress)

Backend POST /api/videos/complete => validate S3 object (HEAD) + create video record in videos table (status=pending)

Admin endpoint to list pending videos

Acceptance: file uploaded to S3 & video record present in DB.

Sprint 3 — Playback + Comments + Like (2–3 gün)

GET /api/videos/:id → return metadata + signed URL for playback

Frontend video page → <video> tag to play signed URL

Implement comments/likes endpoints & UI

Acceptance: logged in user can comment & like; video plays.

Sprint 4 — Admin + Moderation + Download (2 gün)

Admin approve/reject video

GET /api/videos/:id/download → signed URL (expires short)

Basic report functionality

Acceptance: admin approves => status changes; download URL works for allowed users.

Ops Tasks

Set up monitoring/alerts

DB backups and cron

Implement rate limiting (middleware)

13. Örnek PHP kod snippetleri (auth & presigned)

I included presigned snippet; for JWT use firebase/php-jwt lib. Password hash with password_hash.

14. Kabul Kriterleri Özet (MVP)

Register/login/logout: OK

Upload via presigned: OK

Create video metadata in PostgreSQL: OK

Play video via signed URL: OK

Comment + Like: OK

Admin approve flow: OK

Basic security: HTTPS, JWT, rate limiting minimal: OK