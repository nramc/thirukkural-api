import kuralService from "@/app/service/KuralService";
import {Kural} from "@/app/domain/kurals-db";

class RandomKuralService {

    public getRandomKural(): Kural {
        const randomId = Math.floor(Math.random() * 1330) + 1; // Kural numbers range from 1 to 1330
        return kuralService.search(randomId)!;
    }


    public getRandomKuralBySection(sectionId: number): Kural {
        const id = this.getRandomKuralFromSection(sectionId);
        return kuralService.search(id)!;
    }

    private getRandomKuralFromSection(sectionId: number): number {
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

        // Generate random kural number within the range
        return Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
    }

}

const randomKuralService = new RandomKuralService();
export default randomKuralService;
