'use client';

import { useState } from 'react';
import { X, FolderUp } from 'lucide-react';
import type { Client } from '@/lib/types';
import { FileUpload } from './FileUpload';

interface ClientFormProps {
    client: Client | null;
    onSave: (data: Record<string, string>) => void;
    onClose: () => void;
}

export function ClientForm({ client, onSave, onClose }: ClientFormProps) {
    const [name, setName] = useState(client?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{client ? 'Edit Client' : 'New Client'}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Client Name *</label>
                            <input
                                className="form-input"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g., Acme Corp"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Doc upload section */}
                        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, marginTop: 16 }}>
                            <h4 style={{
                                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'var(--text-light)',
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8
                            }}>
                                <FolderUp size={14} /> Upload Client Docs
                            </h4>
                            <p style={{
                                fontSize: '0.75rem', color: 'var(--text-muted)',
                                marginBottom: 12, lineHeight: 1.5
                            }}>
                                Upload brand guidelines, content samples, audience reports, or style guides.
                                Supported: .txt, .md, .csv, .json, .html, .xml, .yml
                            </p>
                            {client ? (
                                <FileUpload clientId={client.id} />
                            ) : (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                    Save the client first, then upload documents.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                            {client ? 'Save Changes' : 'Create Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
