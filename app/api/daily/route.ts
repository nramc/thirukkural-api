import dailyKuralService from "@/app/service/daily-kural-service";

export async function GET() {
    const headers = {
        'Content-Type': 'application/json',
    };

    return Response.json(dailyKuralService.kuralOfTheDay(), {
        headers: headers
    });
}
