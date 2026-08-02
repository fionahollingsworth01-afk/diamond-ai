import {
  animals,
  books,
  characters,
  getCharacterById,
  relationships,
} from './fiveOaksData.js';

const STOP_WORDS = new Set([
  'about', 'and', 'are', 'book', 'character', 'does', 'for', 'from',
  'five', 'have', 'how', 'into', 'is', 'live', 'of', 'oaks', 'on', 'tell', 'that', 'the',
  'their', 'they', 'this', 'what', 'when', 'where', 'which', 'who', 'with',
]);

function casefold(value) {
  return String(value).normalize('NFKC').toLocaleLowerCase('en-US');
}

function wholeWordMatch(text, term) {
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text);
}

function flatten(value) {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flatten);
  return [value];
}

function recordText(type, record) {
  if (type === 'relationship') {
    const people = [record.character_1, record.character_2]
      .map(getCharacterById)
      .filter(Boolean);
    return [
      record.relationship_type,
      record.description,
      record.first_meet,
      ...(record.key_moments || []),
      ...people.map((person) => person.name),
    ].map(casefold).join(' ');
  }
  return flatten(record).map(casefold).join(' ');
}

function displayName(record) {
  return casefold(record.name || record.title || '');
}

function normalizePlural(term) {
  if (term.length > 3 && term.endsWith('s') && !/(?:ss|us|is|ys)$/.test(term)) {
    return term.slice(0, -1);
  }
  return term;
}

export function tokenize(question) {
  return new Set(
    (casefold(question).match(/[a-z0-9']+/g) || [])
      .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
      .map(normalizePlural),
  );
}

export function searchFiveOaks(question) {
  const terms = tokenize(question);
  if (!terms.size) return [];

  const candidates = [];
  const collections = [
    ['character', characters],
    ['book', books],
    ['relationship', relationships],
    ['animal', animals],
  ];

  for (const [type, records] of collections) {
    records.forEach((record, index) => {
      const searchable = recordText(type, record);
      const name = displayName(record);
      let score = 0;

      for (const term of terms) {
        if (searchable.includes(term)) score += wholeWordMatch(searchable, term) ? 3 : 1;
        if (wholeWordMatch(name, term)) score += 10;
      }

      if (score) candidates.push({ score, type, record, index });
    });
  }

  return candidates
    .sort((left, right) => right.score - left.score || left.type.localeCompare(right.type) || left.index - right.index)
    .slice(0, 5);
}

function formatBook(book) {
  const lines = [`${book.title} (Book ${book.order} in ${book.series})`];
  if (book.plot_summary) lines.push(book.plot_summary);
  if (book.themes?.length) lines.push(`Themes: ${book.themes.join(', ')}`);
  return lines.join('\n');
}

function formatCharacter(character) {
  const lines = [character.name];
  if (character.role) lines.push(`Role: ${character.role}`);
  if (character.description) lines.push(character.description);
  if (character.background) lines.push(`Background: ${character.background}`);
  if (character.residence) lines.push(`Lives at: ${character.residence}`);
  if (character.personality_traits?.length) lines.push(`Traits: ${character.personality_traits.join(', ')}`);
  return lines.join('\n');
}

function formatAnimal(animal) {
  const owner = getCharacterById(animal.owner_id);
  const lines = [animal.name, `${animal.species.charAt(0).toUpperCase()}${animal.species.slice(1)}${animal.role ? ` - ${animal.role}` : ''}`];
  if (owner) lines.push(`Associated with: ${owner.name}`);
  if (animal.location) lines.push(`Location: ${animal.location}`);
  if (animal.notes) lines.push(animal.notes);
  return lines.join('\n');
}

function formatRelationship(relationship) {
  const first = getCharacterById(relationship.character_1);
  const second = getCharacterById(relationship.character_2);
  const lines = [`${first?.name || 'Unknown'} and ${second?.name || 'Unknown'}`, relationship.relationship_type];
  if (relationship.description) lines.push(relationship.description);
  return lines.join('\n');
}

export function formatSearchResult({ type, record }) {
  if (type === 'book') return formatBook(record);
  if (type === 'character') return formatCharacter(record);
  if (type === 'animal') return formatAnimal(record);
  return formatRelationship(record);
}

export function answerFiveOaksQuestion(question) {
  const terms = tokenize(question);
  if (!terms.size) {
    return 'Enter a character name, book title, theme, relationship, or animal to search the current Five Oaks records.';
  }

  const results = searchFiveOaks(question);
  if (!results.length) {
    return 'No matching records are available in the current Five Oaks snapshot. Diamond cannot provide facts outside these records.';
  }

  return `Search results\n\n${results.map(formatSearchResult).join('\n\n---\n\n')}`;
}
