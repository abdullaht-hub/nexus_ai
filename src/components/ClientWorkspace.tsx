'use client';

import { useState, useEffect } from 'react';
import {
    ArrowLeft, Edit2, FileText, Megaphone, Search, Calendar, Mail, Share2, Video,
    ClipboardList, Zap, Clock, FolderUp
} from 'lucide-react';
import type { Client, SavedOutput } from '@/lib/types';

interface ClientWorkspaceProps {
    client: Client;
    onLaunchFeature: (featureId: string) => void;
    onEdit: () => void;
    onBack: () => void;
}

const featureCards = [
    { id: 'blog-post', name: 'Blog Post Writer', icon: FileText, color: '#6366f1' },
    { id: 'ad-copy', name: 'Ad Copy Generator', icon: Megaphone, color: '#ec4899' },
    { id: 'seo-content', name: 'SEO Content Writer', icon: Search, color: '#f59e0b' },
    { id: 'content-brief', name: 'Content Brief', icon: ClipboardList, color: '#8b5cf6' },
    { id: 'content-calendar', name: 'Content Calendar', icon: Calendar, color: '#14b8a6' },
    { id: 'email-marketing', name: 'Email Marketing', icon: Mail, color: '#f97316' },
    { id: 'social-media', name: 'Social Media Posts', icon: Share2, color: '#3b82f6' },
    { id: 'video-script', name: 'Video Script', icon: Video, color: '#ef4444' },
];

export function ClientWorkspace({ client, onLaunchFeature, onEdit, onBack }: ClientWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'history'>('overview');
    const [outputs, setOutputs] = useState<SavedOutput[]>([]);
    const [selectedOutput, setSelectedOutput] = useState<SavedOutput | null>(null);

    useEffect(() => {
        fetch(`/api/clients/${client.id}/outputs`)
            .then(r => r.json())
            .then(setOutputs)
            .catch(() => { });
    }, [client.id]);

    return (
        <div>
            {/* Client Brief Header */}
            <div className="workspace-header">
                <button className="btn btn-ghost btn-icon" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div
                    className="workspace-avatar"
                    style={{ background: 'linear-gradient(135deg, var(--primary), #b8c4d4)' }}
                >
                    {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="workspace-info">
                    <h2>{client.name}</h2>
                    <p>
                        <FolderUp size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {(client.documents ?? []).length} document{(client.documents ?? []).length !== 1 ? 's' : ''} uploaded
                    </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={onEdit}>
                    <Edit2 size={14} /> Edit
                </button>
            </div>

            {/* Tabs */}
            <div className="workspace-tabs">
                <button className={`workspace-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`workspace-tab ${activeTab === 'features' ? 'active' : ''}`} onClick={() => setActiveTab('features')}>Features</button>
                <button className={`workspace-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History ({outputs.length})</button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    <div className="workspace-details">
                        <div className="workspace-detail-card" style={{ gridColumn: 'span 2' }}>
                            <div className="workspace-detail-label">Uploaded Documents</div>
                            <div className="workspace-detail-value">
                                {(client.documents ?? []).length > 0
                                    ? (client.documents ?? []).join(', ')
                                    : 'No documents uploaded yet. Click Edit to upload brand guidelines, content samples, and more.'}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <span style={{
                            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.12em', color: 'var(--text-light)'
                        }}>
                            Quick Launch
                        </span>
                    </div>
                    <div className="card-grid">
                        {featureCards.map(f => (
                            <div key={f.id} className="card skill-card" onClick={() => onLaunchFeature(f.id)}>
                                <div className="skill-card-icon" style={{ background: `${f.color}12`, color: f.color }}>
                                    <f.icon size={20} />
                                </div>
                                <div className="skill-card-name">{f.name}</div>
                                <div className="skill-card-desc">
                                    Launch for {client.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
                <div className="card-grid">
                    {featureCards.map(f => (
                        <div key={f.id} className="card skill-card" onClick={() => onLaunchFeature(f.id)}>
                            <div className="skill-card-icon" style={{ background: `${f.color}12`, color: f.color }}>
                                <f.icon size={20} />
                            </div>
                            <div className="skill-card-name">{f.name}</div>
                            <div className="skill-card-desc">
                                Run with {client.name}&apos;s context
                            </div>
                            <div className="skill-card-category">
                                <Zap size={10} style={{ marginRight: 4, display: 'inline' }} /> Launch
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div>
                    {selectedOutput ? (
                        <div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOutput(null)} style={{ marginBottom: 16 }}>
                                <ArrowLeft size={14} /> Back to history
                            </button>
                            <div className="article-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem' }}>{selectedOutput.featureName}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{new Date(selectedOutput.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="article-prose" style={{ whiteSpace: 'pre-wrap' }}>{selectedOutput.output}</div>
                            </div>
                        </div>
                    ) : outputs.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} />
                            <h3>No outputs yet</h3>
                            <p>Launch a feature to generate content. Saved outputs will appear here.</p>
                        </div>
                    ) : (
                        <div className="output-list">
                            {outputs.map(out => (
                                <div key={out.id} className="output-item" onClick={() => setSelectedOutput(out)}>
                                    <div className="output-item-header">
                                        <span className="output-item-skill">{out.featureName}</span>
                                        <span className="output-item-date">{new Date(out.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="output-item-preview">{out.output.slice(0, 200)}...</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
