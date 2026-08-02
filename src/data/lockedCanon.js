function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const identity = new Map([
  ['tsula', 'Tsula Red Hawk is Waya Red Hawk’s nephew. Waya took responsibility for raising him after his parents died, and Jennifer became his mother in every way that mattered. Tsula later called Jennifer “Ma.”'],
  ['tsula red hawk', 'Tsula Red Hawk is Waya Red Hawk’s nephew. Waya took responsibility for raising him after his parents died, and Jennifer became his mother in every way that mattered. Tsula later called Jennifer “Ma.”'],
  ['waya', 'Waya Red Hawk is Jennifer Callahan’s husband and Tsula Red Hawk’s uncle and guardian. He was raised by his grandparents after his parents were killed in a raid when he was a toddler.'],
  ['waya red hawk', 'Waya Red Hawk is Jennifer Callahan’s husband and Tsula Red Hawk’s uncle and guardian. He was raised by his grandparents after his parents were killed in a raid when he was a toddler.'],
  ['jace', 'Jace Callahan is one of the founders of Five Oaks and Susanna Pike’s lifelong partner. They had six children together but never married.'],
  ['jace callahan', 'Jace Callahan is one of the founders of Five Oaks and Susanna Pike’s lifelong partner. They had six children together but never married.'],
  ['susanna', 'Susanna Pike is Jace Callahan’s lifelong partner and the mother of their six children. She and Jace never married.'],
  ['susanna pike', 'Susanna Pike is Jace Callahan’s lifelong partner and the mother of their six children. She and Jace never married.'],
]);

export function lockedCanonAnswer(question) {
  const text = normalize(question);

  let match = text.match(/^(?:who|what) (?:is|was) (.+)$/);
  if (match && identity.has(match[1])) return identity.get(match[1]);

  match = text.match(/^who raised (.+)$/);
  if (match?.[1] === 'tsula' || match?.[1] === 'tsula red hawk') {
    return 'Waya Red Hawk raised Tsula, his nephew, after Tsula’s parents died. After Waya married Jennifer, she raised Tsula as her son, and he later called her “Ma.”';
  }
  if (match?.[1] === 'waya' || match?.[1] === 'waya red hawk') {
    return 'Waya Red Hawk was raised by his grandparents after his parents were killed in a raid when he was a toddler.';
  }

  if (/^did jace(?: callahan)? and susanna(?: pike)? (?:ever )?marry$/.test(text) || /^did susanna(?: pike)? and jace(?: callahan)? (?:ever )?marry$/.test(text)) {
    return 'No. Jace Callahan and Susanna Pike never married. They remained lifelong partners and raised six children together.';
  }

  return '';
}
