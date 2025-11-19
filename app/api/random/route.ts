import {NextRequest, NextResponse} from "next/server";
import kuralService from "@/app/service/KuralService";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sectionParam = searchParams.get('section');

    // when section number provided, return random kural from the section
    if (sectionParam && ['1', '2', '3'].includes(sectionParam)) {
        return NextResponse.json(kuralService.random(Number.parseInt(sectionParam, 10)));
    }


    // Get random kural
    return NextResponse.json(kuralService.random());
}
