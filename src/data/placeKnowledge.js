export const placeKnowledge = [
  {
    keys: ['five oaks', 'ranch', 'main house', 'main cabin'],
    title: 'Five Oaks',
    short: 'Five Oaks is the ranch and chosen-family center of the saga, built by Krys, Jake, Matt, Luke, and Jace.',
    full: 'Five Oaks is more than land. It is the place Krys, Jake, Matt, Luke, and Jace build into a home, a business, and a chosen family. The main house is where decisions are fought over, meals are shared, children grow up, and the founders keep proving that family is something they choose and protect. Five Oaks becomes the emotional and practical center of the saga.'
  },
  {
    keys: ['red willow crossing', 'town'],
    title: 'Red Willow Crossing',
    short: 'Red Willow Crossing is the town tied to Five Oaks, often useful, often judgmental, and sometimes a test of whether the family will stand together.',
    full: 'Red Willow Crossing is the nearby town where Five Oaks does business, faces gossip, makes alliances, and runs into trouble. The town matters because it shows the difference between public acceptance and real family loyalty. When the town pushes against people Five Oaks claims as its own, the family has to decide whether their loyalty is quiet or visible.'
  },
  {
    keys: ['patterson place', 'old patterson place', 'patterson land', 'patterson brothers'],
    title: 'Old Patterson Place',
    short: 'The old Patterson place is land Five Oaks bought from the Patterson brothers. It later becomes the center of Sawyer and Dawson’s oil dream.',
    full: 'The old Patterson place is land Jake bought from the Patterson brothers because they needed help and Five Oaks could use the place once it was cleaned up. It has a farmhouse, barns, chicken houses, orchard, pasture, and land that could later be made useful again. By Sawyer and Dawson’s oil storyline, the land is partly cleaned but not fully useful, which gives the boys room to argue that drilling there is worth the risk.'
  },
  {
    keys: ['dry creek'],
    title: 'Dry Creek',
    short: 'Dry Creek is a nearby cattle-trading area about twenty miles from Red Willow Crossing.',
    full: 'Dry Creek is one of the nearby places tied to cattle work and ranch business. It matters in the later books because characters travel there for deals, cattle, and work that pulls them outside the main Five Oaks setting.'
  },
  {
    keys: ['pleasant hill', 'pleasant hill kansas'],
    title: 'Pleasant Hill, Kansas',
    short: 'Pleasant Hill, Kansas is where Tate comes from.',
    full: 'Pleasant Hill, Kansas is Tate’s home area near Fort Ashborough. His background there helps explain why he understands farming, family pressure, and the danger of being unwelcome in the place that should have been home.'
  },
  {
    keys: ['fort ashborough'],
    title: 'Fort Ashborough',
    short: 'Fort Ashborough is the Kansas fort near Tate’s background and Pleasant Hill.',
    full: 'Fort Ashborough is connected to Tate’s Kansas background near Pleasant Hill. It helps place Tate geographically and gives Diamond a fixed reference for his early life before Five Oaks.'
  },
  {
    keys: ['clearfield'],
    title: 'Clearfield',
    short: 'Clearfield is connected to Muncy, who gives Tate a reference before he is hired at Five Oaks.',
    full: 'Clearfield is part of Tate’s pre-Five Oaks trail. Muncy from Clearfield serves as a reference, helping Tate get hired and placing him in the wider working world outside Five Oaks.'
  }
];

export function findPlaceKnowledge(question) {
  const text = question.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ');
  return placeKnowledge.find((item) => item.keys.some((key) => text.includes(key)));
}
