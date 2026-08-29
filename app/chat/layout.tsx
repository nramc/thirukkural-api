import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Kural AI | Thirukkural API',
    description: 'A thoughtful AI chat experience powered by the Thirukkural API.',
};

export default function ChatLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
