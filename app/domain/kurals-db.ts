export type LocalizedNames = Record<string, string>;

export interface TaxonomyReference {
    id: number;
    names: LocalizedNames;
}

export interface Section {
    id: number;
    names: LocalizedNames;
    firstKural: number;
    lastKural: number;
}

export interface Chapter {
    id: number;
    sectionId: number;
    names: LocalizedNames;
    firstKural: number;
    lastKural: number;
}

export interface SectionsDb {
    sections: Section[];
}

export interface ChaptersDb {
    chapters: Chapter[];
}

export interface Kural {
    number: number;
    section: string;
    chapter: string;
    sectionId: number;
    chapterId: number;
    sectionRef: TaxonomyReference;
    chapterRef: TaxonomyReference;
    kural: string[];
    meaning: { [name: string]: string };
}
