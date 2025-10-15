import {NextRequest, NextResponse} from "next/server";
import kuralService from "@/app/service/KuralService";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sectionParam = searchParams.get('section');

    // If no section parameter, return random kural from all kurals
    if (!sectionParam) {
        return NextResponse.json(kuralService.random());
    }

    // Parse and validate section parameter
    const sectionId = parseInt(sectionParam, 10);
    
    if (isNaN(sectionId) || sectionId < 1 || sectionId > 3) {
        return NextResponse.json(
            {error: "Invalid section ID. Please provide a number between 1 and 3."},
            {status: 400}
        );
    }

    // Get random kural from the specified section
    const kural = kuralService.random(sectionId);
    
    if (kural) {
        return NextResponse.json(kural);
    } else {
        return NextResponse.json(
            {error: "Kural not found for the given section"},
            {status: 404}
        );
    }
}
