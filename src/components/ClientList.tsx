'use client';

import { Edit2, Trash2, FileText, Plus } from 'lucide-react';
import type { Client } from '@/lib/types';

interface ClientListProps {
    clients: Client[];
    onSelect: (client: Client) => void;
    onEdit: (client: Client) => void;
    onDelete: (clientId: string) => void;
    loading: boolean;
}

export function ClientList({ clients, onSelect, onEdit, onDelete, loading }: ClientListProps) {
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="empty-state">
                <FileText size={48} />
                <h3>No clients yet</h3>
                <p>Create your first client to start generating AI-powered content tailored to their brand.</p>
            </div>
        );
    }

    return (
        <div className="card-grid">
            {clients.map(client => (
                <div
                    key={client.id}
                    className="card client-card"
                    onClick={() => onSelect(client)}
                >
                    <div className="client-card-actions">
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={e => { e.stopPropagation(); onEdit(client); }}
                            title="Edit"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={e => { e.stopPropagation(); onDelete(client.id); }}
                            title="Delete"
                            style={{ color: 'var(--error)' }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    <div className="client-card-avatar">
                        {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="client-card-name">{client.name}</div>
                    <div className="client-card-subtitle">
                        {(client.documents ?? []).length} document{(client.documents ?? []).length !== 1 ? 's' : ''}
                    </div>

                    <div className="client-card-meta">
                        <div className="client-card-meta-row">
                            <span className="client-card-meta-label">Documents</span>
                            <span className="client-card-meta-value">{(client.documents ?? []).length}</span>
                        </div>
                        <div className="client-card-meta-row">
                            <span className="client-card-meta-label">Last Active</span>
                            <span className="client-card-meta-value">
                                {new Date(client.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            ))}

            {/* New client placeholder */}
            <div
                className="card client-card-new"
                onClick={() => {/* handled by parent via onEdit with null */ }}
                style={{ cursor: 'default', opacity: 0.5 }}
            >
                <div className="client-card-new-icon">
                    <Plus size={24} />
                </div>
                <h3>New Client</h3>
                <p>Create a new workspace for editorial content and assets.</p>
            </div>
        </div>
    );
}
