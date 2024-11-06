import kuralService from "@/app/service/KuralService";

export async function GET() {

    const id = getRandomKuralNumber();
    const requestedKural = kuralService.search(id);
    return Response.json(requestedKural);
}

function getRandomKuralNumber(): number {
    return Math.floor(Math.random() * 1330) + 1;
}
