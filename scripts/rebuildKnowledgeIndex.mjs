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

function addAliases(records, type) {
  const exact = new Set(records.map((record) => normalize(record.name)));
  const candidates = new Map();

  function offer(alias, record, score) {
    const key = normalize(alias);
    if (!key || exact.has(key)) return;
    const current = candidates.get(key);
    if (!current || score > current.score) candidates.set(key, { alias: clean(alias), record, score });
  }

  for (const record of records) {
    const strength = (record.text.match(/\n[A-Za-z][A-Za-z ’'/-]*:/g) || []).length * 100 + record.text.length;
    const first = record.name.trim().split(/\s+/)[0];
    offer(first, record, strength);

    // Nicknames in headings such as Jesse “Whisper” Winston and James "Ironjaw" Winston.
    for (const match of record.name.matchAll(/[“"]([^”"]+)[”"]/g)) offer(match[1], record, strength + 1000);
    for (const match of record.name.matchAll(/[‘']([^’']+)[’']/g)) offer(match[1], record, strength + 1000);

    // Parenthetical aliases, when the parentheses contain a short alias rather than an explanation.
    for (const match of record.name.matchAll(/\(([^)]+)\)/g)) {
      const value = clean(match[1]);
      if (value.split(/\s+/).length <= 3 && !/wife|husband|mother|father|sister|brother|aunt|uncle/i.test(value)) {
        offer(value, record, strength + 500);
      }
    }
  }

  for (const [key, { alias, record }] of candidates) {
    if (exact.has(key)) continue;
    records.push({ id: `${type}-alias-${key.replace(/\s+/g, '-')}`, name: alias, text: record.text });
    exact.add(key);
  }

  return records;
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

  // Compact entries such as "Henry Richards  Emma's father" and short outlaw entries.
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    if (!raw || field.test(raw)) continue;
    const match = raw.match(/^([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'“”‘’"()&/-]{1,70})\s{2,}(.{3,})$/);
    if (!match) continue;
    const name = clean(match[1]);
    if (skip.has(normalize(name)) || records.some((r) => normalize(r.name) === normalize(name))) continue;
    records.push({ id: `${type}-inline-${i}`, name, text: `${name}\n${clean(match[2])}` });
  }

  return addAliases(records, type);
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