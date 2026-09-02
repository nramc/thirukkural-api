import taxonomyService from '@/app/service/taxonomy-service';

export class RandomKuralUtils {
    private static randomFromRange(minNumber: number, maxNumber: number) {
        // Generate random kural number within the range
        return Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    }

    static random() {
        const sections = taxonomyService.getSections();
        return this.randomFromRange(sections[0].firstKural, sections.at(-1)!.lastKural);
    }

    static randomFromSection(sectionId: number): number {
        const section = taxonomyService.getSection(sectionId);
        if (!section) {
            throw new Error(`Section ${sectionId} was not found`);
        }

        return this.randomFromRange(section.firstKural, section.lastKural);
    }

    static randomFromChapter(chapterId: number) {
        const chapter = taxonomyService.getChapter(chapterId);
        if (!chapter) {
            throw new Error(`Chapter ${chapterId} was not found`);
        }

        return this.randomFromRange(chapter.firstKural, chapter.lastKural);
    }
}
