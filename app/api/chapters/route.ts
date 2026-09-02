import { NextRequest, NextResponse } from 'next/server';
import taxonomyService from '@/app/service/taxonomy-service';

export function GET(request: NextRequest) {
    const section = request.nextUrl.searchParams.get('section');
    if (section === null) {
        return NextResponse.json({ chapters: taxonomyService.getChapters() });
    }

    const sectionId = Number(section);
    if (!Number.isInteger(sectionId) || sectionId < 1 || sectionId > 3) {
        return NextResponse.json({ error: 'section must be an integer between 1 and 3' }, { status: 400 });
    }

    return NextResponse.json({ chapters: taxonomyService.getChapters(sectionId) });
}
