import fs from 'node:fs';
import path from 'node:path';

const dataPath = (name) => path.resolve('public/data', name);
const read = (name) => JSON.parse(fs.readFileSync(dataPath(name), 'utf8'));
const sections = read('sections.json').sections;
const chapters = read('chapters.json').chapters;
const kurals = read('kurals.json').kurals;
const ids = (items) => new Set(items.map((item) => item.id));
const namesAreValid = (names) => names && Object.values(names).length > 0 && Object.values(names).every((name) => typeof name === 'string' && name.trim());

if (sections.length !== 3 || chapters.length !== 133 || kurals.length !== 1330) {
    throw new Error('Expected 3 sections, 133 chapters, and 1330 Kurals');
}
if (ids(sections).size !== sections.length || ids(chapters).size !== chapters.length) {
    throw new Error('Section and chapter IDs must be unique');
}
if (sections.some((section) => !namesAreValid(section.names) || section.firstKural > section.lastKural)) {
    throw new Error('Invalid section names or ranges');
}
if (chapters.some((chapter) => !namesAreValid(chapter.names) || !ids(sections).has(chapter.sectionId) || chapter.firstKural > chapter.lastKural)) {
    throw new Error('Invalid chapter names, section references, or ranges');
}
if (kurals.some((kural, index) => kural.number !== index + 1 || !ids(sections).has(kural.sectionId) || !ids(chapters).has(kural.chapterId))) {
    throw new Error('Kurals must be sequential and reference valid taxonomy IDs');
}
for (const kural of kurals) {
    const chapter = chapters.find((item) => item.id === kural.chapterId);
    const section = sections.find((item) => item.id === kural.sectionId);
    if (kural.number < chapter.firstKural || kural.number > chapter.lastKural || chapter.sectionId !== section.id) {
        throw new Error(`Kural ${kural.number} has an invalid taxonomy range`);
    }
}
console.log('Validated sections, chapters, and 1,330 Kural taxonomy references.');
