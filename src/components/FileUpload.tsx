'use client';

import { useState, useRef } from 'react';
import { Upload, File, Trash2, FileText, Image } from 'lucide-react';

interface ClientFile {
    name: string;
    type: 'brand-doc' | 'asset';
    size: number;
}

interface FileUploadProps {
    clientId: string;
    onUploadComplete?: () => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function FileUpload({ clientId, onUploadComplete }: FileUploadProps) {
    const [files, setFiles] = useState<{ brandDocs: ClientFile[]; assets: ClientFile[] }>({ brandDocs: [], assets: [] });
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadType, setUploadType] = useState<'brand-doc' | 'asset'>('brand-doc');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = async () => {
        try {
            const res = await fetch(`/api/clients/${clientId}/files`);
            const data = await res.json();
            setFiles(data);
        } catch {
            // ignore
        }
    };

    useState(() => {
        fetchFiles();
    });

    const handleUpload = async (fileList: FileList) => {
        setUploading(true);
        const formData = new FormData();
        for (let i = 0; i < fileList.length; i++) {
            formData.append('files', fileList[i]);
        }
        formData.append('type', uploadType);

        try {
            const res = await fetch(`/api/clients/${clientId}/files`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                fetchFiles();
                onUploadComplete?.();
            }
        } catch {
            // ignore
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileName: string, fileType: 'brand-doc' | 'asset') => {
        try {
            await fetch(`/api/clients/${clientId}/files?name=${encodeURIComponent(fileName)}&type=${fileType}`, {
                method: 'DELETE',
            });
            fetchFiles();
        } catch {
            // ignore
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    };

    return (
        <div>
            {/* Type selector */}
            <div className="segmented-control">
                <button
                    className={`segmented-btn ${uploadType === 'brand-doc' ? 'active' : ''}`}
                    onClick={() => setUploadType('brand-doc')}
                    type="button"
                >
                    <FileText size={12} /> Brand Docs
                </button>
                <button
                    className={`segmented-btn ${uploadType === 'asset' ? 'active' : ''}`}
                    onClick={() => setUploadType('asset')}
                    type="button"
                >
                    <Image size={12} /> Assets
                </button>
            </div>

            {/* Drop zone */}
            <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={e => e.target.files && handleUpload(e.target.files)}
                    style={{ display: 'none' }}
                />
                {uploading ? (
                    <div className="loading-spinner" style={{ margin: '0 auto' }} />
                ) : (
                    <div>
                        <Upload size={22} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                        <p>Drop {uploadType === 'brand-doc' ? 'brand documents' : 'asset files'} here</p>
                        <p className="upload-hint">or click to browse</p>
                    </div>
                )}
            </div>

            {/* Uploaded files list */}
            {files.brandDocs.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                    <div style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--text-light)', marginBottom: 6
                    }}>
                        Brand Documents ({files.brandDocs.length})
                    </div>
                    {files.brandDocs.map(f => (
                        <div key={f.name} className="file-list-item">
                            <File size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <span className="file-list-item-name">{f.name}</span>
                            <span className="file-list-item-size">{formatSize(f.size)}</span>
                            <button className="file-list-item-delete" onClick={() => handleDelete(f.name, 'brand-doc')} type="button">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {files.assets.length > 0 && (
                <div>
                    <div style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--text-light)', marginBottom: 6
                    }}>
                        Assets ({files.assets.length})
                    </div>
                    {files.assets.map(f => (
                        <div key={f.name} className="file-list-item">
                            <Image size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <span className="file-list-item-name">{f.name}</span>
                            <span className="file-list-item-size">{formatSize(f.size)}</span>
                            <button className="file-list-item-delete" onClick={() => handleDelete(f.name, 'asset')} type="button">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
