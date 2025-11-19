import kuralOfTheDayService from "@/app/service/kural-of-the-day-service";

export async function GET() {
    const headers = {
        'Content-Type': 'application/json',
    };

    return Response.json(kuralOfTheDayService.kuralOfTheDay(), {
        headers: headers
    });
}
