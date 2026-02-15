// API Client for CineVisor Platform - FastAPI Backend
import config from './config';

class APIClient {
    constructor() {
        this.baseURL = config.apiBaseUrl;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('access_token');
        }
    }

    // Video URL helpers
    getVideoUrl(videoKey) {
        return config.getVideoUrl(videoKey);
    }

    getThumbnailUrl(thumbnailKey) {
        return config.getThumbnailUrl(thumbnailKey);
    }

    setToken(token) {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('access_token', token);
            } else {
                localStorage.removeItem('access_token');
            }
        }
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return this.token || localStorage.getItem('access_token');
        }
        return this.token;
    }

    async request(endpoint, options = {}) {
        const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
        const url = `${this.baseURL}${apiEndpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Remove Content-Type for FormData
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (jsonError) {
                    const text = await response.text();
                    throw new Error(`Invalid JSON response: ${text.substring(0, 300)}`);
                }
            } else {
                const text = await response.text();
                throw new Error(`Unexpected response format (${contentType || 'unknown'}): ${text.substring(0, 300)}`);
            }

            if (!response.ok) {
                throw new Error(data.detail || data.error || data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(
                    `Cannot connect to server.\nURL: ${url}\nPlease check:\n1. Is the backend running?\n2. Is the URL correct?\n3. Are CORS settings correct?\n\nBackend health URL: ${this.baseURL}/api/health`
                );
            }
            throw error;
        }
    }

    // ==================== Auth ====================
    async register(email, username, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, username, password }),
        });
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (data.data?.access_token) {
            this.setToken(data.data.access_token);
            if (typeof window !== 'undefined') {
                localStorage.setItem('refresh_token', data.data.refresh_token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
            }
        }

        return data;
    }

    async logout() {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        try {
            await this.request('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
        } finally {
            this.setToken(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
            }
        }
    }

    async getMe() {
        return this.request('/auth/me');
    }

    async updateProfile(data) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async changePassword(data) {
        return this.request('/users/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async requestPasswordReset(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, new_password: newPassword }),
        });
    }

    // ==================== Users ====================
    async getUserProfile(userId) {
        return this.request(`/users/${userId}`);
    }

    async followUser(userId) {
        return this.request(`/users/${userId}/follow`, { method: 'POST' });
    }

    async unfollowUser(userId) {
        return this.request(`/users/${userId}/follow`, { method: 'DELETE' });
    }

    async getFollowers(userId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/users/${userId}/followers?${query}`);
    }

    async getFollowing(userId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/users/${userId}/following?${query}`);
    }

    // ==================== Notifications ====================
    async getNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/notifications?${query}`);
    }

    async markNotificationAsRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, { method: 'POST' });
    }

    async markAllNotificationsAsRead() {
        return this.request('/notifications/read-all', { method: 'POST' });
    }

    async getUnreadNotificationCount() {
        return this.request('/notifications/unread-count');
    }

    // ==================== Playlists ====================
    async getMyPlaylists(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/playlists?${query}`);
    }

    async getPlaylist(playlistId) {
        return this.request(`/playlists/${playlistId}`);
    }

    async createPlaylist(data) {
        return this.request('/playlists', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePlaylist(playlistId, data) {
        return this.request(`/playlists/${playlistId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deletePlaylist(playlistId) {
        return this.request(`/playlists/${playlistId}`, { method: 'DELETE' });
    }

    async addVideoToPlaylist(playlistId, videoId) {
        return this.request(`/playlists/${playlistId}/videos`, {
            method: 'POST',
            body: JSON.stringify({ video_id: videoId }),
        });
    }

    async removeVideoFromPlaylist(playlistId, videoId) {
        return this.request(`/playlists/${playlistId}/videos/${videoId}`, { method: 'DELETE' });
    }

    // ==================== Videos ====================
    async initUpload(metadata) {
        return this.request('/videos/init', {
            method: 'POST',
            body: JSON.stringify(metadata),
        });
    }

    async completeUpload(uploadData) {
        return this.request('/videos/complete', {
            method: 'POST',
            body: JSON.stringify(uploadData),
        });
    }

    async uploadToS3(presignedUrl, file, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve();
                } else {
                    reject(new Error('Upload failed'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('PUT', presignedUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });
    }

    async uploadLocalVideo(formData) {
        return this.request('/videos/upload-local', {
            method: 'POST',
            body: formData,
            headers: {},
        });
    }

    async getVideos(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/videos?${query}`);
    }

    async getVideo(id) {
        return this.request(`/videos/${id}`);
    }

    async getStreamUrl(id) {
        return this.request(`/videos/${id}/stream`);
    }

    async downloadVideo(id) {
        return this.request(`/videos/${id}/download`);
    }

    async deleteVideo(id) {
        return this.request(`/videos/${id}`, { method: 'DELETE' });
    }

    // ==================== Comments ====================
    async getComments(videoId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/videos/${videoId}/comments?${query}`);
    }

    async createComment(videoId, content) {
        return this.request(`/videos/${videoId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, { method: 'DELETE' });
    }

    // ==================== Likes ====================
    async likeVideo(videoId) {
        return this.request(`/videos/${videoId}/like`, { method: 'POST' });
    }

    async unlikeVideo(videoId) {
        return this.request(`/videos/${videoId}/like`, { method: 'DELETE' });
    }

    // ==================== Reports ====================
    async reportVideo(videoId, reason, details) {
        return this.request(`/videos/${videoId}/report`, {
            method: 'POST',
            body: JSON.stringify({ reason, details }),
        });
    }

    // ==================== Admin ====================
    async getPendingVideos(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/videos/pending?${query}`);
    }

    async approveVideo(id) {
        return this.request(`/admin/videos/${id}/approve`, { method: 'POST' });
    }

    async rejectVideo(id, reason) {
        return this.request(`/admin/videos/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    async getReports(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/reports?${query}`);
    }
}

// Singleton instance
const api = new APIClient();
export default api;
