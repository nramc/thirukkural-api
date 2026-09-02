import { NextRequest, NextResponse } from 'next/server';
import randomKuralService from '@/app/service/random-kural-service';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    // when chapter number provided, return random kural from the chapter
    const chapterId = searchParams.get('chapter');
    if (chapterId) {
        const id = Number(chapterId);
        if (!Number.isInteger(id) || id < 1 || id > 133) {
            return NextResponse.json({ error: 'chapter must be an integer between 1 and 133' }, { status: 400 });
        }

        return NextResponse.json(randomKuralService.getRandomKuralByChapter(id));
    }

    // when section number provided, return random kural from the section
    const sectionId = searchParams.get('section');
    if (sectionId) {
        const id = Number(sectionId);
        if (!Number.isInteger(id) || id < 1 || id > 3) {
            return NextResponse.json({ error: 'section must be an integer between 1 and 3' }, { status: 400 });
        }

        return NextResponse.json(randomKuralService.getRandomKuralBySection(id));
    }

    // Get random kural
    return NextResponse.json(randomKuralService.getRandomKural());
}
