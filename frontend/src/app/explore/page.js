'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';
import VideoCard from '@/components/VideoCard';
import { debounce } from '@/lib/utils';
import styles from './page.module.css';

export default function ExplorePage() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortBy, setSortBy] = useState('newest');
    const [typeFilter, setTypeFilter] = useState('all');
    const { showToast } = useToast();

    useEffect(() => {
        loadVideos();
    }, [sortBy, typeFilter]);

    async function loadVideos(query = '') {
        setLoading(true);
        try {
            const params = { sort: sortBy, limit: 50 };
            if (typeFilter !== 'all') params.type = typeFilter;
            if (query) params.q = query;

            const response = await api.getVideos(params);
            setVideos(response.data?.videos || []);
        } catch (error) {
            console.error('Error loading videos:', error);
            showToast('Error loading videos', 'error');
        } finally {
            setLoading(false);
        }
    }

    const debouncedSearch = debounce((query) => {
        loadVideos(query);
    }, 500);

    function handleSearch(e) {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1><i className="fas fa-compass"></i> Explore</h1>
                <p className={styles.subtitle}>Discover amazing short films from our community</p>
            </div>

            {/* Search & Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search films..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>

                <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                        <label>Type:</label>
                        {['all', 'ai', 'human'].map(type => (
                            <button
                                key={type}
                                className={`filter-btn ${typeFilter === type ? 'active' : ''}`}
                                onClick={() => setTypeFilter(type)}
                            >
                                <i className={`fas fa-${type === 'all' ? 'th' : type === 'ai' ? 'robot' : 'user'}`}></i>
                                {type === 'all' ? 'All' : type === 'ai' ? 'AI' : 'Human'}
                            </button>
                        ))}
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Sort:</label>
                        {[
                            { key: 'newest', icon: 'clock', label: 'Newest' },
                            { key: 'popular', icon: 'fire', label: 'Popular' },
                            { key: 'likes', icon: 'heart', label: 'Liked' },
                        ].map(({ key, icon, label }) => (
                            <button
                                key={key}
                                className={`filter-btn ${sortBy === key ? 'active' : ''}`}
                                onClick={() => setSortBy(key)}
                            >
                                <i className={`fas fa-${icon}`}></i> {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="spinner"></div>
            ) : videos.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="fas fa-search"></i>
                    <h3>No films found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            ) : (
                <>
                    <p className={styles.resultCount}>{videos.length} films found</p>
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
