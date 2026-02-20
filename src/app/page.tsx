'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Users, FileText, Zap, Clock, Megaphone, Search, Calendar, Mail, Share2, Video, ClipboardList
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { ClientList } from '@/components/ClientList';
import { ClientForm } from '@/components/ClientForm';
import { ClientWorkspace } from '@/components/ClientWorkspace';
import { FeatureLauncher } from '@/components/FeatureLauncher';
import type { Client } from '@/lib/types';

type View = 'dashboard' | 'clients' | 'workspace' | 'features';

const featureQuickLinks = [
  { id: 'blog-post', name: 'Blog Post', icon: FileText, color: '#6366f1' },
  { id: 'ad-copy', name: 'Ad Copy', icon: Megaphone, color: '#ec4899' },
  { id: 'seo-content', name: 'SEO Content', icon: Search, color: '#f59e0b' },
  { id: 'content-brief', name: 'Content Brief', icon: ClipboardList, color: '#8b5cf6' },
  { id: 'content-calendar', name: 'Calendar', icon: Calendar, color: '#14b8a6' },
  { id: 'email-marketing', name: 'Email', icon: Mail, color: '#f97316' },
  { id: 'social-media', name: 'Social', icon: Share2, color: '#3b82f6' },
  { id: 'video-script', name: 'Video Script', icon: Video, color: '#ef4444' },
];

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleCreateClient = async (data: Record<string, string>) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchClients();
        setShowForm(false);
      }
    } catch { /* ignore */ }
  };

  const handleUpdateClient = async (data: Record<string, string>) => {
    if (!editingClient) return;
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchClients();
        setEditingClient(null);
        setShowForm(false);
      }
    } catch { /* ignore */ }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Delete this client and all their data?')) return;
    try {
      await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      fetchClients();
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
        setView('clients');
      }
    } catch { /* ignore */ }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setView('workspace');
  };

  const handleLaunchFeature = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setView('features');
  };

  const handleNavigate = (v: View) => {
    setView(v);
    if (v !== 'features') setSelectedFeatureId(null);
  };

  return (
    <>
      <Sidebar
        activeView={view}
        onNavigate={handleNavigate}
        clients={clients}
        selectedClient={selectedClient}
        onSelectClient={handleSelectClient}
      />

      <main className={`main-container ${view === 'features' ? 'narrow' : ''}`}>
        {/* ═══════ DASHBOARD ═══════ */}
        {view === 'dashboard' && (
          <div>
            <div className="dashboard-greeting">
              <h1>Content Studio</h1>
              <p>Draft, refine, and publish AI-powered content for your clients.</p>
            </div>

            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-card-label">Active Clients</div>
                <div className="stat-card-value">{clients.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Features</div>
                <div className="stat-card-value">8</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Templates</div>
                <div className="stat-card-value">8</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">AI Engines</div>
                <div className="stat-card-value">
                  <Zap size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Live
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <span className="dashboard-section-title">Quick Launch</span>
              </div>
              <div className="feature-pills">
                {featureQuickLinks.map(f => (
                  <button
                    key={f.id}
                    className="feature-pill"
                    onClick={() => handleLaunchFeature(f.id)}
                  >
                    <f.icon size={14} style={{ color: f.color }} />
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <span className="dashboard-section-title">Recent Clients</span>
                <button className="btn btn-ghost" onClick={() => setView('clients')}>
                  View all →
                </button>
              </div>
              <div className="card-grid">
                {clients.slice(0, 6).map(client => (
                  <div
                    key={client.id}
                    className="card client-card"
                    onClick={() => handleSelectClient(client)}
                  >
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
                    </div>
                  </div>
                ))}
                <div
                  className="card client-card-new"
                  onClick={() => { setEditingClient(null); setShowForm(true); }}
                >
                  <div className="client-card-new-icon">
                    <Plus size={24} />
                  </div>
                  <h3>New Client</h3>
                  <p>Create a new workspace for editorial content.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ CLIENTS ═══════ */}
        {view === 'clients' && (
          <div>
            <div className="page-header-row">
              <div className="page-header">
                <h1>Client Directory</h1>
                <p>Manage your editorial relationships and access client-specific content archives.</p>
              </div>
              <div className="page-header-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setEditingClient(null); setShowForm(true); }}
                >
                  <Plus size={14} />
                  New Client
                </button>
              </div>
            </div>
            <ClientList
              clients={clients}
              onSelect={handleSelectClient}
              onEdit={(c) => { setEditingClient(c); setShowForm(true); }}
              onDelete={handleDeleteClient}
              loading={loading}
            />
          </div>
        )}

        {/* ═══════ WORKSPACE ═══════ */}
        {view === 'workspace' && selectedClient && (
          <ClientWorkspace
            client={selectedClient}
            onLaunchFeature={handleLaunchFeature}
            onEdit={() => { setEditingClient(selectedClient); setShowForm(true); }}
            onBack={() => setView('clients')}
          />
        )}

        {/* ═══════ FEATURES ═══════ */}
        {view === 'features' && (
          <FeatureLauncher
            client={selectedClient}
            initialFeatureId={selectedFeatureId}
            clients={clients}
            onSelectClient={(c) => setSelectedClient(c)}
          />
        )}

        <footer className="app-footer">
          <p>NexusAI Editorial Studio</p>
          <p className="version">v2.0 · System Operational</p>
        </footer>
      </main>

      {showForm && (
        <ClientForm
          client={editingClient}
          onSave={editingClient ? handleUpdateClient : handleCreateClient}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
        />
      )}
    </>
  );
}
