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
  {
    name: 'Tsula Red Hawk',
    aliases: ['Tsula', 'Tula'],
    text: 'Tsula Red Hawk\nAge: 12\nRole: Waya Red Hawk’s nephew • Jennifer Callahan Red Hawk’s stepson\nFamily: Son of Awinita “Fawn” Red Hawk and Kanuna Sixkiller. Nephew of Waya Red Hawk. Stepson of Jennifer Callahan Red Hawk.\nCore Spine: Tsula is a twelve-year-old boy Waya has raised for the last four years after the deaths of Tsula’s parents. Waya brings him to Five Oaks, where Jennifer becomes his stepmother and the family accepts and protects him.\nHistory: Waya took Tsula in after Awinita, Waya’s sister, and Kanuna Sixkiller died. Tsula has remained with Waya ever since and moves to Five Oaks with him after Waya marries Jennifer.',
  },
  {
    name: 'Tavi',
    text: 'Tavi\nAge: 12\nRole: Tsula Red Hawk’s best friend\nFamily: Older sister Aiyana.\nCore Spine: Tavi is Tsula’s closest friend and part of the Cherokee community connected to Waya and Jennifer. He gives Tsula a friendship grounded in familiarity, loyalty, and shared childhood.',
  },
  {
    name: 'Aiyana',
    text: 'Aiyana\nAge: 19\nRole: Tavi’s older sister\nFamily: Younger brother Tavi.\nCore Spine: Aiyana is a young Cherokee woman who showed interest in Waya before Jennifer and Waya became a couple. She belongs to the community surrounding Waya, Tsula, and the Red Hawk family.',
  },
];

function cleanText(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

function makeSections(text, minimumLength = 45) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(cleanText)
    .filter((line) => line.length >= minimumLength);
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

function makeCharacterSections(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const startsRecord = (index) => {
    const candidate = (lines[index] || '').trim();
    if (!candidate || candidate.includes(':')) return false;
    if (/^(character-database\.md|character base)$/i.test(candidate)) return false;
    let next = index + 1;
    while (next < lines.length && !lines[next].trim()) next += 1;
    return /^(given name|age|born|role):/i.test((lines[next] || '').trim());
  };
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (startsRecord(index)) starts.push(index);
  }
  const records = starts.map((start, recordIndex) => {
    const end = starts[recordIndex + 1] ?? lines.length;
    return {
      id: `character-${recordIndex}`,
      name: lines[start].trim(),
      aliases: [],
      text: lines.slice(start, end).join('\n').trim(),
    };
  });
  const existing = new Set(records.map((record) => record.name.toLowerCase()));
  for (const item of supplementalCharacters) {
    if (!existing.has(item.name.toLowerCase())) {
      records.push({
        id: `character-supplemental-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: item.name,
        aliases: item.aliases || [],
        text: item.text,
      });
    }
  }
  return records;
}

function makeNamedDatabaseSections(text, type) {
  const lines = text.replace(/\r/g, '').split('\n');
  const databaseHeader = type === 'horses' ? /^HORSE DATABASE$/i : /^LIVESTOCK DATABASE$/i;
  const fieldLine = /^[A-Za-z][A-Za-z ’'/-]*:/;
  const starts = [];

  for (let index = 0; index < lines.length; index += 1) {
    const candidate = lines[index].trim();
    if (!candidate || databaseHeader.test(candidate) || fieldLine.test(candidate)) continue;
    const previousBlank = index === 0 || !lines[index - 1].trim();
    let next = index + 1;
    while (next < lines.length && !lines[next].trim()) next += 1;
    const nextLine = (lines[next] || '').trim();
    const horseHeading = type === 'horses' && /^[A-Z][A-Z0-9 ’'-]+$/.test(candidate) && /^(Owner|Breed|Color|Gender|Temperament):/i.test(nextLine);
    const livestockHeading = type === 'livestock' && previousBlank && candidate.length < 60 && !/^["“]/.test(candidate);
    if (horseHeading || livestockHeading) starts.push(index);
  }

  return starts.map((start, recordIndex) => {
    const end = starts[recordIndex + 1] ?? lines.length;
    const name = lines[start].trim();
    return {
      id: `${type}-${recordIndex}`,
      name,
      aliases: [],
      text: lines.slice(start, end).join('\n').trim(),
    };
  });
}

async function buildBooks() {
  const outputBooks = [];
  const errors = [];
  for (const book of books) {
    const fullPath = path.join(process.cwd(), 'public', 'books', book.file);
    try {
      const result = await mammoth.extractRawText({ path: fullPath });
      const sections = makeSections(result.value, 80).map((text, index) => ({ id: `${book.number}-${index}`, text }));
      outputBooks.push({ ...book, sections });
      console.log(`Indexed Book ${book.number}: ${book.title} (${sections.length} sections)`);
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
    const fullPath = path.join(process.cwd(), source.file);
    try {
      const rawText = await fs.readFile(fullPath, 'utf8');
      let sections;
      if (source.type === 'characters') sections = makeCharacterSections(rawText);
      else if (source.type === 'horses' || source.type === 'livestock') sections = makeNamedDatabaseSections(rawText, source.type);
      else sections = makeSections(rawText).map((text, index) => ({ id: `knowledge-${source.file}-${index}`, text }));
      outputKnowledge.push({ ...source, rawText, sections });
      console.log(`Indexed knowledge: ${source.title} (${sections.length} sections)`);
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
  const bookOutput = `export const bookIndex = ${JSON.stringify(outputBooks, null, 2)};\n\nexport const bookIndexErrors = ${JSON.stringify(bookErrors, null, 2)};\n`;
  const knowledgeOutput = `export const knowledgeIndex = ${JSON.stringify(outputKnowledge, null, 2)};\n\nexport const knowledgeIndexErrors = ${JSON.stringify(knowledgeErrors, null, 2)};\n`;
  await fs.mkdir(path.join(process.cwd(), 'src', 'data'), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), 'src', 'data', 'bookIndex.js'), bookOutput, 'utf8');
  await fs.writeFile(path.join(process.cwd(), 'src', 'data', 'knowledgeIndex.js'), knowledgeOutput, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
