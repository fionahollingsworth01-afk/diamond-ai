import { buildAnswer } from './answerEngine.js';

function clean(value = '') {
  return String(value).replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

function normalize(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleName(value = '') {
  return clean(value).split(/\s+/).map((word) => word ? word[0].toUpperCase() + word.slice(1) : '').join(' ');
}

function records(knowledge, type = 'characters') {
  return knowledge.flatMap((source) => source.type === type ? (source.sections || []) : []);
}

function aliases(record) {
  const values = new Set([record.name, ...(record.aliases || [])]);
  const first = String(record.name || '').split(/\s+/)[0];
  if (first) values.add(first);
  for (const match of String(record.name || '').matchAll(/[“‘"']([^”’"']+)[”’"']/g)) values.add(match[1]);
  return [...values].map(normalize).filter(Boolean);
}

function findPerson(name, knowledge) {
  const wanted = normalize(name);
  return records(knowledge).find((record) => aliases(record).includes(wanted)) || null;
}

function displayName(name, knowledge) {
  const person = findPerson(name, knowledge);
  if (person?.name) {
    const wanted = normalize(name);
    const exactAlias = [person.name, ...(person.aliases || [])].find((value) => normalize(value) === wanted);
    return exactAlias || person.name.split(/\s+/)[0] || titleName(name);
  }
  return titleName(name);
}

function listNames(value = '') {
  return clean(value)
    .replace(/^(and|with)\s+/i, '')
    .split(/,|\band\b/i)
    .map((item) => clean(item))
    .filter(Boolean)
    .filter((item) => !/^(his|her|their|the|a|an)$/i.test(item));
}

function relationFromOwnRecord(question, knowledge) {
  const text = normalize(question);
  const match = text.match(/^who (?:is|was|are|were) (.+?)s (brother|brothers|sister|sisters|siblings|parent|parents|father|mother|uncle|aunt|cousin|cousins|son|sons|daughter|daughters|children)$/);
  if (!match) return '';

  const person = findPerson(match[1], knowledge);
  if (!person) return '';

  const relation = match[2];
  const lines = String(person.text || '').replace(/\r/g, '').split('\n').map(clean).filter(Boolean);
  const wantedSibling = /brother|sister|siblings/.test(relation);
  const wantedParent = /parent|father|mother/.test(relation);
  const wantedChild = /son|daughter|children/.test(relation);

  for (const line of lines) {
    let found;
    if (wantedSibling) {
      found = line.match(/(?:brother|sister|sibling)s?\s*(?:of|:)?\s*(.+)$/i) ||
        line.match(/Family:\s*(?:brother|sister|sibling)s?\s*(?:of|:)?\s*(.+)$/i);
    } else if (wantedParent) {
      found = line.match(/(?:parents?|father|mother)\s*(?:are|is|of|:)?\s*(.+)$/i);
    } else if (wantedChild) {
      found = line.match(/(?:children|sons?|daughters?)\s*(?:are|is|of|:)?\s*(.+)$/i);
    } else {
      found = line.match(new RegExp(`${relation}s?\\s*(?:are|is|of|:)?\\s*(.+)$`, 'i'));
    }
    if (!found) continue;
    const names = listNames(found[1]).filter((name) => normalize(name) !== normalize(person.name));
    if (names.length) return names.join(', ');
  }

  return '';
}

function negativeMarriage(question, knowledge) {
  const text = normalize(question);
  const match = text.match(/^did (.+?) and (.+?) (?:ever )?marry$/);
  if (!match) return '';

  const first = normalize(match[1]);
  const second = normalize(match[2]);
  const firstDisplay = displayName(match[1], knowledge);
  const secondDisplay = displayName(match[2], knowledge);
  const allLines = records(knowledge).flatMap((record) => String(record.text || '').split(/\r?\n/));
  const matching = allLines.map((line) => ({ raw: clean(line), text: normalize(line) }))
    .filter((line) => line.text.includes(first) && line.text.includes(second));

  const no = matching.find((line) => /never married|did not marry|didnt marry|unmarried/.test(line.text));
  const yes = matching.find((line) => /\bmarried\b|wife|husband/.test(line.text) && !/never married|did not marry|didnt marry/.test(line.text));

  if (no && yes) return 'I found conflicting canon records about that marriage, so I will not guess.';
  if (no) return `No. ${firstDisplay} and ${secondDisplay} did not marry.`;
  if (yes) return `Yes. The canon records identify ${firstDisplay} and ${secondDisplay} as married.`;
  return '';
}

function directKinship(question, knowledge) {
  const text = normalize(question);
  const match = text.match(/^is (.+?) (.+?)s (son|daughter|nephew|niece|brother|sister|father|mother|uncle|aunt)$/);
  if (!match) return '';

  const subject = normalize(match[1]);
  const person = normalize(match[2]);
  const relation = match[3];
  const subjectRecord = findPerson(match[1], knowledge);
  const personRecord = findPerson(match[2], knowledge);

  const subjectOwnRecord = subjectRecord && String(subjectRecord.text || '').split(/\r?\n/).some((line) => {
    const value = normalize(line);
    return value.includes(person) && value.includes(relation);
  });

  const personOwnRecord = personRecord && String(personRecord.text || '').split(/\r?\n/).some((line) => {
    const value = normalize(line);
    return value.includes(subject) && value.includes(relation);
  });

  const sharedLine = records(knowledge).flatMap((record) => String(record.text || '').split(/\r?\n/)).some((line) => {
    const value = normalize(line);
    return value.includes(subject) && value.includes(person) && value.includes(relation);
  });

  if (!subjectOwnRecord && !personOwnRecord && !sharedLine) return '';
  return `Yes. The canon records identify ${displayName(match[1], knowledge)} as ${displayName(match[2], knowledge)}'s ${relation}.`;
}

export function guardedAnswer(question, books, knowledge) {
  if (!clean(question)) return '';
  return negativeMarriage(question, knowledge) ||
    directKinship(question, knowledge) ||
    relationFromOwnRecord(question, knowledge) ||
    buildAnswer(question, books, knowledge);
}
