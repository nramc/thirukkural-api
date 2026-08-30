import kuralService from "@/app/service/kural-service";

export async function GET(request: Request) {
    const searchParams = new URL(request.url).searchParams;

    // look query param q to filter kural by searching keyword
    const query = searchParams.get('q');
    const page = searchParams.get('page') ? Number.parseInt(searchParams.get('page') as string, 10) : 1;
    const limit = searchParams.get('limit') ? Number.parseInt(searchParams.get('limit') as string, 10) : 10;
    console.log(`Searching for Kurals with keywords: ${query}, page: ${page}, limit: ${limit}`);

    const result = kuralService.searchByKeyword(query ? query.split(',') : [], page, limit);
    return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
    });
}
