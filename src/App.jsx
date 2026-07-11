import { useEffect, useMemo, useState } from 'react';
import { canonRules, characters, families } from './data/diamondData.js';
import { bookIndex, bookIndexErrors } from './data/bookIndex.js';
import { knowledgeIndex, knowledgeIndexErrors } from './data/knowledgeIndex.js';
import { relationshipGraph } from './data/relationshipGraph.js';
import diamondPortrait from '../DIAMOND.jpg';

const tabs = [
  { label: 'Ask Diamond', icon: '💬' },
  { label: 'Books', icon: '📚' },
  { label: 'Characters', icon: '👥' },
  { label: 'Relationships', icon: '🧵' },
  { label: 'Families', icon: '🌳' },
  { label: 'Canon Rules', icon: '⚖️' },
];

const titleWords = new Set(['sheriff', 'deputy', 'doctor', 'dr', 'uncle', 'aunt', 'mr', 'mrs', 'miss']);
const relationshipWords = {
  dad: ['father', 'dad'], father: ['father', 'dad'],
  mom: ['mother', 'mom'], mother: ['mother', 'mom'],
  sister: ['sister'], brother: ['brother'],
  uncle: ['uncle'], aunt: ['aunt'],
  cousin: ['cousin'], cousins: ['cousin'],
  wife: ['wife', 'married'], husband: ['husband', 'married'],
  son: ['son'], daughter: ['daughter'],
  horse: ['horse', 'mare', 'stallion', 'gelding'],
};

function cleanText(value = '') {
  return String(value).replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

function normalize(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeLines(text = '') {
  const lines = String(text).replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.filter((line, index) => index === 0 || normalize(line) !== normalize(lines[index - 1])).join('\n');
}

function allRecords(knowledge) {
  return knowledge.flatMap((source) => (source.sections || []).map((section) => ({ ...section, source })));
}

function aliasesFor(record) {
  const aliases = new Set();
  const original = cleanText(record.name);
  const full = normalize(original);
  if (full) aliases.add(full);

  const words = full.split(' ').filter(Boolean);
  if (words.length > 1 && titleWords.has(words[0])) aliases.add(words.slice(1).join(' '));
  if (words.length) aliases.add(words[0]);

  for (const match of original.matchAll(/[“‘"']([^”’"']+)[”’"']/g)) aliases.add(normalize(match[1]));
  return aliases;
}

function findExactRecord(subject, knowledge, preferredType = '') {
  const wanted = normalize(subject);
  if (!wanted) return null;
  const candidates = allRecords(knowledge).filter((record) => {
    if (preferredType && record.source.type !== preferredType) return false;
    return aliasesFor(record).has(wanted);
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const aExact = normalize(a.name) === wanted ? 1 : 0;
    const bExact = normalize(b.name) === wanted ? 1 : 0;
    return bExact - aExact || String(b.text || '').length - String(a.text || '').length;
  });
  return candidates[0];
}

function looksLikeHeading(line = '') {
  const text = cleanText(line);
  if (!text || text.includes(':') || text.length > 90) return false;
  return /^[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'“”‘’"()&/-]+$/.test(text);
}

function findRawRecord(subject, knowledge) {
  const wanted = normalize(subject);
  if (!wanted) return null;
  for (const source of knowledge) {
    const lines = String(source.rawText || '').replace(/\r/g, '').split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = cleanText(lines[i]);
      const normalizedLine = normalize(line);
      if (!(normalizedLine === wanted || normalizedLine.startsWith(`${wanted} `))) continue;

      const collected = [line];
      for (let j = i + 1; j < lines.length && collected.length < 45; j += 1) {
        const next = cleanText(lines[j]);
        if (!next) {
          if (collected.length > 2) break;
          continue;
        }
        if (looksLikeHeading(next) && !/^(Role|Family|Age|Born|Given Name|Core Spine|Background|Core Beliefs|Greatest|Fatal|Psychological|Relationship|Locked)/i.test(next)) break;
        collected.push(next);
      }
      return { name: line, text: collected.join('\n'), source };
    }
  }
  return null;
}

function identitySubject(question) {
  return cleanText(question)
    .replace(/^(who|what)\s+(is|was|are|were)\s+/i, '')
    .replace(/^tell me (everything )?(you know )?about\s+/i, '')
    .replace(/^what do you know about\s+/i, '')
    .replace(/^show me\s+/i, '')
    .replace(/[?!.]+$/g, '')
    .trim();
}

function parseRelationshipQuestion(question) {
  const text = normalize(question);
  const patterns = [
    /^who (?:is|was) (.+?)s (dad|father|mom|mother|sister|brother|uncle|aunt|cousin|cousins|wife|husband|son|daughter)$/,
    /^what (?:is|was) (.+?)s (horse) (?:named|called)$/,
    /^what (?:is|was) (.+?)s (horse)$/,
    /^who did (.+?) marry$/,
    /^who (?:is|was) (.+?) married to$/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    if (text.startsWith('who did') || text.includes('married to')) return { person: match[1], relation: 'wife' };
    return { person: match[1], relation: match[2] };
  }
  return null;
}

function relationshipAnswer(question, knowledge) {
  const parsed = parseRelationshipQuestion(question);
  if (!parsed) return '';
  const person = normalize(parsed.person);
  const relation = parsed.relation;
  const synonyms = relationshipWords[relation] || [relation];

  if (relation === 'horse') {
    const horses = allRecords(knowledge).filter((record) => record.source.type === 'horses');
    const horse = horses.find((record) => {
      const text = normalize(record.text);
      return text.includes(person) || text.includes(`${person} callahan`) || text.includes(`${person} kincaid`) || text.includes(`${person} rawlins`) || text.includes(`${person} haskins`);
    });
    if (horse) return dedupeLines(horse.text);
  }

  const records = allRecords(knowledge);
  const related = records.filter((record) => {
    const text = normalize(record.text);
    const name = normalize(record.name);
    const personMentioned = text.includes(person) || text.includes(`${person} callahan`) || text.includes(`${person} kincaid`) || text.includes(`${person} rawlins`) || text.includes(`${person} haskins`) || text.includes(`${person} red hawk`) || text.includes(`${person} redhawk`);
    if (!personMentioned) return false;
    return synonyms.some((word) => text.includes(`${word} of ${person}`) || text.includes(`${person}s ${word}`) || text.includes(`${person} ${word}`) || (word === 'married' && text.includes('married')) || name.includes(word));
  });

  if (related.length) {
    related.sort((a, b) => String(a.text || '').length - String(b.text || '').length);
    return dedupeLines(related[0].text);
  }

  for (const source of knowledge) {
    const lines = String(source.rawText || '').replace(/\r/g, '').split('\n').map(cleanText).filter(Boolean);
    const line = lines.find((entry) => {
      const text = normalize(entry);
      return text.includes(person) && synonyms.some((word) => text.includes(word));
    });
    if (line) return line;
  }

  return 'I found the person, but that exact relationship is not written clearly enough in the current canon files.';
}

function bookAnswer(question, books) {
  const text = normalize(question);
  const match = text.match(/\bbook\s*(\d{1,2})\b/);
  if (!match) return '';
  const number = Number(match[1]);
  const book = books.find((item) => Number(item.number) === number);
  if (!book) return `Book ${number} is not indexed yet.`;
  const sections = (book.sections || []).map((section) => cleanText(section.text)).filter(Boolean);
  if (!sections.length) return `Book ${number}, ${book.title}, is listed but has no searchable material indexed.`;
  const useful = sections.slice(0, 6).join('\n\n');
  return `Book ${number} is ${book.title}.\n\n${useful}`;
}

function searchBooks(question, books) {
  const terms = normalize(question).split(' ').filter((word) => word.length > 3);
  const results = [];
  for (const book of books) {
    for (const section of book.sections || []) {
      const text = normalize(section.text);
      const score = terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
      if (score) results.push({ ...section, bookTitle: book.title, score });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

function buildAnswer(question, books, knowledge) {
  if (!question.trim()) return '';

  const book = bookAnswer(question, books);
  if (book) return book;

  const relationship = relationshipAnswer(question, knowledge);
  if (relationship) return relationship;

  const subject = identitySubject(question);
  if (/^(who|what)\s+(is|was|are|were)\b/i.test(question) || /^tell me|^what do you know|^show me/i.test(question)) {
    const exact = findExactRecord(subject, knowledge) || findRawRecord(subject, knowledge);
    if (exact) return dedupeLines(exact.text);
    return 'I could not find an exact canon record for that name. I will not substitute a different person, animal, place, or event.';
  }

  const bookMatches = searchBooks(question, books);
  if (bookMatches.length) return `I found this in ${bookMatches[0].bookTitle}:\n\n${bookMatches[0].text}`;

  return 'I could not find that information in the current Five Oaks canon.';
}

function pickFemaleVoice(voices) {
  const english = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en'));
  const pool = english.length ? english : voices;
  const hints = ['female', 'woman', 'zira', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'serena', 'ava', 'allison', 'salli', 'joanna', 'kendra', 'kimberly', 'aria', 'jenny', 'michelle'];
  return pool.find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint))) || pool.find((voice) => voice.lang?.toLowerCase().startsWith('en-us')) || pool[0];
}

function DiamondFace({ speaking }) {
  const frameStyle = {
    position: 'relative', width: '535px', height: '565px', borderRadius: '30px', overflow: 'hidden',
    border: '2px solid rgba(255,255,255,.24)', background: '#140f12', filter: speaking ? 'brightness(1.06)' : 'none',
    boxShadow: speaking ? 'inset 0 0 35px rgba(255,255,255,.11), 0 0 48px rgba(233,182,214,.5)' : 'inset 0 0 35px rgba(255,255,255,.09), 0 0 38px rgba(233,182,214,.34)',
  };
  return <section className="diamondPortraitShell" aria-label="Diamond assistant portrait"><div className="portraitGlow" /><div style={frameStyle}><img className="diamondPortrait" src={diamondPortrait} alt="Diamond" /></div><p className="faceCaption">{speaking ? 'Diamond is speaking' : 'Diamond is online'}</p></section>;
}

function App() {
  const [activeTab, setActiveTab] = useState('Ask Diamond');
  const [question, setQuestion] = useState('How are Jake, Krys, and Matt connected?');
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);

  const loadedBooks = bookIndex.filter((book) => (book.sections || []).length > 0);
  const loadedKnowledge = knowledgeIndex.filter((source) => (source.sections || []).length > 0 || source.rawText);
  const answer = useMemo(() => buildAnswer(question, loadedBooks, loadedKnowledge), [question, loadedBooks, loadedKnowledge]);
  const diamondVoice = useMemo(() => pickFemaleVoice(voices), [voices]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  function speakAnswer() {
    if (!('speechSynthesis' in window)) return;
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

  function stopSpeaking() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setSpeaking(false); }
  function clearAskDiamond() { stopSpeaking(); setQuestion(''); }

  return (
    <main className="appShell">
      <section className="hero heroWithFace"><div><p className="eyebrow">The World of Five Oaks</p><h1>Diamond</h1><p className="tagline">Five Oaks canon assistant, character encyclopedia, and continuity guard.</p></div><DiamondFace speaking={speaking} /><div className="statusCard"><span>Library</span><strong>{loadedBooks.length} of {bookIndex.length} books indexed</strong><span>Canon databases</span><strong>{loadedKnowledge.length} of {knowledgeIndex.length} indexed</strong></div></section>
      <nav className="tabs" aria-label="Diamond sections">{tabs.map((tab) => <button key={tab.label} className={activeTab === tab.label ? 'active' : ''} onClick={() => setActiveTab(tab.label)}><span aria-hidden="true">{tab.icon}</span> {tab.label}</button>)}</nav>
      {activeTab === 'Ask Diamond' && <section className="panel askPanel"><h2>Ask Diamond</h2><p>Books 1-{loadedBooks.length} and {loadedKnowledge.length} canon databases are indexed.</p><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Diamond..." aria-label="Ask Diamond a Five Oaks question" /><div className="answerBox"><span>Diamond says</span><p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p></div><div className="voiceControls"><button type="button" onClick={speakAnswer} disabled={!answer}>Hear Diamond</button><button type="button" onClick={stopSpeaking}>Stop</button><button type="button" onClick={clearAskDiamond}>Clear</button><p>{diamondVoice ? `Voice selected: ${diamondVoice.name}` : 'Female voice loading...'}</p></div></section>}
      {activeTab === 'Books' && <section className="gridPanel">{bookIndex.map((book) => <article className="card" key={book.file}><h2>Book {book.number}</h2><h3>{book.title}</h3><p>{(book.sections || []).length ? `${book.sections.length} searchable sections indexed.` : 'Not indexed yet.'}</p></article>)}{bookIndexErrors.map((error) => <article className="card" key={error.file}><h3>Index warning</h3><p>{error.book}: {error.error}</p></article>)}{knowledgeIndexErrors.map((error) => <article className="card" key={error.file}><h3>Knowledge warning</h3><p>{error.title}: {error.error}</p></article>)}</section>}
      {activeTab === 'Characters' && <section className="gridPanel">{characters.map((character) => <article className="card" key={character.name}><h2>{character.name}</h2><p className="muted">{character.givenName}</p><h3>{character.role}</h3><p>{character.core}</p>{character.horse && <p><strong>Horse:</strong> {character.horse}</p>}</article>)}</section>}
      {activeTab === 'Relationships' && <section className="gridPanel"><article className="card"><h2>Relationship Graph</h2><p>{relationshipGraph.nodes.length} subjects and {relationshipGraph.edges.length} direct canon links are available.</p></article>{relationshipGraph.edges.map((item) => <article className="card" key={`${item.source}-${item.target}`}><h2>{item.title}</h2><p>{item.summary}</p></article>)}</section>}
      {activeTab === 'Families' && <section className="gridPanel">{families.map((item) => <article className="card" key={item.family}><h2>{item.family}</h2><p>{item.notes}</p></article>)}</section>}
      {activeTab === 'Canon Rules' && <section className="panel"><h2>Diamond’s Canon Rules</h2><ul className="rulesList">{canonRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></section>}
    </main>
  );
}

export default App;
