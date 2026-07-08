import { useEffect, useMemo, useState } from 'react';
import mammoth from 'mammoth';
import { canonRules, characters, families } from './data/diamondData.js';
import diamondPortrait from '../DIAMOND.jpg';

const bookFiles = [
  { number: 1, title: 'Before They Were Brothers', file: 'BEFORE THEY WERE BROTHERS FULL BOOK.docx' },
  { number: 2, title: 'Brothers by the Gun', file: 'BROTHERS BY THE GUN FULL BOOK.docx' },
  { number: 3, title: 'By the Gun No More', file: 'BY THE GUN NO MORE FULL BOOK.docx' },
  { number: 4, title: 'Built for More', file: 'BUILT FOR MORE FULL BOOK.docx' },
  { number: 5, title: 'The Long Way Forward', file: 'THE LONG WAY FORWARD FULL BOOK.docx' },
  { number: 6, title: 'The Missing Man', file: 'THE MISSING MAN FULL BOOK.docx' },
  { number: 7, title: 'What the Land Holds', file: 'WHAT THE LAND HOLDS FULL BOOK.docx' },
  { number: 8, title: 'The Long Ride West', file: 'THE LONG RIDE WEST FULL BOOK.docx' },
  { number: 9, title: 'After the Silence', file: 'AFTER THE SILENCE FULL BOOK.docx' },
  { number: 10, title: 'The Weight of a Name', file: 'THE WEIGHT OF A NAME FULL BOOK.docx' },
  { number: 11, title: 'A Bigger World', file: 'A BIGGER WORLD FULL BOOK.docx' },
  { number: 12, title: 'What We Keep', file: 'WHAT WE KEEP FULL BOOK.docx' },
];

const tabs = [
  { label: 'Ask Diamond', icon: '💬' },
  { label: 'Books', icon: '📚' },
  { label: 'Characters', icon: '👥' },
  { label: 'Families', icon: '🌳' },
  { label: 'Canon Rules', icon: '⚖️' },
];

const stopWords = new Set(['what', 'was', 'were', 'the', 'did', 'does', 'who', 'where', 'when', 'how', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'has', 'his', 'her', 'they', 'them', 'their', 'horse', 'ride', 'rode', 'named', 'name', 'tell', 'show', 'find', 'about']);

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function questionTerms(question) {
  return question.toLowerCase().replace(/[^a-z0-9’'\s]/g, ' ').split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word));
}

function quickCanonAnswer(question) {
  const text = question.toLowerCase();
  if (!text.trim()) return 'Ask me something from Five Oaks canon. I will answer from locked canon first, then search the loaded books.';
  if (text.includes('krys') && text.includes('horse')) return 'Krys rides Lark in the early Five Oaks books.';
  if (text.includes('jace') && text.includes('horse')) return 'Jace rides Barney in the early Five Oaks books.';
  if (text.includes('jake') && text.includes('horse')) return 'Jake’s outlaw-era horse is Grave. By 1916, Grave is gone/deceased and Jake rides a later horse.';
  if (text.includes('matt') && text.includes('horse')) return 'Matt’s outlaw-era horse is Ledger. By 1916, Ledger is gone/deceased unless a later locked file says otherwise.';
  if (text.includes('luke') && text.includes('horse')) return 'Luke’s outlaw-era horse is Cinder. By 1916, Cinder is gone/deceased unless a later locked file says otherwise.';
  if (text.includes('krys') && (text.includes('weapon') || text.includes('rifle') || text.includes('derringer'))) return "Krys carries a Colt Single Action Army, a pocket Derringer, and her pa’s Winchester 1873, the rifle he taught her to shoot with.";
  if (text.includes('jace') && (text.includes('weapon') || text.includes('pistol') || text.includes('rifle'))) return 'Jace carries a Colt Single Action Army, a Winchester Model 1873, a working belt knife, and a small hideout pistol.';
  const found = characters.find((character) => text.includes(character.name.split(' ')[0].toLowerCase()));
  if (found) return `${found.name}: ${found.core} Weapons: ${found.weapons.join(', ')}. Horse record: ${found.horse} (${found.horseEra}). ${found.notes}`;
  return '';
}

function searchBooks(question, books) {
  const terms = questionTerms(question);
  if (!terms.length || !books.length) return [];
  const phrase = cleanText(question.toLowerCase());
  const results = [];

  for (const book of books) {
    for (const part of book.parts) {
      const lower = part.text.toLowerCase();
      let score = lower.includes(phrase) ? 25 : 0;
      for (const term of terms) {
        if (lower.includes(term)) score += 4;
      }
      if (score > 0) results.push({ ...part, bookTitle: book.title, bookNumber: book.number, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

function buildBookAnswer(question, books, loadingStatus) {
  const canon = quickCanonAnswer(question);
  const matches = searchBooks(question, books);
  if (canon && matches.length) return `${canon}\n\nBook support: ${matches[0].bookTitle}\n${matches[0].text}`;
  if (canon) return canon;
  if (matches.length) return `I found this in ${matches[0].bookTitle}:\n\n${matches[0].text}`;
  if (loadingStatus === 'loading') return 'I am still loading the books. Try again in a few seconds.';
  return 'That has not been found in Diamond’s locked canon or the loaded books yet. Add a dossier or check the wording and I will search again.';
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
  const [question, setQuestion] = useState('What horse did Krys ride?');
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [books, setBooks] = useState([]);
  const [bookStatus, setBookStatus] = useState('loading');
  const [bookErrors, setBookErrors] = useState([]);
  const answer = useMemo(() => buildBookAnswer(question, books, bookStatus), [question, books, bookStatus]);
  const matches = useMemo(() => searchBooks(question, books), [question, books]);
  const diamondVoice = useMemo(() => pickFemaleVoice(voices), [voices]);

  useEffect(() => {
    let cancelled = false;
    async function loadBooks() {
      setBookStatus('loading');
      const loaded = [];
      const errors = [];
      for (const book of bookFiles) {
        try {
          const path = `${import.meta.env.BASE_URL}books/${encodeURIComponent(book.file)}`;
          const response = await fetch(path);
          if (!response.ok) throw new Error(`Could not fetch ${book.file}`);
          const buffer = await response.arrayBuffer();
          const extracted = await mammoth.extractRawText({ arrayBuffer: buffer });
          const pieces = extracted.value.split(/\n{2,}/).map(cleanText).filter((line) => line.length > 80).slice(0, 1200);
          loaded.push({ ...book, parts: pieces.map((text, index) => ({ id: `${book.number}-${index}`, text })) });
        } catch (error) {
          errors.push(`${book.title}: ${error.message}`);
        }
      }
      if (!cancelled) {
        setBooks(loaded);
        setBookErrors(errors);
        setBookStatus(errors.length ? 'partial' : 'ready');
      }
    }
    loadBooks();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  function speakAnswer() {
    if (!('speechSynthesis' in window)) { alert('This browser does not support built-in voice yet. Try Edge or Chrome.'); return; }
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

  return (
    <main className="appShell">
      <section className="hero heroWithFace"><div><p className="eyebrow">The World of Five Oaks</p><h1>Diamond</h1><p className="tagline">Five Oaks canon assistant, character encyclopedia, and continuity guard.</p></div><DiamondFace speaking={speaking} /><div className="statusCard"><span>Library</span><strong>{books.length} of {bookFiles.length} books loaded</strong></div></section>
      <nav className="tabs" aria-label="Diamond sections">{tabs.map((tab) => <button key={tab.label} className={activeTab === tab.label ? 'active' : ''} onClick={() => setActiveTab(tab.label)}><span aria-hidden="true">{tab.icon}</span> {tab.label}</button>)}</nav>

      {activeTab === 'Ask Diamond' && <section className="panel askPanel"><h2>Ask Diamond</h2><p>{bookStatus === 'ready' ? 'Books 1-12 are loaded. Ask from canon, characters, horses, places, or scenes.' : 'Diamond is loading the book library.'}</p><textarea value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="Ask Diamond a Five Oaks question" /><div className="answerBox"><span>Diamond says</span><p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p></div>{matches.length > 1 && <div className="gridPanel" style={{ marginTop: '18px' }}>{matches.slice(1, 4).map((match) => <article className="card" key={match.id}><h3>{match.bookTitle}</h3><p>{match.text}</p></article>)}</div>}<div className="voiceControls"><button type="button" onClick={speakAnswer}>Hear Diamond</button><button type="button" onClick={stopSpeaking}>Stop</button><p>{diamondVoice ? `Voice selected: ${diamondVoice.name}` : 'Female voice loading...'}</p></div></section>}

      {activeTab === 'Books' && <section className="gridPanel">{bookFiles.map((book) => { const loaded = books.find((item) => item.number === book.number); return <article className="card" key={book.file}><h2>Book {book.number}</h2><h3>{book.title}</h3><p>{loaded ? `${loaded.parts.length} searchable sections loaded.` : 'Not loaded yet.'}</p></article>; })}{bookErrors.map((error) => <article className="card" key={error}><h3>Load warning</h3><p>{error}</p></article>)}</section>}

      {activeTab === 'Characters' && <section className="gridPanel">{characters.map((character) => <article className="card" key={character.name}><h2>{character.name}</h2><p className="muted">{character.givenName}</p><h3>{character.role}</h3><p>{character.core}</p><p><strong>Horse:</strong> {character.horse} — {character.horseEra}</p><p><strong>Weapons:</strong> {character.weapons.join(', ')}</p></article>)}</section>}
      {activeTab === 'Families' && <section className="gridPanel">{families.map((item) => <article className="card" key={item.family}><h2>{item.family}</h2><p>{item.notes}</p></article>)}</section>}
      {activeTab === 'Canon Rules' && <section className="panel"><h2>Diamond’s Canon Rules</h2><ul className="rulesList">{canonRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></section>}
    </main>
  );
}

export default App;
