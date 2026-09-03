'use client';

import { GoogleAnalytics } from '@next/third-parties/google';

export default function GoogleAnalyticsScript() {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    if (!measurementId) {
        return null;
    }

    return <GoogleAnalytics gaId={measurementId} />;
}
