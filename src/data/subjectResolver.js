import { findCharacterKnowledge } from './characterKnowledge.js';
import { findEventKnowledge } from './eventKnowledge.js';
import { findPlaceKnowledge } from './placeKnowledge.js';
import { findTimelineKnowledge } from './timelineKnowledge.js';
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

export function resolveSubject(question) {
  const text = normalizeQuestion(question);
  const expanded = wantsExpandedAnswer(question);
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
