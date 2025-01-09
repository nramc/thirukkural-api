import kuralService from "@/app/service/KuralService";

export async function GET() {
    const headers = {
        'Content-Type': 'application/json',
    };

    return Response.json(kuralService.kuralOfTheDay(), {
        headers: headers
    });
}
