import { relationships } from './relationshipData.js';

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
  ])
};

export function findRelationshipEdge(firstKey, secondKey) {
  return relationshipGraph.edges.find((edge) => (edge.source === firstKey && edge.target === secondKey) || (edge.source === secondKey && edge.target === firstKey));
}

export function findSubjectConnections(subjectKeys) {
  const keySet = new Set(subjectKeys);
  return relationshipGraph.edges.filter((edge) => keySet.has(edge.source) || keySet.has(edge.target));
}

export function getRelationshipNeighbors(subjectKey) {
  return relationshipGraph.edges
    .filter((edge) => edge.source === subjectKey || edge.target === subjectKey)
    .map((edge) => ({
      ...edge,
      otherKey: edge.source === subjectKey ? edge.target : edge.source
    }));
}
