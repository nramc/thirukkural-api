import { Kural } from '@/app/domain/kurals-db';
import kuralDataLoader, { LoadedKural } from '@/app/service/kural-data-loader';

type KuralPageable = { results: Kural[]; total: number; page: number; limit: number };

class KuralService {
    private readonly records: LoadedKural[];
    private readonly kuralsById: Map<number, Kural>;

    constructor() {
        this.records = kuralDataLoader.load();
        this.kuralsById = new Map(this.records.map(({ value }) => [value.number, value]));
    }

    public search(id: number): Kural | undefined {
        return this.kuralsById.get(id);
    }

    public searchByKeyword(keywords: string[], page: number = 1, limit: number = 10, sectionId?: number, chapterId?: number): KuralPageable {
        const filteredRecords = this.records.filter((record) => this.matchesFilters(record, keywords, sectionId, chapterId));
        const startIndex = (page - 1) * limit;
        return {
            results: filteredRecords.slice(startIndex, startIndex + limit).map(({ value }) => value),
            total: filteredRecords.length,
            page,
            limit,
        };
    }

    private matchesFilters(record: LoadedKural, keywords: string[], sectionId?: number, chapterId?: number): boolean {
        const matchesKeyword = keywords.length === 0 || keywords.some((keyword) => record.searchableText.some((text) => text.includes(keyword)));
        const matchesTaxonomy =
            chapterId === undefined ? sectionId === undefined || record.value.section.id === sectionId : record.value.chapter.id === chapterId;
        return matchesKeyword && matchesTaxonomy;
    }
}

const kuralService = new KuralService();
export default kuralService;
