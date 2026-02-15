// Utility functions for CineVisor Platform

export function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return Math.floor(seconds) + ' seconds ago';
}

export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatNumber(num) {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function getValidThumbnail(video) {
    const shortTitle = video.title?.length > 25 ? video.title.substring(0, 25) + '...' : video.title || 'Untitled';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23141414;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%231a1a1a;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='1280' height='720'/%3E%3Ctext fill='%23E50914' font-family='Arial,sans-serif' font-size='64' font-weight='bold' x='50%25' y='45%25' text-anchor='middle'%3E📽️%3C/text%3E%3Ctext fill='%23ffffff' font-family='Arial,sans-serif' font-size='32' x='50%25' y='60%25' text-anchor='middle'%3E${encodeURIComponent(shortTitle)}%3C/text%3E%3C/svg%3E`;
}

export function isLoggedIn() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
}

export function getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}
