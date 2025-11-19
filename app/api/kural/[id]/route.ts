import kuralService from "@/app/service/kural-service";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ id: string }> }) {

    const id = (await params).id;

    if (!id) {
        return Response.json({error: 'Kural ID is required as path parameter'}, {
            status: 400
        });
    }

    const requestedKural = kuralService.search(Number.parseInt(id));

    if (requestedKural) {
        return Response.json(requestedKural);
    } else {
        return Response.json({error: `Kural with ID:${id} not found`}, {
            status: 404
        });
    }
}