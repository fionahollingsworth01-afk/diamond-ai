import fs from 'node:fs/promises';
import path from 'node:path';

const fixedSources = [
  { title: 'Horse Database', file: 'horses-database.md', type: 'horses' },
  { title: 'Livestock Database', file: 'livestock-database.md', type: 'livestock' },
  { title: 'Places Database', file: 'places-database.md', type: 'reference' },
  { title: 'Businesses Database', file: 'businesses-database.md', type: 'reference' },
  { title: 'Timeline Database', file: 'timeline-database.md', type: 'reference' },
  { title: 'Events Database', file: 'events-database.md', type: 'reference' },
];

const skip = new Set([
  'character-database.md', 'character base', 'the winston gang', "whisper's regular men",
  'the jacobs outfit', "edgar's outfit", 'other named outlaws', 'horse database',
  'livestock database', 'five oaks tradition',
]);

const field = /^[A-Za-z][A-Za-z ’'/-]*:/;
const dossierLeadField = /^(Given Name|Age|Born|Role):/i;
const compactDescriptionStart = /^(?:Lives?|Is|Was|Appears?|Works?|Hired|Married|Raised|Mother|Father|Sister|Brother|Wife|Husband|Uncle|Aunt|Daughter|Son|Children|Child|Friend|Owner|Worker|Employer|Guardian|Niece|Nephew|Grandmother|Grandfather|Longtime|Another|One|Elderly|Younger|Older|Susanna['’]s|Emma['’]s|Olivia['’]s|Luke['’]s|Matt['’]s|Waya['’]s|Tsula['’]s)\b/i;

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalize(value = '') {
  return clean(value).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleFromFile(file) {
  return path.basename(file, path.extname(file))
    .split(/[-_]+/)
    .map((word) => word ? word[0].toUpperCase() + word.slice(1) : '')
    .join(' ');
}

function heading(line) {
  const text = clean(line);
  if (!text || text.length > 100 || text.includes(':') || skip.has(normalize(text))) return false;
  return /^[A-ZÀ-ÖØ-Ý0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'“”‘’"()&/-]+$/.test(text);
}

function addAlias(records, alias, record, type) {
  const key = normalize(alias);
  if (!key || records.some((item) => normalize(item.name) === key)) return;
  records.push({ id: `${type}-alias-${key.replace(/\s+/g, '-')}`, name: clean(alias), text: record.text });
}

function compactRecordFromLine(rawLine) {
  const raw = clean(rawLine);
  if (!raw || raw.length > 180 || raw.includes(':')) return null;

  // Split at a likely description starter instead of greedily swallowing it as part of the name.
  const tokens = raw.split(/\s+/);
  for (let split = 1; split < Math.min(tokens.length, 6); split += 1) {
    const name = tokens.slice(0, split).join(' ');
    const description = tokens.slice(split).join(' ');
    if (!compactDescriptionStart.test(description)) continue;
    if (!/^[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[‘'"“][^’'"”]+[’'"”])?(?:\s+[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){0,2}$/.test(name)) continue;
    return { name: clean(name), description: clean(description) };
  }

  return null;
}

function parseNamedRecords(rawText, type, fileKey = '') {
  const lines = rawText.replace(/\r/g, '').split('\n');
  const starts = [];

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const text = clean(rawLine);
    if (!heading(text)) continue;

    const previousBlank = i === 0 || !clean(lines[i - 1]);
    const nextMeaningful = lines.slice(i + 1).map(clean).find(Boolean) || '';
    const beginsDossier = dossierLeadField.test(nextMeaningful);
    const visuallySeparatedName = /\s{2,}$/.test(rawLine);

    // Dossiers may begin after another dossier with no blank line. Outlaw names in the
    // imported files are marked by trailing spaces before their description line.
    if (previousBlank || beginsDossier || visuallySeparatedName) starts.push(i);
  }

  const prefix = `${type}-${normalize(fileKey || 'database').replace(/\s+/g, '-')}`;
  const records = starts.map((start, index) => ({
    id: `${prefix}-${index}`,
    name: clean(lines[start]),
    text: lines.slice(start, starts[index + 1] ?? lines.length).join('\n').trim(),
  })).filter((record) => record.text && !skip.has(normalize(record.name)));

  // Catch compact entries separated by two or more spaces on the same line.
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw || field.test(raw.trim())) continue;
    const match = raw.match(/^(.+?)\s{2,}(.{3,})$/);
    if (!match) continue;
    const name = clean(match[1]);
    if (!heading(name) || skip.has(normalize(name)) || records.some((r) => normalize(r.name) === normalize(name))) continue;
    records.push({ id: `${prefix}-inline-${i}`, name, text: `${name}\n${clean(match[2])}` });
  }

  // Catch compact entries written with ordinary single spaces, such as
  // "Dallas ‘Dally’ Harlowe Lives with Eddie and Mary".
  for (let i = 0; i < lines.length; i += 1) {
    const compact = compactRecordFromLine(lines[i]);
    if (!compact) continue;
    if (skip.has(normalize(compact.name)) || records.some((record) => normalize(record.name) === normalize(compact.name))) continue;
    records.push({ id: `${prefix}-compact-${i}`, name: compact.name, text: `${compact.name}\n${compact.description}` });
  }

  const byFirst = new Map();
  for (const record of records) {
    const first = normalize(record.name).split(' ')[0];
    if (!first) continue;
    const score = (record.text.match(/\n[A-Za-z][A-Za-z ’'/-]*:/g) || []).length * 100 + record.text.length;
    const current = byFirst.get(first);
    if (!current || score > current.score) byFirst.set(first, { record, score });
  }
  for (const [, { record }] of byFirst) addAlias(records, record.name.split(/\s+/)[0], record, type);

  for (const record of [...records]) {
    for (const match of record.name.matchAll(/[“"]([^”"]+)[”"]/g)) addAlias(records, match[1], record, type);
    for (const match of record.name.matchAll(/[‘']([^’']+)[’']/g)) addAlias(records, match[1], record, type);
    for (const match of record.name.matchAll(/\(([^)]+)\)/g)) {
      const alias = clean(match[1]);
      if (alias.split(/\s+/).length <= 3) addAlias(records, alias, record, type);
    }
  }

  return records;
}

function makeReferenceSections(rawText, file) {
  return rawText.split(/\n{2,}/).map(clean).filter((block) => block.length >= 20).map((text, index) => ({
    id: `reference-${file}-${index}`,
    name: clean(text.split('\n')[0]),
    text,
  }));
}

async function discoverCharacterSources() {
  const knowledgeDir = path.join(process.cwd(), 'knowledge');
  try {
    const entries = await fs.readdir(knowledgeDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map((entry) => ({
        title: titleFromFile(entry.name),
        file: path.posix.join('knowledge', entry.name),
        type: 'characters',
      }));
  } catch {
    return [];
  }
}

async function main() {
  const output = [];
  const errors = [];
  const sources = [...await discoverCharacterSources(), ...fixedSources];

  for (const source of sources) {
    try {
      const rawText = await fs.readFile(path.join(process.cwd(), source.file), 'utf8');
      const sections = source.type === 'reference'
        ? makeReferenceSections(rawText, source.file)
        : parseNamedRecords(rawText, source.type, source.file);
      output.push({ ...source, rawText, sections });
      console.log(`Reindexed ${source.title}: ${sections.length} exact records`);
    } catch (error) {
      errors.push({ title: source.title, file: source.file, error: error.message });
      output.push({ ...source, rawText: '', sections: [] });
    }
  }

  const contents = `export const knowledgeIndex = ${JSON.stringify(output, null, 2)};\n\nexport const knowledgeIndexErrors = ${JSON.stringify(errors, null, 2)};\n`;
  await fs.mkdir(path.join(process.cwd(), 'src', 'data'), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), 'src', 'data', 'knowledgeIndex.js'), contents, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
