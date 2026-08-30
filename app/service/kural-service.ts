import fs from 'node:fs';
import path from 'node:path';
import { Kural, KuralsDb } from '@/app/domain/kurals-db';

type KuralPageable = { results: Kural[]; total: number; page: number; limit: number };

class KuralService {
    private readonly kurals: Kural[];

    constructor() {
        this.kurals = this.loadKurals();
    }

    // Load the JSON data once when the service is instantiated
    private loadKurals(): Kural[] {
        const kuralsDB = JSON.parse(fs.readFileSync(path.resolve('public/data/kurals.json'), 'utf-8')) as KuralsDb;
        return kuralsDB.kurals;
    }

    // Search function to find Kurals based on ID
    public search(id: number): Kural | undefined {
        return this.kurals.find((kural) => kural.number === id);
    }

    // search kural by query param q and pagination
    public searchByKeyword(keywords: string[], page: number = 1, limit: number = 10): KuralPageable {
        let filteredKurals:Kural[] = [];

        if(keywords.length > 0) {
            filteredKurals = this.kurals.filter((kural) => {
                const filterByKeywordPredicate = (kw: string) =>
                    kural.kural[0].includes(kw) || kural.kural[1].includes(kw) || Object.values(kural.meaning).some((meaning) => meaning.includes(kw));
                return keywords.some(filterByKeywordPredicate);
            });
        } else {
            filteredKurals = this.kurals;
        }

        const total = filteredKurals.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const results = filteredKurals.slice(startIndex, endIndex);
        return { results, total, page, limit };
    }
}

const kuralService = new KuralService();
export default kuralService;
