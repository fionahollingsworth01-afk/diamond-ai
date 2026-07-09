import { useEffect, useMemo, useState } from 'react';
import { canonRules, characters, families } from './data/diamondData.js';
import { bookIndex, bookIndexErrors } from './data/bookIndex.js';
import { relationships } from './data/relationshipData.js';
import { findCharacterKnowledge } from './data/characterKnowledge.js';
import { findEventKnowledge } from './data/eventKnowledge.js';
import diamondPortrait from '../DIAMOND.jpg';

const tabs = [
  { label: 'Ask Diamond', icon: '💬' },
  { label: 'Books', icon: '📚' },
  { label: 'Characters', icon: '👥' },
  { label: 'Relationships', icon: '🧵' },
  { label: 'Families', icon: '🌳' },
  { label: 'Canon Rules', icon: '⚖️' },
];

const stopWords = new Set(['what', 'was', 'were', 'the', 'did', 'does', 'who', 'where', 'when', 'how', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'has', 'his', 'her', 'they', 'them', 'their', 'horse', 'ride', 'rode', 'named', 'name', 'tell', 'show', 'find', 'about']);

function cleanText(text) { return text.replace(/\s+/g, ' ').trim(); }
function normalizedText(question) { return question.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' '); }
function questionTerms(question) { return normalizedText(question).split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word)); }
function wantsExpandedAnswer(question) {
  const text = normalizedText(question).trim();
  return text.startsWith('tell me about') || text.startsWith('tell me everything') || text.startsWith('who is') || text.startsWith('who was') || text.includes('show me') || text.includes('passage') || text.includes('scene') || text.includes('quote') || text.includes('special') || text.includes('deep') || text.includes('bond') || text.includes('relationship') || text.startsWith('why');
}
function isDirectQuestion(question) { return /^(who|what|when|where|why|how|did|does|do|is|are|was|were)\b/.test(normalizedText(question).trim()); }
function personIsMentioned(text, person) { return text.includes(person) || text.includes(`${person}s`); }

function findRelationship(question) {
  const text = normalizedText(question);
  return relationships.find((item) => item.people.every((person) => personIsMentioned(text, person)));
}

function knowledgeEntryAnswer(entry, question) {
  if (!entry) return '';
  return wantsExpandedAnswer(question) ? entry.full : entry.short;
}

function characterKnowledgeAnswer(question) { return knowledgeEntryAnswer(findCharacterKnowledge(question), question); }
function eventKnowledgeAnswer(question) { return knowledgeEntryAnswer(findEventKnowledge(question), question); }

function directCanonAnswer(question) {
  const text = normalizedText(question);
  if (!text.trim()) return '';
  const relationship = findRelationship(question);
  if (relationship && wantsExpandedAnswer(question)) return relationship.summary;
  if (relationship) return relationship.direct;

  if (text.includes('who') && text.includes('jake') && text.includes('marry')) return 'Jake married Krys Callahan.';
  if (text.includes('when') && text.includes('jake') && text.includes('marry')) return 'Jake married Krys in the late 1880s.';
  if (text.includes('who') && text.includes('gave') && text.includes('krys') && (text.includes('away') || text.includes('give'))) return 'Matt Haskins gave Krys away when she married Jake.';
  if (text.includes('krys') && text.includes('horse')) return 'Krys rides Lark.';
  if (text.includes('jace') && text.includes('horse')) return 'Jace rides Barney.';
  if (text.includes('jake') && text.includes('horse')) return 'Jake’s outlaw-era horse is Grave. By 1916, Grave is gone/deceased and Jake rides a later horse.';
  if (text.includes('matt') && text.includes('horse')) return 'Matt’s outlaw-era horse is Ledger.';
  if (text.includes('luke') && text.includes('horse')) return 'Luke’s outlaw-era horse is Cinder.';
  if (text.includes('krys') && (text.includes('weapon') || text.includes('rifle') || text.includes('derringer'))) return "Krys carries a Colt Single Action Army, a pocket Derringer, and her pa’s Winchester 1873.";
  if (text.includes('jace') && (text.includes('weapon') || text.includes('pistol') || text.includes('rifle'))) return 'Jace carries a Colt Single Action Army, a Winchester Model 1873, a working belt knife, and a small hideout pistol.';
  return '';
}

function expandedCanonAnswer(question) {
  const text = normalizedText(question);
  const relationship = findRelationship(question);
  if (relationship) return relationship.summary;
  const eventKnowledge = eventKnowledgeAnswer(question);
  if (eventKnowledge) return eventKnowledge;
  const knowledge = characterKnowledgeAnswer(question);
  if (knowledge) return knowledge;
  const found = characters.find((character) => text.includes(character.name.split(' ')[0].toLowerCase()));
  if (found) return `${found.name}: ${found.core} Weapons: ${found.weapons.join(', ')}. Horse record: ${found.horse} (${found.horseEra}). ${found.notes}`;
  return '';
}

function searchBooks(question, books) {
  const terms = questionTerms(question);
  if (!terms.length || !books.length) return [];
  const phrase = cleanText(normalizedText(question));
  const results = [];
  for (const book of books) {
    for (const part of book.sections || []) {
      const lower = normalizedText(part.text);
      let score = lower.includes(phrase) ? 25 : 0;
      for (const term of terms) if (lower.includes(term)) score += 4;
      if (score > 0) results.push({ ...part, bookTitle: book.title, bookNumber: book.number, score });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

function buildBookAnswer(question, books) {
  if (!question.trim()) return '';
  const direct = directCanonAnswer(question);
  const characterKnowledge = characterKnowledgeAnswer(question);
  const eventKnowledge = eventKnowledgeAnswer(question);
  const expanded = wantsExpandedAnswer(question);
  const directQuestion = isDirectQuestion(question);
  const matches = searchBooks(question, books);
  if (direct) return direct;
  if (eventKnowledge) return eventKnowledge;
  if (characterKnowledge) return characterKnowledge;
  const characterAnswer = expandedCanonAnswer(question);
  if (characterAnswer && expanded) return characterAnswer;
  if (directQuestion && !expanded) return 'I could not find a direct answer for that in the current Five Oaks canon yet.';
  if (matches.length && expanded) return `I found this in ${matches[0].bookTitle}:\n\n${matches[0].text}`;
  if (matches.length) return 'I found book support, but not a clean direct answer yet. Ask “show me the passage” if you want the excerpt.';
  return 'I could not find that information in the current Five Oaks canon.';
}

function pickFemaleVoice(voices) {
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en'));
  const voicePool = englishVoices.length ? englishVoices : voices;
  const femaleHints = ['female', 'woman', 'zira', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'serena', 'ava', 'allison', 'salli', 'joanna', 'kendra', 'kimberly', 'aria', 'jenny', 'michelle'];
  return voicePool.find((voice) => femaleHints.some((hint) => voice.name.toLowerCase().includes(hint))) || voicePool.find((voice) => voice.lang?.toLowerCase().startsWith('en-us')) || voicePool[0];
}

function DiamondFace({ speaking }) {
  const frameStyle = { position: 'relative', width: '535px', height: '565px', borderRadius: '30px', overflow: 'hidden', border: '2px solid rgba(255,255,255,.24)', boxShadow: speaking ? 'inset 0 0 35px rgba(255,255,255,.11), 0 0 48px rgba(233,182,214,.5)' : 'inset 0 0 35px rgba(255,255,255,.09), 0 0 38px rgba(233,182,214,.34)', background: '#140f12', filter: speaking ? 'brightness(1.06)' : 'none' };
  return <section className="diamondPortraitShell" aria-label="Diamond assistant portrait"><div className="portraitGlow" /><div style={frameStyle}><img className="diamondPortrait" src={diamondPortrait} alt="Diamond" /></div><p className="faceCaption">{speaking ? 'Diamond is speaking' : 'Diamond is online'}</p></section>;
}

function App() {
  const [activeTab, setActiveTab] = useState('Ask Diamond');
  const [question, setQuestion] = useState('Tell me about the oil venture');
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const loadedBooks = bookIndex.filter((book) => (book.sections || []).length > 0);
  const answer = useMemo(() => buildBookAnswer(question, loadedBooks), [question, loadedBooks]);
  const matches = useMemo(() => wantsExpandedAnswer(question) ? searchBooks(question, loadedBooks) : [], [question, loadedBooks]);
  const diamondVoice = useMemo(() => pickFemaleVoice(voices), [voices]);
  useEffect(() => { if (!('speechSynthesis' in window)) return undefined; const loadVoices = () => setVoices(window.speechSynthesis.getVoices()); loadVoices(); window.speechSynthesis.addEventListener('voiceschanged', loadVoices); return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices); }, []);
  function speakAnswer() { if (!('speechSynthesis' in window)) { alert('This browser does not support built-in voice yet. Try Edge or Chrome.'); return; } window.speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance(answer); speech.voice = diamondVoice || null; speech.lang = diamondVoice?.lang || 'en-US'; speech.pitch = 1.12; speech.rate = 0.92; speech.onstart = () => setSpeaking(true); speech.onend = () => setSpeaking(false); speech.onerror = () => setSpeaking(false); window.speechSynthesis.speak(speech); }
  function stopSpeaking() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setSpeaking(false); }
  function clearAskDiamond() { stopSpeaking(); setQuestion(''); }

  return (
    <main className="appShell">
      <section className="hero heroWithFace"><div><p className="eyebrow">The World of Five Oaks</p><h1>Diamond</h1><p className="tagline">Five Oaks canon assistant, character encyclopedia, and continuity guard.</p></div><DiamondFace speaking={speaking} /><div className="statusCard"><span>Library</span><strong>{loadedBooks.length} of {bookIndex.length} books indexed</strong></div></section>
      <nav className="tabs" aria-label="Diamond sections">{tabs.map((tab) => <button key={tab.label} className={activeTab === tab.label ? 'active' : ''} onClick={() => setActiveTab(tab.label)}><span aria-hidden="true">{tab.icon}</span> {tab.label}</button>)}</nav>
      {activeTab === 'Ask Diamond' && <section className="panel askPanel"><h2>Ask Diamond</h2><p>{loadedBooks.length ? 'Books 1-12 are indexed. Phase 2 now checks character and event knowledge before book passages.' : 'Diamond has not indexed the book library yet.'}</p><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Diamond..." aria-label="Ask Diamond a Five Oaks question" /><div className="answerBox"><span>Diamond says</span><p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p></div>{matches.length > 1 && <div className="gridPanel" style={{ marginTop: '18px' }}>{matches.slice(1, 4).map((match) => <article className="card" key={match.id}><h3>{match.bookTitle}</h3><p>{match.text}</p></article>)}</div>}<div className="voiceControls"><button type="button" onClick={speakAnswer} disabled={!answer}>Hear Diamond</button><button type="button" onClick={stopSpeaking}>Stop</button><button type="button" onClick={clearAskDiamond}>Clear</button><p>{diamondVoice ? `Voice selected: ${diamondVoice.name}` : 'Female voice loading...'}</p></div></section>}
      {activeTab === 'Books' && <section className="gridPanel">{bookIndex.map((book) => <article className="card" key={book.file}><h2>Book {book.number}</h2><h3>{book.title}</h3><p>{(book.sections || []).length ? `${book.sections.length} searchable sections indexed.` : 'Not indexed yet.'}</p></article>)}{bookIndexErrors.map((error) => <article className="card" key={error.file}><h3>Index warning</h3><p>{error.book}: {error.error}</p></article>)}</section>}
      {activeTab === 'Characters' && <section className="gridPanel">{characters.map((character) => <article className="card" key={character.name}><h2>{character.name}</h2><p className="muted">{character.givenName}</p><h3>{character.role}</h3><p>{character.core}</p><p><strong>Horse:</strong> {character.horse} — {character.horseEra}</p><p><strong>Weapons:</strong> {character.weapons.join(', ')}</p></article>)}</section>}
      {activeTab === 'Relationships' && <section className="gridPanel">{relationships.map((item) => <article className="card" key={item.title}><h2>{item.title}</h2><p>{item.summary}</p></article>)}</section>}
      {activeTab === 'Families' && <section className="gridPanel">{families.map((item) => <article className="card" key={item.family}><h2>{item.family}</h2><p>{item.notes}</p></article>)}</section>}
      {activeTab === 'Canon Rules' && <section className="panel"><h2>Diamond’s Canon Rules</h2><ul className="rulesList">{canonRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></section>}
    </main>
  );
}

export default App;
