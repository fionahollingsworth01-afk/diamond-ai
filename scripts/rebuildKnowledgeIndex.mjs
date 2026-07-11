import fs from 'node:fs/promises';
import path from 'node:path';

const sources = [
  { title: 'Character Database', file: 'knowledge', type: 'characters' },
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

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalize(value = '') {
  return clean(value).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function heading(line) {
  const text = clean(line);
  if (!text || text.length > 100 || text.includes(':') || skip.has(normalize(text))) return false;
  return /^[A-ZÀ-ÖØ-Ý0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'“”‘’"()&/-]+$/.test(text);
}

function addAlias(records, alias, record, type) {
  const key = normalize(alias);
  if (!key || records.some((item) => normalize(item.name) === key)) return;
  records.push({ id: `${type}-alias-${key.replace(/\s+/g, '-')}`, name: alias, text: record.text });
}

function parseNamedRecords(rawText, type) {
  const lines = rawText.replace(/\r/g, '').split('\n');
  const starts = [];

  for (let i = 0; i < lines.length; i += 1) {
    const text = clean(lines[i]);
    const previousBlank = i === 0 || !clean(lines[i - 1]);
    if (!previousBlank || !heading(text)) continue;

    let next = i + 1;
    while (next < lines.length && !clean(lines[next])) next += 1;
    const nextLine = clean(lines[next]);

    const strongRecord = field.test(nextLine) || /^(role|given name|age|born|owner|breed|type|family|core spine|background|history|appears):/i.test(nextLine);
    if (strongRecord) starts.push(i);
  }

  const records = starts.map((start, index) => ({
    id: `${type}-${index}`,
    name: clean(lines[start]),
    text: lines.slice(start, starts[index + 1] ?? lines.length).join('\n').trim(),
  }));

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    if (!raw || field.test(raw)) continue;
    const match = raw.match(/^([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'“”‘’"()&/-]{1,70})\s{2,}(.{3,})$/);
    if (!match) continue;
    const name = clean(match[1]);
    if (skip.has(normalize(name)) || records.some((r) => normalize(r.name) === normalize(name))) continue;
    records.push({ id: `${type}-inline-${i}`, name, text: `${name}\n${clean(match[2])}` });
  }

  const byFirst = new Map();
  for (const record of records) {
    const first = normalize(record.name).split(' ')[0];
    if (!first) continue;
    const score = (record.text.match(/\n[A-Za-z][A-Za-z ’'/-]*:/g) || []).length * 100 + record.text.length;
    const current = byFirst.get(first);
    if (!current || score > current.score) byFirst.set(first, { record, score });
  }

  for (const [first, { record }] of byFirst) addAlias(records, record.name.split(/\s+/)[0], record, type);

  for (const record of [...records]) {
    for (const match of record.name.matchAll(/[“"]([^”"]+)[”"]/g)) addAlias(records, clean(match[1]), record, type);
    for (const match of record.name.matchAll(/[‘']([^’']+)[’']/g)) addAlias(records, clean(match[1]), record, type);
  }

  // Guaranteed outlaw nickname aliases, pulled directly from the full master text.
  for (const alias of ['Whisper', 'Ironjaw']) {
    const aliasKey = normalize(alias);
    const lineIndex = lines.findIndex((line) => normalize(line).split(' ').includes(aliasKey));
    if (lineIndex < 0) continue;

    let start = lineIndex;
    while (start > 0 && clean(lines[start - 1])) start -= 1;

    let end = lineIndex + 1;
    while (end < lines.length) {
      const current = clean(lines[end]);
      const previousBlank = end === 0 || !clean(lines[end - 1]);
      if (previousBlank && heading(current) && end > lineIndex + 1) break;
      end += 1;
    }

    const record = {
      id: `${type}-direct-${aliasKey}`,
      name: clean(lines[lineIndex]),
      text: lines.slice(lineIndex, end).join('\n').trim(),
    };
    if (record.text) addAlias(records, alias, record, type);
  }

  return records;
}

function makeReferenceSections(rawText, file) {
  return rawText.split(/\n{2,}/).map(clean).filter((block) => block.length >= 20).map((text, index) => ({ id: `reference-${file}-${index}`, name: clean(text.split('\n')[0]), text }));
}

async function main() {
  const output = [];
  const errors = [];

  for (const source of sources) {
    try {
      const rawText = await fs.readFile(path.join(process.cwd(), source.file), 'utf8');
      const sections = source.type === 'reference'
        ? makeReferenceSections(rawText, source.file)
        : parseNamedRecords(rawText, source.type);
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
