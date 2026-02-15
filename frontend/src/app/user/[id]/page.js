'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import VideoCard from '@/components/VideoCard';
import { formatNumber } from '@/lib/utils';
import styles from './page.module.css';

export default function UserPage({ params }) {
    const resolvedParams = use(params);
    const userId = resolvedParams.id;
    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const { user, isLoggedIn } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (userId) {
            loadProfile();
            loadUserVideos();
        }
    }, [userId]);

    async function loadProfile() {
        try {
            const res = await api.getUserProfile(userId);
            setProfile(res.data);
            setIsFollowing(res.data.is_following || false);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadUserVideos() {
        try {
            const res = await api.getVideos({ owner: userId });
            setVideos(res.data?.videos || []);
        } catch (error) {
            console.warn('Could not load videos');
        }
    }

    async function handleFollow() {
        if (!isLoggedIn) {
            showToast('Login required', 'error');
            return;
        }
        try {
            if (isFollowing) {
                await api.unfollowUser(userId);
                setIsFollowing(false);
                showToast('Unfollowed', 'info');
            } else {
                await api.followUser(userId);
                setIsFollowing(true);
                showToast('Following!', 'success');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    if (loading) return <div style={{ padding: '4rem' }}><div className="spinner"></div></div>;
    if (!profile) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>User not found</div>;

    return (
        <div className={styles.container}>
            <div className={styles.profileHeader}>
                <div className={styles.avatar}>
                    <i className="fas fa-user"></i>
                </div>
                <div className={styles.info}>
                    <h1>{profile.username}</h1>
                    <p className={styles.bio}>{profile.bio || 'No bio'}</p>
                    <div className={styles.stats}>
                        <span><strong>{formatNumber(profile.followers_count || 0)}</strong> Followers</span>
                        <span><strong>{formatNumber(profile.following_count || 0)}</strong> Following</span>
                        <span><strong>{formatNumber(videos.length)}</strong> Films</span>
                    </div>
                    {isLoggedIn && user?.id !== userId && (
                        <button
                            onClick={handleFollow}
                            className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ marginTop: '1rem' }}
                        >
                            <i className={`fas fa-${isFollowing ? 'user-check' : 'user-plus'}`}></i>
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    )}
                </div>
            </div>

            <h2 style={{ marginBottom: '1.5rem' }}><i className="fas fa-film" style={{ color: 'var(--netflix-red)' }}></i> Films</h2>
            {videos.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>No films uploaded yet</p>
            ) : (
                <div className="video-grid">
                    {videos.map((video, i) => (
                        <VideoCard key={video.id} video={video} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
