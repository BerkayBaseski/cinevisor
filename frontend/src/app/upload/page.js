'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import config from '@/lib/config';
import styles from './page.module.css';

export default function UploadPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [filmType, setFilmType] = useState('ai');
    const [allowDownload, setAllowDownload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [aiModel, setAiModel] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const fileInputRef = useRef(null);
    const { isLoggedIn } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!config.upload.allowedFormats.includes(file.type)) {
            showToast('Invalid file format. Supported: MP4, WebM, MOV, AVI', 'error');
            return;
        }

        if (file.size > config.upload.maxFileSize) {
            showToast('File too large. Maximum 500MB', 'error');
            return;
        }

        setSelectedFile(file);
        showToast('File selected successfully', 'success');
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!isLoggedIn) {
            showToast('Please login to upload', 'error');
            router.push('/login');
            return;
        }

        if (!selectedFile) {
            showToast('Please select a video file', 'error');
            return;
        }

        if (!title.trim()) {
            showToast('Please enter a title', 'error');
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            // Step 1: Initialize upload
            const initRes = await api.initUpload({
                title: title.trim(),
                description: description.trim(),
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                type: filmType,
                allow_download: allowDownload,
                ai_model: filmType === 'ai' ? aiModel : undefined,
                ai_prompt: filmType === 'ai' ? aiPrompt : undefined,
            });

            const { uploadId, presignedUrl, s3_key } = initRes.data;

            if (presignedUrl) {
                // Step 2: Upload to S3
                setProgress(10);
                await api.uploadToS3(presignedUrl, selectedFile, (percent) => {
                    setProgress(10 + (percent * 0.8));
                });

                // Step 3: Complete upload
                setProgress(90);
                await api.completeUpload({
                    uploadId,
                    s3_key,
                    size_bytes: selectedFile.size,
                    duration_seconds: 0,
                });
            } else {
                // Local upload fallback
                const formData = new FormData();
                formData.append('video', selectedFile);
                formData.append('title', title.trim());
                formData.append('description', description.trim());
                formData.append('tags', tags);
                formData.append('type', filmType);
                formData.append('allow_download', allowDownload);

                await api.uploadLocalVideo(formData);
            }

            setProgress(100);
            showToast('Upload successful! Your video is pending review.', 'success');
            setTimeout(() => router.push('/'), 2000);
        } catch (error) {
            showToast(error.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.uploadCard}>
                <h1><i className="fas fa-cloud-upload-alt"></i> Upload Film</h1>
                <p className={styles.subtitle}>Share your cinematic creation with the world</p>

                <form onSubmit={handleSubmit}>
                    {/* Film Type Selection */}
                    <div className={styles.typeSelection}>
                        <label className="form-label">Film Type</label>
                        <div className={styles.typeCards}>
                            <div
                                className={`${styles.typeCard} ${filmType === 'ai' ? styles.activeAi : ''}`}
                                onClick={() => setFilmType('ai')}
                            >
                                <div className={styles.typeIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                                    <i className="fas fa-robot"></i>
                                </div>
                                <strong>AI Generated</strong>
                                <p>Created with AI tools</p>
                            </div>
                            <div
                                className={`${styles.typeCard} ${filmType === 'human' ? styles.activeHuman : ''}`}
                                onClick={() => setFilmType('human')}
                            >
                                <div className={styles.typeIcon} style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
                                    <i className="fas fa-user"></i>
                                </div>
                                <strong>Human-Made</strong>
                                <p>Traditional filmmaking</p>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="form-group">
                        <label className="form-label">Video File</label>
                        <div
                            className={`${styles.dropzone} ${selectedFile ? styles.hasFile : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            {selectedFile ? (
                                <div className={styles.fileInfo}>
                                    <i className="fas fa-check-circle" style={{ color: '#4ade80' }}></i>
                                    <span>{selectedFile.name}</span>
                                    <span className={styles.fileSize}>
                                        ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                                    </span>
                                </div>
                            ) : (
                                <div className={styles.dropzoneContent}>
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    <p>Click to select video file</p>
                                    <span>MP4, WebM, MOV — Max 500MB</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter film title"
                            required
                            maxLength={200}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your film..."
                            rows={4}
                        />
                    </div>

                    {/* Tags */}
                    <div className="form-group">
                        <label className="form-label">Tags (comma separated)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="drama, sci-fi, experimental"
                        />
                    </div>

                    {/* AI-specific fields */}
                    {filmType === 'ai' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">AI Model Used</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={aiModel}
                                    onChange={(e) => setAiModel(e.target.value)}
                                    placeholder="e.g., Sora, RunwayML, Pika..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">AI Prompt</label>
                                <textarea
                                    className="form-textarea"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="What prompt did you use?"
                                    rows={3}
                                />
                            </div>
                        </>
                    )}

                    {/* Allow Download */}
                    <div className={styles.checkbox}>
                        <input
                            type="checkbox"
                            id="allow-download"
                            checked={allowDownload}
                            onChange={(e) => setAllowDownload(e.target.checked)}
                        />
                        <label htmlFor="allow-download">Allow viewers to download this film</label>
                    </div>

                    {/* Progress Bar */}
                    {uploading && (
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                            <span className={styles.progressText}>{Math.round(progress)}%</span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading || !selectedFile}
                        style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', marginTop: '1rem' }}
                    >
                        {uploading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                        ) : (
                            <><i className="fas fa-upload"></i> Upload Film</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
