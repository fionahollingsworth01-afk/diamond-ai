import assert from 'node:assert/strict';
import { guardedAnswer } from '../src/data/canonGuard.js';

const knowledge = [
  {
    title: 'Callahan Family',
    file: 'knowledge/callahan-family.md',
    type: 'characters',
    rawText: 'Callahan Family\nJace Callahan and Susanna Pike lived together their entire adult lives but never married.',
    sections: [
      {
        id: 'jace',
        name: 'Jace Callahan',
        text: 'Jace Callahan\nRole: Founder and rancher\nFamily: Partner of Susanna Pike. Jace Callahan and Susanna Pike never married.\nHorse: Barney',
      },
      {
        id: 'susanna',
        name: 'Susanna Pike',
        text: 'Susanna Pike\nRole: Five Oaks matriarch\nFamily: Lifelong partner of Jace Callahan. Jace Callahan and Susanna Pike never married.',
      },
      {
        id: 'krys',
        name: 'Krysten “Krys” Callahan Kincaid',
        aliases: ['Krys'],
        text: 'Krysten “Krys” Callahan Kincaid\nRole: Heart of Five Oaks\nFamily: Sister of Jace, Rance, Royce, and Rhys Callahan.',
      },
      {
        id: 'tsula',
        name: 'Tsula Red Hawk',
        text: 'Tsula Red Hawk\nRole: Waya Red Hawk’s nephew\nFamily: Nephew of Waya Red Hawk. Waya raised him after his parents died.',
      },
      {
        id: 'waya',
        name: 'Waya Red Hawk',
        text: 'Waya Red Hawk\nRole: Jennifer Callahan’s husband\nFamily: Uncle and guardian of Tsula Red Hawk.',
      },
      {
        id: 'matt',
        name: 'Matt Haskins',
        text: 'Matt Haskins\nRole: Five Oaks founder\nHorse: Ledger',
      },
    ],
  },
  {
    title: 'Horse Database',
    file: 'horses-database.md',
    type: 'horses',
    sections: [
      { id: 'ledger', name: 'Ledger', text: 'Ledger\nOwner: Matt Haskins' },
    ],
  },
];

const books = [
  {
    number: 18,
    title: 'Where the Fire Meets the Sky',
    sections: [
      { id: 'wedding', text: 'Jennifer and Waya stood together before their families and married.' },
    ],
  },
];

assert.match(guardedAnswer('Who is Krys?', books, knowledge), /Heart of Five Oaks/i);
assert.equal(guardedAnswer('Did Jace and Susanna ever marry?', books, knowledge), 'No. Jace and Susanna did not marry.');
assert.match(guardedAnswer('Is Tsula Waya’s nephew?', books, knowledge), /^Yes\./);
assert.match(guardedAnswer('Who is Tsula?', books, knowledge), /Waya Red Hawk’s nephew/i);
assert.match(guardedAnswer('Who raised Tsula?', books, knowledge), /Waya Red Hawk raised Tsula/i);
assert.match(guardedAnswer('Who raised Waya?', books, knowledge), /grandparents/i);
assert.match(guardedAnswer('What was Matt’s horse named?', books, knowledge), /Ledger/);
assert.match(guardedAnswer('Who are Krys’s brothers?', books, knowledge), /Jace.*Rance.*Royce.*Rhys/i);
assert.match(guardedAnswer('Which book has Jennifer and Waya married?', books, knowledge), /Where the Fire Meets the Sky/);
assert.match(guardedAnswer('Who is Somebody Invented?', books, knowledge), /will not invent/i);

console.log('Diamond answer-engine regression tests passed.');
