function clean(value = '') {
  return String(value).replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

export function normalize(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const UNKNOWN = 'I could not verify that in the current Five Oaks canon. I will not invent an answer.';
const CONFLICT = 'I found conflicting canon records, so I am not going to pretend they agree.';

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'book', 'could', 'does', 'everything',
  'from', 'happened', 'happens', 'have', 'into', 'know', 'more', 'much', 'show', 'that', 'their',
  'there', 'these', 'they', 'this', 'what', 'when', 'where', 'which', 'with', 'would', 'your',
]);

const SURNAME_SUFFIXES = [
  'callahan', 'kincaid', 'rawlins', 'haskins', 'red hawk', 'redhawk', 'pike', 'hudson', 'ward',
  'echevarria', 'collins', 'masters', 'harvey', 'walters', 'shover', 'sixkiller',
];

const RELATION_SYNONYMS = {
  dad: 'father', father: 'father',
  mom: 'mother', mother: 'mother',
  brother: 'brother', brothers: 'brother',
  sister: 'sister', sisters: 'sister',
  sibling: 'sibling', siblings: 'sibling',
  parent: 'parent', parents: 'parent',
  uncle: 'uncle', uncles: 'uncle',
  aunt: 'aunt', aunts: 'aunt',
  cousin: 'cousin', cousins: 'cousin',
  wife: 'spouse', husband: 'spouse', spouse: 'spouse',
  son: 'son', sons: 'son', daughter: 'daughter', daughters: 'daughter',
  child: 'child', children: 'child',
  nephew: 'nephew', niece: 'niece',
  horse: 'horse',
};

function dedupeLines(text = '') {
  const out = [];
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      if (out.length && out.at(-1) !== '') out.push('');
      continue;
    }
    if (out.length && normalize(out.at(-1)) === normalize(line)) continue;
    out.push(line);
  }
  while (out.at(-1) === '') out.pop();
  return out.join('\n');
}

function allRecords(knowledge, type = '') {
  return knowledge.flatMap((source) => (source.sections || [])
    .filter(() => !type || source.type === type)
    .map((section) => ({ ...section, source })));
}

function recordAliases(record) {
  const values = new Set([record.name, ...(record.aliases || [])]);
  const name = String(record.name || '');
  const first = name.split(/\s+/)[0];
  if (first) values.add(first);
  for (const match of name.matchAll(/[“‘"']([^”’"']+)[”’"']/g)) values.add(match[1]);
  return [...values].map(normalize).filter(Boolean);
}

function recordFields(record) {
  const fields = new Map();
  for (const raw of String(record.text || '').replace(/\r/g, '').split('\n')) {
    const match = raw.trim().match(/^([^:]{2,50}):\s*(.+)$/);
    if (!match) continue;
    fields.set(normalize(match[1]), clean(match[2]));
  }
  return fields;
}

function dossierScore(record, wanted = '') {
  const text = String(record.text || '');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const fields = recordFields(record);
  let score = Math.min(text.length, 5000) / 20;
  if (normalize(record.name) === wanted) score += 10000;
  if (normalize(lines[0] || '') === wanted) score += 3000;
  score += fields.size * 600;
  if (fields.has('core spine')) score += 1200;
  if (fields.has('role')) score += 500;
  if (lines.length <= 2) score -= 2500;
  return score;
}

function exactRecords(subject, knowledge, type = '') {
  const wanted = normalize(subject);
  if (!wanted) return [];
  return allRecords(knowledge, type)
    .filter((record) => recordAliases(record).includes(wanted))
    .sort((a, b) => dossierScore(b, wanted) - dossierScore(a, wanted));
}

function identitySubject(question) {
  return clean(question)
    .replace(/^(who|what)\s+(is|was|are|were)\s+/i, '')
    .replace(/^tell me (everything )?(you know )?about\s+/i, '')
    .replace(/^what do you know about\s+/i, '')
    .replace(/^show me\s+/i, '')
    .replace(/(?:'s|’s)?\s+(full\s+)?(dossier|profile|record|entry)$/i, '')
    .replace(/[?!.]+$/g, '')
    .trim();
}

function isIdentityQuestion(question) {
  const text = clean(question);
  return /^(who|what)\s+(is|was|are|were)\b/i.test(text) ||
    /^(tell me|what do you know|show me)\b/i.test(text);
}

function naturalIdentityAnswer(record) {
  const fields = recordFields(record);
  const role = fields.get('role');
  const core = fields.get('core spine') || fields.get('core') || fields.get('background foundation');
  const family = fields.get('family');
  const parts = [];
  if (record.name) parts.push(role ? `${record.name} is ${role.replace(/^a\s+/i, 'a ')}` : record.name);
  if (core) parts.push(core);
  if (family) parts.push(`Family: ${family}`);
  if (parts.length >= 2) return parts.join('\n\n');
  return dedupeLines(record.text);
}

function familySourceAnswer(subject, knowledge) {
  const wanted = normalize(subject).replace(/^the\s+/, '');
  if (!wanted.endsWith(' family')) return '';
  const familyName = wanted.replace(/\s+family$/, '');
  const source = knowledge.find((item) => {
    const title = normalize(item.title || '');
    const file = normalize(item.file || '');
    return title.includes(`${familyName} family`) || file.includes(`${familyName} family`);
  });
  if (!source?.rawText) return '';
  return dedupeLines(String(source.rawText).split(/\r?\n/).slice(0, 60).join('\n'));
}

function variantsForName(name) {
  const base = normalize(name);
  const variants = new Set([base]);
  if (base && !base.includes(' ')) {
    for (const surname of SURNAME_SUFFIXES) variants.add(`${base} ${surname}`);
  }
  return [...variants];
}

function lineEvidence(record, names = [], terms = []) {
  const lines = String(record.text || '').replace(/\r/g, '').split('\n').map(clean).filter(Boolean);
  return lines.filter((line) => {
    const normalized = normalize(line);
    return names.every((nameGroup) => nameGroup.some((name) => normalized.includes(name))) &&
      terms.some((term) => normalized.includes(term));
  });
}

function parseRelationshipQuestion(question) {
  const text = normalize(question);
  let match = text.match(/^who (?:is|was|are|were) (.+?)s (father|dad|mother|mom|brother|brothers|sister|sisters|siblings|parents|uncle|aunt|cousin|cousins|wife|husband|spouse|son|sons|daughter|daughters|children|nephew|niece)$/);
  if (match) return { person: match[1], relation: RELATION_SYNONYMS[match[2]] || match[2], plural: /s$|siblings|parents|children/.test(match[2]) };

  match = text.match(/^who did (.+?) marry$/);
  if (match) return { person: match[1], relation: 'spouse', plural: false };

  match = text.match(/^who (?:is|was) (.+?) married to$/);
  if (match) return { person: match[1], relation: 'spouse', plural: false };

  match = text.match(/^what (?:is|was) (?:the name of )?(.+?)s horse(?: named| called)?$/);
  if (match) return { person: match[1], relation: 'horse', plural: false };

  return null;
}

function relationTerms(relation) {
  if (relation === 'sibling') return ['brother', 'sister', 'sibling'];
  if (relation === 'parent') return ['father', 'mother', 'parent'];
  if (relation === 'spouse') return ['wife', 'husband', 'spouse', 'married to', 'married'];
  if (relation === 'child') return ['son', 'daughter', 'child', 'children'];
  return [relation];
}

function candidateNameFromLine(line, person, relation) {
  const normalizedPerson = variantsForName(person);
  const raw = clean(line);
  const patterns = [];

  for (const personName of normalizedPerson) {
    const escaped = personName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    for (const term of relationTerms(relation)) {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      patterns.push(new RegExp(`^(.+?)\\s+(?:is|was)\\s+${escaped}'?s\\s+${escapedTerm}\\b`, 'i'));
      patterns.push(new RegExp(`^${escaped}'?s\\s+${escapedTerm}\\s+(?:is|was)\\s+(.+)$`, 'i'));
      patterns.push(new RegExp(`^${escaped}\\s+(?:married|was married to|is married to)\\s+(.+)$`, 'i'));
      patterns.push(new RegExp(`^(.+?)\\s+(?:married|was married to|is married to)\\s+${escaped}$`, 'i'));
      patterns.push(new RegExp(`^${escapedTerm}\\s+of\\s+${escaped}\\s*[:,-]?\\s*(.+)$`, 'i'));
    }
  }

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) return clean(match[1]);
  }
  return '';
}

function relationshipAnswer(question, knowledge) {
  const request = parseRelationshipQuestion(question);
  if (!request) return '';

  if (request.relation === 'horse') {
    const personNames = variantsForName(request.person);
    const matches = allRecords(knowledge, 'horses').filter((record) => {
      const text = normalize(record.text);
      return personNames.some((person) => text.includes(`owner ${person}`) || text.includes(`belongs to ${person}`));
    });
    if (!matches.length) return UNKNOWN;
    return naturalIdentityAnswer(matches[0]);
  }

  const personNames = variantsForName(request.person);
  const terms = relationTerms(request.relation);
  const candidates = [];

  for (const record of allRecords(knowledge, 'characters')) {
    const recordName = normalize(record.name);
    const evidence = lineEvidence(record, [personNames], terms);
    if (!evidence.length) continue;

    let candidate = record.name;
    for (const line of evidence) {
      const extracted = candidateNameFromLine(line, request.person, request.relation);
      if (extracted) candidate = extracted;
    }
    if (!candidate || personNames.includes(normalize(candidate))) continue;
    candidates.push({ name: clean(candidate), record, evidence });
  }

  const unique = [...new Map(candidates.map((item) => [normalize(item.name), item])).values()];
  if (!unique.length) return UNKNOWN;
  if (request.plural || ['sibling', 'parent', 'child', 'cousin'].includes(request.relation)) {
    return unique.map((item) => item.name).join(', ');
  }
  if (unique.length > 1) {
    const names = unique.map((item) => item.name);
    if (new Set(names.map(normalize)).size > 1) return `${CONFLICT}\n\nPossible answers: ${names.join(', ')}`;
  }
  return unique[0].name;
}

function yesNoRelationshipAnswer(question, knowledge) {
  const text = normalize(question);
  let match = text.match(/^did (.+?) and (.+?) (?:ever )?marry$/);
  if (match) {
    const first = variantsForName(match[1]);
    const second = variantsForName(match[2]);
    const joined = allRecords(knowledge, 'characters').flatMap((record) => String(record.text || '').split(/\r?\n/));
    const positive = joined.some((line) => {
      const value = normalize(line);
      return first.some((a) => value.includes(a)) && second.some((b) => value.includes(b)) && /married|wife|husband/.test(value);
    });
    const negative = joined.some((line) => {
      const value = normalize(line);
      return first.some((a) => value.includes(a)) && second.some((b) => value.includes(b)) && /never married|did not marry|didnt marry|unmarried/.test(value);
    });
    if (positive && negative) return CONFLICT;
    if (negative) return `No. ${clean(match[1])} and ${clean(match[2])} did not marry.`;
    if (positive) return `Yes. The canon records identify ${clean(match[1])} and ${clean(match[2])} as married.`;
    return UNKNOWN;
  }

  match = text.match(/^is (.+?) (.+?)s (son|daughter|nephew|niece|brother|sister|father|mother|uncle|aunt)$/);
  if (match) {
    const subject = match[1];
    const person = match[2];
    const relation = RELATION_SYNONYMS[match[3]] || match[3];
    const subjectNames = variantsForName(subject);
    const personNames = variantsForName(person);
    const terms = relationTerms(relation);
    const lines = allRecords(knowledge, 'characters').flatMap((record) => String(record.text || '').split(/\r?\n/));
    const found = lines.some((line) => {
      const value = normalize(line);
      return subjectNames.some((name) => value.includes(name)) && personNames.some((name) => value.includes(name)) && terms.some((term) => value.includes(term));
    });
    if (found) return `Yes. The canon records identify ${clean(subject)} as ${clean(person)}'s ${relation}.`;
    return UNKNOWN;
  }

  return '';
}

function bookNumberAnswer(question, books) {
  const match = normalize(question).match(/\bbook\s*(\d{1,2})\b/);
  if (!match) return '';
  const number = Number(match[1]);
  const book = books.find((item) => Number(item.number) === number);
  if (!book) return `Book ${number} is not indexed.`;
  return `Book ${number} is ${book.title}. It contains ${(book.sections || []).length} searchable sections.`;
}

function asksForPassage(question) {
  const text = normalize(question);
  return /passage|scene|excerpt|quote|where in the book/.test(text);
}

function searchTerms(question) {
  return normalize(question).split(' ').filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function rankedBookHits(question, books) {
  const phrase = normalize(question);
  const terms = searchTerms(question);
  if (!terms.length) return [];
  const hits = [];

  for (const book of books) {
    for (const section of book.sections || []) {
      const text = normalize(section.text);
      const matchedTerms = terms.filter((term) => text.includes(term));
      if (!matchedTerms.length) continue;
      let score = matchedTerms.length * 10;
      if (text.includes(phrase)) score += 80;
      if (matchedTerms.length === terms.length) score += 30;
      score += Math.min(String(section.text || '').length, 1500) / 500;
      hits.push({ book, section, score, matchedTerms });
    }
  }
  return hits.sort((a, b) => b.score - a.score);
}

function manuscriptAnswer(question, books) {
  const hits = rankedBookHits(question, books);
  if (!hits.length) return '';
  const best = hits[0];
  const second = hits[1];
  if (second && best.score - second.score < 3 && best.book.number !== second.book.number) {
    return `${CONFLICT}\n\nClosest matches are in ${best.book.title} and ${second.book.title}. Ask for a more specific person, event, or phrase.`;
  }
  if (asksForPassage(question)) return `I found this in ${best.book.title}:\n\n${clean(best.section.text)}`;
  return `The strongest manuscript match is in ${best.book.title}. Ask “show me the passage” to see the excerpt.`;
}

function contradictionCheck(records) {
  const normalized = records.map((record) => normalize(record.text));
  const positiveMarriage = normalized.some((text) => /\bmarried\b/.test(text) && !/never married|did not marry|didnt marry/.test(text));
  const negativeMarriage = normalized.some((text) => /never married|did not marry|didnt marry/.test(text));
  return positiveMarriage && negativeMarriage;
}

export function buildAnswer(question, books, knowledge) {
  if (!clean(question)) return '';

  const numberedBook = bookNumberAnswer(question, books);
  if (numberedBook) return numberedBook;

  const yesNo = yesNoRelationshipAnswer(question, knowledge);
  if (yesNo) return yesNo;

  const relationship = relationshipAnswer(question, knowledge);
  if (relationship) return relationship;

  if (isIdentityQuestion(question)) {
    const subject = identitySubject(question);
    const family = familySourceAnswer(subject, knowledge);
    if (family) return family;

    const matches = exactRecords(subject, knowledge);
    if (matches.length) {
      if (contradictionCheck(matches)) return CONFLICT;
      return naturalIdentityAnswer(matches[0]);
    }
    return UNKNOWN;
  }

  const manuscript = manuscriptAnswer(question, books);
  if (manuscript) return manuscript;

  return UNKNOWN;
}
