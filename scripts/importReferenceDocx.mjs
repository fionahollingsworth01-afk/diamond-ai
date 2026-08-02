import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';

const sources = [
  ['Antagonists.docx', 'knowledge/antagonists.md'],
  ['Extended Families.docx', 'knowledge/extended-families.md'],
  ['Oil Crew.docx', 'knowledge/oil-crew.md'],
  ['Outlaws Data Base.docx', 'knowledge/outlaws-database.md'],
  ['Ranch Hands.docx', 'knowledge/ranch-hands.md'],
  ['Tate Hudson.docx', 'knowledge/tate-hudson.md'],
  ['Townspeople.docx', 'knowledge/townspeople.md'],
  ['Weapons.docx', 'knowledge/weapons.md'],
];

function cleanExtractedText(value = '') {
  return String(value)
    .replace(/\r/g, '')
    .replace(/[\t ]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  for (const [inputFile, outputFile] of sources) {
    const inputPath = path.join(process.cwd(), inputFile);
    const outputPath = path.join(process.cwd(), outputFile);

    try {
      await fs.access(inputPath);
    } catch {
      console.warn(`Reference file not found: ${inputFile}`);
      continue;
    }

    const { value, messages } = await mammoth.extractRawText({ path: inputPath });
    const text = cleanExtractedText(value);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${text}\n`, 'utf8');

    if (messages.length) {
      console.warn(`${inputFile}: ${messages.map((item) => item.message).join('; ')}`);
    }
    console.log(`Imported ${inputFile} -> ${outputFile}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
