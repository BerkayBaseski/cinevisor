// API Configuration for CineVisor Platform
// Supports environment variables for different deployment targets

const config = {
  // API Base URL - defaults to FastAPI backend
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',

  // CloudFront CDN URL (for S3 video/thumbnail delivery)
  cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || '',

  // AWS S3 Direct URL
  s3Url: process.env.NEXT_PUBLIC_S3_URL || '',

  // Video URL Helper
  getVideoUrl(videoKey) {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${videoKey}`;
    } else if (this.s3Url) {
      return `${this.s3Url}/${videoKey}`;
    }
    return `${this.apiBaseUrl}/api/videos/stream/${videoKey}`;
  },

  // Thumbnail URL Helper
  getThumbnailUrl(thumbnailKey) {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${thumbnailKey}`;
    } else if (this.s3Url) {
      return `${this.s3Url}/${thumbnailKey}`;
    }
    return `${this.apiBaseUrl}/api/videos/thumbnail/${thumbnailKey}`;
  },

  // Upload Settings
  upload: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFormats: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
  },

  // Feature Flags
  features: {
    comments: true,
    likes: true,
    reports: true,
    adminPanel: true,
  },

  // Rate Limiting Info
  rateLimits: {
    api: '100 requests per minute',
    upload: '10 uploads per hour',
    comments: '30 comments per hour',
  },
};

export default config;
