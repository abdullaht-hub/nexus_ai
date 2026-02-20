import { NextRequest } from 'next/server';
import { runOrchestration } from '@/lib/orchestrator';
import { OrchestrationRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const body: OrchestrationRequest = await request.json();

        if (!body.clientId || !body.featureId) {
            return new Response(
                JSON.stringify({ error: 'clientId and featureId are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of runOrchestration(body.clientId, body.featureId, body.inputs || {}, body.modelId)) {
                        controller.enqueue(encoder.encode(chunk));
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'error', content: errorMsg })}\n\n`)
                    );
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to start orchestration' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
