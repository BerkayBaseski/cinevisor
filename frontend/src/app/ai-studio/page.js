'use client';

import styles from './page.module.css';

export default function AIStudioPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.badge}>BETA</div>
                <h1><i className="fas fa-magic"></i> AI Studio</h1>
                <p className={styles.subtitle}>Create amazing short films with artificial intelligence</p>
            </div>

            <div className={styles.features}>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                        <i className="fas fa-film"></i>
                    </div>
                    <h3>Text to Video</h3>
                    <p>Transform your ideas into captivating short films using AI-powered video generation.</p>
                    <span className={styles.comingSoon}>Coming Soon</span>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
                        <i className="fas fa-music"></i>
                    </div>
                    <h3>AI Soundtrack</h3>
                    <p>Generate original music and sound effects that perfectly match your film&apos;s mood.</p>
                    <span className={styles.comingSoon}>Coming Soon</span>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                        <i className="fas fa-paint-brush"></i>
                    </div>
                    <h3>Style Transfer</h3>
                    <p>Apply artistic styles to your videos — from anime to cinematic noir.</p>
                    <span className={styles.comingSoon}>Coming Soon</span>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'linear-gradient(135deg, #14b8a6, #3b82f6)' }}>
                        <i className="fas fa-robot"></i>
                    </div>
                    <h3>AI Script Writer</h3>
                    <p>Let AI help you write compelling scripts and storyboards for your next masterpiece.</p>
                    <span className={styles.comingSoon}>Coming Soon</span>
                </div>
            </div>

            <div className={styles.cta}>
                <h2>Stay Tuned</h2>
                <p>We&apos;re building the future of AI-powered filmmaking. These features are coming soon!</p>
            </div>
        </div>
    );
}
