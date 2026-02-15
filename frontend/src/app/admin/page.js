'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { timeAgo } from '@/lib/utils';
import styles from './page.module.css';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingVideos, setPendingVideos] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, isLoggedIn, isAdmin } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn || !isAdmin) {
            router.push('/');
            return;
        }
        loadData();
    }, [isLoggedIn, isAdmin]);

    async function loadData() {
        setLoading(true);
        try {
            const [pendingRes, reportsRes] = await Promise.allSettled([
                api.getPendingVideos(),
                api.getReports(),
            ]);
            if (pendingRes.status === 'fulfilled') setPendingVideos(pendingRes.value.data?.videos || []);
            if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data?.reports || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(videoId) {
        try {
            await api.approveVideo(videoId);
            showToast('Video approved!', 'success');
            setPendingVideos(prev => prev.filter(v => v.id !== videoId));
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function handleReject(videoId) {
        const reason = prompt('Rejection reason:');
        if (!reason) return;
        try {
            await api.rejectVideo(videoId, reason);
            showToast('Video rejected', 'info');
            setPendingVideos(prev => prev.filter(v => v.id !== videoId));
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    if (!isAdmin) return null;

    return (
        <div className={styles.container}>
            <h1><i className="fas fa-shield-alt"></i> Admin Panel</h1>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'pending' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    <i className="fas fa-clock"></i> Pending ({pendingVideos.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'reports' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <i className="fas fa-flag"></i> Reports ({reports.length})
                </button>
            </div>

            {loading ? (
                <div className="spinner"></div>
            ) : activeTab === 'pending' ? (
                <div className={styles.list}>
                    {pendingVideos.length === 0 ? (
                        <p className={styles.empty}>No pending videos</p>
                    ) : (
                        pendingVideos.map(video => (
                            <div key={video.id} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <h3>{video.title}</h3>
                                    <p>by @{video.owner_username} • {timeAgo(video.created_at)}</p>
                                    <span className={`${styles.badge} ${video.type === 'ai' ? styles.aiBadge : styles.humanBadge}`}>
                                        {video.type === 'ai' ? 'AI' : 'Human'}
                                    </span>
                                </div>
                                <div className={styles.itemActions}>
                                    <button onClick={() => handleApprove(video.id)} className="btn btn-primary">
                                        <i className="fas fa-check"></i> Approve
                                    </button>
                                    <button onClick={() => handleReject(video.id)} className="btn btn-danger">
                                        <i className="fas fa-times"></i> Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className={styles.list}>
                    {reports.length === 0 ? (
                        <p className={styles.empty}>No reports</p>
                    ) : (
                        reports.map(report => (
                            <div key={report.id} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <h3>Report: {report.reason}</h3>
                                    <p>{report.details}</p>
                                    <span>{timeAgo(report.created_at)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
