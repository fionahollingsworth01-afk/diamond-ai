function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function relationshipKey(first, second) {
  return [normalize(first), normalize(second)].sort().join('|');
}

const identityFacts = new Map([
  ['tsula', 'Tsula Red Hawk is Waya Red Hawk’s nephew. Waya took responsibility for raising him, and Jennifer became his mother in every way that mattered. Tsula later called Jennifer “Ma.”'],
  ['tsula red hawk', 'Tsula Red Hawk is Waya Red Hawk’s nephew. Waya took responsibility for raising him, and Jennifer became his mother in every way that mattered. Tsula later called Jennifer “Ma.”'],
  ['waya', 'Waya Red Hawk is Jennifer Callahan’s husband, Tsula Red Hawk’s uncle and guardian, and one of the equal partners in the Five Oaks oil venture.'],
  ['waya red hawk', 'Waya Red Hawk is Jennifer Callahan’s husband, Tsula Red Hawk’s uncle and guardian, and one of the equal partners in the Five Oaks oil venture.'],
  ['jace', 'Jace Callahan is one of the founders of Five Oaks and Susanna Pike’s lifelong partner. They had six children together but never married.'],
  ['jace callahan', 'Jace Callahan is one of the founders of Five Oaks and Susanna Pike’s lifelong partner. They had six children together but never married.'],
  ['susanna', 'Susanna Pike is Jace Callahan’s lifelong partner and the mother of their six children. She and Jace never married.'],
  ['susanna pike', 'Susanna Pike is Jace Callahan’s lifelong partner and the mother of their six children. She and Jace never married.'],
  ['krys', 'Krysten “Krys” Callahan Kincaid is the heart of Five Oaks, Jake Kincaid’s wife, and sister to Jace, Rance, Royce, and Rhys Callahan.'],
  ['matt', 'Matt Haskins is one of the founders of Five Oaks. He never married and considered Jennifer his granddaughter. His horse was Ledger.'],
  ['matt haskins', 'Matt Haskins is one of the founders of Five Oaks. He never married and considered Jennifer his granddaughter. His horse was Ledger.'],
  ['cole', 'Cole Callahan is one of Jace and Susanna’s sons and Tate Hudson’s partner and husband.'],
  ['cole callahan', 'Cole Callahan is one of Jace and Susanna’s sons and Tate Hudson’s partner and husband.'],
  ['tate', 'Tate Hudson is Cole Callahan’s partner and husband.'],
  ['tate hudson', 'Tate Hudson is Cole Callahan’s partner and husband.'],
]);

const raisedFacts = new Map([
  ['tsula', 'Waya Red Hawk raised Tsula after taking responsibility for his nephew. Jennifer later helped raise Tsula as her own son, and he came to call her “Ma.”'],
  ['tsula red hawk', 'Waya Red Hawk raised Tsula after taking responsibility for his nephew. Jennifer later helped raise Tsula as her own son, and he came to call her “Ma.”'],
  ['waya', 'Waya was raised by his grandparents after his parents were killed in a raid when he was a toddler.'],
  ['waya red hawk', 'Waya was raised by his grandparents after his parents were killed in a raid when he was a toddler.'],
]);

const spouseFacts = new Map([
  ['matt', 'Matt Haskins never married.'],
  ['matt haskins', 'Matt Haskins never married.'],
  ['jace', 'Jace Callahan and Susanna Pike were lifelong partners, but they never married.'],
  ['jace callahan', 'Jace Callahan and Susanna Pike were lifelong partners, but they never married.'],
  ['susanna', 'Susanna Pike and Jace Callahan were lifelong partners, but they never married.'],
  ['susanna pike', 'Susanna Pike and Jace Callahan were lifelong partners, but they never married.'],
  ['cole', 'Cole Callahan is married to Tate Hudson.'],
  ['cole callahan', 'Cole Callahan is married to Tate Hudson.'],
  ['tate', 'Tate Hudson is married to Cole Callahan.'],
  ['tate hudson', 'Tate Hudson is married to Cole Callahan.'],
  ['waya', 'Waya Red Hawk is married to Jennifer Callahan.'],
  ['waya red hawk', 'Waya Red Hawk is married to Jennifer Callahan.'],
  ['jennifer', 'Jennifer Callahan is married to Waya Red Hawk.'],
  ['jennifer callahan', 'Jennifer Callahan is married to Waya Red Hawk.'],
]);

const relationshipFacts = new Map([
  [relationshipKey('krys', 'jace'), 'Krys Callahan Kincaid and Jace Callahan are sister and brother.'],
  [relationshipKey('krys callahan kincaid', 'jace callahan'), 'Krys Callahan Kincaid and Jace Callahan are sister and brother.'],
  [relationshipKey('waya', 'tsula'), 'Waya Red Hawk is Tsula Red Hawk’s uncle and guardian. Tsula is Waya’s nephew.'],
  [relationshipKey('waya red hawk', 'tsula red hawk'), 'Waya Red Hawk is Tsula Red Hawk’s uncle and guardian. Tsula is Waya’s nephew.'],
  [relationshipKey('jace', 'susanna'), 'Jace Callahan and Susanna Pike were lifelong partners and had six children together, but they never married.'],
  [relationshipKey('jace callahan', 'susanna pike'), 'Jace Callahan and Susanna Pike were lifelong partners and had six children together, but they never married.'],
  [relationshipKey('cole', 'tate'), 'Cole Callahan and Tate Hudson are husbands.'],
  [relationshipKey('cole callahan', 'tate hudson'), 'Cole Callahan and Tate Hudson are husbands.'],
  [relationshipKey('jennifer', 'waya'), 'Jennifer Callahan and Waya Red Hawk are wife and husband.'],
  [relationshipKey('jennifer callahan', 'waya red hawk'), 'Jennifer Callahan and Waya Red Hawk are wife and husband.'],
  [relationshipKey('krys', 'jake'), 'Krys Callahan Kincaid and Jake Kincaid are wife and husband.'],
  [relationshipKey('kai', 'paloma'), 'Kai Kincaid and Paloma Echevarría Kincaid are husband and wife.'],
  [relationshipKey('luke', 'emma'), 'Luke Rawlins and Emma Rawlins are husband and wife.'],
  [relationshipKey('rhys', 'olivia'), 'Rhys Callahan and Olivia Collins Callahan are husband and wife.'],
]);

export function lockedCanonAnswer(question = '') {
  const text = normalize(question);

  let match = text.match(/^(?:who|what) (?:is|was) (.+)$/);
  if (match) {
    const answer = identityFacts.get(match[1]);
    if (answer) return answer;
  }

  match = text.match(/^who (?:is|was) (.+?) married to$/);
  if (match) {
    const answer = spouseFacts.get(match[1]);
    if (answer) return answer;
  }

  match = text.match(/^who did (.+?) marry$/);
  if (match) {
    const answer = spouseFacts.get(match[1]);
    if (answer) return answer;
  }

  match = text.match(/^did (.+?) (?:ever )?marry$/);
  if (match) {
    const answer = spouseFacts.get(match[1]);
    if (answer) return answer;
  }

  match = text.match(/^who raised (.+)$/);
  if (match) {
    const answer = raisedFacts.get(match[1]);
    if (answer) return answer;
  }

  match = text.match(/^who (?:did|does) (.+) raise$/);
  if (match) {
    const subject = match[1];
    if (subject === 'waya' || subject === 'waya red hawk') {
      return 'Waya Red Hawk raised his nephew, Tsula Red Hawk.';
    }
  }

  match = text.match(/^how (?:are|were) (.+?) and (.+?) related$/);
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
