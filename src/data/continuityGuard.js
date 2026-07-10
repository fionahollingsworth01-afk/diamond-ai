const lockedClaims = [
  {
    id: 'jake-krys-marriage',
    subjects: ['jake', 'krys'],
    topic: ['marry', 'married', 'husband', 'wife'],
    truth: 'Jake Kincaid and Krys Callahan are husband and wife. They marry in the late 1880s.',
    contradictions: [
      { phrases: ['jake married susanna', 'susanna married jake'], correction: 'Jake married Krys, not Susanna.' },
      { phrases: ['krys married matt', 'matt married krys'], correction: 'Krys married Jake. Matt is her brother by choice, not her husband.' },
      { phrases: ['jake and krys never married'], correction: 'Jake and Krys did marry, in the late 1880s.' }
    ]
  },
  {
    id: 'jace-susanna-status',
    subjects: ['jace', 'susanna'],
    topic: ['marry', 'married', 'husband', 'wife'],
    truth: 'Jace Callahan and Susanna Pike never marry. Susanna remains Pike.',
    contradictions: [
      { phrases: ['jace married susanna', 'susanna married jace', 'jace and susanna were married'], correction: 'Jace and Susanna never marry. Susanna remains Pike.' }
    ]
  },
  {
    id: 'krys-jace-siblings',
    subjects: ['krys', 'jace'],
    topic: ['sister', 'brother', 'siblings', 'related'],
    truth: 'Krys and Jace are half siblings through Roger Callahan.',
    contradictions: [
      { phrases: ['krys and jace are not related', 'jace is not krys brother'], correction: 'Krys and Jace are half siblings through Roger Callahan.' }
    ]
  },
  {
    id: 'krys-children',
    subjects: ['krys', 'kai', 'wes'],
    topic: ['child', 'children', 'son', 'sons', 'daughter'],
    truth: 'Krys and Jake have two sons: Kai and Wes.',
    contradictions: [
      { phrases: ['krys had a daughter', 'krys has a daughter'], correction: 'No daughter is established for Krys. She and Jake have two sons, Kai and Wes.' },
      { phrases: ['krys had three children', 'krys has three children'], correction: 'Krys and Jake have two children: Kai and Wes.' }
    ]
  },
  {
    id: 'jace-children',
    subjects: ['jace', 'susanna', 'eli', 'cole', 'sawyer', 'dawson', 'jennifer', 'caleb'],
    topic: ['child', 'children', 'son', 'sons', 'daughter'],
    truth: 'Jace and Susanna have six children: Eli, Cole, Sawyer, Dawson, Jennifer, and Caleb.',
    contradictions: [
      { phrases: ['jace had five children', 'jace has five children'], correction: 'Jace and Susanna have six children.' },
      { phrases: ['jennifer is jakes daughter', 'jake is jennifers father'], correction: 'Jennifer is Jace and Susanna’s daughter, not Jake’s.' }
    ]
  },
  {
    id: 'cole-tate-romance',
    subjects: ['cole', 'tate'],
    topic: ['love', 'relationship', 'romance', 'together'],
    truth: 'Cole and Tate fall in love in Book 17.',
    contradictions: [
      { phrases: ['cole and tate are brothers', 'tate is coles brother'], correction: 'Cole and Tate are not brothers. They fall in love.' }
    ]
  },
  {
    id: 'jennifer-waya-family',
    subjects: ['jennifer', 'waya', 'tsula'],
    topic: ['marry', 'married', 'family', 'daughter'],
    truth: 'Jennifer marries Waya, and Tsula becomes part of the family they build at Five Oaks.',
    contradictions: [
      { phrases: ['jennifer married wyatt', 'wyatt married jennifer'], correction: 'Jennifer marries Waya, not Wyatt.' },
      { phrases: ['tsula is jennifers biological daughter'], correction: 'Tsula is Waya’s daughter. Jennifer accepts her as part of their family.' }
    ]
  },
  {
    id: 'whisper-outcome',
    subjects: ['eli', 'krys', 'whisper'],
    topic: ['kill', 'killed', 'shot', 'shooting'],
    truth: 'Krys is shot after shoving Eli aside, and Eli kills Whisper.',
    contradictions: [
      { phrases: ['whisper killed krys', 'krys died from whisper'], correction: 'Krys is shot but survives. Eli kills Whisper.' },
      { phrases: ['matt killed whisper'], correction: 'Eli kills Whisper.' }
    ]
  }
];

function normalize(text) {
  return text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isContinuityCheck(question) {
  const text = normalize(question);
  return text.startsWith('is ') || text.startsWith('are ') || text.startsWith('did ') || text.startsWith('does ') || text.startsWith('was ') || text.startsWith('were ') || text.includes('is it true') || text.includes('canon') || text.includes('correct') || text.includes('right that') || text.includes('continuity');
}

function findContradiction(text) {
  for (const claim of lockedClaims) {
    for (const contradiction of claim.contradictions) {
      if (contradiction.phrases.some((phrase) => text.includes(normalize(phrase)))) {
        return { claim, contradiction };
      }
    }
  }
  return null;
}

function findSupportedClaim(text) {
  return lockedClaims.find((claim) => {
    const subjectHit = claim.subjects.some((subject) => text.includes(subject));
    const topicHit = claim.topic.some((topic) => text.includes(topic));
    return subjectHit && topicHit;
  });
}

export function checkContinuity(question) {
  const text = normalize(question);
  const contradiction = findContradiction(text);

  if (contradiction) {
    return {
      type: 'continuity-conflict',
      confidence: 'locked',
      answer: `That conflicts with locked Five Oaks canon. ${contradiction.contradiction.correction}\n\nLocked canon: ${contradiction.claim.truth}`
    };
  }

  if (!isContinuityCheck(question)) return null;

  const supported = findSupportedClaim(text);
  if (supported) {
    return {
      type: 'continuity-confirmed',
      confidence: 'locked',
      answer: `The locked canon says: ${supported.truth}`
    };
  }

  return {
    type: 'continuity-unknown',
    confidence: 'unknown',
    answer: 'That detail is not established in Diamond’s locked canon yet. I will not guess or treat it as fact.'
  };
}

export { lockedClaims };
