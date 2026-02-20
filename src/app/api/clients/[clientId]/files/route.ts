import { NextRequest, NextResponse } from 'next/server';
import { syncClientDocuments } from '@/lib/clients';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'clients');

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// GET - List uploaded files for a client
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;
    try {
        const brandDocsDir = path.join(DATA_DIR, clientId, 'brand-docs');
        const assetsDir = path.join(DATA_DIR, clientId, 'assets');
        ensureDir(brandDocsDir);
        ensureDir(assetsDir);

        const brandDocs = fs.readdirSync(brandDocsDir).map(f => ({
            name: f,
            type: 'brand-doc' as const,
            size: fs.statSync(path.join(brandDocsDir, f)).size,
        }));

        const assets = fs.readdirSync(assetsDir).map(f => ({
            name: f,
            type: 'asset' as const,
            size: fs.statSync(path.join(assetsDir, f)).size,
        }));

        return NextResponse.json({ brandDocs, assets });
    } catch {
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }
}

// POST - Upload files for a client
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;
    try {
        const clientDir = path.join(DATA_DIR, clientId);
        if (!fs.existsSync(path.join(clientDir, 'meta.json'))) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const fileType = formData.get('type') as string || 'brand-doc';

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        const targetDir = path.join(clientDir, fileType === 'asset' ? 'assets' : 'brand-docs');
        ensureDir(targetDir);

        const uploaded: { name: string; size: number }[] = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filePath = path.join(targetDir, file.name);
            fs.writeFileSync(filePath, buffer);
            uploaded.push({ name: file.name, size: buffer.length });
        }

        syncClientDocuments(clientId);

        return NextResponse.json({
            success: true,
            uploaded,
            message: `${uploaded.length} file(s) uploaded successfully`
        }, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to upload: ${msg}` }, { status: 500 });
    }
}

// DELETE - Remove a file
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('name');
        const fileType = searchParams.get('type') || 'brand-doc';

        if (!fileName) {
            return NextResponse.json({ error: 'File name required' }, { status: 400 });
        }

        const targetDir = path.join(DATA_DIR, clientId, fileType === 'asset' ? 'assets' : 'brand-docs');
        const filePath = path.join(targetDir, fileName);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        fs.unlinkSync(filePath);
        syncClientDocuments(clientId);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
