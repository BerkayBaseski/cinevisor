'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import styles from '../login/page.module.css';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        setLoading(true);
        try {
            await register(email, username, password);
            showToast('Registration successful! Please sign in.', 'success');
            router.push('/login');
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <h1>Create Account</h1>
                    <p>Join the CineVisor community</p>
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
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
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
                            placeholder="Create a password"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
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
                            <><i className="fas fa-spinner fa-spin"></i> Creating Account...</>
                        ) : (
                            <><i className="fas fa-user-plus"></i> Sign Up</>
                        )}
                    </button>
                </form>

                <div className={styles.authFooter}>
                    <p>
                        Already have an account?{' '}
                        <Link href="/login" className={styles.authLink}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
