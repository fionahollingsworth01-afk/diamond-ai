import animalsPayload from './five-oaks/animals.json' with { type: 'json' };
import booksPayload from './five-oaks/books.json' with { type: 'json' };
import charactersPayload from './five-oaks/characters.json' with { type: 'json' };
import relationshipsPayload from './five-oaks/relationships.json' with { type: 'json' };

function collection(payload, name) {
  if (!payload || !Array.isArray(payload[name])) {
    throw new Error(`Five Oaks snapshot is missing its ${name} collection.`);
  }
  return payload[name];
}

function indexById(records) {
  return new Map(records.map((record) => [record.id, record]));
}

export const books = collection(booksPayload, 'books');
export const characters = collection(charactersPayload, 'characters');
export const relationships = collection(relationshipsPayload, 'relationships');
export const animals = collection(animalsPayload, 'animals');

export const booksByOrder = [...books].sort((left, right) => left.order - right.order);
export const booksById = indexById(books);
export const charactersById = indexById(characters);
export const relationshipsById = indexById(relationships);
export const animalsById = indexById(animals);

export function getBookById(bookId) {
  return booksById.get(bookId);
}

export function getCharacterById(characterId) {
  return charactersById.get(characterId);
}

export function getRelationshipById(relationshipId) {
  return relationshipsById.get(relationshipId);
}

export function getAnimalById(animalId) {
  return animalsById.get(animalId);
}

export function getCharactersInBook(bookId) {
  const book = getBookById(bookId);
  if (!book) return [];
  return book.characters.map(getCharacterById).filter(Boolean);
}

export function getRelationshipsForCharacter(characterId) {
  return relationships.filter(
    (relationship) => relationship.character_1 === characterId || relationship.character_2 === characterId,
  );
}

export const relationshipViews = relationships.map((relationship) => ({
  ...relationship,
  firstCharacter: getCharacterById(relationship.character_1),
  secondCharacter: getCharacterById(relationship.character_2),
}));

export const unavailableFamilyData = 'Family records are not available in the current Five Oaks snapshot.';
export const unavailableCanonRuleData = 'Canon-rule records are not available in the current Five Oaks snapshot.';
