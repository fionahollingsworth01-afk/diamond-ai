import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dataDirectory = resolve('src', 'data', 'five-oaks');

async function readCollection(filename, collectionName) {
  const path = resolve(dataDirectory, filename);
  let payload;
  try {
    payload = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read ${path}: ${error.message}`);
  }

  if (!payload || !Array.isArray(payload[collectionName])) {
    throw new Error(`${path} must contain a '${collectionName}' array.`);
  }
  if (!payload[collectionName].every((record) => record && typeof record === 'object' && !Array.isArray(record))) {
    throw new Error(`Every ${collectionName} entry in ${path} must be an object.`);
  }
  return payload[collectionName];
}

function requiredFields(records, recordType, fields, errors) {
  records.forEach((record, index) => {
    fields.forEach((field) => {
      if (!(field in record) || record[field] === '') {
        errors.push(`${recordType} ${record.id || index} is missing required field '${field}'.`);
      }
    });
  });
}

const [books, characters, relationships, animals] = await Promise.all([
  readCollection('books.json', 'books'),
  readCollection('characters.json', 'characters'),
  readCollection('relationships.json', 'relationships'),
  readCollection('animals.json', 'animals'),
]);

const errors = [];
requiredFields(books, 'Book', ['id', 'title', 'series', 'order'], errors);
requiredFields(characters, 'Character', ['id', 'name', 'role'], errors);
requiredFields(relationships, 'Relationship', ['id', 'character_1', 'character_2', 'relationship_type'], errors);
requiredFields(animals, 'Animal', ['id', 'name', 'species'], errors);

const characterIds = new Set(characters.map((character) => character.id));
const ensureUniqueIds = (records, recordType) => {
  const ids = new Set();
  records.forEach((record) => {
    if (ids.has(record.id)) errors.push(`${recordType} ${record.id} has a duplicate id.`);
    ids.add(record.id);
  });
};

ensureUniqueIds(books, 'Book');
ensureUniqueIds(characters, 'Character');
ensureUniqueIds(relationships, 'Relationship');
ensureUniqueIds(animals, 'Animal');

books.forEach((book) => {
  if (!Array.isArray(book.characters)) {
    errors.push(`Book ${book.id} has an invalid characters list.`);
    return;
  }
  book.characters.forEach((characterId) => {
    if (!characterIds.has(characterId)) errors.push(`Book ${book.id} references unknown character ${characterId}.`);
  });
});

relationships.forEach((relationship) => {
  ['character_1', 'character_2'].forEach((field) => {
    if (!characterIds.has(relationship[field])) {
      errors.push(`Relationship ${relationship.id} references unknown ${field} ${relationship[field]}.`);
    }
  });
});

animals.forEach((animal) => {
  if (animal.owner_id && !characterIds.has(animal.owner_id)) {
    errors.push(`Animal ${animal.id} references unknown owner ${animal.owner_id}.`);
  }
});

if (errors.length) {
  throw new Error(`Five Oaks snapshot validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
}

console.log(`Five Oaks snapshot valid: ${books.length} books, ${characters.length} characters, ${relationships.length} relationships, ${animals.length} animals.`);
