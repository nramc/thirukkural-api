import fs from 'node:fs';
import path from 'node:path';

const dataRoot = path.resolve('public/data');
const read = (relativePath) => JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), 'utf8'));
const sections = read('sections.json').sections;
const chapters = read('chapters.json').chapters;
const legacyKurals = read('kurals.json').kurals;
const canonical = read('canonical/kurals.ta.json').items;
const transliteration = read('transliterations/ta-Latn.json').items;
const manifests = [read('manifests/en.json'), read('manifests/ta.json')];
const sectionIds = new Set(sections.map((item) => item.id));
const chapterIds = new Set(chapters.map((item) => item.id));
const namesAreValid = (names) => names && Object.values(names).length > 0 && Object.values(names).every((name) => typeof name === 'string' && name.trim());
const hasTwoLines = (lines) => Array.isArray(lines) && lines.length === 2 && lines.every((line) => typeof line === 'string' && line.trim());

if (sections.length !== 3 || chapters.length !== 133 || canonical.length !== 1330 || legacyKurals.length !== canonical.length) {
    throw new Error('Expected 3 sections, 133 chapters, and 1330 canonical and legacy Kurals');
}
if (new Set(sections.map((section) => section.id)).size !== sections.length || new Set(chapters.map((chapter) => chapter.id)).size !== chapters.length) {
    throw new Error('Section and chapter IDs must be unique');
}
if (sections.some((section) => !namesAreValid(section.names) || section.firstKural > section.lastKural)) {
    throw new Error('Invalid section names or ranges');
}
if (chapters.some((chapter) => !namesAreValid(chapter.names) || !sectionIds.has(chapter.sectionId) || chapter.firstKural > chapter.lastKural)) {
    throw new Error('Invalid chapter names, section references, or ranges');
}

for (const [index, kural] of canonical.entries()) {
    const legacy = legacyKurals[index];
    const chapter = chapters.find((item) => item.id === kural.chapterId);
    const section = sections.find((item) => item.id === kural.sectionId);
    if (
        kural.number !== index + 1 ||
        kural.number !== legacy.number ||
        !sectionIds.has(kural.sectionId) ||
        !chapterIds.has(kural.chapterId) ||
        !hasTwoLines(kural.lines) ||
        JSON.stringify(kural.lines) !== JSON.stringify(legacy.kural) ||
        kural.sectionId !== legacy.sectionId ||
        kural.chapterId !== legacy.chapterId ||
        kural.number < chapter.firstKural ||
        kural.number > chapter.lastKural ||
        chapter.sectionId !== section.id
    ) {
        throw new Error(`Canonical Kural ${kural.number} does not match the legacy data or taxonomy`);
    }

    const transliterationItem = transliteration[String(kural.number)];
    if (
        !transliterationItem ||
        !hasTwoLines(transliterationItem.lines) ||
        JSON.stringify(transliterationItem.lines) !== JSON.stringify(legacy.transliteration)
    ) {
        throw new Error(`Transliteration for Kural ${kural.number} does not match the legacy data`);
    }
}

if (Object.keys(transliteration).length !== canonical.length) {
    throw new Error('Transliteration coverage must contain all 1330 Kurals');
}

for (const manifest of manifests) {
    if (
        !manifest.locale ||
        !Array.isArray(manifest.interpretations) ||
        new Set(manifest.interpretations.map((item) => item.id)).size !== manifest.interpretations.length
    ) {
        throw new Error(`Invalid manifest for locale ${manifest.locale}`);
    }
    for (const entry of manifest.interpretations) {
        const file = read(entry.path);
        if (
            file.locale !== manifest.locale ||
            file.identifier !== entry.id ||
            file.contentType !== entry.type ||
            !file.coverage ||
            file.coverage.total !== canonical.length
        ) {
            throw new Error(`Invalid metadata for ${entry.path}`);
        }
        if (Object.keys(file.items).length !== canonical.length) {
            throw new Error(`Interpretation ${entry.path} must contain all 1330 Kurals`);
        }
        for (const kural of canonical) {
            const item = file.items[String(kural.number)];
            const legacy = legacyKurals[kural.number - 1];
            if (!item || typeof item.text !== 'string' || !item.text.trim() || item.text !== legacy.meaning[entry.meaningKey]) {
                throw new Error(`Interpretation ${entry.path} for Kural ${kural.number} does not match the legacy data`);
            }
        }
    }
}

console.log('Validated canonical data, transliteration, manifests, interpretations, taxonomy, and legacy parity for 1,330 Kurals.');
