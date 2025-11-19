import {NextRequest, NextResponse} from "next/server";
import randomKuralService from "@/app/service/random-kural-service";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get('section');

    // when section number provided, return random kural from the section
    if (sectionId && ['1', '2', '3'].includes(sectionId)) {
        return NextResponse.json(randomKuralService.getRandomKuralBySection(Number.parseInt(sectionId, 10)));
    }


    // Get random kural
    return NextResponse.json(randomKuralService.getRandomKural());
}
