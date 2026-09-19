import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Kural Quiz | Match the Couplet to its Meaning',
    description: 'A fast, self-graded multiple-choice game: read a Thirukkural couplet and pick its correct modern-day meaning.',
    alternates: {
        canonical: '/quiz',
    },
    openGraph: {
        title: 'Kural Quiz | Match the Couplet to its Meaning',
        description: 'A fast, self-graded multiple-choice game: read a Thirukkural couplet and pick its correct modern-day meaning.',
        url: '/quiz',
        type: 'website',
        images: ['/images/thirukkural-api-banner.png'],
    },
};

export default function QuizLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
