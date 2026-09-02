import fs from 'node:fs';
import path from 'node:path';
import {Kural} from '@/app/domain/kurals-db';
import taxonomyService from '@/app/service/taxonomy-service';

type KuralPageable = { results: Kural[]; total: number; page: number; limit: number };
type StoredKural = Omit<Kural, 'section' | 'chapter'> & {
    sectionId: number;
    chapterId: number;
};

class KuralService {
    private readonly kurals: Kural[];

    constructor() {
        this.kurals = this.loadKurals();
    }

    // Load the JSON data once when the service is instantiated
    private loadKurals(): Kural[] {
        const kuralsDB = JSON.parse(fs.readFileSync(path.resolve('public/data/kurals.json'), 'utf-8')) as {
            kurals: StoredKural[]
        };
        return kuralsDB.kurals.map(({sectionId, chapterId, ...kural}) => {
            const section = taxonomyService.getSection(sectionId);
            const chapter = taxonomyService.getChapter(chapterId);
            if (!section || !chapter || chapter.sectionId !== section.id || kural.number < chapter.firstKural || kural.number > chapter.lastKural) {
                throw new Error(`Kural ${kural.number} does not map to valid taxonomy data`);
            }

            return {
                ...kural,
                section: {id: section.id, names: section.names},
                chapter: {id: chapter.id, names: chapter.names},
            };
        });
    }

    // Search function to find Kurals based on ID
    public search(id: number): Kural | undefined {
        return this.kurals.find((kural) => kural.number === id);
    }

    // search kural by query param q and pagination
    public searchByKeyword(keywords: string[], page: number = 1, limit: number = 10, sectionId?: number, chapterId?: number): KuralPageable {
        let filteredKurals: Kural[];

        if (keywords.length > 0) {
            filteredKurals = this.kurals.filter((kural) => {
                const filterByKeywordPredicate = (kw: string) =>
                    kural.kural.some((kural) => kural.includes(kw)) ||
                    kural.transliteration.some((line) => line.includes(kw)) ||
                    Object.values(kural.meaning).some((meaning) => meaning.includes(kw));
                return keywords.some(filterByKeywordPredicate);
            });
        } else {
            filteredKurals = this.kurals;
        }

        filteredKurals = filteredKurals.filter(
            (kural) =>
                (chapterId === undefined || kural.chapter.id === chapterId) &&
                (chapterId !== undefined || sectionId === undefined || kural.section.id === sectionId),
        );

        const total = filteredKurals.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const results = filteredKurals.slice(startIndex, endIndex);
        return {results, total, page, limit};
    }
}

const kuralService = new KuralService();
export default kuralService;
