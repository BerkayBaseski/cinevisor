'use client';

import Link from 'next/link';
import { timeAgo, formatNumber, getValidThumbnail } from '@/lib/utils';
import styles from './VideoCard.module.css';

export default function VideoCard({ video, index = 0 }) {
    return (
        <Link
            href={`/watch/${video.id}`}
            className={styles.card}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            <div className={styles.thumbnailWrapper}>
                <img
                    src={getValidThumbnail(video)}
                    alt={video.title}
                    className={styles.thumbnail}
                    loading="lazy"
                />
                <div className={`${styles.typeBadge} ${video.type === 'ai' ? styles.ai : styles.human}`}>
                    <i className={`fas fa-${video.type === 'ai' ? 'robot' : 'user'}`}></i>
                    {video.type === 'ai' ? ' AI' : ' HUMAN'}
                </div>
                <div className={styles.playOverlay}>
                    <i className="fas fa-play"></i>
                </div>
            </div>
            <div className={styles.info}>
                <h3 className={styles.title}>{video.title}</h3>
                <div className={styles.meta}>
                    <span className={styles.username}>@{video.owner_username}</span>
                    <span>{timeAgo(video.created_at)}</span>
                </div>
                <div className={styles.stats}>
                    <span className={styles.stat}>
                        <i className="fas fa-eye"></i> {formatNumber(video.views)}
                    </span>
                    <span className={styles.stat}>
                        <i className="fas fa-heart"></i> {formatNumber(video.likes_count)}
                    </span>
                    <span className={styles.stat}>
                        <i className="fas fa-comment"></i> {formatNumber(video.comments_count)}
                    </span>
                </div>
            </div>
        </Link>
    );
}
