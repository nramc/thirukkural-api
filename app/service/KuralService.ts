import fs from 'node:fs';
import path from 'node:path';
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


}

const kuralService = new KuralService();
export default kuralService;
