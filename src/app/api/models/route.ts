import { NextResponse } from 'next/server';
import { listModels, getDefaultModel } from '@/lib/models';

export async function GET() {
    try {
        const models = await listModels();
        const defaultModel = getDefaultModel();
        return NextResponse.json({ models, defaultModelId: defaultModel.id });
    } catch {
        return NextResponse.json({ error: 'Failed to list models' }, { status: 500 });
    }
}
