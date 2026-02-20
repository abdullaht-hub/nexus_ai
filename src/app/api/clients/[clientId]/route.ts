import { NextRequest, NextResponse } from 'next/server';
import { getClient, updateClient, deleteClient } from '@/lib/clients';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;
    const client = getClient(clientId);
    if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;
    const body = await request.json();
    const updated = updateClient(clientId, body);
    if (!updated) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;
    const deleted = deleteClient(clientId);
    if (!deleted) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
}
