import assert from 'node:assert/strict';
import {
  getCharacterById,
  getRelationshipById,
  getRelationshipsForCharacter,
} from '../src/data/fiveOaksData.js';
import {
  answerFiveOaksQuestion,
  searchFiveOaks,
  tokenize,
} from '../src/data/fiveOaksSearch.js';

const krysResults = searchFiveOaks('Who is Krys?');
assert.equal(krysResults[0].type, 'character');
assert.equal(krysResults[0].record.id, 'krys');
assert.match(answerFiveOaksQuestion('Who is Krys?'), /Founder of Five Oaks/);

const bookResults = searchFiveOaks('Roots and Responsibility');
assert.ok(bookResults.some((result) => result.type === 'book' && result.record.id === 'book_13'));
assert.match(answerFiveOaksQuestion('Roots and Responsibility'), /Book 13/);

const relationshipResults = searchFiveOaks('romantic interest');
assert.equal(relationshipResults[0].type, 'relationship');
assert.equal(relationshipResults[0].record.id, 'jennifer-waya');
assert.match(answerFiveOaksQuestion('romantic interest'), /Romantic interest/);

const animalResults = searchFiveOaks('Grave');
assert.equal(animalResults[0].type, 'animal');
assert.equal(animalResults[0].record.id, 'grave');
assert.match(answerFiveOaksQuestion('Grave'), /Associated with: Jake Kincaid/);

assert.deepEqual([...tokenize('Who is the Five Oaks character?')], []);
assert.match(answerFiveOaksQuestion('Who is the Five Oaks character?'), /Enter a character name/);
assert.match(answerFiveOaksQuestion('unrecorded visitor'), /No matching records are available/);

const rankedResults = searchFiveOaks('founder');
assert.equal(rankedResults.length, 5);
assert.ok(rankedResults.every((result) => result.type === 'character'));
assert.equal(searchFiveOaks('Jake')[0].record.id, 'jake');

const relationship = getRelationshipById('jace-susanna');
assert.equal(relationship.character_1, 'jace');
assert.equal(relationship.character_2, 'susanna');
assert.equal(getCharacterById(relationship.character_1).name, 'Jace Callahan');
assert.equal(getRelationshipsForCharacter('susanna')[0].id, 'jace-susanna');

console.log('Five Oaks snapshot search tests passed.');
