import { characterKnowledge } from './characterKnowledge.js';
import { eventKnowledge } from './eventKnowledge.js';
import { placeKnowledge } from './placeKnowledge.js';
import { timelineKnowledge } from './timelineKnowledge.js';
import { findRelationshipEdge, findRelationshipPath, relationshipGraph } from './relationshipGraph.js';

const inferenceRecords = [
  {
    key: 'conrad-pressure',
    triggers: ['conrad', 'temptation', 'almost kiss'],
    subjects: ['conrad', 'krys', 'jake', 'matt'],
    events: ['conrad temptation arc'],
    consequences: {
      krys: 'Conrad tests Krys’ commitment to the life and family she chose.',
      jake: 'Conrad forces Jake to face the possibility of losing Krys and exposes how much emotional security he places in their marriage.',
      matt: 'Conrad threatens the two people at the center of Matt’s emotional world, which helps explain why the arc hits him so hard.'
    },
    synthesis: 'The Conrad arc works as emotional pressure across the family. Krys is tested, Jake is wounded by fear, and Matt begins to break because the marriage holding part of his world together appears endangered.'
  },
  {
    key: 'whisper-aftermath',
    triggers: ['whisper', 'krys shot', 'eli kills whisper'],
    subjects: ['eli', 'krys', 'matt'],
    events: ['whisper confrontation'],
    consequences: {
      eli: 'Eli carries guilt and the burden of killing Whisper after Krys is shot protecting him.',
      krys: 'Krys survives and becomes part of Eli’s healing because she understands violence and guilt without rejecting him.',
      matt: 'Matt is forced into the terror of possibly losing Krys while holding her through the aftermath.'
    },
    synthesis: 'The Whisper confrontation binds Eli, Krys, and Matt through protection, violence, fear, and survival. Eli acts, Krys pays the physical price, and Matt bears the immediate emotional terror.'
  },
  {
    key: 'oil-generation',
    triggers: ['oil', 'drill', 'drilling', 'patterson'],
    subjects: ['sawyer', 'dawson', 'jace', 'jake', 'matt', 'krys', 'luke', 'cole', 'tate', 'waya'],
    events: ['sawyer and dawson oil venture'],
    consequences: {
      sawyer: 'The oil venture becomes Sawyer’s chance to prove that his ambition can become disciplined work.',
      dawson: 'The oil venture lets Dawson show that he understands cost, equipment, and practical risk.',
      jace: 'Jace’s opposition tests whether he can trust his sons to become men outside his control.',
      matt: 'Matt’s concern centers on financial exposure and whether the plan is strong enough to justify the cost.',
      krys: 'Krys supports giving the boys a chance because unused land and available money can become opportunity rather than dead weight.'
    },
    synthesis: 'The oil vote is a generational test. Sawyer and Dawson ask to be treated as capable adults, while the founders must decide whether protecting Five Oaks means avoiding risk or teaching the next generation how to carry it.'
  },
  {
    key: 'cole-tate-acceptance',
    triggers: ['cole and tate', 'cole tate', 'barn kiss', 'creek meeting', 'tate acceptance'],
    subjects: ['cole', 'tate', 'krys', 'jace', 'sawyer', 'dawson'],
    events: ['cole and tate love story'],
    consequences: {
      cole: 'Cole must choose whether fear and inherited shame will control his life.',
      tate: 'Tate must decide whether Five Oaks can become a place where he is loved without hiding forever.',
      krys: 'Krys becomes an early source of understanding rather than condemnation.',
      jace: 'Jace’s eventual acceptance becomes evidence that he can grow past fear and control.',
      sawyer: 'Sawyer’s later acceptance shows that the younger family can change how it treats Tate.',
      dawson: 'Dawson’s later acceptance helps turn Tate from an outsider into family.'
    },
    synthesis: 'Cole and Tate’s relationship changes more than the two men. It becomes a measure of whether Five Oaks can expand its idea of family when love does not fit the expectations its people inherited.'
  },
  {
    key: 'redhawk-family',
    triggers: ['jennifer and waya', 'waya and jennifer', 'redhawk', 'tsula', 'town acceptance'],
    subjects: ['jennifer', 'waya', 'tsula', 'jace', 'sawyer', 'dawson', 'matt'],
    events: ['jennifer and waya arc'],
    consequences: {
      jennifer: 'Jennifer chooses Waya and accepts Tsula as part of the family she is building.',
      waya: 'Waya must trust that Five Oaks will defend both him and his daughter rather than welcoming him conditionally.',
      tsula: 'Tsula’s acceptance proves whether the family understands that a child cannot be treated as an attachment to someone else’s marriage.',
      jace: 'Jace must stand behind his daughter and show that his idea of family has grown.',
      matt: 'Matt’s bond with Jennifer makes her safety and happiness deeply personal to him.'
    },
    synthesis: 'Jennifer, Waya, and Tsula force Five Oaks to prove its values in public. Their arc turns acceptance from a private feeling into a family obligation backed by action.'
  }
];

function normalize(text) {
  return text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function mentionedSubjects(question) {
  const text = ` ${normalize(question)} `;
  return relationshipGraph.nodes.filter((node) => {
    const phrases = [node.key, node.displayName, ...(node.aliases || [])].map(normalize);
    return phrases.some((phrase) => text.includes(` ${phrase} `));
  });
}

function asksForEffect(question) {
  const text = normalize(question);
  return text.includes('affect') || text.includes('impact') || text.includes('change') || text.includes('because') || text.startsWith('why') || text.includes('what did') || text.includes('result');
}

function asksForConnection(question) {
  const text = normalize(question);
  return text.includes('connect') || text.includes('related') || text.includes('relationship') || text.includes('how are') || text.includes('link');
}

function asksForImportance(question) {
  const text = normalize(question);
  return text.includes('matter') || text.includes('important') || text.includes('significance') || text.startsWith('why');
}

function findKnowledgeByTitle(collection, title) {
  const target = normalize(title);
  return collection.find((entry) => normalize(entry.title || entry.name || '') === target);
}

function findRelevantRecord(question, subjects) {
  const text = normalize(question);
  const keys = subjects.map((subject) => subject.key);

  return inferenceRecords
    .map((record) => {
      const triggerMatched = record.triggers.some((trigger) => text.includes(normalize(trigger)));
      let eventMatched = record.events.some((event) => text.includes(normalize(event)));

      for (const event of record.events) {
        const entry = findKnowledgeByTitle(eventKnowledge, event);
        if (entry?.keys?.some((key) => text.includes(normalize(key)))) eventMatched = true;
      }

      if (!triggerMatched && !eventMatched) return { record, score: 0 };

      const subjectScore = record.subjects.filter((subject) => keys.includes(subject)).length * 5;
      return { record, score: subjectScore + (triggerMatched ? 8 : 0) + (eventMatched ? 8 : 0) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.record;
}

function relationshipPathAnswer(first, second) {
  const direct = findRelationshipEdge(first.key, second.key);
  if (direct) return direct.summary;

  const path = findRelationshipPath(first.key, second.key);
  if (!path || path.length < 2) return '';

  const labels = path.map((key) => relationshipGraph.nodes.find((node) => node.key === key)?.displayName || key);
  const links = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = findRelationshipEdge(path[index], path[index + 1]);
    if (edge) links.push(edge.direct);
  }

  return `Diamond connects ${first.displayName} and ${second.displayName} through ${labels.join(' → ')}. ${links.join(' ')}`;
}

function consequenceAnswer(record, subjects) {
  const pieces = subjects
    .map((subject) => record.consequences[subject.key] ? `${subject.displayName}: ${record.consequences[subject.key]}` : '')
    .filter(Boolean);

  if (!pieces.length) return record.synthesis;
  return `${record.synthesis}\n\n${pieces.join('\n\n')}`;
}

function crossKnowledgeAnswer(question, subjects) {
  const text = normalize(question);
  const character = characterKnowledge.find((entry) => entry.keys.some((key) => text.includes(normalize(key))));
  const event = eventKnowledge.find((entry) => entry.keys.some((key) => text.includes(normalize(key))));
  const place = placeKnowledge.find((entry) => entry.keys.some((key) => text.includes(normalize(key))));
  const timeline = timelineKnowledge.find((entry) => entry.keys.some((key) => text.includes(normalize(key))));
  const entries = [character, event, place, timeline].filter(Boolean);

  if (entries.length < 2 && subjects.length < 2) return '';

  const summaries = entries.map((entry) => entry.short).filter(Boolean);
  if (!summaries.length) return '';

  return `Diamond’s inference from the connected canon records is:\n\n${summaries.join('\n\n')}`;
}

export function inferCanonAnswer(question) {
  const subjects = mentionedSubjects(question);
  const record = findRelevantRecord(question, subjects);

  if (record && (asksForEffect(question) || asksForImportance(question) || subjects.length >= 2)) {
    return {
      type: 'inference',
      confidence: 'grounded',
      subjects,
      answer: consequenceAnswer(record, subjects)
    };
  }

  if (subjects.length === 2 && asksForConnection(question)) {
    const answer = relationshipPathAnswer(subjects[0], subjects[1]);
    if (answer) return { type: 'relationship-inference', confidence: 'grounded', subjects, answer };
  }

  const crossKnowledge = crossKnowledgeAnswer(question, subjects);
  if (crossKnowledge && (asksForEffect(question) || asksForImportance(question))) {
    return { type: 'cross-knowledge', confidence: 'grounded', subjects, answer: crossKnowledge };
  }

  return null;
}
