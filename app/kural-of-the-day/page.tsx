import {Metadata} from "next";
import {Kural} from "@/app/domain/kurals-db";

const kuralData: Kural = {
    number: 1,
    kural: ["அகர முதல எழுத்தெல்லாம் ஆதி", "பகவன் முதற்றே உலகு."],
    meaning: {"en": "A, the first letter, is the origin of all letters, and God, the first cause, is the origin of the world."},
    section: 'அதிகாரம்: பொருட்பால்',
    chapter: 'அதிகாரம்: Chapter 1',
};

async function getKural(kuralNumber = "random") {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"; // Default for local dev

    const response = await fetch(`${baseUrl}/api/${kuralNumber}`, { cache: "no-store" });
    return response.json();
}

 const KuralOfTheDay = async () => {

     const kuralNumber = "random";
     const currentKural = await getKural(kuralNumber);

     if (!currentKural) return <p>Loading...</p>;


     return (
         <div className="card-container">
             <div className="card-header">
                 <div className="card-avatar"></div>
                 <div className="ml-4 text-white">
                     <h2 className="text-xl font-bold">Thirukkural</h2>
                     <p className="text-sm">Words of Wisdom</p>
                 </div>
             </div>

             <div className="card-content">
                 <p className="card-title">Kural of the Day: {currentKural.number}</p>
                 <blockquote className="card-quote">
                     <span>{currentKural.kural[0]}</span>
                     <span>{currentKural.kural[1]}</span>
                 </blockquote>
                 <div className="card-meaning">
                     <p className="card-meaning-title">Meaning:</p>
                     <div className="ps-3">
                         {Object.entries(currentKural.meaning).map(([key, value]) => (
                             <p key={key} className="card-meaning-item">{value}</p>
                         ))}
                     </div>
                 </div>
             </div>
         </div>
     );
 };

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Kural of the Day',
        openGraph: {
            images: ['/some-specific-page-image.jpg'],
            description: kuralData.meaning['en'],
            url: 'https://your-app-name.vercel.app/kural-of-the-day',
            type: 'website',
            siteName: 'Thirukkural API',
            locale: 'en_US',
            title: 'Kural of the Day'
        },
    }

};

export default KuralOfTheDay;
