'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import styles from './page.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await login(email, password);
            showToast('Login successful!', 'success');
            router.push('/');
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <h1>Sign In</h1>
                    <p>Welcome back to CineVisor</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                    >
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Signing in...</>
                        ) : (
                            <><i className="fas fa-sign-in-alt"></i> Sign In</>
                        )}
                    </button>
                </form>

                <div className={styles.authFooter}>
                    <Link href="/forgot-password" className={styles.authLink}>
                        Forgot your password?
                    </Link>
                    <p>
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className={styles.authLink}>
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
