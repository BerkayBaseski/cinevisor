# 📦 AWS S3 Video Storage Kurulum Rehberi

## S3 Bucket Oluşturma

### 1. AWS Console'da S3 Bucket

```bash
# AWS Console → S3 → Create bucket
Bucket name: aishortfilm-videos
Region: us-east-1 (veya en yakın region)
Block all public access: ✓ (Enabled - presigned URL kullanacağız)
Versioning: Enabled (önerilir)
Encryption: AES-256 (default)
```

### 2. Bucket Policy - Presigned URL için

S3 bucket'ın kendi permission'ları yeterli (IAM user ile erişeceğiz).

### 3. CORS Configuration

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Uygulama:** S3 Console → Bucket → Permissions → CORS configuration

### 4. Lifecycle Rules (Maliyet Optimizasyonu)

```
Rule 1: Move to Glacier
- Prefix: videos/
- Transition: 90 days → Glacier Deep Archive
- Status: Enabled

Rule 2: Delete incomplete uploads
- Prefix: videos/
- Delete incomplete multipart uploads after: 7 days
- Status: Enabled
```

**Tahmini maliyet tasarrufu:** %80-90 (Glacier için)

## IAM User Oluşturma

### 1. IAM User

```bash
# AWS Console → IAM → Users → Create user
Username: aishortfilm-s3-user
Access type: Programmatic access
```

### 2. IAM Policy (Minimal Permissions)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::aishortfilm-videos",
        "arn:aws:s3:::aishortfilm-videos/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::aishortfilm-videos/*"
    }
  ]
}
```

### 3. Access Keys

```bash
# IAM User → Security credentials → Create access key
Access Key ID: AKIA...
Secret Access Key: wJalr...

# Backend .env dosyasına ekle
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
```

## CloudFront CDN (Opsiyonel ama Önerilir)

### 1. CloudFront Distribution

```bash
# AWS Console → CloudFront → Create Distribution

Origin Domain: aishortfilm-videos.s3.us-east-1.amazonaws.com
Origin Path: (boş)
Origin Access: Legacy access identities
  - Create new OAI

Default Cache Behavior:
  Viewer Protocol Policy: Redirect HTTP to HTTPS
  Allowed HTTP Methods: GET, HEAD, OPTIONS
  Cache Policy: CachingOptimized
  
Distribution Settings:
  Price Class: Use all edge locations
  Alternate Domain Names (CNAMEs): videos.yourdomain.com
  SSL Certificate: Request ACM certificate
```

### 2. S3 Bucket Policy (CloudFront için)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR-OAI-ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::aishortfilm-videos/*"
    }
  ]
}
```

### 3. Backend Config (CloudFront ile)

```env
S3_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
USE_CLOUDFRONT=true
```

**Backend kod güncellemesi:**

```php
// utils/S3Client.php - generatePresignedViewUrl metodunda

public function generatePresignedViewUrl($key, $expiresIn = 3600): string {
    // CloudFront kullanılıyorsa
    if ($_ENV['USE_CLOUDFRONT'] === 'true') {
        $domain = $_ENV['S3_CLOUDFRONT_DOMAIN'];
        return "https://{$domain}/{$key}";
    }
    
    // Normal S3 signed URL
    $cmd = $this->client->getCommand('GetObject', [
        'Bucket' => $this->bucket,
        'Key' => $key
    ]);
    
    $request = $this->client->createPresignedRequest($cmd, "+{$expiresIn} seconds");
    return (string) $request->getUri();
}
```

## Video Upload Flow (Detaylı)

### 1. Frontend → Backend: Init Upload

```javascript
// Frontend request
const response = await api.initUpload({
  title: "My AI Film",
  description: "Description",
  tags: ["sci-fi", "drama"],
  allow_download: true
});

// Backend response
{
  "upload_id": "abc123",
  "presigned_url": "https://aishortfilm-videos.s3.amazonaws.com/videos/...",
  "s3_key": "videos/user-uuid/video-uuid.mp4",
  "expires_in": 3600
}
```

### 2. Frontend → S3: Direct Upload

```javascript
// Direct PUT to S3 (no backend involved)
await fetch(presignedUrl, {
  method: 'PUT',
  body: videoFile,
  headers: {
    'Content-Type': 'video/mp4'
  }
});
```

### 3. Frontend → Backend: Complete Upload

```javascript
await api.completeUpload({
  upload_id: "abc123",
  s3_key: "videos/user-uuid/video-uuid.mp4",
  size_bytes: 52428800,
  duration_seconds: 180
});

// Backend validates S3 object exists (HEAD request)
// Then creates database record
```

## S3 Folder Structure

```
aishortfilm-videos/
├── videos/
│   ├── {user-uuid-1}/
│   │   ├── {video-uuid-1}.mp4
│   │   ├── {video-uuid-2}.mp4
│   │   └── ...
│   └── {user-uuid-2}/
│       └── ...
├── thumbnails/
│   ├── {video-uuid-1}.jpg
│   └── ...
└── hls/ (future)
    ├── {video-uuid-1}/
    │   ├── playlist.m3u8
    │   ├── segment-0.ts
    │   └── ...
    └── ...
```

## Backup Strategy

### 1. S3 Versioning

```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket aishortfilm-videos \
  --versioning-configuration Status=Enabled
```

### 2. Cross-Region Replication (Önemli veriler için)

```bash
# Target bucket (farklı region)
aws s3 mb s3://aishortfilm-videos-backup --region eu-west-1

# Replication rule
aws s3api put-bucket-replication \
  --bucket aishortfilm-videos \
  --replication-configuration file://replication-config.json
```

## Monitoring & Alerts

### 1. S3 Metrics

```bash
# Enable CloudWatch metrics
aws s3api put-bucket-metrics-configuration \
  --bucket aishortfilm-videos \
  --id EntireBucket \
  --metrics-configuration Id=EntireBucket
```

### 2. CloudWatch Alarms

```bash
# Alert on high request count
aws cloudwatch put-metric-alarm \
  --alarm-name "S3-HighRequestCount" \
  --alarm-description "S3 requests exceed threshold" \
  --metric-name AllRequests \
  --namespace AWS/S3 \
  --statistic Sum \
  --period 300 \
  --threshold 10000 \
  --comparison-operator GreaterThanThreshold
```

## Cost Optimization

### 1. Intelligent-Tiering

```bash
# S3 Intelligent-Tiering for automatic cost optimization
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket aishortfilm-videos \
  --id AllObjects \
  --intelligent-tiering-configuration file://tiering-config.json
```

### 2. Request Cost Reduction

- CloudFront kullanın (S3 request sayısını %90 azaltır)
- Büyük dosyalar için multipart upload
- ETags ile conditional requests

### 3. Tahmini Maliyetler

**100 GB storage, 1 TB transfer/month:**

**S3 Only:**
- Storage: $2.30
- PUT requests (10K): $0.05
- GET requests (1M): $0.40
- Data transfer: $90
- **Total: ~$93/month**

**S3 + CloudFront:**
- Storage: $2.30
- PUT requests: $0.05
- GET requests (100K only): $0.04
- Data transfer S3→CF: $20
- CloudFront transfer (1TB): $85
- **Total: ~$107/month** (%15 daha pahalı AMA çok daha hızlı + güvenli)

## Security Best Practices

- [ ] S3 bucket public access BLOCKED
- [ ] Presigned URLs kısa ömürlü (1-6 saat)
- [ ] IAM user minimal permissions
- [ ] CloudFront signed URLs (hassas içerik için)
- [ ] S3 Access Logs enabled
- [ ] MFA Delete enabled (production)
- [ ] Bucket versioning enabled
- [ ] Encryption at rest (AES-256)

## Testing

### 1. Upload Test

```bash
# Generate presigned URL
curl -X POST http://localhost:8000/api/videos/init \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test"}'

# Upload file
curl -X PUT "PRESIGNED_URL" \
  --upload-file test-video.mp4 \
  -H "Content-Type: video/mp4"
```

### 2. Download Test

```bash
# Get stream URL
curl http://localhost:8000/api/videos/VIDEO_ID/stream

# Test playback
ffplay "SIGNED_URL"
```

## Troubleshooting

**CORS Error:**
→ S3 CORS configuration doğru mu?
→ Frontend origin allowed origins'da mı?

**Presigned URL expired:**
→ Server ve client saatleri senkron mu?
→ S3_PRESIGNED_EXPIRY değeri yeterli mi?

**Upload failed:**
→ File size MAX_UPLOAD_SIZE içinde mi?
→ IAM user PutObject iznine sahip mi?

**Video not playing:**
→ Content-Type: video/mp4 header'ı var mı?
→ CORS headers doğru mu?

---

💡 **Pro Tip:** Development'ta LocalStack kullanarak local S3 simülasyonu yapabilirsiniz (maliyet tasarrufu).

