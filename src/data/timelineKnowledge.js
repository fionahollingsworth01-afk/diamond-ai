export const timelineKnowledge = [
  {
    keys: ['1881', 'before they were brothers', 'johnson farm', 'barn loft'],
    title: '1881 - Before They Were Brothers opening era',
    short: 'In 1881, Krys is seventeen, Jace is twenty, and the early Callahan/Five Oaks foundation is still being formed around the Johnson farm and the barn loft.',
    full: 'The 1881 era is where the pre-Five Oaks foundation begins. Krys is seventeen and returns from finishing school. Jace is twenty and pushed into the tack-room life because of Roger. Rance is fifteen, Royce is thirteen, and Rhys is eleven. This era is important because it shows the family damage before the chosen family fully forms and before Five Oaks becomes a place of safety.'
  },
  {
    keys: ['1884', '1885', 'bank robbery', 'brothers by the gun', 'freight jobs'],
    title: '1884-1885 - Outlaw era and bank robbery',
    short: 'The 1884-1885 era covers the outlaw work, the bank robbery, Luke’s knife wound, and Krys proving she belongs in the core crew.',
    full: 'The 1884-1885 era centers on Brothers by the Gun, the bank robbery, freight jobs, and the dangerous years before Five Oaks settles into ranch life. Krys works at the bank and helps open the escape route. Luke is injured by a knife wound, not a bullet. Matt plans, Jake acts from outside, and Jace is absent from the bank job. This era proves the core bond between Krys, Jake, Matt, Luke, and Jace.'
  },
  {
    keys: ['1887', '1888', 'roger visit', 'roger month', 'kai naming', 'krys naming kai'],
    title: '1887-1888 - Roger’s visit and Kai’s naming',
    short: 'The 1887-1888 era includes Roger’s month at the ranch, his cruelty toward Rhys, and Krys receiving permission to name her son Kai.',
    full: 'In 1887-1888, Roger’s month at the ranch exposes everything he hates about Five Oaks: equal shares, communal meals, Krys touching Matt in Jake’s presence, Luke and Emma cooking, and the family structure that does not answer to him. Roger slaps Rhys, and Jace later intervenes. This era also includes Krys meeting the traveling Indian Kai and receiving permission to name her son Kai, a choice Jake resists at first but later accepts.'
  },
  {
    keys: ['1916', 'eli return', 'whisper', 'redstone', 'manchester', 'cedar gap'],
    title: '1916 - Eli’s return and Whisper',
    short: 'In 1916, Eli returns toward Five Oaks while Whisper hunts for him, leading toward Krys being shot and Eli killing Whisper.',
    full: 'The 1916 arc follows Eli after his time with Whisper and Ironjaw. He travels through Manchester, Redstone, Cedar Gap, and Red Willow Crossing while trying to protect his family from Whisper. Eli watches Five Oaks from the ridge before stepping back into the family. The arc builds toward the confrontation where Krys shoves Eli aside and is shot, Matt catches her, and Eli kills Whisper.'
  },
  {
    keys: ['book 17', 'cole book', 'what stays buried', 'cole and tate'],
    title: 'Book 17 - Cole and Tate',
    short: 'Book 17 centers on Cole and Tate’s hidden relationship and Jace learning to accept his son.',
    full: 'Book 17, What Stays Buried, centers on Cole Callahan and Tate. Their relationship is quiet, risky, and emotionally dangerous because the world around them can punish what they feel. Jace struggles with confusion, anger, and fear, while Susanna moves toward protection first. By the end of the larger Jennifer/Waya continuity, Jace has accepted Tate, and Sawyer and Dawson speak to Tate normally as family.'
  },
  {
    keys: ['sawyer and dawson book', 'oil book', 'after waya', 'next book'],
    title: 'Sawyer and Dawson oil book',
    short: 'Sawyer and Dawson’s book follows their effort to drill for oil on the old Patterson place and prove they are ready to be taken seriously.',
    full: 'Sawyer and Dawson’s book comes after the family has grown through Jennifer and Waya’s story. Their oil dream is more than a business idea. It is a test of whether the founders can trust the next generation, whether the twins can move beyond being seen as trouble, and whether Five Oaks can risk twelve thousand dollars and the old Patterson place on something that may fail.'
  }
];

export function findTimelineKnowledge(question) {
  const text = question.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ');
  return timelineKnowledge.find((item) => item.keys.some((key) => text.includes(key)));
}
