import { NextResponse } from 'next/server';
import taxonomyService from '@/app/service/taxonomy-service';

export function GET() {
    return NextResponse.json({ sections: taxonomyService.getSections() });
}
