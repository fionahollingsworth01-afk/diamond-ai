import { bookIndex } from './bookIndex.js';

const sceneLocations = [
  {
    keys: ['conrad', 'conrad arc', 'temptation arc', 'almost kiss', 'krys and conrad'],
    bookNumber: 10,
    bookTitle: 'The Weight of a Name',
    scene: 'Conrad temptation arc',
    chapter: null,
    status: 'locked',
    note: 'The exact chapter has not been entered into Diamond’s scene map yet.'
  },
  {
    keys: ['whisper', 'eli kills whisper', 'eli kill whisper', 'krys shot', 'whisper confrontation'],
    bookNumber: 16,
    bookTitle: null,
    bookLabel: 'Eli’s book',
    scene: 'Whisper confrontation',
    chapter: null,
    status: 'locked',
    note: 'Book 16’s final title and exact chapter have not been entered into Diamond’s scene map yet.'
  },
  {
    keys: ['cole meets tate', 'cole first meets tate', 'cole and tate', 'barn kiss', 'creek meeting', 'tate hired'],
    bookNumber: 17,
    bookTitle: 'Where He Stood',
    bookLabel: 'Cole and Tate’s book',
    scene: 'Cole and Tate love story',
    chapter: null,
    status: 'working-title',
    note: 'Where He Stood is the current working title in Diamond’s canon records. The exact chapter has not been entered yet.'
  },
  {
    keys: ['jennifer and waya', 'waya and jennifer', 'jennifer marries waya', 'waya moves to five oaks', 'tsula moves to five oaks'],
    bookNumber: 18,
    bookTitle: 'Where the Fire Meets the Sky',
    scene: 'Jennifer and Waya arc',
    chapter: null,
    status: 'locked',
    note: 'The exact chapter has not been entered into Diamond’s scene map yet.'
  },
  {
    keys: ['oil venture', 'drill for oil', 'drilling for oil', 'founders oil meeting', 'sawyer and dawson oil', 'oil strike'],
    bookNumber: 19,
    bookTitle: 'Black Gold Under Dust',
    scene: 'Sawyer and Dawson oil venture',
    chapter: null,
    status: 'locked',
    note: 'The exact chapter has not been entered into Diamond’s scene map yet.'
  },
  {
    keys: ['look at what we built', 'five oaks legacy book'],
    bookNumber: 20,
    bookTitle: 'Look at What We Built',
    scene: 'Five Oaks legacy story',
    chapter: null,
    status: 'planned',
    note: 'Scene-level chapter locations have not been entered yet.'
  },
  {
    keys: ['royce returns', 'royce return'],
    bookNumber: 21,
    bookTitle: 'Royce Returns',
    scene: 'Royce’s return',
    chapter: null,
    status: 'planned',
    note: 'Scene-level chapter locations have not been entered yet.'
  },
  {
    keys: ['patterson place purchased', 'patterson land purchased', 'buy the patterson place', 'patterson sale'],
    bookNumber: 13,
    bookTitle: null,
    bookLabel: 'the bridge book',
    scene: 'Purchase of the Patterson place',
    chapter: null,
    status: 'planned-location',
    note: 'Diamond currently places this in Book 13, the bridge book. The final title and exact chapter have not been entered.'
  }
];

const locationWords = ['what book', 'which book', 'book is', 'book was', 'where does', 'where did', 'where is', 'what chapter', 'which chapter', 'chapter is', 'chapter was', 'find the scene', 'show me the scene', 'show me the passage', 'where in the series'];

function normalize(text) {
  return text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function asksForLocation(question) {
  const text = normalize(question);
  return locationWords.some((phrase) => text.includes(phrase));
}

function asksForChapter(question) {
  return normalize(question).includes('chapter');
}

function cleanTerms(question) {
  const stopWords = new Set(['what', 'which', 'book', 'chapter', 'where', 'when', 'does', 'did', 'was', 'were', 'the', 'this', 'that', 'scene', 'passage', 'show', 'find', 'tell', 'about', 'happen', 'happens', 'series']);
  return normalize(question).split(' ').filter((term) => term.length > 2 && !stopWords.has(term));
}

function findSceneRecord(question) {
  const text = normalize(question);
  return sceneLocations
    .map((record) => {
      const score = record.keys.reduce((total, key) => {
        const normalizedKey = normalize(key);
        if (text.includes(normalizedKey)) return total + normalizedKey.split(' ').length * 8;
        const keyTerms = normalizedKey.split(' ');
        return total + keyTerms.filter((term) => text.includes(term)).length * 2;
      }, 0);
      return { record, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.record || null;
}

function searchIndexedBooks(question) {
  const terms = cleanTerms(question);
  if (!terms.length) return [];

  const results = [];
  for (const book of bookIndex) {
    for (const section of book.sections || []) {
      const text = normalize(section.text || '');
      const matchedTerms = terms.filter((term) => text.includes(term));
      if (!matchedTerms.length) continue;
      const phraseBonus = text.includes(normalize(question)) ? 30 : 0;
      results.push({
        bookNumber: book.number,
        bookTitle: book.title,
        section,
        score: phraseBonus + matchedTerms.length * 5
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

function bookName(record) {
  if (record.bookTitle) return `Book ${record.bookNumber}, ${record.bookTitle}`;
  if (record.bookLabel) return `Book ${record.bookNumber}, ${record.bookLabel}`;
  return `Book ${record.bookNumber}`;
}

function recordAnswer(record, question) {
  const location = bookName(record);
  if (asksForChapter(question)) {
    if (record.chapter) return `${record.scene} is in ${location}, Chapter ${record.chapter}.`;
    return `${record.scene} is in ${location}. ${record.note}`;
  }
  return `${record.scene} is in ${location}. ${record.note || ''}`.trim();
}

function indexedAnswer(matches, question) {
  if (!matches.length) return null;
  const top = matches[0];
  const wantsPassage = normalize(question).includes('passage') || normalize(question).includes('show me');
  const answer = wantsPassage
    ? `I found the strongest matching passage in Book ${top.bookNumber}, ${top.bookTitle}:\n\n${top.section.text}`
    : `The strongest indexed match is in Book ${top.bookNumber}, ${top.bookTitle}.`;
  return {
    type: 'book-location',
    confidence: 'indexed-manuscript',
    bookNumber: top.bookNumber,
    bookTitle: top.bookTitle,
    matches,
    answer
  };
}

export function findBookLocation(question) {
  if (!asksForLocation(question)) return null;

  const record = findSceneRecord(question);
  if (record) {
    return {
      type: 'book-location',
      confidence: record.status,
      bookNumber: record.bookNumber,
      bookTitle: record.bookTitle,
      scene: record.scene,
      answer: recordAnswer(record, question)
    };
  }

  const indexed = indexedAnswer(searchIndexedBooks(question), question);
  if (indexed) return indexed;

  return {
    type: 'book-location-unknown',
    confidence: 'unknown',
    answer: 'Diamond does not have a reliable book location for that scene yet. I will not invent one.'
  };
}

export { sceneLocations };
