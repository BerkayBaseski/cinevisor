'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { timeAgo } from '@/lib/utils';
import styles from './page.module.css';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isLoggedIn } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        loadNotifications();
    }, [isLoggedIn]);

    async function loadNotifications() {
        try {
            const res = await api.getNotifications();
            setNotifications(res.data?.notifications || []);
        } catch (error) {
            console.warn('Notifications not available');
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkAllRead() {
        try {
            await api.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function handleMarkRead(id) {
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.warn('Could not mark notification');
        }
    }

    function getNotifIcon(type) {
        switch (type) {
            case 'like': return 'heart';
            case 'comment': return 'comment';
            case 'follow': return 'user-plus';
            case 'video_approved': return 'check-circle';
            case 'video_rejected': return 'times-circle';
            default: return 'bell';
        }
    }

    if (!isLoggedIn) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1><i className="fas fa-bell"></i> Notifications</h1>
                {notifications.some(n => !n.is_read) && (
                    <button onClick={handleMarkAllRead} className="btn btn-secondary">
                        <i className="fas fa-check-double"></i> Mark All Read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="spinner"></div>
            ) : notifications.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`${styles.notif} ${!notif.is_read ? styles.unread : ''}`}
                            onClick={() => handleMarkRead(notif.id)}
                        >
                            <div className={styles.notifIcon}>
                                <i className={`fas fa-${getNotifIcon(notif.type)}`}></i>
                            </div>
                            <div className={styles.notifContent}>
                                <p>{notif.message}</p>
                                <span className={styles.notifTime}>{timeAgo(notif.created_at)}</span>
                            </div>
                            {!notif.is_read && <div className={styles.unreadDot}></div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
