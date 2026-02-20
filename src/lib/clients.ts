import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Client, ClientCreateInput, SavedOutput } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'clients');

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function clientDir(clientId: string) {
    return path.join(DATA_DIR, clientId);
}

function metaPath(clientId: string) {
    return path.join(clientDir(clientId), 'meta.json');
}

export function listClients(): Client[] {
    ensureDir(DATA_DIR);
    const dirs = fs.readdirSync(DATA_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());

    const clients: Client[] = [];
    for (const dir of dirs) {
        const mp = path.join(DATA_DIR, dir.name, 'meta.json');
        if (fs.existsSync(mp)) {
            const data = JSON.parse(fs.readFileSync(mp, 'utf-8'));
            clients.push(data);
        }
    }
    return clients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getClient(clientId: string): Client | null {
    const mp = metaPath(clientId);
    if (!fs.existsSync(mp)) return null;
    return JSON.parse(fs.readFileSync(mp, 'utf-8'));
}

export function createClient(input: ClientCreateInput): Client {
    const id = uuidv4();
    const now = new Date().toISOString();
    const client: Client = {
        id,
        name: input.name,
        documents: [],
        createdAt: now,
        updatedAt: now,
    };

    const dir = clientDir(id);
    ensureDir(dir);
    ensureDir(path.join(dir, 'brand-docs'));
    ensureDir(path.join(dir, 'assets'));
    ensureDir(path.join(dir, 'outputs'));

    fs.writeFileSync(metaPath(id), JSON.stringify(client, null, 2));
    return client;
}

export function updateClient(clientId: string, input: Partial<ClientCreateInput>): Client | null {
    const existing = getClient(clientId);
    if (!existing) return null;

    const updated: Client = {
        ...existing,
        ...input,
        updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(metaPath(clientId), JSON.stringify(updated, null, 2));
    return updated;
}

/** Update the documents list in the client meta after file changes */
export function syncClientDocuments(clientId: string): Client | null {
    const existing = getClient(clientId);
    if (!existing) return null;

    const docsDir = path.join(clientDir(clientId), 'brand-docs');
    ensureDir(docsDir);
    const documents = fs.readdirSync(docsDir);

    const updated: Client = {
        ...existing,
        documents,
        updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(metaPath(clientId), JSON.stringify(updated, null, 2));
    return updated;
}

export function deleteClient(clientId: string): boolean {
    const dir = clientDir(clientId);
    if (!fs.existsSync(dir)) return false;
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
}

export function saveOutput(clientId: string, output: Omit<SavedOutput, 'id' | 'createdAt'>): SavedOutput {
    const dir = path.join(clientDir(clientId), 'outputs');
    ensureDir(dir);

    const saved: SavedOutput = {
        ...output,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
    };

    const filePath = path.join(dir, `${saved.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(saved, null, 2));
    return saved;
}

export function listOutputs(clientId: string): SavedOutput[] {
    const dir = path.join(clientDir(clientId), 'outputs');
    ensureDir(dir);

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const outputs: SavedOutput[] = files.map(f => {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    });

    return outputs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBrandDocs(clientId: string): string[] {
    const dir = path.join(clientDir(clientId), 'brand-docs');
    ensureDir(dir);
    return fs.readdirSync(dir);
}

/** Read all text-based docs from brand-docs/ and return their concatenated content */
export function getClientDocContents(clientId: string): string {
    const dir = path.join(clientDir(clientId), 'brand-docs');
    ensureDir(dir);

    const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.html', '.xml', '.yml', '.yaml'];
    const files = fs.readdirSync(dir);
    const parts: string[] = [];

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (TEXT_EXTENSIONS.includes(ext)) {
            try {
                const content = fs.readFileSync(path.join(dir, file), 'utf-8');
                parts.push(`--- ${file} ---\n${content}`);
            } catch {
                // skip unreadable files
            }
        }
    }

    return parts.join('\n\n');
}
