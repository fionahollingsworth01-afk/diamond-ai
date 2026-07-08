import { useEffect, useMemo, useState } from 'react';
import { canonRules, characters, families } from './data/diamondData.js';
import diamondPortrait from '../DIAMOND.jpg';

const tabs = ['Ask Diamond', 'Characters', 'Families', 'Canon Rules'];

function answerQuestion(question) {
  const text = question.toLowerCase();

  if (!text.trim()) {
    return 'Ask me something from Five Oaks canon. I will answer from locked knowledge, not guesswork.';
  }

  if (text.includes('grave')) {
    return 'Grave is Jake Kincaid’s outlaw-era horse. By 1916, Grave is gone/deceased, so Diamond should not answer that Jake is riding Grave in the later books.';
  }

  if (text.includes('ledger')) {
    return 'Ledger is Matt Haskins’ outlaw-era horse. By 1916, Ledger is gone/deceased unless a later locked file says otherwise.';
  }

  if (text.includes('cinder')) {
    return 'Cinder is Luke Rawlins’ outlaw-era horse. By 1916, Cinder is gone/deceased unless a later locked file says otherwise.';
  }

  if (text.includes('krys') && (text.includes('weapon') || text.includes('rifle') || text.includes('derringer'))) {
    return "Krys carries a Colt Single Action Army, a pocket Derringer, and her pa’s Winchester 1873, the rifle he taught her to shoot with. That rifle matters because it proves she was already capable before she ever rode with the boys.";
  }

  if (text.includes('jace') && (text.includes('weapon') || text.includes('pistol') || text.includes('rifle'))) {
    return 'Jace carries a Colt Single Action Army, a Winchester Model 1873, a working belt knife, and a small hideout pistol because Jace is not above having one more damn option.';
  }

  const found = characters.find((character) => text.includes(character.name.split(' ')[0].toLowerCase()));
  if (found) {
    return `${found.name}: ${found.core} Weapons: ${found.weapons.join(', ')}. Horse record: ${found.horse} (${found.horseEra}). ${found.notes}`;
  }

  return 'That has not been established in Diamond’s locked canon yet. Add the dossier or correction, and I will use that instead of making something up.';
}

function pickFemaleVoice(voices) {
  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en'));
  const voicePool = englishVoices.length ? englishVoices : voices;
  const femaleHints = [
    'female',
    'woman',
    'zira',
    'susan',
    'samantha',
    'victoria',
    'karen',
    'moira',
    'tessa',
    'serena',
    'ava',
    'allison',
    'salli',
    'joanna',
    'kendra',
    'kimberly',
    'aria',
    'jenny',
    'michelle',
  ];

  return (
    voicePool.find((voice) => femaleHints.some((hint) => voice.name.toLowerCase().includes(hint))) ||
    voicePool.find((voice) => voice.lang?.toLowerCase().startsWith('en-us')) ||
    voicePool[0]
  );
}

function DiamondFace({ speaking }) {
  return (
    <section className={`diamondPortraitShell ${speaking ? 'speaking' : ''}`} aria-label="Diamond assistant portrait">
      <div className="portraitGlow" />
      <div className="portraitFrame">
        <img className="diamondPortrait" src={diamondPortrait} alt="Diamond" />
        <div className="portraitBreath" />
      </div>
      <p className="faceCaption">{speaking ? 'Diamond is speaking' : 'Diamond is online'}</p>
    </section>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('Ask Diamond');
  const [question, setQuestion] = useState('What horse did Jake ride?');
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const answer = useMemo(() => answerQuestion(question), [question]);
  const diamondVoice = useMemo(() => pickFemaleVoice(voices), [voices]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return undefined;
    }

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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }

  return (
    <main className="appShell">
      <section className="hero heroWithFace">
        <div>
          <p className="eyebrow">The World of Five Oaks</p>
          <h1>Diamond</h1>
          <p className="tagline">Five Oaks canon assistant, character encyclopedia, and continuity guard.</p>
        </div>
        <DiamondFace speaking={speaking} />
        <div className="statusCard">
          <span>First Look</span>
          <strong>Canon-safe foundation online</strong>
        </div>
      </section>

      <nav className="tabs" aria-label="Diamond sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Ask Diamond' && (
        <section className="panel askPanel">
          <h2>Ask Diamond</h2>
          <p>First version. She only answers from the canon we have started loading.</p>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            aria-label="Ask Diamond a Five Oaks question"
          />
          <div className="answerBox">
            <span>Diamond says</span>
            <p>{answer}</p>
          </div>
          <div className="voiceControls">
            <button type="button" onClick={speakAnswer}>Hear Diamond</button>
            <button type="button" onClick={stopSpeaking}>Stop</button>
            <p>{diamondVoice ? `Voice selected: ${diamondVoice.name}` : 'Female voice loading...'}</p>
          </div>
        </section>
      )}

      {activeTab === 'Characters' && (
        <section className="gridPanel">
          {characters.map((character) => (
            <article className="card" key={character.name}>
              <h2>{character.name}</h2>
              <p className="muted">{character.givenName}</p>
              <h3>{character.role}</h3>
              <p>{character.core}</p>
              <p><strong>Horse:</strong> {character.horse} — {character.horseEra}</p>
              <p><strong>Weapons:</strong> {character.weapons.join(', ')}</p>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'Families' && (
        <section className="gridPanel">
          {families.map((item) => (
            <article className="card" key={item.family}>
              <h2>{item.family}</h2>
              <p>{item.notes}</p>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'Canon Rules' && (
        <section className="panel">
          <h2>Diamond’s Canon Rules</h2>
          <ul className="rulesList">
            {canonRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default App;
