import kuralService from "@/app/service/KuralService";

export async function GET() {
    return Response.json(kuralService.random());
}
