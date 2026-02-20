'use client';

import { useState, useRef, useEffect } from 'react';
import {
    FileText, Megaphone, Search, Calendar, Mail, Share2, Video, ClipboardList, Zap,
    Play, Square, Copy, Check, Save, Loader2, Wrench, AlertCircle, ChevronDown, Sparkles, Info
} from 'lucide-react';
import type { Client, FeatureField } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface ModelOption {
    id: string;
    name: string;
    provider: string;
    tier: 'fast' | 'recommended' | 'premium';
    description: string;
}

interface FeatureLauncherProps {
    client: Client | null;
    initialFeatureId: string | null;
    clients: Client[];
    onSelectClient: (client: Client) => void;
}

interface FeatureMeta {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    fields: FeatureField[];
}

const iconMap: Record<string, React.ElementType> = {
    FileText, Megaphone, Search, Calendar, Mail, Share2, Video, ClipboardList,
};

const featureColors: Record<string, string> = {
    'blog-post': '#6366f1',
    'ad-copy': '#ec4899',
    'seo-content': '#f59e0b',
    'content-brief': '#8b5cf6',
    'content-calendar': '#14b8a6',
    'email-marketing': '#f97316',
    'social-media': '#3b82f6',
    'video-script': '#ef4444',
};

export function FeatureLauncher({ client, initialFeatureId, clients, onSelectClient }: FeatureLauncherProps) {
    const [features, setFeatures] = useState<FeatureMeta[]>([]);
    const [selectedFeature, setSelectedFeature] = useState<FeatureMeta | null>(null);
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [output, setOutput] = useState('');
    const [toolCalls, setToolCalls] = useState<{ name: string; status: string }[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [models, setModels] = useState<ModelOption[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [configOpen, setConfigOpen] = useState(true);
    const outputRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Fetch models
    useEffect(() => {
        fetch('/api/models')
            .then(r => r.json())
            .then((data: { models: ModelOption[]; defaultModelId: string }) => {
                setModels(data.models);
                setSelectedModelId(data.defaultModelId);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        fetch('/api/features')
            .then(r => r.json())
            .then((data: FeatureMeta[]) => {
                setFeatures(data);
                if (initialFeatureId) {
                    const found = data.find((f: FeatureMeta) => f.id === initialFeatureId);
                    if (found) selectFeature(found);
                }
            })
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectFeature = (feature: FeatureMeta) => {
        setSelectedFeature(feature);
        const defaultInputs: Record<string, string> = {};
        feature.fields.forEach(f => {
            defaultInputs[f.name] = f.defaultValue?.toString() || '';
        });
        setInputs(defaultInputs);
        setOutput('');
        setToolCalls([]);
        setError(null);
        setConfigOpen(true);
    };

    const handleRun = async () => {
        if (!client || !selectedFeature) return;

        setIsRunning(true);
        setOutput('');
        setToolCalls([]);
        setError(null);
        setSaved(false);
        setConfigOpen(false);

        abortRef.current = new AbortController();

        try {
            const res = await fetch('/api/orchestrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: client.id,
                    featureId: selectedFeature.id,
                    inputs,
                    modelId: selectedModelId || undefined,
                }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            if (!reader) throw new Error('No response body');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            switch (data.type) {
                                case 'text':
                                    setOutput(prev => prev + data.content);
                                    break;
                                case 'tool_use':
                                    setToolCalls(prev => [...prev, { name: data.toolName, status: 'running' }]);
                                    break;
                                case 'tool_result':
                                    setToolCalls(prev =>
                                        prev.map(tc =>
                                            tc.name === data.toolName ? { ...tc, status: 'done' } : tc
                                        )
                                    );
                                    break;
                                case 'error':
                                    setError(data.content);
                                    break;
                                case 'status':
                                    break;
                                case 'done':
                                    break;
                            }
                        } catch {
                            // ignore parse errors
                        }
                    }
                }
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setError((err as Error).message);
            }
        } finally {
            setIsRunning(false);
        }
    };

    const handleStop = () => {
        abortRef.current?.abort();
        setIsRunning(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!client || !selectedFeature || !output) return;
        try {
            await fetch(`/api/clients/${client.id}/outputs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    featureId: selectedFeature.id,
                    featureName: selectedFeature.name,
                    inputs,
                    output,
                }),
            });
            setSaved(true);
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, toolCalls]);

    const wordCount = output.trim() ? output.trim().split(/\s+/).length : 0;

    // ——— Feature Selection Grid ———
    if (!selectedFeature) {
        return (
            <div>
                <div className="page-header">
                    <h1>Content Library</h1>
                    <p>Select a feature to run with {client?.name || 'a client'}&apos;s context</p>
                </div>

                {!client && clients.length > 0 && (
                    <div className="status-bar">
                        <AlertCircle size={16} />
                        Select a client from the sidebar first, then choose a feature below
                    </div>
                )}

                <div className="card-grid">
                    {features.map(feature => {
                        const Icon = iconMap[feature.icon] || Zap;
                        const color = featureColors[feature.id] || '#6366f1';
                        return (
                            <div key={feature.id} className="card skill-card" onClick={() => selectFeature(feature)}>
                                <div className="skill-card-icon" style={{ background: `${color}12`, color }}>
                                    <Icon size={20} />
                                </div>
                                <div className="skill-card-name">{feature.name}</div>
                                <div className="skill-card-desc">{feature.description}</div>
                                <div className="skill-card-category">{feature.category}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ——— Feature Launcher (Collapsible Config + Article Output) ———
    const FeatureIcon = iconMap[selectedFeature.icon] || Zap;
    const color = featureColors[selectedFeature.id] || '#6366f1';

    return (
        <div>
            {/* Feature header */}
            <div className="launcher-feature-header">
                <div className="launcher-feature-info">
                    <div className="launcher-feature-icon" style={{ background: `${color}12`, color }}>
                        <FeatureIcon size={20} />
                    </div>
                    <div>
                        <div className="launcher-feature-name">{selectedFeature.name}</div>
                        <div className="launcher-feature-category">
                            Running for <strong>{client?.name}</strong>
                        </div>
                    </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedFeature(null); setOutput(''); setToolCalls([]); setError(null); }}>
                    Change Feature
                </button>
            </div>

            {!client && (
                <div className="output-error">
                    <AlertCircle size={16} />
                    Please select a client first
                </div>
            )}

            {/* ═══ Collapsible Config Panel ═══ */}
            <div className="config-panel">
                <input
                    type="checkbox"
                    className="config-toggle"
                    id="launcher-config"
                    checked={configOpen}
                    onChange={() => setConfigOpen(!configOpen)}
                />
                <label className="config-trigger" htmlFor="launcher-config">
                    <div className="config-trigger-left">
                        <div className="config-trigger-icon">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <div className="config-trigger-title">Editor Configuration</div>
                            <div className="config-trigger-subtitle">Parameters for draft generation</div>
                        </div>
                    </div>
                    <div className="config-trigger-right">
                        <span className="config-badge">Active</span>
                        <span className="config-chevron">
                            <ChevronDown size={18} />
                        </span>
                    </div>
                </label>

                <div className="config-content" style={{ maxHeight: configOpen ? '2000px' : '0' }}>
                    <div className="config-content-inner">
                        <div className="config-grid">
                            {/* Left side — Client + Model */}
                            <div className="config-sidebar">
                                {/* Client selector */}
                                <div className="form-group">
                                    <label className="form-label">Writer Context</label>
                                    <select
                                        className="form-select"
                                        value={client?.id || ''}
                                        onChange={e => {
                                            const c = clients.find(cl => cl.id === e.target.value);
                                            if (c) onSelectClient(c);
                                        }}
                                    >
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Model selector as radio cards */}
                                <div className="form-group">
                                    <label className="form-label">Creative Engine</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {models.map(m => (
                                            <label
                                                key={m.id}
                                                className={`model-option ${selectedModelId === m.id ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="model"
                                                    checked={selectedModelId === m.id}
                                                    onChange={() => setSelectedModelId(m.id)}
                                                />
                                                <div>
                                                    <span className="model-option-name">
                                                        {m.name}
                                                        {m.tier === 'recommended' && ' ★'}
                                                        {m.tier === 'premium' && ' ⚡'}
                                                    </span>
                                                    <span className="model-option-desc">
                                                        {m.provider} · {m.tier === 'recommended' ? 'Balanced quality & speed' : m.tier === 'premium' ? 'Highest quality' : 'Fast generation'}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right side — Feature fields */}
                            <div className="config-main">
                                {selectedFeature.fields.map(field => (
                                    <div key={field.name} className="form-group">
                                        <label className="form-label">
                                            {field.label} {field.required && '*'}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                className="form-textarea"
                                                value={inputs[field.name] || ''}
                                                onChange={e => setInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                placeholder={field.placeholder}
                                                rows={4}
                                            />
                                        ) : field.type === 'select' ? (
                                            <select
                                                className="form-select"
                                                value={inputs[field.name] || ''}
                                                onChange={e => setInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                                            >
                                                {field.options?.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className="form-input"
                                                type={field.type}
                                                value={inputs[field.name] || ''}
                                                onChange={e => setInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                placeholder={field.placeholder}
                                            />
                                        )}
                                    </div>
                                ))}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                                    {isRunning ? (
                                        <button className="btn btn-danger" onClick={handleStop}>
                                            <Square size={14} /> Stop
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-primary btn-lg"
                                            onClick={handleRun}
                                            disabled={!client || selectedFeature.fields.some(f => f.required && !inputs[f.name])}
                                        >
                                            <Sparkles size={16} /> Generate Draft
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Article Output ═══ */}
            <div className="article-container">
                {/* Side action buttons */}
                {output && (
                    <div className="article-side-actions">
                        <button className="article-side-btn" onClick={handleCopy} title={copied ? 'Copied!' : 'Copy text'}>
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button className="article-side-btn" onClick={handleSave} title={saved ? 'Saved!' : 'Save to history'} disabled={saved}>
                            {saved ? <Check size={16} /> : <Save size={16} />}
                        </button>
                    </div>
                )}

                <div className="article-body" ref={outputRef}>
                    {/* Error state */}
                    {error && (
                        <div className="output-error">
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    {/* Tool calls */}
                    {toolCalls.length > 0 && (
                        <div className="tool-call-panel">
                            <div className="tool-call-panel-header">
                                <Info size={12} /> Research Activity
                            </div>
                            {toolCalls.map((tc, i) => (
                                <div key={i} className="tool-call-indicator">
                                    {tc.status === 'running' ? (
                                        <Loader2 size={14} className="tool-icon" />
                                    ) : (
                                        <Wrench size={14} />
                                    )}
                                    <span>
                                        {tc.status === 'running' ? 'Running' : 'Completed'}: <strong>{tc.name.replace(/_/g, ' ')}</strong>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading state */}
                    {isRunning && !output && !error && (
                        <div className="output-loading">
                            <Loader2 size={28} className="output-loading-spinner" />
                            <p>AI is drafting your content...</p>
                        </div>
                    )}

                    {/* Streaming/complete output */}
                    {output && (
                        <div>
                            <header className="article-header">
                                <div className="article-category">
                                    {selectedFeature.category}
                                </div>
                                <h1 className="article-title">{selectedFeature.name}</h1>
                                <div className="article-meta">
                                    <div className="article-meta-item">
                                        <span className="article-meta-label">Client</span>
                                        <span className="article-meta-value">{client?.name}</span>
                                    </div>
                                    <div className="article-meta-divider" />
                                    <div className="article-meta-item">
                                        <span className="article-meta-label">Date</span>
                                        <span className="article-meta-value">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="article-meta-divider" />
                                    <div className="article-meta-item">
                                        <span className="article-meta-label">Words</span>
                                        <span className="article-meta-value">{wordCount}</span>
                                    </div>
                                </div>
                            </header>

                            <div className={`article-prose ${isRunning ? 'streaming-cursor' : ''}`}>
                                <ReactMarkdown>{output}</ReactMarkdown>
                            </div>

                            {/* Inline action bar for mobile */}
                            {!isRunning && (
                                <div className="article-footer">
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={handleSave} disabled={saved}>
                                            {saved ? <Check size={14} /> : <Save size={14} />}
                                            {saved ? 'Saved' : 'Save'}
                                        </button>
                                    </div>
                                    <div className="article-word-count">
                                        Word Count: <strong>{wordCount} words</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty state */}
                    {!output && !isRunning && !error && (
                        <div className="output-empty">
                            <FeatureIcon size={48} />
                            <h3>Ready to generate</h3>
                            <p>Fill in the configuration above and click &quot;Generate Draft&quot; to start</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
