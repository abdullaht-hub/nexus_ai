'use client';

import { PenLine, Search, Bell } from 'lucide-react';
import type { Client } from '@/lib/types';

type View = 'dashboard' | 'clients' | 'workspace' | 'features';

interface HeaderProps {
    activeView: View;
    onNavigate: (view: View) => void;
    clients: Client[];
    selectedClient: Client | null;
    onSelectClient: (client: Client) => void;
}

export function Sidebar({ activeView, onNavigate }: HeaderProps) {
    const navItems: { id: View; label: string }[] = [
        { id: 'dashboard', label: 'Studio' },
        { id: 'clients', label: 'Clients' },
        { id: 'features', label: 'Library' },
    ];

    return (
        <header className="top-header">
            <div className="header-left">
                <div className="header-brand">
                    <PenLine size={22} className="header-brand-icon" />
                    <span className="header-brand-name">
                        NexusAI
                        <span className="header-brand-sub">Editorial</span>
                    </span>
                </div>
                <nav className="header-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`header-nav-link ${activeView === item.id || (activeView === 'workspace' && item.id === 'clients') ? 'active' : ''}`}
                            onClick={() => onNavigate(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="header-right">
                <div className="header-status">
                    <span>Status:</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a' }}>
                        <span className="header-status-dot" />
                        Online
                    </span>
                </div>
                <button className="header-icon-btn">
                    <Search size={18} />
                </button>
                <button className="header-icon-btn" style={{ position: 'relative' }}>
                    <Bell size={18} />
                    <span style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--primary)', border: '2px solid var(--bg-light)'
                    }} />
                </button>
                <div className="header-avatar">U</div>
            </div>
        </header>
    );
}
