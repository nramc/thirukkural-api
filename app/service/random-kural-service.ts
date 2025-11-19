import kuralService from "@/app/service/kural-service";
import {Kural} from "@/app/domain/kurals-db";
import {RandomKuralUtils} from "@/app/service/random-kural-utils";

class RandomKuralService {

    public getRandomKural(): Kural {
        const id = RandomKuralUtils.random();
        return kuralService.search(id)!;
    }

    public getRandomKuralBySection(sectionId: number): Kural {
        const id = RandomKuralUtils.randomFromSection(sectionId);
        return kuralService.search(id)!;
    }

    getRandomKuralByChapter(chapterId: number): Kural {
        const id = RandomKuralUtils.randomFromChapter(chapterId);
        return kuralService.search(id)!;
    }

}

const randomKuralService = new RandomKuralService();
export default randomKuralService;
