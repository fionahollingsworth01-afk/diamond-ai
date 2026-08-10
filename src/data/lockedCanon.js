function clean(value = '') {
  return String(value).replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const aliases = new Map([
  ['krys', 'krys'], ['krysten', 'krys'], ['krysten krys callahan kincaid', 'krys'], ['krys callahan kincaid', 'krys'],
  ['jace', 'jace'], ['jace callahan', 'jace'],
  ['jake', 'jake'], ['jacob', 'jake'], ['jacob kincaid', 'jake'], ['jake kincaid', 'jake'],
  ['matt', 'matt'], ['matt haskins', 'matt'],
  ['waya', 'waya'], ['waya red hawk', 'waya'],
  ['tsula', 'tsula'], ['tsula red hawk', 'tsula'],
  ['jennifer', 'jennifer'], ['jennifer callahan', 'jennifer'], ['jennifer red hawk', 'jennifer'], ['jennifer callahan red hawk', 'jennifer'],
  ['susanna', 'susanna'], ['susanna pike', 'susanna'],
  ['cole', 'cole'], ['cole callahan', 'cole'],
  ['tate', 'tate'], ['tate hudson', 'tate'],
  ['kai', 'kai'], ['kai kincaid', 'kai'],
  ['paloma', 'paloma'], ['paloma echevarria', 'paloma'], ['paloma echevarria kincaid', 'paloma'],
  ['luke', 'luke'], ['luke rawlins', 'luke'],
  ['emma', 'emma'], ['emma rawlins', 'emma'],
  ['rhys', 'rhys'], ['rhys callahan', 'rhys'],
  ['olivia', 'olivia'], ['olivia collins', 'olivia'], ['olivia collins callahan', 'olivia'],
]);

function canonicalName(value = '') {
  const cleaned = normalize(value).replace(/^(the\s+)?/, '');
  return aliases.get(cleaned) || cleaned;
}

function relationshipKey(first, second) {
  return [canonicalName(first), canonicalName(second)].sort().join('|');
}

function groupKey(names = []) {
  return names.map(canonicalName).filter(Boolean).sort().join('|');
}

const identityFacts = new Map([
  ['tsula', 'Tsula Red Hawk is Waya Red Hawk’s nephew. Waya took responsibility for raising him, and Jennifer became his mother in every way that mattered. Tsula later called Jennifer “Ma.”'],
  ['waya', 'Waya Red Hawk is Jennifer Callahan’s husband, Tsula Red Hawk’s uncle and guardian, and one of the equal partners in the Five Oaks oil venture.'],
  ['jace', 'Jace Callahan is one of the founders of Five Oaks and Susanna Pike’s lifelong partner. They had six children together but never married.'],
  ['susanna', 'Susanna Pike is Jace Callahan’s lifelong partner and the mother of their six children. She and Jace never married.'],
  ['krys', 'Krysten “Krys” Callahan Kincaid is the heart of Five Oaks, Jake Kincaid’s wife, and sister to Jace, Rance, Royce, and Rhys Callahan.'],
  ['matt', 'Matt Haskins is one of the founders of Five Oaks. He never married and considered Jennifer his granddaughter. His horse was Ledger.'],
  ['cole', 'Cole Callahan is one of Jace and Susanna’s sons and Tate Hudson’s partner and husband.'],
  ['tate', 'Tate Hudson is Cole Callahan’s partner and husband.'],
]);

const raisedFacts = new Map([
  ['tsula', 'Waya Red Hawk raised Tsula after taking responsibility for his nephew. Jennifer later helped raise Tsula as her own son, and he came to call her “Ma.”'],
  ['waya', 'Waya was raised by his grandparents after his parents were killed in a raid when he was a toddler.'],
]);

const spouseFacts = new Map([
  ['matt', 'Matt Haskins never married.'],
  ['jace', 'Jace Callahan and Susanna Pike were lifelong partners, but they never married.'],
  ['susanna', 'Susanna Pike and Jace Callahan were lifelong partners, but they never married.'],
  ['cole', 'Cole Callahan is married to Tate Hudson.'],
  ['tate', 'Tate Hudson is married to Cole Callahan.'],
  ['waya', 'Waya Red Hawk is married to Jennifer Callahan.'],
  ['jennifer', 'Jennifer Callahan is married to Waya Red Hawk.'],
]);

const relationshipFacts = new Map([
  [relationshipKey('krys', 'jace'), 'Krys Callahan Kincaid and Jace Callahan are sister and brother.'],
  [relationshipKey('waya', 'tsula'), 'Waya Red Hawk is Tsula Red Hawk’s uncle and guardian. Tsula is Waya’s nephew.'],
  [relationshipKey('jace', 'susanna'), 'Jace Callahan and Susanna Pike were lifelong partners and had six children together, but they never married.'],
  [relationshipKey('cole', 'tate'), 'Cole Callahan and Tate Hudson are husbands.'],
  [relationshipKey('jennifer', 'waya'), 'Jennifer Callahan and Waya Red Hawk are wife and husband.'],
  [relationshipKey('krys', 'jake'), 'Krys Callahan Kincaid and Jake Kincaid are wife and husband.'],
  [relationshipKey('kai', 'paloma'), 'Kai Kincaid and Paloma Echevarría Kincaid are husband and wife.'],
  [relationshipKey('luke', 'emma'), 'Luke Rawlins and Emma Rawlins are husband and wife.'],
  [relationshipKey('rhys', 'olivia'), 'Rhys Callahan and Olivia Collins Callahan are husband and wife.'],
]);

const groupConnectionFacts = new Map([
  [groupKey(['jake', 'krys', 'matt']), 'Jake Kincaid and Krys Callahan Kincaid are husband and wife. Matt Haskins is their lifelong friend and fellow founder of Five Oaks.'],
]);

function parseGroupNames(value = '') {
  return value
    .split(/\s*,\s*|\s+and\s+/i)
    .map((name) => name.trim())
    .filter(Boolean);
}

function factFor(map, value) {
  return map.get(canonicalName(value)) || '';
}

export function lockedCanonAnswer(question = '') {
  const text = normalize(question);
  const raw = clean(question).replace(/[?!.]+$/g, '').trim();

  if (/^(?:where is|where was|where are|where were) (?:the )?five oaks(?: located)?$/.test(text) ||
      /^(?:what is|whats) (?:the )?location of (?:the )?five oaks$/.test(text)) {
    return 'Five Oaks is located in Red Willow Crossing, Missouri.';
  }

  let match = text.match(/^(?:who|what) (?:is|was) (.+)$/);
  if (match) {
    const answer = factFor(identityFacts, match[1]);
    if (answer) return answer;
  }

  match = text.match(/^who (?:is|was) (.+?) married to$/);
  if (match) {
    const answer = factFor(spouseFacts, match[1]);
    if (answer) return answer;
  }

  match = text.match(/^who did (.+?) marry$/);
  if (match) {
    const answer = factFor(spouseFacts, match[1]);
    if (answer) return answer;
  }

  match = text.match(/^did (.+?) (?:ever )?marry$/);
  if (match) {
    const answer = factFor(spouseFacts, match[1]);
    if (answer) return answer;
  }

  match = text.match(/^who raised (.+)$/);
  if (match) {
    const answer = factFor(raisedFacts, match[1]);
    if (answer) return answer;
  }

  match = text.match(/^who (?:did|does) (.+) raise$/);
  if (match && canonicalName(match[1]) === 'waya') {
    return 'Waya Red Hawk raised his nephew, Tsula Red Hawk.';
  }

  match = raw.match(/^how\s+(?:are|were)\s+(.+?)\s+(?:related|connected)$/i);
  if (match) {
    const names = parseGroupNames(match[1]);
    const groupAnswer = groupConnectionFacts.get(groupKey(names));
    if (groupAnswer) return groupAnswer;
    if (names.length === 2) {
      const answer = relationshipFacts.get(relationshipKey(names[0], names[1]));
      if (answer) return answer;
    }
  }

  match = text.match(/^what (?:is|was) (?:the )?relationship between (.+?) and (.+)$/);
  if (match) {
    const answer = relationshipFacts.get(relationshipKey(match[1], match[2]));
    if (answer) return answer;
  }

  match = text.match(/^what (?:is|was) (.+?)s relationship (?:to|with) (.+)$/);
  if (match) {
    const answer = relationshipFacts.get(relationshipKey(match[1], match[2]));
    if (answer) return answer;
  }

  match = text.match(/^(?:are|were) (.+?) and (.+?) related$/);
  if (match) {
    const answer = relationshipFacts.get(relationshipKey(match[1], match[2]));
    if (answer) return answer;
  }

  return '';
}
