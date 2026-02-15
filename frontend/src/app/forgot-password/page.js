'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';
import styles from '../login/page.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { showToast } = useToast();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.requestPasswordReset(email);
            setSent(true);
            showToast('Password reset email sent!', 'success');
        } catch (error) {
            showToast(error.message || 'Failed to send reset email', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <h1>Forgot Password</h1>
                    <p>Enter your email to receive a reset link</p>
                </div>

                {sent ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#4ade80', marginBottom: '1rem', display: 'block' }}></i>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Reset link sent to <strong>{email}</strong>
                        </p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                            Check your email and follow the instructions
                        </p>
                    </div>
                ) : (
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

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                        >
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                            ) : (
                                <><i className="fas fa-envelope"></i> Send Reset Link</>
                            )}
                        </button>
                    </form>
                )}

                <div className={styles.authFooter}>
                    <Link href="/login" className={styles.authLink}>
                        <i className="fas fa-arrow-left"></i> Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
