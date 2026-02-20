import { NextResponse } from 'next/server';
import { listFeatures } from '@/lib/features';

export async function GET() {
    const features = listFeatures().map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        icon: f.icon,
        category: f.category,
        fields: f.fields,
    }));
    return NextResponse.json(features);
}
