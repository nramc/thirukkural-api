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

export interface KuralMeaning {
    ta_mu_va: string;
    ta_salamon: string;
    ta_kalaignar: string;
    en: string;
    en_modern: string;
}

export interface Kural {
    number: number;
    section: TaxonomyReference;
    chapter: TaxonomyReference;
    kural: string[];
    transliteration: [string, string];
    meaning: KuralMeaning;
}
