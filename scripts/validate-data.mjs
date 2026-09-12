import fs from 'node:fs';
import path from 'node:path';

const dataRoot = path.resolve('public/data');
const expectedSchemaVersion = '1.0.0';
const expectedCanonicalPath = 'canonical/kurals.ta.json';
const expectedTransliterationPath = 'transliterations/ta-Latn.json';
const localePattern = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};
const read = (relativePath) => JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), 'utf8'));
const manifestFiles = fs
    .readdirSync(path.join(dataRoot, 'manifests'))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));
const manifestEntries = manifestFiles.map((fileName) => ({
    fileName,
    manifest: read(`manifests/${fileName}`),
}));
const sections = read('sections.json').sections;
const chapters = read('chapters.json').chapters;
const canonical = read('canonical/kurals.ta.json').items;
const transliteration = read('transliterations/ta-Latn.json').items;
const manifests = manifestEntries.map(({ manifest }) => manifest);
const sectionIds = new Set(sections.map((item) => item.id));
const chapterIds = new Set(chapters.map((item) => item.id));
const meaningKeys = new Set();
const manifestLocales = new Set();
const hasTwoLines = (lines) => Array.isArray(lines) && lines.length === 2 && lines.every((line) => typeof line === 'string' && line.trim());

assert(Array.isArray(sections) && sections.length === 3, 'Expected exactly 3 sections');
assert(Array.isArray(chapters) && chapters.length === 133, 'Expected exactly 133 chapters');
assert(Array.isArray(canonical) && canonical.length === 1330, 'Expected exactly 1330 canonical Kurals');
assert(isRecord(transliteration), 'Transliteration items must be an object');

for (const { fileName, manifest } of manifestEntries) {
    assert(isRecord(manifest), `Manifest ${fileName} must be an object`);
    assert(manifest.schemaVersion === expectedSchemaVersion, `Manifest ${fileName} must use schema version ${expectedSchemaVersion}`);
    assert(typeof manifest.locale === 'string' && localePattern.test(manifest.locale), `Invalid locale in manifest ${fileName}`);
    assert(fileName === `${manifest.locale}.json`, `Manifest filename ${fileName} must match locale ${manifest.locale}`);
    assert(!manifestLocales.has(manifest.locale), `Duplicate manifest locale ${manifest.locale}`);
    manifestLocales.add(manifest.locale);
    assert(typeof manifest.languageName === 'string' && manifest.languageName.trim(), `Manifest ${fileName} must have a languageName`);
    assert(manifest.canonical === expectedCanonicalPath, `Manifest ${fileName} must reference ${expectedCanonicalPath}`);
    assert(manifest.transliteration === expectedTransliterationPath, `Manifest ${fileName} must reference ${expectedTransliterationPath}`);
    assert(Array.isArray(manifest.interpretations), `Manifest ${fileName} must have an interpretations array`);
    assert(
        manifest.requiredMeaningKeys === undefined ||
            (Array.isArray(manifest.requiredMeaningKeys) &&
                new Set(manifest.requiredMeaningKeys).size === manifest.requiredMeaningKeys.length &&
                manifest.requiredMeaningKeys.every((key) => typeof key === 'string' && key.trim())),
        `Invalid requiredMeaningKeys for locale ${manifest.locale}`,
    );
    assert(
        new Set(manifest.interpretations.map((item) => item?.id)).size === manifest.interpretations.length,
        `Interpretation IDs must be unique in ${fileName}`,
    );

    for (const entry of manifest.interpretations) {
        assert(isRecord(entry), `Invalid interpretation entry in ${fileName}`);
        assert(typeof entry.id === 'string' && entry.id.trim(), `Interpretation ID is required in ${fileName}`);
        assert(typeof entry.type === 'string' && entry.type.trim(), `Interpretation type is required for ${manifest.locale}/${entry.id}`);
        assert(typeof entry.path === 'string' && entry.path.trim(), `Interpretation path is required for ${manifest.locale}/${entry.id}`);
        const normalizedPath = path.posix.normalize(entry.path.replaceAll('\\', '/'));
        assert(
            normalizedPath === entry.path && normalizedPath.startsWith(`interpretations/${manifest.locale}/`) && normalizedPath.endsWith('.json'),
            `Interpretation path ${entry.path} must be under interpretations/${manifest.locale}/`,
        );
        if (entry.meaningKey !== undefined) {
            assert(typeof entry.meaningKey === 'string' && entry.meaningKey.trim(), `Invalid meaningKey for ${entry.path}`);
            assert(!meaningKeys.has(entry.meaningKey), `Duplicate meaningKey ${entry.meaningKey} in interpretation manifests`);
            meaningKeys.add(entry.meaningKey);
        }
    }
}

const namesAreValid = (names) =>
    isRecord(names) &&
    Object.keys(names).length > 0 &&
    Object.values(names).every((name) => typeof name === 'string' && name.trim()) &&
    [...manifestLocales].every((locale) => typeof names[locale] === 'string' && names[locale].trim());

assert(new Set(sections.map((section) => section.id)).size === sections.length, 'Section IDs must be unique');
assert(new Set(chapters.map((chapter) => chapter.id)).size === chapters.length, 'Chapter IDs must be unique');
assert(
    sections.every((section) => Number.isInteger(section.id) && Number.isInteger(section.firstKural) && Number.isInteger(section.lastKural)),
    'Section IDs and ranges must be integers',
);
assert(
    chapters.every(
        (chapter) =>
            Number.isInteger(chapter.id) && Number.isInteger(chapter.sectionId) && Number.isInteger(chapter.firstKural) && Number.isInteger(chapter.lastKural),
    ),
    'Chapter IDs and ranges must be integers',
);
assert(
    sections.every((section) => namesAreValid(section.names) && section.firstKural <= section.lastKural),
    'Invalid section names or ranges',
);
assert(
    chapters.every((chapter) => namesAreValid(chapter.names) && sectionIds.has(chapter.sectionId) && chapter.firstKural <= chapter.lastKural),
    'Invalid chapter names, section references, or ranges',
);

const assertContiguousRanges = (items, label) => {
    const ordered = [...items].sort((left, right) => left.firstKural - right.firstKural);
    let expectedFirst = 1;
    for (const item of ordered) {
        assert(item.firstKural === expectedFirst, `${label} ranges must be contiguous and start at Kural 1`);
        expectedFirst = item.lastKural + 1;
    }
    assert(expectedFirst === canonical.length + 1, `${label} ranges must end at Kural ${canonical.length}`);
};

assertContiguousRanges(sections, 'Section');
assertContiguousRanges(chapters, 'Chapter');
for (const chapter of chapters) {
    const section = sections.find((item) => item.id === chapter.sectionId);
    assert(
        chapter.firstKural >= section.firstKural && chapter.lastKural <= section.lastKural,
        `Chapter ${chapter.id} range must be inside section ${section.id}`,
    );
}

for (const [index, kural] of canonical.entries()) {
    const chapter = chapters.find((item) => item.id === kural.chapterId);
    const section = sections.find((item) => item.id === kural.sectionId);
    if (
        kural.number !== index + 1 ||
        !Number.isInteger(kural.number) ||
        !Number.isInteger(kural.sectionId) ||
        !Number.isInteger(kural.chapterId) ||
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
    if (!transliterationItem || !hasTwoLines(transliterationItem.lines)) {
        throw new Error(`Transliteration for Kural ${kural.number} is missing or invalid`);
    }
}

assert(Object.keys(transliteration).length === canonical.length, 'Transliteration coverage must contain all 1330 Kurals');

for (const manifest of manifests) {
    for (const entry of manifest.interpretations) {
        const file = read(entry.path);
        assert(isRecord(file), `Interpretation ${entry.path} must be an object`);
        if (
            file.schemaVersion !== expectedSchemaVersion ||
            file.locale !== manifest.locale ||
            file.identifier !== entry.id ||
            file.contentType !== entry.type ||
            typeof file.displayName !== 'string' ||
            !file.displayName.trim() ||
            !isRecord(file.metadata) ||
            typeof file.metadata.reviewStatus !== 'string' ||
            !file.metadata.reviewStatus.trim() ||
            !isRecord(file.coverage) ||
            file.coverage.total !== canonical.length
        ) {
            throw new Error(`Invalid metadata for ${entry.path}`);
        }
        if (!isRecord(file.items) || Object.keys(file.items).length !== canonical.length) {
            throw new Error(`Interpretation ${entry.path} must contain all 1330 Kurals`);
        }
        for (const kural of canonical) {
            const item = file.items[String(kural.number)];
            if (!isRecord(item) || typeof item.text !== 'string' || !item.text.trim()) {
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
