# 📚 API Dokümantasyonu

## Base URL
```
http://localhost:8000/api
```

## Authentication

Tüm korumalı endpoint'ler JWT Bearer token gerektirir:

```
Authorization: Bearer <access_token>
```

---

## 🔐 Auth Endpoints

### Register
Yeni kullanıcı kaydı oluşturur.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

---

### Login
Kullanıcı girişi yapar ve token döner.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_jwt",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "role": "user"
    }
  }
}
```

---

### Refresh Token
Access token'ı yeniler.

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "refresh_jwt"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "access_token": "new_jwt_token",
    "expires_in": 3600
  }
}
```

---

### Logout
Kullanıcının refresh token'larını iptal eder.

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh_token": "refresh_jwt"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Get Current User
Giriş yapmış kullanıcının bilgilerini döner.

```http
GET /auth/me
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "role": "user",
    "avatar_url": null,
    "bio": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## 🎬 Video Endpoints

### Initialize Upload
Video yükleme işlemini başlatır ve presigned URL döner.

```http
POST /videos/init
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Video Title",
  "description": "Video description",
  "tags": ["sci-fi", "drama"],
  "allow_download": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "upload_id": "unique_id",
    "presigned_url": "https://s3.amazonaws.com/...",
    "s3_key": "videos/user_id/uuid.mp4",
    "expires_in": 3600,
    "max_size": 2147483648
  }
}
```

---

### Complete Upload
Video yükleme işlemini tamamlar.

```http
POST /videos/complete
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "upload_id": "unique_id",
  "s3_key": "videos/user_id/uuid.mp4",
  "title": "Video Title",
  "description": "Video description",
  "tags": ["sci-fi", "drama"],
  "allow_download": true,
  "size_bytes": 52428800,
  "duration_seconds": 180,
  "thumbnail_url": "https://..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Upload complete",
  "data": {
    "video_id": "uuid",
    "status": "pending",
    "video": { }
  }
}
```

---

### List Videos
Onaylı videoları listeler.

```http
GET /videos?sort=newest&tags=sci-fi&q=search&page=1&limit=20
```

**Query Parameters:**
- `sort`: `newest` | `popular` | `likes` (default: newest)
- `tags`: Tag filter
- `q`: Search query
- `owner_id`: Owner user ID
- `page`: Page number (default: 1)
- `limit`: Results per page (max: 100, default: 20)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "uuid",
        "title": "Video Title",
        "description": "Description",
        "tags": ["sci-fi"],
        "owner_id": "uuid",
        "owner_username": "username",
        "thumbnail_url": "https://...",
        "duration_seconds": 180,
        "views": 1234,
        "likes_count": 89,
        "comments_count": 12,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "count": 15
  }
}
```

---

### Get Video
Belirli bir videonun detaylarını döner.

```http
GET /videos/:id
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Video Title",
    "description": "Description",
    "tags": ["sci-fi"],
    "owner_id": "uuid",
    "owner_username": "username",
    "thumbnail_url": "https://...",
    "duration_seconds": 180,
    "size_bytes": 52428800,
    "allow_download": true,
    "status": "approved",
    "views": 1234,
    "likes_count": 89,
    "comments_count": 12,
    "is_liked": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### Get Stream URL
Video için stream URL'i döner.

```http
GET /videos/:id/stream
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "stream_url": "https://s3.amazonaws.com/...",
    "expires_in": 3600,
    "video": {
      "id": "uuid",
      "title": "Video Title",
      "duration_seconds": 180,
      "thumbnail_url": "https://..."
    }
  }
}
```

---

### Download Video
İndirme izni olan video için download URL döner.

```http
GET /videos/:id/download
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "download_url": "https://s3.amazonaws.com/...",
    "expires_in": 300,
    "filename": "Video Title.mp4"
  }
}
```

---

### Delete Video
Video siler (owner veya admin).

```http
DELETE /videos/:id
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

## 💬 Comment Endpoints

### Get Comments
Video yorumlarını listeler.

```http
GET /videos/:id/comments?page=1&limit=50
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "video_id": "uuid",
        "user_id": "uuid",
        "username": "username",
        "avatar_url": null,
        "content": "Great video!",
        "likes_count": 5,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "page": 1,
    "limit": 50,
    "count": 12
  }
}
```

---

### Create Comment
Yeni yorum ekler.

```http
POST /videos/:id/comments
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Great video!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Comment created",
  "data": {
    "id": "uuid",
    "video_id": "uuid",
    "user_id": "uuid",
    "username": "username",
    "content": "Great video!",
    "likes_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### Delete Comment
Yorum siler (owner veya admin).

```http
DELETE /comments/:id
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## ❤️ Like Endpoints

### Like Video
Video beğenir.

```http
POST /videos/:id/like
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Video liked",
  "data": {
    "likes_count": 90,
    "is_liked": true
  }
}
```

---

### Unlike Video
Video beğenisini kaldırır.

```http
DELETE /videos/:id/like
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Video unliked",
  "data": {
    "likes_count": 89,
    "is_liked": false
  }
}
```

---

## 🚨 Report Endpoints

### Report Video
Video şikayet eder.

```http
POST /videos/:id/report
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "spam",
  "details": "This is spam content"
}
```

**Reason Options:** `spam`, `inappropriate`, `copyright`, `misleading`, `other`

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "report_id": "uuid"
  }
}
```

---

## 👮 Admin Endpoints

### Get Pending Videos
Onay bekleyen videoları listeler (admin/moderator).

```http
GET /admin/videos/pending?page=1&limit=20
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "videos": [ ],
    "page": 1,
    "limit": 20,
    "count": 5
  }
}
```

---

### Approve Video
Video onaylar (admin/moderator).

```http
POST /admin/videos/:id/approve
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Video approved successfully",
  "data": {
    "video_id": "uuid",
    "status": "approved"
  }
}
```

---

### Reject Video
Video reddeder (admin/moderator).

```http
POST /admin/videos/:id/reject
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "Content does not meet guidelines"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Video rejected",
  "data": {
    "video_id": "uuid",
    "status": "rejected",
    "reason": "..."
  }
}
```

---

### Get Reports
Şikayetleri listeler (admin/moderator).

```http
GET /admin/reports?status=open&page=1&limit=20
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid",
        "video_id": "uuid",
        "video_title": "Video Title",
        "user_id": "uuid",
        "reporter_username": "username",
        "reason": "spam",
        "details": "...",
        "status": "open",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "count": 3
  }
}
```

---

## Error Responses

Tüm hata durumları şu formatta döner:

```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field": "Validation error"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

- **General API:** 100 requests / 60 seconds
- **Registration:** 10 requests / hour
- **Login:** 20 requests / 15 minutes
- **Comments:** 30 requests / 5 minutes
- **Upload:** 10 requests / hour
- **Reports:** 10 requests / hour

