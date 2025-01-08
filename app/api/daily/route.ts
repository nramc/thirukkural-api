import kuralService from "@/app/service/KuralService";

export async function GET() {
    // Add CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    return Response.json(kuralService.kuralOfTheDay(), {
        headers: headers
    });
}
