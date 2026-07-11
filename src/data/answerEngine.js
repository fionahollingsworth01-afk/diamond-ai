function clean(value = '') { return String(value).replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim(); }
export function normalize(value = '') {
  return clean(value).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function dedupeLines(text = '') {
  const out = [];
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) { if (out.length && out.at(-1) !== '') out.push(''); continue; }
    if (out.length && normalize(out.at(-1)) === normalize(line)) continue;
    out.push(line);
  }
  while (out.at(-1) === '') out.pop();
  return out.join('\n');
}
function records(knowledge, type = '') {
  return knowledge.flatMap((source) => (source.sections || []).filter(() => !type || source.type === type).map((section) => ({ ...section, source })));
}
function aliases(record) {
  return new Set([record.name, ...(record.aliases || [])].map(normalize).filter(Boolean));
}
function exactRecord(subject, knowledge, type = '') {
  const wanted = normalize(subject);
  if (!wanted) return null;
  const candidates = records(knowledge, type).filter((record) => aliases(record).has(wanted));
  if (!candidates.length) return null;
  return candidates.sort((a, b) => {
    const ae = normalize(a.name) === wanted ? 1 : 0;
    const be = normalize(b.name) === wanted ? 1 : 0;
    return be - ae || String(b.text || '').length - String(a.text || '').length;
  })[0];
}
function identitySubject(question) {
  return clean(question)
    .replace(/^(who|what)\s+(is|was|are|were)\s+/i, '')
    .replace(/^tell me (everything )?(you know )?about\s+/i, '')
    .replace(/^what do you know about\s+/i, '')
    .replace(/^show me\s+/i, '')
    .replace(/[?!.]+$/g, '')
    .trim();
}
function isIdentityQuestion(question) {
  return /^(who|what)\s+(is|was|are|were)\b/i.test(clean(question)) || /^(tell me|what do you know|show me)\b/i.test(clean(question));
}
function relationRequest(question) {
  const text = normalize(question);
  const patterns = [
    /^who (?:is|was) (.+?)s (father|dad|mother|mom|sister|brother|uncle|aunt|wife|husband|son|daughter|cousin|cousins)$/,
    /^who are (.+?)s (parents|siblings|cousins)$/,
    /^who did (.+?) marry$/,
    /^who (?:is|was) (.+?) married to$/,
    /^what (?:is|was) (.+?)s horse(?: named| called)?$/,
    /^what (?:is|was) the name of (.+?)s horse$/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    if (text.startsWith('who did') || text.includes('married to')) return { person: match[1], relation: 'spouse' };
    if (text.includes('horse')) return { person: match[1], relation: 'horse' };
    return { person: match[1], relation: match[2] };
  }
  return null;
}
const RELATION_TERMS = {
  father: ['father'], dad: ['father'], mother: ['mother'], mom: ['mother'],
  sister: ['sister'], brother: ['brother'], uncle: ['uncle'], aunt: ['aunt'],
  wife: ['wife'], husband: ['husband'], son: ['son'], daughter: ['daughter'],
  cousin: ['cousin'], cousins: ['cousin'], parents: ['father','mother'], siblings: ['sister','brother'],
  spouse: ['wife','husband','married'],
};
function nameVariants(person) {
  const p = normalize(person);
  const variants = new Set([p]);
  const suffixes = [' callahan',' kincaid',' rawlins',' haskins',' red hawk',' redhawk',' pike',' hudson',' ward',' echevarria'];
  suffixes.forEach((suffix) => variants.add(`${p}${suffix}`));
  return [...variants];
}
function relationMatches(record, person, relation) {
  const text = normalize(record.text);
  const name = normalize(record.name);
  const terms = RELATION_TERMS[relation] || [relation];
  const variants = nameVariants(person);
  return terms.some((term) => variants.some((variant) => {
    if (text.includes(`${term} of ${variant}`)) return true;
    if (text.includes(`${variant}s ${term}`)) return true;
    if (new RegExp(`\\b${variant}s(?: older| younger| maternal| paternal)? ${term}\\b`).test(text)) return true;
    if (text.includes(`${term} to ${variant}`)) return true;
    if (term === 'married' && (text.includes(`${variant} married`) || text.includes(`married to ${variant}`))) return true;
    if (text.length < 320 && text.includes(`${term} ${name}`) && text.includes(variant)) return true;
    return false;
  }));
}
function relationshipAnswer(question, knowledge) {
  const request = relationRequest(question);
  if (!request) return '';
  if (request.relation === 'horse') {
    const personVariants = nameVariants(request.person);
    const matches = records(knowledge, 'horses').filter((record) => personVariants.some((variant) => normalize(record.text).includes(`owner ${variant}`)));
    if (!matches.length) return 'I could not find a horse recorded for that person.';
    return dedupeLines(matches[0].text);
  }
  const matches = records(knowledge, 'characters').filter((record) => relationMatches(record, request.person, request.relation));
  if (!matches.length) return 'I could not find that relationship in the current canon records.';
  const unique = [...new Map(matches.map((item) => [normalize(item.name), item])).values()]
    .filter((item) => !['father','mother','sister','brother','uncle','aunt','wife','husband','son','daughter','cousin'].includes(normalize(item.name)));
  if (!unique.length) return 'I could not find that relationship in the current canon records.';
  if (['cousins','parents','siblings'].includes(request.relation)) return unique.map((item) => item.name).join(', ');
  unique.sort((a, b) => String(a.text || '').length - String(b.text || '').length);
  return dedupeLines(unique[0].text);
}
function bookAnswer(question, books) {
  const text = normalize(question);
  const match = text.match(/\bbook\s*(\d{1,2})\b/);
  if (!match) return '';
  const number = Number(match[1]);
  const book = books.find((item) => Number(item.number) === number);
  if (!book) return `Book ${number} is not indexed.`;
  const sections = (book.sections || []).map((section) => clean(section.text)).filter(Boolean);
  if (!sections.length) return `Book ${number}, ${book.title}, is listed but has no searchable text.`;
  const summary = sections.slice(0, 4).join('\n\n');
  return `Book ${number} is ${book.title}.\n\n${summary}`;
}
function keywordBookSearch(question, books) {
  const stop = new Set(['what','where','when','which','does','did','about','tell','show','book','happens','happened','with','from','that','this']);
  const terms = normalize(question).split(' ').filter((word) => word.length > 3 && !stop.has(word));
  if (!terms.length) return null;
  const hits = [];
  for (const book of books) for (const section of book.sections || []) {
    const text = normalize(section.text);
    const score = terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
    if (score) hits.push({ book, section, score });
  }
  return hits.sort((a, b) => b.score - a.score)[0] || null;
}
export function buildAnswer(question, books, knowledge) {
  if (!clean(question)) return '';
  const book = bookAnswer(question, books);
  if (book) return book;
  const relationship = relationshipAnswer(question, knowledge);
  if (relationship) return relationship;
  if (isIdentityQuestion(question)) {
    const subject = identitySubject(question);
    const found = exactRecord(subject, knowledge);
    if (found) return dedupeLines(found.text);
    return 'I could not find an exact canon record for that name. I will not substitute a different person, animal, place, or event.';
  }
  const hit = keywordBookSearch(question, books);
  if (hit) return `I found this in ${hit.book.title}:\n\n${clean(hit.section.text)}`;
  return 'I could not find that information in the current Five Oaks canon.';
}
