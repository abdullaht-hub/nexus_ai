import Firecrawl from '@mendable/firecrawl-js';
import { FeatureInput, ToolDefinition } from './types';
import { getClient, getClientDocContents } from './clients';
import { getFeature } from './features';
import { getDefaultModel } from './models';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

function getFirecrawlClient(): Firecrawl | null {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey || apiKey === 'your-firecrawl-api-key-here') {
        return null;
    }
    return new Firecrawl({ apiKey });
}

export async function executeToolCall(
    toolName: string,
    toolInput: Record<string, unknown>
): Promise<string> {
    const firecrawl = getFirecrawlClient();

    try {
        switch (toolName) {
            case 'firecrawl_scrape': {
                if (!firecrawl) {
                    return JSON.stringify({
                        error: 'FIRECRAWL_API_KEY is not configured',
                        message: 'Set FIRECRAWL_API_KEY in .env.local to enable web scraping.',
                    });
                }
                const url = toolInput.url as string;
                const onlyMainContent = toolInput.onlyMainContent !== false;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result: any = await firecrawl.scrape(url, {
                    formats: ['markdown'],
                    onlyMainContent,
                });
                if (result.success) {
                    return JSON.stringify({
                        success: true,
                        url,
                        markdown: result.markdown || '',
                        metadata: result.metadata || {},
                    });
                } else {
                    return JSON.stringify({
                        success: false,
                        url,
                        error: result.error || 'Failed to scrape URL',
                    });
                }
            }

            case 'firecrawl_search': {
                if (!firecrawl) {
                    return JSON.stringify({
                        error: 'FIRECRAWL_API_KEY is not configured',
                        message: 'Set FIRECRAWL_API_KEY in .env.local to enable web search.',
                    });
                }
                const query = toolInput.query as string;
                const limit = Math.min((toolInput.limit as number) || 5, 10);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result: any = await firecrawl.search(query, { limit });
                if (result.success && result.data) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const results = result.data.map((item: any) => ({
                        title: item.title || item.metadata?.title || '',
                        url: item.url || item.metadata?.sourceURL || '',
                        description: item.description || item.metadata?.description || '',
                        markdown: item.markdown || '',
                    }));
                    return JSON.stringify({
                        success: true,
                        query,
                        results,
                        resultCount: results.length,
                    });
                } else {
                    return JSON.stringify({
                        success: false,
                        query,
                        error: result.error || 'Search failed',
                    });
                }
            }

            default:
                return JSON.stringify({ error: `Unknown tool: ${toolName}` });
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return JSON.stringify({
            error: `Tool execution failed: ${msg}`,
            tool: toolName,
        });
    }
}

/** Convert our tool definitions to OpenAI function-calling format */
function buildOpenAITools(tools: ToolDefinition[]) {
    return tools.map(t => ({
        type: 'function' as const,
        function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema,
        },
    }));
}

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content?: string | null;
    tool_calls?: {
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
    }[];
    tool_call_id?: string;
}

export async function* runOrchestration(
    clientId: string,
    featureId: string,
    inputs: FeatureInput,
    modelId?: string
): AsyncGenerator<string> {
    const client = getClient(clientId);
    if (!client) {
        yield `data: ${JSON.stringify({ type: 'error', content: 'Client not found' })}\n\n`;
        return;
    }

    const feature = getFeature(featureId);
    if (!feature) {
        yield `data: ${JSON.stringify({ type: 'error', content: 'Feature not found' })}\n\n`;
        return;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
        yield `data: ${JSON.stringify({ type: 'error', content: 'OPENROUTER_API_KEY is not configured. Please set it in .env.local' })}\n\n`;
        return;
    }

    const docContent = getClientDocContents(clientId);
    const systemPrompt = feature.buildSystemPrompt(client, docContent);
    const userMessage = feature.buildUserMessage(inputs);
    const tools = buildOpenAITools(feature.tools);
    const selectedModel = modelId || getDefaultModel().id;

    yield `data: ${JSON.stringify({ type: 'status', content: `Running feature: ${feature.name} for client: ${client.name} (model: ${selectedModel})` })}\n\n`;

    const messages: OpenRouterMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
    ];

    let continueLoop = true;
    let iteration = 0;
    const maxIterations = 15;

    while (continueLoop && iteration < maxIterations) {
        iteration++;

        const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'NexusAI Content Engine',
            },
            body: JSON.stringify({
                model: selectedModel,
                messages,
                tools: tools.length > 0 ? tools : undefined,
                max_tokens: 8192,
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            yield `data: ${JSON.stringify({ type: 'error', content: `OpenRouter API error (${response.status}): ${errBody}` })}\n\n`;
            return;
        }

        const data = await response.json();

        if (data.error) {
            yield `data: ${JSON.stringify({ type: 'error', content: data.error.message || JSON.stringify(data.error) })}\n\n`;
            return;
        }

        const choice = data.choices?.[0];
        if (!choice) {
            yield `data: ${JSON.stringify({ type: 'error', content: 'No response from model' })}\n\n`;
            return;
        }

        const assistantMessage = choice.message;

        // Emit text content
        if (assistantMessage.content) {
            yield `data: ${JSON.stringify({ type: 'text', content: assistantMessage.content })}\n\n`;
        }

        // Handle tool calls
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // Add assistant message with tool calls to conversation
            messages.push({
                role: 'assistant',
                content: assistantMessage.content || null,
                tool_calls: assistantMessage.tool_calls,
            });

            // Execute each tool call and add results
            for (const toolCall of assistantMessage.tool_calls) {
                const fnName = toolCall.function.name;
                let fnArgs: Record<string, unknown> = {};
                try {
                    fnArgs = JSON.parse(toolCall.function.arguments);
                } catch {
                    // ignore parse errors
                }

                yield `data: ${JSON.stringify({ type: 'tool_use', toolName: fnName, toolInput: fnArgs })}\n\n`;

                const result = await executeToolCall(fnName, fnArgs);

                yield `data: ${JSON.stringify({ type: 'tool_result', toolName: fnName, content: result })}\n\n`;

                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: result,
                });
            }
        } else {
            // No tool calls — we're done
            continueLoop = false;
        }

        if (choice.finish_reason === 'stop') {
            continueLoop = false;
        }
    }

    yield `data: ${JSON.stringify({ type: 'done' })}\n\n`;
}
