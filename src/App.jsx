import { useEffect, useMemo, useState } from 'react';
import {
  animals,
  books,
  characters,
  relationshipViews,
  unavailableCanonRuleData,
  unavailableFamilyData,
} from './data/fiveOaksData.js';
import { answerFiveOaksQuestion } from './data/fiveOaksSearch.js';
import diamondPortrait from '../DIAMOND.jpg';

const tabs = [
  { label: 'Ask Diamond', icon: '💬' },
  { label: 'Books', icon: '📚' },
  { label: 'Characters', icon: '👥' },
  { label: 'Relationships', icon: '🧵' },
  { label: 'Families', icon: '🌳' },
  { label: 'Canon Rules', icon: '⚖️' },
];

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

  const answer = useMemo(() => answerFiveOaksQuestion(question), [question]);
  const diamondVoice = useMemo(() => pickFemaleVoice(voices), [voices]);
  const snapshotRecordCount = characters.length + relationshipViews.length + animals.length;

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
      <section className="hero heroWithFace"><div><p className="eyebrow">The World of Five Oaks</p><h1>Diamond</h1><p className="tagline">Five Oaks canon assistant, character encyclopedia, and continuity guard.</p></div><DiamondFace speaking={speaking} /><div className="statusCard"><span>Library</span><strong>{books.length} current Five Oaks books</strong><span>Canon databases</span><strong>{snapshotRecordCount} current snapshot records</strong></div></section>
      <nav className="tabs" aria-label="Diamond sections">{tabs.map((tab) => <button key={tab.label} className={activeTab === tab.label ? 'active' : ''} onClick={() => setActiveTab(tab.label)}><span aria-hidden="true">{tab.icon}</span> {tab.label}</button>)}</nav>
      {activeTab === 'Ask Diamond' && <section className="panel askPanel"><h2>Ask Diamond</h2><p>{books.length} books and {snapshotRecordCount} current Five Oaks records are searchable.</p><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Diamond..." aria-label="Ask Diamond a Five Oaks question" /><div className="answerBox"><span>Diamond says</span><p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p></div><div className="voiceControls"><button type="button" onClick={speakAnswer} disabled={!answer}>Hear Diamond</button><button type="button" onClick={stopSpeaking}>Stop</button><button type="button" onClick={clearAskDiamond}>Clear</button><p>{diamondVoice ? `Voice selected: ${diamondVoice.name}` : 'Female voice loading...'}</p></div></section>}
      {activeTab === 'Books' && <section className="gridPanel">{books.map((book) => <article className="card" key={book.id}><h2>Book {book.order}</h2><h3>{book.title}</h3><p>{book.plot_summary}</p></article>)}</section>}
      {activeTab === 'Characters' && <section className="gridPanel">{characters.map((character) => <article className="card" key={character.id}><h2>{character.name}</h2><p className="muted">{character.aliases?.join(', ')}</p><h3>{character.role}</h3><p>{character.description}</p></article>)}</section>}
      {activeTab === 'Relationships' && <section className="gridPanel"><article className="card"><h2>Relationship Graph</h2><p>{characters.length} subjects and {relationshipViews.length} direct Five Oaks links are available.</p></article>{relationshipViews.map((relationship) => <article className="card" key={relationship.id}><h2>{relationship.firstCharacter?.name || 'Unknown'} and {relationship.secondCharacter?.name || 'Unknown'}</h2><p className="muted">{relationship.relationship_type}</p><p>{relationship.description}</p></article>)}</section>}
      {activeTab === 'Families' && <section className="gridPanel"><article className="card"><h2>Families</h2><p>{unavailableFamilyData}</p></article></section>}
      {activeTab === 'Canon Rules' && <section className="panel"><h2>Diamond’s Canon Rules</h2><p>{unavailableCanonRuleData}</p></section>}
    </main>
  );
}

export default App;
