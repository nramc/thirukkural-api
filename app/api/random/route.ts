import {NextRequest, NextResponse} from "next/server";
import kuralService from "@/app/service/KuralService";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sectionParam = searchParams.get('section');

    // If no section parameter or invalid section, return random kural from all kurals
    if (!sectionParam || (isNaN(parseInt(sectionParam, 10)) || !['1', '2', '3'].includes(sectionParam))) {
        return NextResponse.json(kuralService.random());
    }

    // Parse section parameter
    const sectionId = parseInt(sectionParam, 10);

    // Get random kural from the specified section
    return NextResponse.json(kuralService.random(sectionId));
}
