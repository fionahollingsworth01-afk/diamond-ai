import { knowledgeIndex } from './knowledgeIndex.js';

export const characterKnowledge = [
  {
    keys: ['conrad'],
    name: 'Conrad',
    short: 'Conrad is part of the temptation arc in The Weight of a Name. He becomes interested in Krys and represents the easier, polished life she could choose instead of the hard life she has built with Jake and Five Oaks.',
    full: 'Conrad is important because he does not function like a normal villain. His role is emotional pressure. He becomes interested in Krys during The Weight of a Name and tempts her with attention, polish, money, and a life that looks easier than the one she has with Jake. His presence tests Krys, shakes Jake, and hits Matt hard because Matt sees the threat to the two people who mean the most to him. Conrad matters because he exposes how strong Krys and Jake’s marriage really is and how deeply Matt depends on both of them staying whole.',
    facts: ['Appears in The Weight of a Name.', 'Connected to Krys’ temptation arc.', 'Creates pressure on Jake and Matt.', 'Not a traditional outlaw threat.']
  },
  {
    keys: ['krys', 'krysten'],
    name: 'Krys Callahan',
    short: 'Krys Callahan is one of the core foundations of Five Oaks: sharp, stubborn, loyal, and impossible to make small. She marries Jake Kincaid, has Kai and Wes, rides Lark, and is family by choice to Matt and Luke.',
    full: 'Krys Callahan is one of the emotional centers of Five Oaks. She survives Roger Callahan’s control and becomes a woman who chooses her own family, her own loyalty, and her own life. She marries Jake Kincaid in the late 1880s and has two sons, Kai and Wes. She is Matt’s sister by choice, Luke’s sister by choice, Jace’s half sister, and one of the five people who helped build Five Oaks into a family instead of just a ranch. Krys is perceptive, stubborn, protective, and dangerous when someone threatens the people she loves.',
    facts: ['Marries Jake Kincaid.', 'Mother of Kai and Wes.', 'Rides Lark.', 'Half sister to Jace through Roger Callahan.', 'Sister by choice to Matt and Luke.']
  },
  {
    keys: ['matt', 'matthew'],
    name: 'Matt Haskins',
    short: 'Matt Haskins is one of the Five Oaks founders and its careful strategist. He is controlled, protective, deeply loyal, and shaped by grief, guilt, and the spells that come from Clara’s death.',
    full: 'Matt Haskins is the planner and structural backbone of Five Oaks. He counts cost, reads danger, and carries grief from Clara’s death in a way that never truly leaves him. He is brother by choice to Krys, Jake, and Luke, and his bond with Krys is one of the deepest in the saga. Matt gives Krys away when she marries Jake. Later, Jennifer becomes one of the people who can anchor him during his spells. Matt is not cold; he is controlled because losing control has cost him too much.',
    facts: ['One of the Five Oaks founders.', 'Gave Krys away at her wedding to Jake.', 'Lost Clara.', 'Has spells.', 'Outlaw-era horse is Ledger.']
  },
  {
    keys: ['jake', 'jacob'],
    name: 'Jake Kincaid',
    short: 'Jake Kincaid is Krys’ husband, father of Kai and Wes, and one of the Five Oaks founders. He is quiet, dangerous when he has to be, and fiercely loyal to the family he helped build.',
    full: 'Jake Kincaid is one of the core men of Five Oaks. He marries Krys in the late 1880s and builds a life with her after surviving abuse and violence. Jake is not a man who talks more than he has to, but he loves hard, protects hard, and trusts Krys’ strength instead of trying to control it. His bonds with Matt and Luke are brotherhood by choice, and his marriage to Krys is one of the foundations of the saga.',
    facts: ['Marries Krys Callahan in the late 1880s.', 'Father of Kai and Wes.', 'One of the Five Oaks founders.', 'Outlaw-era horse is Grave.']
  },
  {
    keys: ['luke', 'lucas'],
    name: 'Luke Rawlins',
    short: 'Luke Rawlins is one of the Five Oaks founders, a charmer with a wounded past, and family by choice to Krys, Matt, and Jake.',
    full: 'Luke Rawlins carries humor and charm over old hurt. He left home young after violence and learned how to survive by reading people, distracting danger, and protecting anyone weaker than the men who once hurt him. Luke’s bond with Krys is sibling-deep because he accepts her as family and never treats her like Roger’s damaged daughter. He is brother by choice to Matt and Jake, husband to Emma, and father to Sami.',
    facts: ['One of the Five Oaks founders.', 'Husband of Emma.', 'Father of Sami.', 'Family by choice to Krys, Matt, and Jake.', 'Outlaw-era horse is Cinder.']
  },
  {
    keys: ['jace', 'jason'],
    name: 'Jace Callahan',
    short: 'Jace Callahan is Krys’ half brother through Roger, father of Eli, Cole, Sawyer, Dawson, Jennifer, and Caleb, and one of the Five Oaks founders.',
    full: 'Jace Callahan is pressure, pride, loyalty, and damage all tangled together. He is Roger Callahan’s son and Krys’ half brother, but their bond is complicated by what Roger did to both of them. Jace and Susanna Pike never marry, but they have six children together: Eli, Cole, Sawyer, Dawson, Jennifer, and Caleb. Jace is protective, stubborn, suspicious, and often difficult, but he is still part of the Five Oaks foundation.',
    facts: ['Krys’ half brother.', 'Susanna Pike remains Pike; she and Jace never marry.', 'Father of Eli, Cole, Sawyer, Dawson, Jennifer, and Caleb.', 'Rides Barney in the early books.']
  },
  {
    keys: ['sawyer'],
    name: 'Sawyer Callahan',
    short: 'Sawyer Callahan is one of Jace and Susanna’s twin sons. He and Dawson become central to the oil storyline.',
    full: 'Sawyer Callahan is ambitious, restless, and tied closely to his twin brother Dawson. The two boys grow from being family trouble into young men who want to take a serious risk by drilling for oil on the old Patterson place. Sawyer is often the one pushing the idea forward, but he and Dawson share the dream together.',
    facts: ['Twin brother of Dawson.', 'Son of Jace and Susanna.', 'Central to the oil book.']
  },
  {
    keys: ['dawson'],
    name: 'Dawson Callahan',
    short: 'Dawson Callahan is Sawyer’s twin brother and partner in the oil dream.',
    full: 'Dawson Callahan is one of Jace and Susanna’s twin sons. He shares Sawyer’s fascination with oil, drilling, reports, and the possibility of finding something valuable under Five Oaks land. Dawson is not just tagging along behind Sawyer; he studies costs, equipment, risk, and the practical side of the venture.',
    facts: ['Twin brother of Sawyer.', 'Son of Jace and Susanna.', 'Studies the practical side of the oil venture.']
  },
  {
    keys: ['cole'],
    name: 'Cole Callahan',
    short: 'Cole Callahan is Jace and Susanna’s son and Tate’s love interest in Book 17.',
    full: 'Cole Callahan is one of Jace and Susanna’s sons. His relationship with Tate becomes central in Book 17. Cole struggles with what he feels, what he has been taught, and what loving Tate could cost them both. His arc is about fear, courage, family, secrecy, and whether he can claim the truth of who he loves.',
    facts: ['Son of Jace and Susanna.', 'Falls in love with Tate.', 'Book 17 focus.']
  },
  {
    keys: ['tate'],
    name: 'Tate',
    short: 'Tate is Cole’s love interest in Book 17, a hired hand from Kansas whose relationship with Cole changes both their lives.',
    full: 'Tate comes from Pleasant Hill, Kansas, near Fort Ashborough. He becomes a hired hand at Five Oaks and falls in love with Cole Callahan. Tate understands secrecy and risk, but he also wants something real. His relationship with Cole forces both men to face fear, family, and what kind of life they can build honestly.',
    facts: ['From Pleasant Hill, Kansas.', 'Connected to Fort Ashborough.', 'Falls in love with Cole.']
  },
  {
    keys: ['jennifer'],
    name: 'Jennifer Callahan',
    short: 'Jennifer Callahan is Jace and Susanna’s daughter, deeply important to Matt, and Waya’s future wife.',
    full: 'Jennifer Callahan is one of Jace and Susanna’s children and becomes especially important in the later Five Oaks books. She has a powerful bond with Matt and becomes one of his anchors during his spells. Her relationship with Waya brings Waya and Tsula into Five Oaks and tests whether the family will stand behind the people they claim as their own.',
    facts: ['Daughter of Jace and Susanna.', 'Important anchor for Matt.', 'Marries Waya Redhawk.']
  },
  {
    keys: ['waya'],
    name: 'Waya Redhawk',
    short: 'Waya Redhawk becomes Jennifer’s husband and brings Tsula into Five Oaks.',
    full: 'Waya Redhawk is tied to Jennifer’s story and becomes part of Five Oaks through love, loyalty, and family. His marriage to Jennifer forces the town and the family to decide whether their values mean something when tested. He brings Tsula with him, and by the end of Jennifer and Waya’s book, Five Oaks stands for them.',
    facts: ['Marries Jennifer Callahan.', 'Father/family connection to Tsula.', 'Moves into Five Oaks with Tsula by the end of Jennifer and Waya’s book.']
  },
  {
    keys: ['bekka'],
    name: 'Bekka',
    short: 'Bekka is a woman connected to the saloon and to Luke Rawlins’s life before he chose Emma. She cared for Luke, believed he might take her away from that life, and resented Emma because Luke chose a respectable future with her instead.',
    full: 'Bekka is part of Luke Rawlins’s past in Built for More. She works at the saloon and shared a relationship with Luke before he committed himself to Emma. Bekka believed Luke might someday take her away and build a life with her. When Luke chose Emma, Bekka saw that choice as proof that he wanted respectability more than he wanted her. She confronted Emma and warned that Luke might return to the saloon if Emma or her family made him feel he did not belong. Bekka is not merely jealous; she is a woman who believed Luke represented her best chance to escape and was deeply wounded when he walked away.',
    facts: ['Appears in Built for More.', 'Connected to Luke before his marriage to Emma.', 'Works at the saloon.', 'Confronts Emma after Luke chooses her.']
  }
];

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function requestedSubject(question = '') {
  return normalize(
    String(question)
      .replace(/^(who|what)\s+(is|was|are|were)\s+/i, '')
      .replace(/^tell me (everything )?about\s+/i, '')
      .replace(/^show me\s+/i, '')
      .replace(/[?!.]+$/g, '')
  );
}

function nameAliases(name = '') {
  const aliases = new Set();
  const normalizedName = normalize(name);
  if (normalizedName) aliases.add(normalizedName);

  const first = normalizedName.split(' ')[0];
  if (first) aliases.add(first);

  for (const match of String(name).matchAll(/[“‘"']([^”’"']+)[”’"']/g)) {
    const nickname = normalize(match[1]);
    if (nickname) aliases.add(nickname);
  }

  return aliases;
}

function findIndexedCharacter(subject) {
  if (!subject) return null;
  const matches = [];

  for (const source of knowledgeIndex) {
    if (source.type !== 'characters') continue;
    for (const section of source.sections || []) {
      if (nameAliases(section.name).has(subject)) matches.push(section);
    }
  }

  if (!matches.length) return null;

  const uniqueByText = [...new Map(matches.map((item) => [item.text, item])).values()];
  if (uniqueByText.length !== 1) return null;

  const match = uniqueByText[0];
  return {
    keys: [subject],
    name: match.name,
    short: match.text,
    full: match.text,
    facts: [],
  };
}

export function findCharacterKnowledge(question) {
  const subject = requestedSubject(question);
  if (!subject) return null;

  const indexed = findIndexedCharacter(subject);
  if (indexed) return indexed;

  return characterKnowledge.find((item) => item.keys.some((key) => normalize(key) === subject)) || null;
}
