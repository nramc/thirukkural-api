import fs from 'node:fs';
import path from 'node:path';
import { Kural, KuralMeaning } from '@/app/domain/kurals-db';
import taxonomyService from '@/app/service/taxonomy-service';

export type ManifestInterpretation = {
    id: string;
    type: string;
    path: string;
    meaningKey?: string;
};

type CanonicalKural = {
    number: number;
    sectionId: number;
    chapterId: number;
    lines: [string, string];
};

type InterpretationFile = {
    locale: string;
    contentType: string;
    identifier: string;
    items: Record<string, { text: string }>;
};

type Manifest = {
    locale: string;
    requiredMeaningKeys?: string[];
    interpretations: ManifestInterpretation[];
};

export type LoadedKural = {
    value: Kural;
    searchableText: string[];
};

class KuralDataLoader {
    private readonly dataPath = path.resolve('public/data');

    public load(): LoadedKural[] {
        const manifests = this.loadManifests();
        const canonical = this.readJson<{ items: CanonicalKural[] }>('canonical/kurals.ta.json').items;
        const transliterations = this.readJson<{ items: Record<string, { lines: [string, string] }> }>('transliterations/ta-Latn.json').items;
        const interpretations = this.loadInterpretations(manifests);
        const requiredMeaningKeys = new Set(manifests.flatMap((manifest) => manifest.requiredMeaningKeys ?? []));
        const sections = new Map(taxonomyService.getSections().map((section) => [section.id, section]));
        const chapters = new Map(taxonomyService.getChapters().map((chapter) => [chapter.id, chapter]));

        return canonical.map((record) => this.composeKural(record, transliterations, interpretations, requiredMeaningKeys, sections, chapters));
    }

    private readJson<T>(relativePath: string): T {
        return JSON.parse(fs.readFileSync(path.join(this.dataPath, relativePath), 'utf-8')) as T;
    }

    private loadManifests(): Manifest[] {
        const manifestDirectory = path.join(this.dataPath, 'manifests');
        return fs
            .readdirSync(manifestDirectory)
            .filter((fileName) => fileName.endsWith('.json'))
            .sort((left, right) => left.localeCompare(right))
            .map((fileName) => this.readJson<Manifest>(`manifests/${fileName}`));
    }

    private loadInterpretations(manifests: Manifest[]) {
        const meaningKeys = new Set<string>();
        return manifests.flatMap((manifest) =>
            manifest.interpretations.map((entry) => {
                if (entry.meaningKey && meaningKeys.has(entry.meaningKey)) {
                    throw new Error(`Duplicate meaningKey ${entry.meaningKey} in interpretation manifests`);
                }
                if (entry.meaningKey) {
                    meaningKeys.add(entry.meaningKey);
                }
                return {
                    ...entry,
                    file: this.readJson<InterpretationFile>(entry.path),
                };
            }),
        );
    }

    private composeKural(
        record: CanonicalKural,
        transliterations: Record<string, { lines: [string, string] }>,
        interpretations: ReturnType<KuralDataLoader['loadInterpretations']>,
        requiredMeaningKeys: Set<string>,
        sections: Map<number, ReturnType<typeof taxonomyService.getSection>>,
        chapters: Map<number, ReturnType<typeof taxonomyService.getChapter>>,
    ): LoadedKural {
        const section = sections.get(record.sectionId);
        const chapter = chapters.get(record.chapterId);
        const transliteration = transliterations[String(record.number)]?.lines;
        if (
            !section ||
            !chapter ||
            chapter.sectionId !== section.id ||
            record.number < chapter.firstKural ||
            record.number > chapter.lastKural ||
            !transliteration
        ) {
            throw new Error(`Kural ${record.number} does not map to valid taxonomy or transliteration data`);
        }

        const meaning = {} as KuralMeaning;
        const searchableText = [...record.lines, ...transliteration];
        for (const interpretation of interpretations) {
            const text = interpretation.file.items[String(record.number)]?.text;
            if (!text?.trim()) {
                throw new Error(`Kural ${record.number} is missing ${interpretation.id} content`);
            }
            searchableText.push(text);
            if (interpretation.meaningKey && requiredMeaningKeys.has(interpretation.meaningKey)) {
                (meaning as unknown as Record<string, string>)[interpretation.meaningKey] = text;
            }
        }

        const missingMeaningKeys = [...requiredMeaningKeys].filter((key) => !(meaning as unknown as Record<string, string>)[key]);
        if (missingMeaningKeys.length > 0) {
            throw new Error(`Kural ${record.number} is missing required meaning: ${missingMeaningKeys[0]}`);
        }

        return {
            value: {
                number: record.number,
                kural: record.lines,
                transliteration,
                meaning,
                section: { id: section.id, names: section.names },
                chapter: { id: chapter.id, names: chapter.names },
            },
            searchableText,
        };
    }
}

const kuralDataLoader = new KuralDataLoader();
export default kuralDataLoader;
