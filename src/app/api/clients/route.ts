import { NextRequest, NextResponse } from 'next/server';
import { listClients, createClient } from '@/lib/clients';
import { ClientCreateInput } from '@/lib/types';

export async function GET() {
    try {
        const clients = listClients();
        return NextResponse.json(clients);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: ClientCreateInput = await request.json();

        if (!body.name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const client = createClient({ name: body.name });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}
