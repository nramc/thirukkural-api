import fs from 'node:fs';
import path from 'node:path';

const dataRoot = path.resolve('public/data');
const read = (relativePath) => JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), 'utf8'));
const manifestFiles = fs
    .readdirSync(path.join(dataRoot, 'manifests'))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));
const sections = read('sections.json').sections;
const chapters = read('chapters.json').chapters;
const canonical = read('canonical/kurals.ta.json').items;
const transliteration = read('transliterations/ta-Latn.json').items;
const manifests = manifestFiles.map((fileName) => read(`manifests/${fileName}`));
const sectionIds = new Set(sections.map((item) => item.id));
const chapterIds = new Set(chapters.map((item) => item.id));
const meaningKeys = new Set();
const namesAreValid = (names) => names && Object.values(names).length > 0 && Object.values(names).every((name) => typeof name === 'string' && name.trim());
const hasTwoLines = (lines) => Array.isArray(lines) && lines.length === 2 && lines.every((line) => typeof line === 'string' && line.trim());

if (sections.length !== 3 || chapters.length !== 133 || canonical.length !== 1330) {
    throw new Error('Expected 3 sections, 133 chapters, and 1330 canonical Kurals');
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
    const chapter = chapters.find((item) => item.id === kural.chapterId);
    const section = sections.find((item) => item.id === kural.sectionId);
    if (
        kural.number !== index + 1 ||
        !sectionIds.has(kural.sectionId) ||
        !chapterIds.has(kural.chapterId) ||
        !hasTwoLines(kural.lines) ||
        kural.number < chapter.firstKural ||
        kural.number > chapter.lastKural ||
        chapter.sectionId !== section.id
    ) {
        throw new Error(`Canonical Kural ${kural.number} does not match the canonical schema or taxonomy`);
    }

    const transliterationItem = transliteration[String(kural.number)];
    if (
        !transliterationItem ||
        !hasTwoLines(transliterationItem.lines)
    ) {
        throw new Error(`Transliteration for Kural ${kural.number} is missing or invalid`);
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
    if (
        manifest.requiredMeaningKeys !== undefined &&
        (!Array.isArray(manifest.requiredMeaningKeys) || manifest.requiredMeaningKeys.some((key) => typeof key !== 'string' || !key.trim()))
    ) {
        throw new Error(`Invalid requiredMeaningKeys for locale ${manifest.locale}`);
    }
    for (const entry of manifest.interpretations) {
        if (entry.meaningKey) {
            if (meaningKeys.has(entry.meaningKey)) {
                throw new Error(`Duplicate meaningKey ${entry.meaningKey} in interpretation manifests`);
            }
            meaningKeys.add(entry.meaningKey);
        }
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
            if (!item || typeof item.text !== 'string' || !item.text.trim()) {
                throw new Error(`Interpretation ${entry.path} for Kural ${kural.number} is missing or invalid`);
            }
        }
    }
    for (const key of manifest.requiredMeaningKeys ?? []) {
        if (!manifest.interpretations.some((entry) => entry.meaningKey === key)) {
            throw new Error(`Required meaningKey ${key} is not mapped in ${manifest.locale}`);
        }
    }
}

console.log('Validated canonical data, transliteration, manifests, interpretations, and taxonomy for 1,330 Kurals.');
