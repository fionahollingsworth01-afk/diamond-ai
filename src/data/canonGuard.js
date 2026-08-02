import { buildAnswer } from './answerEngine.js';
import { lockedCanonAnswer } from './lockedCanon.js';

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

function identitySubject(question) {
  const text = clean(question).replace(/[?!.]+$/g, '').trim();
  const patterns = [
    /^(?:who|what)\s+(?:is|was)\s+(.+)$/i,
    /^tell me (?:everything )?(?:you know )?about\s+(.+)$/i,
    /^what do you know about\s+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return clean(match[1]);
  }
  return '';
}

function nextNonBlank(lines, index) {
  for (let i = index + 1; i < lines.length; i += 1) {
    if (clean(lines[i])) return i;
  }
  return -1;
}

function fieldValue(lines, label) {
  const pattern = new RegExp(`^${label}\\s*:\\s*(.*)$`, 'i');
  for (let i = 0; i < lines.length; i += 1) {
    const match = clean(lines[i]).match(pattern);
    if (!match) continue;
    if (match[1]) return clean(match[1]);
    const next = nextNonBlank(lines, i);
    return next >= 0 ? clean(lines[next]) : '';
  }
  return '';
}

function horseIdentity(record) {
  const lines = String(record.text || '').replace(/\r/g, '').split('\n');
  const owner = fieldValue(lines, 'Owner');
  const breed = fieldValue(lines, 'Breed');
  const color = fieldValue(lines, 'Color');
  const gender = fieldValue(lines, 'Gender');
  const temperament = fieldValue(lines, 'Temperament');
  const core = fieldValue(lines, 'Core Spine');
  const answer = [record.name];
  if (owner) answer.push(`Owner: ${owner}`);
  if (breed) answer.push(`Breed: ${breed}`);
  if (color) answer.push(`Color: ${color}`);
  if (gender) answer.push(`Gender: ${gender}`);
  if (temperament) answer.push(`Temperament: ${temperament}`);
  if (core) answer.push(`Core: ${core}`);
  return answer.join('\n');
}

function findHorse(name, knowledge) {
  const wanted = normalize(name);
  if (!wanted) return null;
  return records(knowledge, 'horses').find((record) => aliases(record).includes(wanted)) || null;
}

function horseAnswer(question, knowledge) {
  const raw = clean(question).replace(/[?!.]+$/g, '').trim();
  const text = normalize(raw);

  let subject = identitySubject(raw);
  if (subject) {
    const horse = findHorse(subject, knowledge);
    if (horse) return horseIdentity(horse);
  }

  let match = text.match(/^who (?:owns|owned|rides|rode) (.+)$/);
  if (!match) match = text.match(/^whose horse (?:is|was) (.+)$/);
  if (!match) match = text.match(/^who (?:is|was) (.+?)s owner$/);
  if (match) {
    const horse = findHorse(match[1], knowledge);
    if (!horse) return '';
    const owner = fieldValue(String(horse.text || '').split(/\r?\n/), 'Owner');
    return owner ? `${horse.name} belongs to ${owner}.` : horseIdentity(horse);
  }

  match = text.match(/^what horse (?:does|did) (.+?) (?:ride|own)$/);
  if (!match) match = text.match(/^what (?:is|was) (.+?)s horse(?:s name)?$/);
  if (!match) match = text.match(/^what horse belongs to (.+)$/);
  if (!match) match = text.match(/^which horse (?:does|did) (.+?) (?:ride|own)$/);
  if (match) {
    const owner = normalize(match[1]);
    const horse = records(knowledge, 'horses').find((record) => {
      const lines = String(record.text || '').replace(/\r/g, '').split('\n');
      return normalize(fieldValue(lines, 'Owner')) === owner;
    });
    return horse ? horseIdentity(horse) : '';
  }

  return '';
}

function isDossierHeading(lines, index) {
  const line = clean(lines[index]);
  if (!line || line.includes(':')) return false;
  const next = nextNonBlank(lines, index);
  return next >= 0 && /^role\s*:/i.test(clean(lines[next]));
}

function subjectMatchesHeading(subject, heading) {
  const wanted = normalize(subject);
  const candidate = normalize(heading);
  if (!wanted || !candidate) return false;
  return candidate === wanted || candidate.startsWith(`${wanted} `);
}

function familyLines(lines) {
  const start = lines.findIndex((line) => /^family\s*:/i.test(clean(line)));
  if (start < 0) return [];
  const found = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = clean(lines[i]);
    if (!line) continue;
    if (/^[A-Za-z][A-Za-z ]{1,40}:/.test(line)) break;
    found.push(line);
  }
  return found;
}

function dossierIdentity(question, knowledge) {
  const subject = identitySubject(question);
  if (!subject) return '';

  for (const source of knowledge) {
    const raw = String(source.rawText || '');
    if (!raw) continue;
    const lines = raw.replace(/\r/g, '').split('\n');

    for (let i = 0; i < lines.length; i += 1) {
      if (!isDossierHeading(lines, i) || !subjectMatchesHeading(subject, lines[i])) continue;
      let end = lines.length;
      for (let j = i + 1; j < lines.length; j += 1) {
        if (isDossierHeading(lines, j)) {
          end = j;
          break;
        }
      }

      const dossier = lines.slice(i, end);
      const heading = clean(dossier[0]);
      const role = fieldValue(dossier, 'Role');
      const family = familyLines(dossier);
      const core = fieldValue(dossier, 'Core Spine');
      const answer = [heading];
      if (role) answer.push(`Role: ${role}`);
      if (family.length) answer.push(`Family: ${family.join(' ')}`);
      if (core) answer.push(`Core: ${core}`);
      return answer.join('\n');
    }
  }
  return '';
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
  return lockedCanonAnswer(question) ||
    horseAnswer(question, knowledge) ||
    dossierIdentity(question, knowledge) ||
    negativeMarriage(question, knowledge) ||
    directKinship(question, knowledge) ||
    relationFromOwnRecord(question, knowledge) ||
    buildAnswer(question, books, knowledge);
}
