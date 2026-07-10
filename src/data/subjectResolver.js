import { findBookLocation } from './bookIntelligence.js';
import { findCharacterKnowledge } from './characterKnowledge.js';
import { checkContinuity } from './continuityGuard.js';
import { findEventKnowledge } from './eventKnowledge.js';
import { findPlaceKnowledge } from './placeKnowledge.js';
import { findTimelineKnowledge } from './timelineKnowledge.js';
import { inferCanonAnswer } from './inferenceEngine.js';
import { findRelationshipEdge, findRelationshipGroup, findRelationshipPath, findSubjectConnections, relationshipGraph } from './relationshipGraph.js';
import { relationships } from './relationshipData.js';

export function normalizeQuestion(question) {
  return question.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ');
}

function wantsExpandedAnswer(question) {
  const text = normalizeQuestion(question).trim();
  return text.startsWith('tell me about') || text.startsWith('tell me everything') || text.startsWith('who is') || text.startsWith('who was') || text.includes('show me') || text.includes('passage') || text.includes('scene') || text.includes('quote') || text.includes('special') || text.includes('deep') || text.includes('bond') || text.includes('relationship') || text.startsWith('why') || text.startsWith('how');
}

function personIsMentioned(text, person) {
  return text.includes(person) || text.includes(`${person}s`);
}

function findRelationshipKnowledge(question) {
  const text = normalizeQuestion(question);
  return relationships.find((item) => item.people.every((person) => personIsMentioned(text, person)));
}

function uniqueItems(items) {
  return [...new Set(items)];
}

function wordsForSubject(subject) {
  return uniqueItems([subject.key, subject.displayName.toLowerCase(), ...(subject.aliases || [])])
    .map((item) => normalizeQuestion(item).trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

function phraseIsMentioned(text, phrase) {
  return ` ${text} `.includes(` ${phrase} `);
}

export function resolveMentionedSubjects(question) {
  const text = normalizeQuestion(question);
  return relationshipGraph.nodes.filter((subject) => wordsForSubject(subject).some((phrase) => phraseIsMentioned(text, phrase)));
}

function asksForMultiSubjectAnswer(question, subjects) {
  const text = normalizeQuestion(question);
  if (subjects.length >= 3) return true;
  return subjects.length >= 2 && (text.includes('relationship') || text.includes('relationships') || text.includes('bond') || text.includes('bonds') || text.includes('connected') || text.includes('connect') || text.includes('how are') || text.includes('between') || text.includes('together') || text.includes('family'));
}

function asksHowConnected(question, subjects) {
  const text = normalizeQuestion(question);
  return subjects.length === 2 && (text.includes('how are') || text.includes('connected') || text.includes('connect') || text.includes('related'));
}

function subjectName(key) {
  return relationshipGraph.nodes.find((node) => node.key === key)?.displayName || key;
}

function pathAnswer(path) {
  if (!path || path.length < 2) return '';
  const parts = [];

  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = findRelationshipEdge(path[index], path[index + 1]);
    if (edge) parts.push(`${edge.title}: ${edge.direct}`);
  }

  return parts.length ? `Diamond does not have a direct link entered for those two yet, but the relationship graph connects them this way:\n\n${parts.join('\n\n')}` : '';
}

function buildMultiSubjectAnswer(subjects, expanded) {
  const keys = subjects.map((subject) => subject.key);
  const group = findRelationshipGroup(keys);
  if (group) return expanded ? group.expanded : group.direct;

  const pairAnswers = [];

  for (let first = 0; first < keys.length; first += 1) {
    for (let second = first + 1; second < keys.length; second += 1) {
      const edge = findRelationshipEdge(keys[first], keys[second]);
      if (edge) pairAnswers.push(`${edge.title}: ${edge.direct}`);
    }
  }

  if (pairAnswers.length) {
    const introduction = keys.length > 2 ? `${keys.map(subjectName).join(', ')} are connected through these canon relationships:` : '';
    return [introduction, ...pairAnswers].filter(Boolean).join('\n\n');
  }

  const connections = findSubjectConnections(keys, true);
  if (connections.length) {
    return connections.map((edge) => `${edge.title}: ${edge.direct}`).join('\n\n');
  }

  return `Diamond knows ${keys.map(subjectName).join(', ')} as canon subjects, but no direct relationship link has been entered for that exact group yet.`;
}

export function resolveSubject(question) {
  const text = normalizeQuestion(question);
  const expanded = wantsExpandedAnswer(question);
  const mentionedSubjects = resolveMentionedSubjects(question);
  const continuity = checkContinuity(question);
  const bookLocation = findBookLocation(question);
  const inference = inferCanonAnswer(question);

  if (continuity?.answer) return continuity;
  if (bookLocation?.answer) return bookLocation;
  if (inference?.answer) return inference;

  if (asksForMultiSubjectAnswer(question, mentionedSubjects)) {
    const directAnswer = buildMultiSubjectAnswer(mentionedSubjects, expanded);

    if (asksHowConnected(question, mentionedSubjects) && directAnswer.includes('no direct relationship link')) {
      const path = findRelationshipPath(mentionedSubjects[0].key, mentionedSubjects[1].key);
      const indirectAnswer = pathAnswer(path);
      if (indirectAnswer) return { type: 'relationship-path', subjects: mentionedSubjects, path, answer: indirectAnswer };
    }

    return { type: 'multi-subject', subjects: mentionedSubjects, answer: directAnswer };
  }

  const relationship = findRelationshipKnowledge(question);
  const place = findPlaceKnowledge(question);
  const event = findEventKnowledge(question);
  const timeline = findTimelineKnowledge(question);
  const character = findCharacterKnowledge(question);

  if (relationship) return { type: 'relationship', entry: relationship, answer: expanded ? relationship.summary : relationship.direct };
  if (place) return { type: 'place', entry: place, answer: expanded ? place.full : place.short };
  if (event) return { type: 'event', entry: event, answer: expanded ? event.full : event.short };
  if (timeline) return { type: 'timeline', entry: timeline, answer: expanded ? timeline.full : timeline.short };
  if (character) return { type: 'character', entry: character, answer: expanded ? character.full : character.short };

  if (text.includes('who') && text.includes('jake') && text.includes('marry')) return { type: 'fact', answer: 'Jake married Krys Callahan.' };
  if (text.includes('when') && text.includes('jake') && text.includes('marry')) return { type: 'fact', answer: 'Jake married Krys in the late 1880s.' };
  if (text.includes('who') && text.includes('gave') && text.includes('krys') && (text.includes('away') || text.includes('give'))) return { type: 'fact', answer: 'Matt Haskins gave Krys away when she married Jake.' };
  if (text.includes('krys') && text.includes('horse')) return { type: 'fact', answer: 'Krys rides Lark.' };
  if (text.includes('jace') && text.includes('horse')) return { type: 'fact', answer: 'Jace rides Barney.' };
  if (text.includes('jake') && text.includes('horse')) return { type: 'fact', answer: 'Jake’s outlaw-era horse is Grave. By 1916, Grave is gone/deceased and Jake rides a later horse.' };
  if (text.includes('matt') && text.includes('horse')) return { type: 'fact', answer: 'Matt’s outlaw-era horse is Ledger.' };
  if (text.includes('luke') && text.includes('horse')) return { type: 'fact', answer: 'Luke’s outlaw-era horse is Cinder.' };
  if (text.includes('krys') && (text.includes('weapon') || text.includes('rifle') || text.includes('derringer'))) return { type: 'fact', answer: "Krys carries a Colt Single Action Army, a pocket Derringer, and her pa’s Winchester 1873." };
  if (text.includes('jace') && (text.includes('weapon') || text.includes('pistol') || text.includes('rifle'))) return { type: 'fact', answer: 'Jace carries a Colt Single Action Army, a Winchester Model 1873, a working belt knife, and a small hideout pistol.' };

  return null;
}
