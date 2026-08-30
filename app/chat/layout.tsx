import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Valluvar AI | Explore Thirukkural Wisdom',
    description: 'Explore the wisdom of the Thirukkural through thoughtful conversations with Valluvar AI.',
};

export default function ChatLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
