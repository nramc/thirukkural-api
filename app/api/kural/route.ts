import kuralService from '@/app/service/kural-service';

export async function GET(request: Request) {
    const searchParams = new URL(request.url).searchParams;

    // look query param q to filter kural by searching keyword
    const query = searchParams.get('q');
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;
    const sectionId = searchParams.get('section') ? Number(searchParams.get('section')) : undefined;
    const chapterId = searchParams.get('chapter') ? Number(searchParams.get('chapter')) : undefined;

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return Response.json({ error: 'page must be at least 1 and limit must be between 1 and 100' }, { status: 400 });
    }
    if (sectionId !== undefined && (!Number.isInteger(sectionId) || sectionId < 1 || sectionId > 3)) {
        return Response.json({ error: 'section must be an integer between 1 and 3' }, { status: 400 });
    }
    if (chapterId !== undefined && (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 133)) {
        return Response.json({ error: 'chapter must be an integer between 1 and 133' }, { status: 400 });
    }

    const result = kuralService.searchByKeyword(query ? query.split(',') : [], page, limit, sectionId, chapterId);
    return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
    });
}
