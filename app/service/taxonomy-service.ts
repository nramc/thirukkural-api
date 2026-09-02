import fs from 'node:fs';
import path from 'node:path';
import { Chapter, ChaptersDb, Section, SectionsDb } from '@/app/domain/kurals-db';

class TaxonomyService {
    private readonly sections: Section[];
    private readonly chapters: Chapter[];

    constructor() {
        this.sections = this.load<SectionsDb>('sections.json').sections;
        this.chapters = this.load<ChaptersDb>('chapters.json').chapters;
        this.validate();
    }

    private load<T>(fileName: string): T {
        return JSON.parse(fs.readFileSync(path.resolve('public/data', fileName), 'utf-8')) as T;
    }

    private validate(): void {
        const sectionIds = new Set(this.sections.map((section) => section.id));
        if (sectionIds.size !== this.sections.length || this.sections.some((section) => section.firstKural > section.lastKural)) {
            throw new Error('Invalid section taxonomy data');
        }

        if (
            new Set(this.chapters.map((chapter) => chapter.id)).size !== this.chapters.length ||
            this.chapters.some(
                (chapter) =>
                    !sectionIds.has(chapter.sectionId) ||
                    chapter.firstKural > chapter.lastKural ||
                    !Object.values(chapter.names).every((name) => name.trim().length > 0),
            )
        ) {
            throw new Error('Invalid chapter taxonomy data');
        }
    }

    public getSections(): Section[] {
        return this.sections;
    }

    public getChapters(sectionId?: number): Chapter[] {
        return sectionId === undefined ? this.chapters : this.chapters.filter((chapter) => chapter.sectionId === sectionId);
    }

    public getSection(id: number): Section | undefined {
        return this.sections.find((section) => section.id === id);
    }

    public getChapter(id: number): Chapter | undefined {
        return this.chapters.find((chapter) => chapter.id === id);
    }

    public getSectionForKural(number: number): Section | undefined {
        return this.sections.find((section) => number >= section.firstKural && number <= section.lastKural);
    }

    public getChapterForKural(number: number): Chapter | undefined {
        return this.chapters.find((chapter) => number >= chapter.firstKural && number <= chapter.lastKural);
    }
}

const taxonomyService = new TaxonomyService();
export default taxonomyService;
