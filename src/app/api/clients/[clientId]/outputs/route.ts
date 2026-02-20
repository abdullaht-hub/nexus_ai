import { NextRequest, NextResponse } from 'next/server';
import { listOutputs, saveOutput } from '@/lib/clients';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;
    try {
        const outputs = listOutputs(clientId);
        return NextResponse.json(outputs);
    } catch {
        return NextResponse.json({ error: 'Failed to list outputs' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;
    try {
        const body = await request.json();
        const saved = saveOutput(clientId, {
            clientId,
            featureId: body.featureId,
            featureName: body.featureName,
            inputs: body.inputs,
            output: body.output,
        });
        return NextResponse.json(saved, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to save output' }, { status: 500 });
    }
}
