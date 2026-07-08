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

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function makeSections(text) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(cleanText)
    .filter((line) => line.length > 80);

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
  return sections.slice(0, 1800);
}

async function main() {
  const outputBooks = [];
  const errors = [];

  for (const book of books) {
    const fullPath = path.join(process.cwd(), 'public', 'books', book.file);
    try {
      const result = await mammoth.extractRawText({ path: fullPath });
      const sections = makeSections(result.value).map((text, index) => ({
        id: `${book.number}-${index}`,
        text,
      }));
      outputBooks.push({ ...book, sections });
      console.log(`Indexed Book ${book.number}: ${book.title} (${sections.length} sections)`);
    } catch (error) {
      errors.push({ book: book.title, file: book.file, error: error.message });
      outputBooks.push({ ...book, sections: [] });
      console.warn(`Could not index ${book.title}: ${error.message}`);
    }
  }

  const output = `export const bookIndex = ${JSON.stringify(outputBooks, null, 2)};\n\nexport const bookIndexErrors = ${JSON.stringify(errors, null, 2)};\n`;
  await fs.mkdir(path.join(process.cwd(), 'src', 'data'), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), 'src', 'data', 'bookIndex.js'), output, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
