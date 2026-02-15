'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import VideoCard from '@/components/VideoCard';
import styles from './page.module.css';

export default function ProfilePage() {
    const [userVideos, setUserVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState('');
    const { user, isLoggedIn, updateUser } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        loadUserVideos();
        setBio(user?.bio || '');
    }, [isLoggedIn]);

    async function loadUserVideos() {
        try {
            const res = await api.getVideos({ owner: user?.id });
            setUserVideos(res.data?.videos || []);
        } catch (error) {
            console.warn('Could not load user videos');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveProfile() {
        try {
            const res = await api.updateProfile({ bio });
            updateUser({ ...user, bio });
            showToast('Profile updated!', 'success');
            setEditing(false);
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    if (!isLoggedIn) return null;

    return (
        <div className={styles.container}>
            <div className={styles.profileHeader}>
                <div className={styles.avatar}>
                    <i className="fas fa-user"></i>
                </div>
                <div className={styles.profileInfo}>
                    <h1>{user?.username}</h1>
                    <p className={styles.email}>{user?.email}</p>
                    <p className={styles.role}>
                        <i className="fas fa-shield-alt"></i> {user?.role || 'User'}
                    </p>
                    {editing ? (
                        <div className={styles.editBio}>
                            <textarea
                                className="form-textarea"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={3}
                            />
                            <div className={styles.editActions}>
                                <button onClick={handleSaveProfile} className="btn btn-primary">Save</button>
                                <button onClick={() => setEditing(false)} className="btn btn-secondary">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className={styles.bio}>{user?.bio || 'No bio yet'}</p>
                            <button onClick={() => setEditing(true)} className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
                                <i className="fas fa-edit"></i> Edit Profile
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <h2><i className="fas fa-film"></i> My Films ({userVideos.length})</h2>
                {loading ? (
                    <div className="spinner"></div>
                ) : userVideos.length === 0 ? (
                    <div className={styles.emptyState}>
                        <i className="fas fa-video"></i>
                        <p>You haven&apos;t uploaded any films yet</p>
                        <button onClick={() => router.push('/upload')} className="btn btn-primary">
                            <i className="fas fa-upload"></i> Upload Your First Film
                        </button>
                    </div>
                ) : (
                    <div className="video-grid">
                        {userVideos.map((video, i) => (
                            <VideoCard key={video.id} video={video} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
