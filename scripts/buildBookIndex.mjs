import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';

const books = [
  { number: 1, title: 'Before They Were Brothers', file: 'BEFORE THEY WERE BROTHERS FULL BOOK.docx' },
  { number: 2, title: 'Brothers by the Gun', file: 'BROTHERS BY THE GUN FULL BOOK.docx' },
  { number: 3, title: 'By the Gun No More', file: 'BY THE GUN NO MORE FULL BOOK.docx' },
  { number: 4, title: 'Built for More', file: 'BUILT FOR MORE FULL BOOK.docx' },
  { number: 5, title: 'The Long Way Forward', file: 'THE LONG WAY FORWARD FULL BOOK.docx' },
  { number: 6, title: 'The Missing Man', file: 'THE MISSING MAN FULL BOOK.docx' },
  { number: 7, title: 'What the Land Holds', file: 'WHAT THE LAND HOLDS FULL BOOK.docx' },
  { number: 8, title: 'The Long Ride West', file: 'THE LONG RIDE WEST FULL BOOK.docx' },
  { number: 9, title: 'After the Silence', file: 'AFTER THE SILENCE FULL BOOK.docx' },
  { number: 10, title: 'The Weight of a Name', file: 'THE WEIGHT OF A NAME FULL BOOK.docx' },
  { number: 11, title: 'A Bigger World', file: 'A BIGGER WORLD FULL BOOK.docx' },
  { number: 12, title: 'What We Keep', file: 'WHAT WE KEEP FULL BOOK.docx' },
  { number: 13, title: 'Roots and Responsibility', file: 'Book 13 Roots and Responsibility.docx' },
  { number: 14, title: 'Holding the Line', file: 'Book 14 Holding The Line.docx' },
  { number: 15, title: 'What Comes After', file: 'Book 15 WHAT COMES AFTER.docx' },
  { number: 16, title: 'The Line He Walks', file: 'Book 16 THE LINE HE WALKS.docx' },
  { number: 17, title: 'Where He Stands', file: 'Book 17 WHERE HE STANDS.docx' },
  { number: 18, title: 'Where the Fire Meets the Sky', file: 'Book 18 WHERE THE FIRE MEETS THE SKY.docx' },
];

const knowledgeFiles = [
  { title: 'Character Database', file: 'knowledge', type: 'characters' },
  { title: 'Horse Database', file: 'horses-database.md', type: 'horses' },
  { title: 'Livestock Database', file: 'livestock-database.md', type: 'livestock' },
  { title: 'Places Database', file: 'places-database.md', type: 'reference' },
  { title: 'Businesses Database', file: 'businesses-database.md', type: 'reference' },
  { title: 'Timeline Database', file: 'timeline-database.md', type: 'reference' },
  { title: 'Events Database', file: 'events-database.md', type: 'reference' },
];

const supplementalCharacters = [
  { name: 'Tavi', text: 'Tavi\nAge: 12\nRole: Tsula Red Hawk’s best friend\nFamily: Older sister Aiyana.\nCore Spine: Tavi is Tsula’s closest friend and part of the Cherokee community connected to Waya and Jennifer.' },
  { name: 'Aiyana', text: 'Aiyana\nAge: 19\nRole: Tavi’s older sister\nFamily: Younger brother Tavi.\nCore Spine: Aiyana is a young Cherokee woman who showed interest in Waya before Jennifer and Waya became a couple.' },
  { name: 'Tsula', aliases: ['Tsula Red Hawk', 'Tsula Redhawk', 'Tula'], text: 'Tsula Red Hawk\nAge: 12\nRole: Waya Red Hawk’s nephew and foster son\nFamily: Son of Awinita “Fawn” Red Hawk and Kanuna Sixkiller, both deceased. Nephew of Waya Red Hawk. Stepson in every meaningful way of Jennifer Callahan Red Hawk.' },
];

const groupHeadings = new Set([
  'character-database.md', 'character base', 'the winston gang', "whisper's regular men",
  'the jacobs outfit', "edgar's outfit", 'other named outlaws', 'five oaks tradition',
]);
const fieldLine = /^[A-Za-z][A-Za-z ’'/-]*:/;

function cleanText(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function normalize(text = '') {
  return cleanText(text).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function makeSections(text, minimumLength = 45) {
  const paragraphs = text.split(/\n{2,}/).map(cleanText).filter((line) => line.length >= minimumLength);
  const sections = [];
  let chunk = [];
  let length = 0;
  for (const paragraph of paragraphs) {
    chunk.push(paragraph);
    length += paragraph.length;
    if (length > 900) {
      sections.push(chunk.join(' '));
      chunk = [];
      length = 0;
    }
  }
  if (chunk.length) sections.push(chunk.join(' '));
  return sections.slice(0, 2200);
}

function isHeading(line) {
  if (!line || line.includes(':') || line.length > 90) return false;
  if (groupHeadings.has(normalize(line))) return false;
  return /^[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'“”‘’"-]+$/.test(line);
}

function addFirstNameAliases(records) {
  const counts = new Map();
  for (const record of records) {
    const first = normalize(record.name).split(' ')[0];
    if (first) counts.set(first, (counts.get(first) || 0) + 1);
  }
  const existing = new Set(records.map((record) => normalize(record.name)));
  const aliases = [];
  for (const record of records) {
    const firstDisplay = record.name.trim().split(/\s+/)[0];
    const first = normalize(firstDisplay);
    if (!first || counts.get(first) !== 1 || existing.has(first)) continue;
    aliases.push({ id: `character-first-${first}`, name: firstDisplay, text: record.text });
    existing.add(first);
  }
  records.push(...aliases);
  return records;
}

function makeCharacterSections(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const starts = [];

  // Every full dossier begins on a blank-separated heading line. Do not require a particular next field.
  for (let index = 0; index < lines.length; index += 1) {
    const candidate = lines[index].trim();
    const previousBlank = index === 0 || !lines[index - 1].trim();
    if (previousBlank && isHeading(candidate)) starts.push(index);
  }

  const records = starts.map((start, recordIndex) => {
    const end = starts[recordIndex + 1] ?? lines.length;
    return {
      id: `character-${recordIndex}`,
      name: lines[start].trim(),
      text: lines.slice(start, end).join('\n').trim(),
    };
  }).filter((record) => !groupHeadings.has(normalize(record.name)));

  // Catch compact one-line entries, including relatives, ranch hands, and outlaws.
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index].trim();
    if (!raw || fieldLine.test(raw)) continue;
    const match = raw.match(/^([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'“”‘’"-]{1,55})\s{2,}(.{3,})$/);
    if (!match) continue;
    const name = match[1].trim();
    if (groupHeadings.has(normalize(name))) continue;
    if (records.some((record) => normalize(record.name) === normalize(name))) continue;
    records.push({ id: `character-inline-${index}`, name, text: `${name}\n${match[2].trim()}` });
  }

  const existing = new Set(records.map((record) => normalize(record.name)));
  for (const item of supplementalCharacters) {
    for (const alias of [item.name, ...(item.aliases || [])]) {
      const key = normalize(alias);
      if (existing.has(key)) continue;
      records.push({ id: `character-supplemental-${key.replace(/\s+/g, '-')}`, name: alias, text: item.text });
      existing.add(key);
    }
  }

  return addFirstNameAliases(records);
}

function makeNamedDatabaseSections(text, type) {
  const lines = text.replace(/\r/g, '').split('\n');
  const databaseHeader = type === 'horses' ? /^HORSE DATABASE$/i : /^LIVESTOCK DATABASE$/i;
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const candidate = lines[index].trim();
    const previousBlank = index === 0 || !lines[index - 1].trim();
    if (!previousBlank || !candidate || databaseHeader.test(candidate) || fieldLine.test(candidate)) continue;
    if (groupHeadings.has(normalize(candidate))) continue;
    if (isHeading(candidate)) starts.push(index);
  }
  return starts.map((start, recordIndex) => ({
    id: `${type}-${recordIndex}`,
    name: lines[start].trim(),
    text: lines.slice(start, starts[recordIndex + 1] ?? lines.length).join('\n').trim(),
  }));
}

async function buildBooks() {
  const outputBooks = [];
  const errors = [];
  for (const book of books) {
    const fullPath = path.join(process.cwd(), 'public', 'books', book.file);
    try {
      const result = await mammoth.extractRawText({ path: fullPath });
      const sections = makeSections(result.value, 80).map((sectionText, index) => ({ id: `${book.number}-${index}`, text: sectionText }));
      outputBooks.push({ ...book, sections });
    } catch (error) {
      errors.push({ book: book.title, file: book.file, error: error.message });
      outputBooks.push({ ...book, sections: [] });
    }
  }
  return { outputBooks, errors };
}

async function buildKnowledge() {
  const outputKnowledge = [];
  const errors = [];
  for (const source of knowledgeFiles) {
    try {
      const rawText = await fs.readFile(path.join(process.cwd(), source.file), 'utf8');
      let sections;
      if (source.type === 'characters') sections = makeCharacterSections(rawText);
      else if (source.type === 'horses' || source.type === 'livestock') sections = makeNamedDatabaseSections(rawText, source.type);
      else sections = makeSections(rawText).map((sectionText, index) => ({ id: `knowledge-${source.file}-${index}`, text: sectionText }));
      outputKnowledge.push({ ...source, rawText, sections });
    } catch (error) {
      errors.push({ title: source.title, file: source.file, error: error.message });
      outputKnowledge.push({ ...source, rawText: '', sections: [] });
    }
  }
  return { outputKnowledge, errors };
}

async function main() {
  const { outputBooks, errors: bookErrors } = await buildBooks();
  const { outputKnowledge, errors: knowledgeErrors } = await buildKnowledge();
  await fs.mkdir(path.join(process.cwd(), 'src', 'data'), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), 'src', 'data', 'bookIndex.js'), `export const bookIndex = ${JSON.stringify(outputBooks, null, 2)};\n\nexport const bookIndexErrors = ${JSON.stringify(bookErrors, null, 2)};\n`, 'utf8');
  await fs.writeFile(path.join(process.cwd(), 'src', 'data', 'knowledgeIndex.js'), `export const knowledgeIndex = ${JSON.stringify(outputKnowledge, null, 2)};\n\nexport const knowledgeIndexErrors = ${JSON.stringify(knowledgeErrors, null, 2)};\n`, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});