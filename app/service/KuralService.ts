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
        const randomIndex = this.getRandomKuralNumber();
        return this.kurals[randomIndex];
    }

    private getRandomKuralNumber(): number {
        return Math.floor(Math.random() * 1330) + 1;
    }
}

const kuralService = new KuralService();
export default kuralService;
