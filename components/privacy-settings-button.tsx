'use client';

const settingsEventName = 'thirukkural:open-analytics-settings';

export default function PrivacySettingsButton() {
    return (
        <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(settingsEventName))}
            className="transition-colors hover:font-bold hover:text-blue-800 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
            Privacy settings
        </button>
    );
}
