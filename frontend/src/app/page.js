'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import VideoCard from '@/components/VideoCard';
import styles from './page.module.css';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSort, setCurrentSort] = useState('newest');
  const [currentType, setCurrentType] = useState('all');
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos(sort = 'newest', type = 'all') {
    setLoading(true);
    try {
      const params = { sort, limit: 20 };
      if (type !== 'all') {
        params.type = type;
      }

      const response = await api.getVideos(params);
      setVideos(response.data?.videos || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(sort) {
    setCurrentSort(sort);
    loadVideos(sort, currentType);
  }

  function handleTypeFilter(type) {
    setCurrentType(type);
    const typeLabels = { all: 'All Films', ai: 'AI Films', human: 'Human-Made Films' };
    showToast(`Filtering: ${typeLabels[type]}`, 'info');
    loadVideos(currentSort, type);
  }

  function handleUploadClick() {
    if (isLoggedIn) {
      router.push('/upload');
    } else {
      showToast('You must login to upload videos', 'error');
      setTimeout(() => router.push('/login'), 1500);
    }
  }

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow}></div>
        <h1 className={styles.heroTitle}>
          Discover Short Films<br />Like Never Before
        </h1>
        <p className={styles.heroSubtitle}>
          Explore AI-generated and human-made cinematic masterpieces
        </p>
        <p className={styles.heroTypes}>
          <i className="fas fa-robot" style={{ color: 'var(--netflix-red)' }}></i> AI Films &nbsp;|&nbsp;
          <i className="fas fa-user" style={{ color: 'var(--netflix-red)' }}></i> Human-Made
        </p>

        {/* Type Filter Buttons */}
        <div className={styles.typeFilters}>
          {['all', 'ai', 'human'].map(type => (
            <button
              key={type}
              onClick={() => handleTypeFilter(type)}
              className={`btn ${currentType === type ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '1rem', padding: '0.75rem 2rem', transition: 'all 0.3s ease', transform: currentType === type ? 'scale(1.05)' : 'scale(1)' }}
            >
              <i className={`fas fa-${type === 'all' ? 'th' : type === 'ai' ? 'robot' : 'user'}`}></i>
              {type === 'all' ? ' All Films' : type === 'ai' ? ' AI Films' : ' Human-Made'}
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className={styles.ctaButtons}>
          <Link href="/explore" className="btn btn-outline" style={{ fontSize: '1.1rem', padding: '0.85rem 2.5rem' }}>
            <i className="fas fa-compass"></i> Explore
          </Link>
          <button onClick={handleUploadClick} className="btn btn-outline" style={{ fontSize: '1.1rem', padding: '0.85rem 2.5rem' }}>
            <i className="fas fa-cloud-upload-alt"></i> Upload Film
          </button>
        </div>
      </section>

      {/* Popular Films Section */}
      <div className={styles.sectionHeader}>
        <h2><i className="fas fa-fire"></i> Popular Films</h2>
        <div className={styles.sortButtons}>
          {[
            { key: 'newest', icon: 'clock', label: 'Newest' },
            { key: 'popular', icon: 'fire', label: 'Popular' },
            { key: 'likes', icon: 'heart', label: 'Most Liked' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`filter-btn ${currentSort === key ? 'active' : ''}`}
              onClick={() => handleSort(key)}
            >
              <i className={`fas fa-${icon}`}></i> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Videos */}
      {loading ? (
        <div className="spinner"></div>
      ) : videos.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-film"></i>
          <p>No {currentType === 'all' ? 'videos' : currentType === 'ai' ? 'AI films' : 'human-made films'} found</p>
          <p className={styles.emptyHint}>Try selecting a different category</p>
        </div>
      ) : (
        <>
          <div className={styles.videoCount}>
            <p>
              Showing {currentType === 'all' ? 'All Films' : currentType === 'ai' ? 'AI Films' : 'Human-Made Films'}
              <span className={styles.countBadge}>{videos.length}</span>
            </p>
          </div>
          <div className="video-grid">
            {videos.map((video, index) => (
              <VideoCard key={video.id} video={video} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
