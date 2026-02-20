export interface ModelOption {
    id: string;
    name: string;
    provider: string;
    tier: 'fast' | 'recommended' | 'premium';
    description: string;
}

/**
 * Curated model list — hand-picked for content writing workflows.
 * Each provider has: 1 premium, 1-2 recommended, 1 fast option.
 */
const MODELS: ModelOption[] = [
    // ── Anthropic ──────────────────────────────────────────
    {
        id: 'anthropic/claude-sonnet-4.6',
        name: 'Claude Sonnet 4.6',
        provider: 'Anthropic',
        tier: 'premium',
        description: 'Anthropic\'s latest and most capable Sonnet-class model',
    },
    {
        id: 'anthropic/claude-sonnet-4',
        name: 'Claude Sonnet 4',
        provider: 'Anthropic',
        tier: 'recommended',
        description: 'Great balance of speed, quality, and cost for content writing',
    },
    {
        id: 'anthropic/claude-haiku-4.5',
        name: 'Claude Haiku 4.5',
        provider: 'Anthropic',
        tier: 'fast',
        description: 'Fastest Anthropic model — ideal for quick drafts and iteration',
    },

    // ── OpenAI ─────────────────────────────────────────────
    {
        id: 'openai/gpt-5.2',
        name: 'GPT-5.2',
        provider: 'OpenAI',
        tier: 'premium',
        description: 'OpenAI\'s latest frontier model with enhanced reasoning',
    },
    {
        id: 'openai/gpt-4.1',
        name: 'GPT-4.1',
        provider: 'OpenAI',
        tier: 'recommended',
        description: 'Strong all-rounder for content generation tasks',
    },
    {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        tier: 'fast',
        description: 'Compact and fast OpenAI model for lightweight tasks',
    },

    // ── Google ──────────────────────────────────────────────
    {
        id: 'google/gemini-3-pro-preview',
        name: 'Gemini 3 Pro',
        provider: 'Google',
        tier: 'premium',
        description: 'Google\'s flagship model for high-precision reasoning',
    },
    {
        id: 'google/gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro Preview',
        provider: 'Google',
        tier: 'recommended',
        description: 'Latest Gemini with enhanced reasoning — great for longform content',
    },
    {
        id: 'google/gemini-3-flash-preview',
        name: 'Gemini 3 Flash',
        provider: 'Google',
        tier: 'fast',
        description: 'High-speed Google model for agentic workflows',
    },

    // ── Meta ────────────────────────────────────────────────
    {
        id: 'meta-llama/llama-4-maverick',
        name: 'Llama 4 Maverick',
        provider: 'Meta',
        tier: 'recommended',
        description: 'Meta\'s strong open-weight model — excellent for creative content',
    },
    {
        id: 'meta-llama/llama-4-scout',
        name: 'Llama 4 Scout',
        provider: 'Meta',
        tier: 'fast',
        description: 'Fast and capable open model for drafting',
    },

    // ── DeepSeek ────────────────────────────────────────────
    {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1',
        provider: 'DeepSeek',
        tier: 'recommended',
        description: 'Strong reasoning model — good for analytical content',
    },
    {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3',
        provider: 'DeepSeek',
        tier: 'fast',
        description: 'Fast and cost-effective general-purpose model',
    },

    // ── Mistral ─────────────────────────────────────────────
    {
        id: 'mistralai/mistral-large-2512',
        name: 'Mistral Large 3',
        provider: 'Mistral',
        tier: 'recommended',
        description: 'Mistral\'s flagship — strong multilingual content generation',
    },
];

export async function listModels(): Promise<ModelOption[]> {
    return MODELS;
}

export function getDefaultModel(): ModelOption {
    // Default to Claude Sonnet 4.6
    return MODELS[0];
}

export function getModelsByProvider(): Record<string, ModelOption[]> {
    const grouped: Record<string, ModelOption[]> = {};
    for (const model of MODELS) {
        if (!grouped[model.provider]) grouped[model.provider] = [];
        grouped[model.provider].push(model);
    }
    return grouped;
}
