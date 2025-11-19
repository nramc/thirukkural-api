import {Kural} from "@/app/domain/kurals-db";
import kuralService from "@/app/service/KuralService";

class KuralOfTheDayService {

    public kuralOfTheDay(): Kural {
        const id = this.getKuralNumberOfTheDay();
        return kuralService.search(id)!;
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

const kuralOfTheDayService = new KuralOfTheDayService();
export default kuralOfTheDayService;