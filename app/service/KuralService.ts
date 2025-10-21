import fs from 'fs';
import path from 'path';
import {Kural, KuralsDb} from "@/app/domain/kurals-db";

class KuralService {
    private readonly kurals: Kural[];

    constructor() {
        this.kurals = this.loadKurals();
    }

    // Load the JSON data once when the service is instantiated
    private loadKurals(): Kural[] {
        const kuralsDB = JSON.parse(
            fs.readFileSync(path.resolve('public/data/kurals.json'), 'utf-8')
        ) as KuralsDb;
        return kuralsDB.kurals;
    }

    // Search function to find Kurals based on ID
    public search(id: number): Kural | undefined {
        return this.kurals.find(kural => kural.number === id);
    }

    public random(sectionId?: number): Kural {
        const id = this.getRandomKuralNumber(sectionId);
        return this.kurals.find(kural => kural.number === id)!;
    }

    public kuralOfTheDay(): Kural {
        const id = this.getKuralNumberOfTheDay();
        return this.kurals.find(kural => kural.number === id)!;
    }

    private getRandomKuralNumber(sectionId?: number): number {
        // Define kural number ranges for each section
        let minNumber = 1;
        let maxNumber = 1330;
        
        if (sectionId) {
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
        }

        // Generate random kural number within the range
        return Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    }

    private getKuralNumberOfTheDay() {
        // This function generates a consistent Kural number based on the current date.

        // Step 1: Set offset date to 1st Jan 2023
        const offsetDate = new Date('2025-05-23');

        // Step 2: Get the current date
        const today = new Date();

        // Step 3: Calculate the difference in days
        const timeDiff = today.getTime() - offsetDate.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Step 4: Calculate the Kural number
        // Use a simple formula to generate an index from 1 to 1330
        return ((dayDiff % 1330) + 1);
    }
}

const kuralService = new KuralService();
export default kuralService;
