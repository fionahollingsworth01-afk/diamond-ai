import { useMemo, useState } from 'react';
import { canonRules, characters, families } from './data/diamondData.js';

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

function DiamondFace({ speaking }) {
  return (
    <section className={`diamondFace ${speaking ? 'speaking' : ''}`} aria-label="Diamond assistant face">
      <div className="diamondGlow" />
      <div className="faceFrame">
        <div className="browLine" />
        <div className="eyes">
          <span className="eye"><span className="pupil" /></span>
          <span className="eye"><span className="pupil" /></span>
        </div>
        <div className="noseGem" />
        <div className="mouth" />
      </div>
      <p className="faceCaption">Diamond is online</p>
    </section>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('Ask Diamond');
  const [question, setQuestion] = useState('What horse did Jake ride?');
  const answer = useMemo(() => answerQuestion(question), [question]);
  const isSpeaking = activeTab === 'Ask Diamond' && question.trim().length > 0;

  return (
    <main className="appShell">
      <section className="hero heroWithFace">
        <div>
          <p className="eyebrow">The World of Five Oaks</p>
          <h1>Diamond</h1>
          <p className="tagline">Five Oaks canon assistant, character encyclopedia, and continuity guard.</p>
        </div>
        <DiamondFace speaking={isSpeaking} />
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
