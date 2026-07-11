import { useEffect, useMemo, useState } from 'react';
import { canonRules, characters, families } from './data/diamondData.js';
import { bookIndex, bookIndexErrors } from './data/bookIndex.js';
import { knowledgeIndex, knowledgeIndexErrors } from './data/knowledgeIndex.js';
import { relationshipGraph } from './data/relationshipGraph.js';
import { findCharacterKnowledge } from './data/characterKnowledge.js';
import { findEventKnowledge } from './data/eventKnowledge.js';
import { findPlaceKnowledge } from './data/placeKnowledge.js';
import { findTimelineKnowledge } from './data/timelineKnowledge.js';
import { resolveSubject } from './data/subjectResolver.js';
import diamondPortrait from '../DIAMOND.jpg';

const tabs = [
  { label: 'Ask Diamond', icon: '💬' },
  { label: 'Books', icon: '📚' },
  { label: 'Characters', icon: '👥' },
  { label: 'Relationships', icon: '🧵' },
  { label: 'Families', icon: '🌳' },
  { label: 'Canon Rules', icon: '⚖️' },
];

const stopWords = new Set([
  'what', 'was', 'were', 'the', 'did', 'does', 'who', 'where', 'when', 'how',
  'and', 'for', 'with', 'from', 'that', 'this', 'have', 'has', 'his', 'her',
  'they', 'them', 'their', 'horse', 'ride', 'rode', 'named', 'name', 'tell',
  'show', 'find', 'about',
]);

function cleanText(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizedText(text = '') {
  return cleanText(text)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function requestedSubject(question) {
  return cleanText(question)
    .replace(/^(who|what)\s+(is|was|are|were)\s+/i, '')
    .replace(/^tell me (everything )?about\s+/i, '')
    .replace(/^show me\s+/i, '')
    .replace(/(?:'s|’s)?\s+(full\s+)?(dossier|profile|entry)$/i, '')
    .replace(/\s+(dossier|profile|entry)$/i, '')
    .replace(/[?!.]+$/g, '')
    .trim();
}

function questionTerms(question) {
  return normalizedText(question)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function wantsFullRecord(question) {
  const text = normalizedText(question);
  return text.includes('dossier') || text.includes('full profile') ||
    text.includes('full entry') || text.includes('complete entry') ||
    text.includes('everything about') || text.includes('entire entry');
}

function wantsPassage(question) {
  const text = normalizedText(question);
  return text.includes('show me the passage') || text.includes('show the passage') ||
    text.includes('scene') || text.includes('quote') || text.includes('excerpt');
}

function wantsExpandedAnswer(question) {
  const text = normalizedText(question);
  return text.startsWith('tell me about') || text.startsWith('why') ||
    text.startsWith('how') || text.includes('relationship') ||
    text.includes('bond') || text.includes('deep');
}

function isDirectQuestion(question) {
  return /^(who|what|when|where|why|how|did|does|do|is|are|was|were)\b/.test(
    normalizedText(question),
  );
}

function knowledgeEntryAnswer(entry, question) {
  if (!entry) return '';
  return wantsExpandedAnswer(question) ? entry.full : entry.short;
}

function legacyKnowledgeAnswer(question) {
  return knowledgeEntryAnswer(findPlaceKnowledge(question), question) ||
    knowledgeEntryAnswer(findEventKnowledge(question), question) ||
    knowledgeEntryAnswer(findTimelineKnowledge(question), question) ||
    knowledgeEntryAnswer(findCharacterKnowledge(question), question);
}

function exactCharacterMatch(question, knowledge) {
  const subject = normalizedText(requestedSubject(question));
  if (!subject) return null;

  for (const source of knowledge) {
    if (source.type !== 'characters') continue;
    const exact = (source.sections || []).find((part) => normalizedText(part.name) === subject);
    if (exact) return { ...exact, sourceLabel: source.title, score: 10000 };
  }
  return null;
}

function exactRawLineMatch(question, knowledge) {
  const subject = requestedSubject(question);
  const normalizedSubject = normalizedText(subject);
  if (!normalizedSubject) return null;

  for (const source of knowledge) {
    const lines = String(source.rawText || '').replace(/\r/g, '').split('\n');
    for (const rawLine of lines) {
      const line = cleanText(rawLine);
      const normalizedLine = normalizedText(line);
      if (!line || normalizedLine === normalizedSubject) continue;
      if (normalizedLine.startsWith(`${normalizedSubject} `)) {
        return {
          id: `raw-${source.file}-${normalizedSubject}`,
          name: subject,
          text: line,
          sourceLabel: source.title,
          score: 9000,
          simpleLine: true,
        };
      }
    }
  }
  return null;
}

function searchCollection(question, collection, labelKey) {
  const terms = questionTerms(question);
  if (!terms.length || !collection.length) return [];
  const phrase = normalizedText(question);
  const results = [];

  for (const source of collection) {
    const sourceLabel = source[labelKey] || source.title || source.file;
    const sourceName = normalizedText(sourceLabel || '');
    for (const part of source.sections || []) {
      const lower = normalizedText(part.text);
      let score = lower.includes(phrase) ? 30 : 0;
      for (const term of terms) {
        if (lower.includes(term)) score += 5;
        if (sourceName.includes(term)) score += 3;
      }
      if (score > 0) results.push({ ...part, sourceLabel, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 6);
}

function searchBooks(question, books) {
  return searchCollection(question, books, 'title').map((match) => ({
    ...match,
    bookTitle: match.sourceLabel,
  }));
}

function searchKnowledge(question, knowledge) {
  const exactCharacter = exactCharacterMatch(question, knowledge);
  if (exactCharacter) return [exactCharacter];
  const exactLine = exactRawLineMatch(question, knowledge);
  if (exactLine) return [exactLine];
  return searchCollection(question, knowledge, 'title');
}

function extractField(text, label, nextLabels) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const next = nextLabels
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const match = text.match(new RegExp(`${escaped}:\\s*(.*?)(?=\\s+(?:${next}):|$)`, 'i'));
  return cleanText(match?.[1] || '');
}

function firstSentences(text, count = 2) {
  const sentences = cleanText(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return cleanText(sentences.slice(0, count).join(' '));
}

function conversationalKnowledgeAnswer(match, question) {
  if (!match?.text) return '';
  if (wantsFullRecord(question)) return match.text;

  const subject = match.name || requestedSubject(question) || 'This entry';
  const text = cleanText(match.text);

  if (match.simpleLine) {
    const remainder = text.replace(new RegExp(`^${subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '');
    return remainder ? `${subject} is ${remainder.replace(/^is\s+/i, '')}` : text;
  }

  const age = extractField(text, 'Age', [
    'Born', 'Role', 'Family', 'Core Spine', 'Background Foundation', 'Background',
    'Type', 'Breed', 'Color', 'Temperament', 'History',
  ]);
  const role = extractField(text, 'Role', [
    'Family', 'Core Spine', 'Background Foundation', 'Background', 'Core Formation',
    'Type', 'Breed', 'Color', 'Temperament', 'History',
  ]);
  const core = extractField(text, 'Core Spine', [
    'Background Foundation', 'Background', 'Core Formation', 'Core Beliefs',
    'Greatest Fear', 'Greatest Strength', 'Fatal Flaw', 'Psychological Markers', 'History',
  ]);
  const background = extractField(text, 'Background Foundation', [
    'Core Formation', 'Core Beliefs', 'Greatest Fear', 'Greatest Strength',
    'Fatal Flaw', 'Psychological Markers', 'Relationship With', 'Locked Thematic Core',
  ]) || extractField(text, 'Background', [
    'Core Formation', 'Core Beliefs', 'Greatest Fear', 'Greatest Strength',
    'Fatal Flaw', 'Psychological Markers', 'Relationship With', 'Locked Thematic Core',
  ]);
  const history = extractField(text, 'History', [
    'Core Formation', 'Core Beliefs', 'Greatest Fear', 'Greatest Strength',
    'Fatal Flaw', 'Psychological Markers', 'Relationship With', 'Locked Thematic Core',
  ]);

  let opening = age ? `${subject} is ${age} years old` : `${subject} is part of the Five Oaks canon`;
  if (role) opening += ` and is ${role.replace(/\s*•\s*/g, ', ')}`;

  const details = [
    firstSentences(core, 2),
    firstSentences(background || history, wantsExpandedAnswer(question) ? 3 : 2),
  ].filter(Boolean);

  if (!details.length) details.push(firstSentences(text, wantsExpandedAnswer(question) ? 4 : 2));
  return `${opening}. ${details.join(' ')}`.replace(/\s+/g, ' ').trim();
}

function buildAnswer(question, books, knowledge) {
  if (!question.trim()) return '';

  const knowledgeMatches = searchKnowledge(question, knowledge);
  if (knowledgeMatches.length) return conversationalKnowledgeAnswer(knowledgeMatches[0], question);

  const resolved = resolveSubject(question);
  if (resolved?.answer) return resolved.answer;

  const legacy = legacyKnowledgeAnswer(question);
  if (legacy) return legacy;

  const bookMatches = searchBooks(question, books);
  if (bookMatches.length && wantsPassage(question)) {
    return `I found this in ${bookMatches[0].bookTitle}:\n\n${bookMatches[0].text}`;
  }
  if (bookMatches.length && wantsExpandedAnswer(question)) {
    return `According to ${bookMatches[0].bookTitle}, ${firstSentences(bookMatches[0].text, 4)}`;
  }
  if (isDirectQuestion(question)) {
    return 'I could not find a direct answer for that in the current Five Oaks canon yet.';
  }
  if (bookMatches.length) {
    return 'I found book support, but not a clean direct answer yet. Ask “show me the passage” if you want the excerpt.';
  }
  return 'I could not find that information in the current Five Oaks canon.';
}

function pickFemaleVoice(voices) {
  const english = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en'));
  const pool = english.length ? english : voices;
  const hints = ['female', 'woman', 'zira', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'serena', 'ava', 'allison', 'salli', 'joanna', 'kendra', 'kimberly', 'aria', 'jenny', 'michelle'];
  return pool.find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint))) ||
    pool.find((voice) => voice.lang?.toLowerCase().startsWith('en-us')) || pool[0];
}

function DiamondFace({ speaking }) {
  const frameStyle = {
    position: 'relative', width: '535px', height: '565px', borderRadius: '30px',
    overflow: 'hidden', border: '2px solid rgba(255,255,255,.24)',
    boxShadow: speaking
      ? 'inset 0 0 35px rgba(255,255,255,.11), 0 0 48px rgba(233,182,214,.5)'
      : 'inset 0 0 35px rgba(255,255,255,.09), 0 0 38px rgba(233,182,214,.34)',
    background: '#140f12', filter: speaking ? 'brightness(1.06)' : 'none',
  };
  return (
    <section className="diamondPortraitShell" aria-label="Diamond assistant portrait">
      <div className="portraitGlow" />
      <div style={frameStyle}><img className="diamondPortrait" src={diamondPortrait} alt="Diamond" /></div>
      <p className="faceCaption">{speaking ? 'Diamond is speaking' : 'Diamond is online'}</p>
    </section>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('Ask Diamond');
  const [question, setQuestion] = useState('How are Jake, Krys, and Matt connected?');
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);

  const loadedBooks = bookIndex.filter((book) => (book.sections || []).length > 0);
  const loadedKnowledge = knowledgeIndex.filter((source) => (source.sections || []).length > 0);
  const knowledgeMatches = useMemo(
    () => searchKnowledge(question, loadedKnowledge),
    [question, loadedKnowledge],
  );
  const answer = useMemo(
    () => buildAnswer(question, loadedBooks, loadedKnowledge),
    [question, loadedBooks, loadedKnowledge],
  );
  const matches = useMemo(
    () => wantsPassage(question) && !knowledgeMatches.length ? searchBooks(question, loadedBooks) : [],
    [question, loadedBooks, knowledgeMatches],
  );
  const diamondVoice = useMemo(() => pickFemaleVoice(voices), [voices]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  function speakAnswer() {
    if (!('speechSynthesis' in window)) {
      alert('This browser does not support built-in voice yet. Try Edge or Chrome.');
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(answer);
    speech.voice = diamondVoice || null;
    speech.lang = diamondVoice?.lang || 'en-US';
    speech.pitch = 1.12;
    speech.rate = 0.92;
    speech.onstart = () => setSpeaking(true);
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(speech);
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function clearAskDiamond() {
    stopSpeaking();
    setQuestion('');
  }

  return (
    <main className="appShell">
      <section className="hero heroWithFace">
        <div><p className="eyebrow">The World of Five Oaks</p><h1>Diamond</h1><p className="tagline">Five Oaks canon assistant, character encyclopedia, and continuity guard.</p></div>
        <DiamondFace speaking={speaking} />
        <div className="statusCard"><span>Library</span><strong>{loadedBooks.length} of {bookIndex.length} books indexed</strong><span>Canon databases</span><strong>{loadedKnowledge.length} of {knowledgeIndex.length} indexed</strong></div>
      </section>

      <nav className="tabs" aria-label="Diamond sections">
        {tabs.map((tab) => <button key={tab.label} className={activeTab === tab.label ? 'active' : ''} onClick={() => setActiveTab(tab.label)}><span aria-hidden="true">{tab.icon}</span> {tab.label}</button>)}
      </nav>

      {activeTab === 'Ask Diamond' && (
        <section className="panel askPanel">
          <h2>Ask Diamond</h2>
          <p>{loadedBooks.length ? `Books 1-12 and ${loadedKnowledge.length} canon databases are indexed. Diamond searches the databases before the manuscripts.` : 'Diamond has not indexed the book library yet.'}</p>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Diamond..." aria-label="Ask Diamond a Five Oaks question" />
          <div className="answerBox"><span>Diamond says</span><p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p></div>
          {matches.length > 1 && <div className="gridPanel" style={{ marginTop: '18px' }}>{matches.slice(1, 4).map((match) => <article className="card" key={match.id}><h3>{match.bookTitle}</h3><p>{match.text}</p></article>)}</div>}
          <div className="voiceControls"><button type="button" onClick={speakAnswer} disabled={!answer}>Hear Diamond</button><button type="button" onClick={stopSpeaking}>Stop</button><button type="button" onClick={clearAskDiamond}>Clear</button><p>{diamondVoice ? `Voice selected: ${diamondVoice.name}` : 'Female voice loading...'}</p></div>
        </section>
      )}

      {activeTab === 'Books' && <section className="gridPanel">{bookIndex.map((book) => <article className="card" key={book.file}><h2>Book {book.number}</h2><h3>{book.title}</h3><p>{(book.sections || []).length ? `${book.sections.length} searchable sections indexed.` : 'Not indexed yet.'}</p></article>)}{bookIndexErrors.map((error) => <article className="card" key={error.file}><h3>Index warning</h3><p>{error.book}: {error.error}</p></article>)}{knowledgeIndexErrors.map((error) => <article className="card" key={error.file}><h3>Knowledge warning</h3><p>{error.title}: {error.error}</p></article>)}</section>}

      {activeTab === 'Characters' && <section className="gridPanel">{characters.map((character) => <article className="card" key={character.name}><h2>{character.name}</h2><p className="muted">{character.givenName}</p><h3>{character.role}</h3><p>{character.core}</p><p><strong>Horse:</strong> {character.horse} — {character.horseEra}</p><p><strong>Weapons:</strong> {character.weapons.join(', ')}</p></article>)}</section>}

      {activeTab === 'Relationships' && <section className="gridPanel"><article className="card"><h2>Relationship Graph</h2><p>{relationshipGraph.nodes.length} subjects and {relationshipGraph.edges.length} direct canon links are available to Diamond’s resolver.</p></article>{relationshipGraph.edges.map((item) => <article className="card" key={`${item.source}-${item.target}`}><h2>{item.title}</h2><p>{item.summary}</p></article>)}</section>}

      {activeTab === 'Families' && <section className="gridPanel">{families.map((item) => <article className="card" key={item.family}><h2>{item.family}</h2><p>{item.notes}</p></article>)}</section>}

      {activeTab === 'Canon Rules' && <section className="panel"><h2>Diamond’s Canon Rules</h2><ul className="rulesList">{canonRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></section>}
    </main>
  );
}

export default App;
