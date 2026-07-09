import { relationships } from './relationshipData.js';

const groupProfiles = [
  {
    people: ['jake', 'krys', 'matt'],
    direct: 'Jake and Krys are husband and wife, Jake and Matt are brothers by choice, and Krys and Matt are brother and sister by choice. Together, they form one of the strongest foundations of Five Oaks: Jake protects what they built, Matt gives it structure, and Krys gives both men the home and family they had been missing.',
    expanded: 'Jake, Krys, and Matt are tied together by marriage, chosen family, survival, and decades of trust. Jake and Krys build a life as husband and wife. Jake and Matt carry the bond of brothers who survived the worst years together. Krys and Matt chose each other as family long before Five Oaks became secure. As a group, they work because each brings something different: Jake brings protection and finality, Matt brings planning and control, and Krys brings loyalty, judgment, and the emotional center that turns survival into family.'
  },
  {
    people: ['jennifer', 'waya', 'tsula'],
    direct: 'Jennifer and Waya become husband and wife, Waya is Tsula’s father, and Jennifer accepts Tsula as part of the life they build together. Their family becomes part of Five Oaks as a whole, not in pieces.',
    expanded: 'Jennifer, Waya, and Tsula form a family together. Jennifer’s love for Waya includes his daughter, and Five Oaks’ acceptance of their marriage must also include Tsula. Their bond matters because it tests whether the family will live by its own promises: Waya cannot be welcomed while Tsula is treated as separate, and Jennifer will not build a life that asks either of them to stand outside it.'
  },
  {
    people: ['cole', 'tate', 'krys'],
    direct: 'Cole and Tate fall in love, and Krys becomes one of the first people to understand what is happening and treat their bond with care rather than disgust.',
    expanded: 'Cole and Tate’s relationship begins under secrecy and fear, while Krys becomes an important bridge between their private truth and the family around them. She recognizes what Cole is trying to understand about himself and does not reduce either man to shame. Her role in their story matters because acceptance begins with someone seeing clearly and refusing to turn love into a weapon.'
  }
];

export const relationshipGraph = {
  nodes: [
    { key: 'jake', displayName: 'Jake Kincaid', family: 'Kincaid', aliases: ['jacob', 'jacob weston kincaid'] },
    { key: 'krys', displayName: 'Krys Callahan', family: 'Callahan / Kincaid', aliases: ['krysten', 'krysten irene callahan'] },
    { key: 'matt', displayName: 'Matt Haskins', family: 'Five Oaks', aliases: ['matthew', 'matthew alan haskins'] },
    { key: 'luke', displayName: 'Luke Rawlins', family: 'Rawlins', aliases: ['lucas', 'lucas paul rawlins'] },
    { key: 'jace', displayName: 'Jace Callahan', family: 'Callahan', aliases: ['jason', 'jason michael callahan'] },
    { key: 'jennifer', displayName: 'Jennifer Callahan', family: 'Callahan / Redhawk', aliases: ['jennifer redhawk'] },
    { key: 'waya', displayName: 'Waya Redhawk', family: 'Redhawk', aliases: ['waya'] },
    { key: 'tsula', displayName: 'Tsula Redhawk', family: 'Redhawk', aliases: ['tsula'] },
    { key: 'eli', displayName: 'Eli Callahan', family: 'Callahan', aliases: ['eli'] },
    { key: 'cole', displayName: 'Cole Callahan', family: 'Callahan', aliases: ['cole'] },
    { key: 'tate', displayName: 'Tate', family: 'Five Oaks', aliases: ['tate'] },
    { key: 'sawyer', displayName: 'Sawyer Callahan', family: 'Callahan', aliases: ['sawyer'] },
    { key: 'dawson', displayName: 'Dawson Callahan', family: 'Callahan', aliases: ['dawson'] },
    { key: 'kai', displayName: 'Kai Kincaid', family: 'Kincaid', aliases: ['kai weston kincaid'] },
    { key: 'paloma', displayName: 'Paloma Echevarría', family: 'Echevarría / Kincaid', aliases: ['paloma', 'paloma echevarria'] },
    { key: 'wes', displayName: 'Wes Kincaid', family: 'Kincaid', aliases: ['wesley', 'wesley kincaid'] },
    { key: 'sami', displayName: 'Sami Rawlins', family: 'Rawlins / Kincaid', aliases: ['sammy', 'samantha', 'samantha rawlins'] }
  ],
  edges: relationships.map((relationship) => ({
    source: relationship.people[0],
    target: relationship.people[1],
    title: relationship.title,
    direct: relationship.direct,
    summary: relationship.summary
  })).concat([
    {
      source: 'waya',
      target: 'tsula',
      title: 'Waya Redhawk and Tsula Redhawk',
      direct: 'Waya is Tsula’s father. When Waya marries Jennifer, Tsula becomes part of the Five Oaks family too.',
      summary: 'Waya and Tsula are father and daughter. Tsula matters because Jennifer’s marriage to Waya does not bring only a husband into Five Oaks; it brings a child who also needs protection, acceptance, and a real place in the family.'
    },
    {
      source: 'jennifer',
      target: 'tsula',
      title: 'Jennifer Callahan and Tsula Redhawk',
      direct: 'Jennifer accepts Tsula as part of the life she builds with Waya.',
      summary: 'Jennifer’s love for Waya includes Tsula. By the end of Jennifer and Waya’s book, Five Oaks must make room for both of them, and that acceptance is part of the emotional point of the story.'
    }
  ]),
  groups: groupProfiles
};

function samePeople(first, second) {
  if (first.length !== second.length) return false;
  const firstSet = new Set(first);
  return second.every((person) => firstSet.has(person));
}

export function findRelationshipEdge(firstKey, secondKey) {
  return relationshipGraph.edges.find((edge) => (edge.source === firstKey && edge.target === secondKey) || (edge.source === secondKey && edge.target === firstKey));
}

export function findRelationshipGroup(subjectKeys) {
  return relationshipGraph.groups.find((group) => samePeople(group.people, subjectKeys));
}

export function findSubjectConnections(subjectKeys, requireBothSubjects = false) {
  const keySet = new Set(subjectKeys);
  return relationshipGraph.edges.filter((edge) => {
    if (requireBothSubjects) return keySet.has(edge.source) && keySet.has(edge.target);
    return keySet.has(edge.source) || keySet.has(edge.target);
  });
}

export function getRelationshipNeighbors(subjectKey) {
  return relationshipGraph.edges
    .filter((edge) => edge.source === subjectKey || edge.target === subjectKey)
    .map((edge) => ({
      ...edge,
      otherKey: edge.source === subjectKey ? edge.target : edge.source
    }));
}

export function findRelationshipPath(startKey, endKey) {
  if (startKey === endKey) return [startKey];

  const queue = [[startKey]];
  const visited = new Set([startKey]);

  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];

    for (const neighbor of getRelationshipNeighbors(current)) {
      if (visited.has(neighbor.otherKey)) continue;
      const nextPath = [...path, neighbor.otherKey];
      if (neighbor.otherKey === endKey) return nextPath;
      visited.add(neighbor.otherKey);
      queue.push(nextPath);
    }
  }

  return null;
}
