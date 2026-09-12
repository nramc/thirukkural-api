import fs from 'node:fs';
import path from 'node:path';
import { Kural, KuralMeaning } from '@/app/domain/kurals-db';
import taxonomyService from '@/app/service/taxonomy-service';

type KuralPageable = { results: Kural[]; total: number; page: number; limit: number };
type CanonicalKural = { number: number; sectionId: number; chapterId: number; lines: [string, string] };
type InterpretationFile = { locale: string; contentType: string; identifier: string; items: Record<string, { text: string }> };
type Manifest = { locale: string; interpretations: Array<{ id: string; type: string; path: string; meaningKey: keyof KuralMeaning }> };

const meaningKeys: Array<keyof KuralMeaning> = ['ta_mu_va', 'ta_salamon', 'ta_kalaignar', 'en', 'en_modern'];

class KuralService {
    private readonly kurals: Kural[];

    constructor() {
        this.kurals = this.loadKurals(this.loadManifests());
    }

    private readJson<T>(relativePath: string): T {
        return JSON.parse(fs.readFileSync(path.resolve('public/data', relativePath), 'utf-8')) as T;
    }

    private loadManifests(): Manifest[] {
        return [this.readJson<Manifest>('manifests/en.json'), this.readJson<Manifest>('manifests/ta.json')];
    }

    private loadKurals(manifests: Manifest[]): Kural[] {
        const canonical = this.readJson<{ items: CanonicalKural[] }>('canonical/kurals.ta.json').items;
        const transliteration = this.readJson<{ items: Record<string, { lines: [string, string] }> }>('transliterations/ta-Latn.json').items;
        const interpretations = manifests.flatMap((manifest) =>
            manifest.interpretations.map((entry) => ({ ...entry, file: this.readJson<InterpretationFile>(entry.path) })),
        );

        return canonical.map(({ number, sectionId, chapterId, lines }) => {
            const section = taxonomyService.getSection(sectionId);
            const chapter = taxonomyService.getChapter(chapterId);
            const transliterationLines = transliteration[String(number)]?.lines;
            if (
                !section ||
                !chapter ||
                chapter.sectionId !== section.id ||
                number < chapter.firstKural ||
                number > chapter.lastKural ||
                !transliterationLines
            ) {
                throw new Error(`Kural ${number} does not map to valid taxonomy or transliteration data`);
            }

            const meaning = {} as KuralMeaning;
            for (const interpretation of interpretations) {
                const text = interpretation.file.items[String(number)]?.text;
                if (!text?.trim()) {
                    throw new Error(`Kural ${number} is missing ${interpretation.id} content`);
                }
                meaning[interpretation.meaningKey] = text;
            }
            if (meaningKeys.some((key) => !meaning[key])) {
                throw new Error(`Kural ${number} is missing a required legacy meaning`);
            }

            return {
                number,
                kural: lines,
                transliteration: transliterationLines,
                meaning,
                section: { id: section.id, names: section.names },
                chapter: { id: chapter.id, names: chapter.names },
            };
        });
    }

    public search(id: number): Kural | undefined {
        return this.kurals.find((kural) => kural.number === id);
    }

    public searchByKeyword(keywords: string[], page: number = 1, limit: number = 10, sectionId?: number, chapterId?: number): KuralPageable {
        let filteredKurals: Kural[];
        if (keywords.length > 0) {
            filteredKurals = this.kurals.filter((kural) => {
                const filterByKeywordPredicate = (kw: string) =>
                    kural.kural.some((line) => line.includes(kw)) ||
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
        const results = filteredKurals.slice(startIndex, startIndex + limit);
        return { results, total, page, limit };
    }
}

const kuralService = new KuralService();
export default kuralService;
