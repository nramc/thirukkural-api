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

    public random(): Kural {
        const id = this.getRandomKuralNumber();
        return this.kurals.find(kural => kural.number === id)!;
    }

    public kuralOfTheDay(): Kural {
        const id = this.getKuralNumberOfTheDay();
        return this.kurals.find(kural => kural.number === id)!;
    }

    private getRandomKuralNumber(): number {
        return Math.floor(Math.random() * 1330) + 1;
    }

    private getKuralNumberOfTheDay() {
        // Step 1: Get the current date
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1; // Months are zero-based
        const year = today.getFullYear();

        // Step 2: Generate a consistent index using the date
        // Example: Use a simple formula to generate an index from 1 to 1330
        return ((day + month + year) % 1330) + 1;
    }
}

const kuralService = new KuralService();
export default kuralService;
