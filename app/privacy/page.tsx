import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Privacy Notice',
    description: 'Privacy and optional analytics information for Thirukkural API.',
};

export default function PrivacyPage() {
    return (
        <main className="min-h-[70vh] px-4 py-16 sm:px-6 lg:px-8">
            <article className="mx-auto w-full max-w-3xl rounded-3xl border border-blue-100 bg-white/80 p-6 text-slate-700 shadow-sm backdrop-blur sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Privacy</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">Privacy notice</h1>

                <div className="mt-8 space-y-6 text-sm leading-7 sm:text-base">
                    <section>
                        <h2 className="text-xl font-semibold text-blue-950">Optional analytics</h2>
                        <p className="mt-2">
                            This website may use Google Analytics 4 to understand general usage, such as which pages are visited and how visitors navigate the
                            site. Analytics is optional and is loaded only after you select “Accept analytics”.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-blue-950">What we do not send</h2>
                        <p className="mt-2">
                            This integration does not send chat messages, AI responses, Kural text, API request bodies, or custom user-generated content to
                            Google Analytics.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-blue-950">Your choices</h2>
                        <p className="mt-2">
                            Select “Reject” in the analytics notice to keep analytics disabled. You can reopen your choice at any time with the “Privacy
                            settings” link in the footer. Rejecting analytics clears Google Analytics cookies that are accessible to this website; data already
                            sent cannot be withdrawn by this application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-blue-950">Third-party provider</h2>
                        <p className="mt-2">
                            Google Analytics is provided by Google. Google may process analytics data according to its own terms and privacy policies. Review
                            Google’s documentation for current details about its data processing and controls.
                        </p>
                    </section>
                </div>

                <Link href="/" className="mt-10 inline-flex font-semibold text-blue-800 underline underline-offset-4 hover:text-blue-600">
                    Return to Thirukkural
                </Link>
            </article>
        </main>
    );
}
