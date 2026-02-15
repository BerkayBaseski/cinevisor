'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, isLoggedIn, logout } = useAuth();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            fetchUnreadCount();
        }
    }, [isLoggedIn]);

    async function fetchUnreadCount() {
        try {
            const res = await api.getUnreadNotificationCount();
            setUnreadCount(res.data?.count || 0);
        } catch {
            // silently fail
        }
    }

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    const isActive = (path) => pathname === path;

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <i className="fas fa-video"></i>
                    <span>CineVisor</span>
                </Link>

                <button
                    className={styles.mobileToggle}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <i className={`fas fa-${mobileOpen ? 'times' : 'bars'}`}></i>
                </button>

                <div className={`${styles.navContent} ${mobileOpen ? styles.mobileOpen : ''}`}>
                    <ul className={styles.navMenu}>
                        <li>
                            <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}>
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/explore" className={`${styles.navLink} ${isActive('/explore') ? styles.active : ''}`}>
                                Explore
                            </Link>
                        </li>
                        {isLoggedIn && (
                            <li>
                                <Link href="/upload" className={`${styles.navLink} ${isActive('/upload') ? styles.active : ''}`}>
                                    Upload
                                </Link>
                            </li>
                        )}
                        <li>
                            <Link href="/ai-studio" className={`${styles.navLink} ${isActive('/ai-studio') ? styles.active : ''}`}>
                                <i className="fas fa-magic"></i> AI Studio
                                <span className={styles.betaBadge}>BETA</span>
                            </Link>
                        </li>
                        {isLoggedIn && (
                            <>
                                <li>
                                    <Link href="/notifications" className={`${styles.navLink} ${isActive('/notifications') ? styles.active : ''}`} style={{ position: 'relative' }}>
                                        <i className="fas fa-bell"></i>
                                        {unreadCount > 0 && (
                                            <span className={styles.notifBadge}>
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/profile" className={`${styles.navLink} ${isActive('/profile') ? styles.active : ''}`}>
                                        {user?.username}
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>

                    <div className={styles.navActions}>
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className={`${styles.btn} ${styles.btnSecondary}`}>
                                Logout
                            </button>
                        ) : (
                            <>
                                <Link href="/login" className={`${styles.btn} ${styles.btnSecondary}`}>
                                    Sign In
                                </Link>
                                <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
