export class RandomKuralUtils {

    private static randomFromRange(minNumber: number, maxNumber: number) {
        // Generate random kural number within the range
        return Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    }

    static random() {
        return this.randomFromRange(1, 1330) // Kural numbers range from 1 to 1330
    }

    static randomFromSection(sectionId: number): number {
        // Define kural number ranges for each section
        let minNumber = 0;
        let maxNumber = 0;

        switch (sectionId) {
            case 1: // அறத்துப்பால் (Virtue)
                minNumber = 1;
                maxNumber = 380;
                break;
            case 2: // பொருட்பால் (Wealth)
                minNumber = 381;
                maxNumber = 1080;
                break;
            case 3: // காமத்துப்பால் (Love)
                minNumber = 1081;
                maxNumber = 1330;
                break;
        }

        return this.randomFromRange(minNumber, maxNumber);
    }

    static randomFromChapter(chapterId: number) {
        const minNumber = (chapterId - 1) * 10 + 1
        const maxNumber = chapterId * 10

        return this.randomFromRange(minNumber, maxNumber);
    }
}