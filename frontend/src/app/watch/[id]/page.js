'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { timeAgo, formatNumber } from '@/lib/utils';
import styles from './page.module.css';

export default function WatchPage({ params }) {
    const resolvedParams = use(params);
    const videoId = resolvedParams.id;
    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const videoRef = useRef(null);
    const { user, isLoggedIn } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (videoId) {
            loadVideo();
            loadComments();
        }
    }, [videoId]);

    async function loadVideo() {
        try {
            const res = await api.getVideo(videoId);
            setVideo(res.data);
            setIsLiked(res.data.is_liked || false);
            setLikesCount(res.data.likes_count || 0);
        } catch (error) {
            showToast('Error loading video', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function loadComments() {
        try {
            const res = await api.getComments(videoId);
            setComments(res.data?.comments || []);
        } catch (error) {
            console.warn('Comments not available');
        }
    }

    async function handleLike() {
        if (!isLoggedIn) {
            showToast('Login required to like videos', 'error');
            return;
        }
        try {
            if (isLiked) {
                await api.unlikeVideo(videoId);
                setIsLiked(false);
                setLikesCount(prev => prev - 1);
            } else {
                await api.likeVideo(videoId);
                setIsLiked(true);
                setLikesCount(prev => prev + 1);
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function handleComment(e) {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!isLoggedIn) {
            showToast('Login required to comment', 'error');
            return;
        }

        try {
            await api.createComment(videoId, newComment);
            setNewComment('');
            showToast('Comment posted!', 'success');
            loadComments();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function handleDeleteComment(commentId) {
        try {
            await api.deleteComment(commentId);
            showToast('Comment deleted', 'success');
            loadComments();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e) {
            const video = videoRef.current;
            if (!video) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    video.paused ? video.play() : video.pause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    video.currentTime -= 5;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    video.currentTime += 5;
                    break;
                case 'm':
                    e.preventDefault();
                    video.muted = !video.muted;
                    break;
                case 'f':
                    e.preventDefault();
                    if (video.requestFullscreen) video.requestFullscreen();
                    break;
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (loading) {
        return <div className={styles.container}><div className="spinner"></div></div>;
    }

    if (!video) {
        return (
            <div className={styles.container}>
                <div className={styles.notFound}>
                    <i className="fas fa-film"></i>
                    <h2>Video not found</h2>
                    <button onClick={() => router.push('/')} className="btn btn-primary">Go Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.playerSection}>
                {/* Video Player */}
                <div className={styles.player}>
                    <video
                        ref={videoRef}
                        controls
                        autoPlay
                        className={styles.video}
                        poster={video.thumbnail_url}
                    >
                        <source src={`${api.baseURL}/api/videos/${videoId}/stream`} type="video/mp4" />
                    </video>
                </div>

                {/* Video Info */}
                <div className={styles.videoInfo}>
                    <div className={styles.titleRow}>
                        <h1>{video.title}</h1>
                        <span className={`${styles.typeBadge} ${video.type === 'ai' ? styles.ai : styles.human}`}>
                            <i className={`fas fa-${video.type === 'ai' ? 'robot' : 'user'}`}></i>
                            {video.type === 'ai' ? ' AI Generated' : ' Human-Made'}
                        </span>
                    </div>

                    <div className={styles.metaRow}>
                        <div className={styles.metaLeft}>
                            <span><i className="fas fa-eye"></i> {formatNumber(video.views)} views</span>
                            <span><i className="fas fa-calendar"></i> {timeAgo(video.created_at)}</span>
                            <span className={styles.owner}>
                                <i className="fas fa-user"></i> @{video.owner_username}
                            </span>
                        </div>

                        <div className={styles.actions}>
                            <button
                                onClick={handleLike}
                                className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`}
                            >
                                <i className={`fas fa-heart`}></i> {formatNumber(likesCount)}
                            </button>
                            {video.allow_download && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await api.downloadVideo(videoId);
                                            window.open(res.data?.url, '_blank');
                                        } catch (error) {
                                            showToast('Download failed', 'error');
                                        }
                                    }}
                                    className={styles.actionBtn}
                                >
                                    <i className="fas fa-download"></i> Download
                                </button>
                            )}
                        </div>
                    </div>

                    {video.description && (
                        <div className={styles.description}>
                            <p>{video.description}</p>
                        </div>
                    )}

                    {video.tags && video.tags.length > 0 && (
                        <div className="tags">
                            {video.tags.map((tag, i) => (
                                <span key={i} className="tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <div className={styles.commentsSection}>
                    <h3><i className="fas fa-comments"></i> Comments ({comments.length})</h3>

                    {isLoggedIn && (
                        <form onSubmit={handleComment} className={styles.commentForm}>
                            <textarea
                                className="form-textarea"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                rows={3}
                            />
                            <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>
                                <i className="fas fa-paper-plane"></i> Post Comment
                            </button>
                        </form>
                    )}

                    <div className={styles.commentsList}>
                        {comments.length === 0 ? (
                            <p className={styles.noComments}>No comments yet. Be the first!</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className={styles.comment}>
                                    <div className={styles.commentHeader}>
                                        <span className={styles.commentAuthor}>@{comment.username}</span>
                                        <span className={styles.commentTime}>{timeAgo(comment.created_at)}</span>
                                        {(user?.id === comment.user_id || user?.role === 'admin') && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className={styles.deleteBtn}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                    <p className={styles.commentContent}>{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
