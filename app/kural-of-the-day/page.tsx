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
         <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200">
             <div className="bg-blue-600 p-4 flex items-center rounded-t-2xl">
                 <div className="w-10 h-10 bg-cover bg-center rounded-full" style={{ backgroundImage: "url('/assets/logo/tamil/img.png')" }}></div>
                 <div className="ml-4 text-white">
                     <h2 className="text-xl font-bold">Thirukkural</h2>
                     <p className="text-sm">Words of Wisdom</p>
                 </div>
             </div>

             <div className="p-6">
                 <p className="font-bold text-gray-700 text-lg">Kural of the Day: {currentKural.number}</p>
                 <blockquote className="italic text-blue-600 font-semibold flex flex-col mt-2 ps-3 border-l-4 border-blue-500">
                     <span>{currentKural.kural[0]}</span>
                     <span>{currentKural.kural[1]}</span>
                 </blockquote>
                 <div className="mt-4">
                     <p className="font-bold text-gray-700">Meaning:</p>
                     <div className="ps-3 text-gray-600">
                         {Object.entries(currentKural.meaning).map(([key, value]) => (
                             <p key={key} className="py-1 text-sm">{value}</p>
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
