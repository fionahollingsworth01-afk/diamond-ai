export const eventKnowledge = [
  {
    keys: ['where did jennifer and waya marry', 'where were jennifer and waya married', 'jennifer and waya wedding location', 'waya and jennifer wedding location', 'where did they marry'],
    title: 'Jennifer and Waya wedding location',
    short: 'Jennifer and Waya were married at the Cherokee settlement.',
    full: 'Jennifer Callahan and Waya Red Hawk were married at the Cherokee settlement, surrounded by Waya’s family and community.'
  },
  {
    keys: ['who married jennifer and waya', 'who performed jennifer and waya wedding', 'who officiated jennifer and waya wedding', 'who married them'],
    title: 'Jennifer and Waya wedding officiants',
    short: 'A Cherokee shaman and a pastor married Jennifer and Waya at the settlement.',
    full: 'Jennifer and Waya were married at the Cherokee settlement by a Cherokee shaman and a pastor. Elder Kai did not marry them; he was Kai’s grandfather and was already deceased.'
  },
  {
    keys: ['conrad arc', 'conrad temptation', 'temptation arc', 'almost kiss', 'krys and conrad'],
    title: 'Conrad temptation arc',
    short: 'The Conrad arc tests Krys, Jake, and Matt emotionally. Conrad tempts Krys with attention and an easier polished life, but the real point of the arc is what that pressure reveals about Krys’ marriage, Jake’s pain, and Matt’s dependence on both of them staying whole.',
    full: 'The Conrad temptation arc is not about Conrad being a traditional villain. It is about pressure. Conrad offers Krys attention, polish, money, and the possibility of an easier life while Jake is emotionally vulnerable and Matt is already carrying too much. The almost-kiss matters because it exposes the crack before it becomes a break. Krys has to choose who she is and what she built. Jake has to face the fear of losing her. Matt breaks because Krys and Jake are the center of his world, and Conrad threatens both at once.'
  },
  {
    keys: ['oil', 'oil venture', 'drill', 'drilling', 'patterson place', 'patterson land'],
    title: 'Sawyer and Dawson oil venture',
    short: 'Sawyer and Dawson want to drill for oil on the old Patterson place. The conflict is not just about oil; it is about whether Five Oaks trusts the next generation enough to risk money, land, and pride on their dream.',
    full: 'The oil venture begins with Sawyer and Dawson asking the founders for permission and backing to drill on the old Patterson place. Jace is against it, Jake is reluctant because he bought the land to use later, Matt worries about the money, Krys sees no reason to let unused land sit empty, and Luke is willing to hear the boys out. Waya’s knowledge helps them, Cole supports the idea, and Tate surprises the room with practical insight. The scene matters because it marks Sawyer and Dawson stepping out of boyhood trouble and asking to be taken seriously as men with a plan.'
  },
  {
    keys: ['whisper', 'eli kills whisper', 'shooting whisper', 'krys shot', 'eli book'],
    title: 'Whisper confrontation',
    short: 'The Whisper confrontation is one of Eli’s defining moments. Krys is shot after shoving Eli aside, Matt holds her, and Eli kills Whisper.',
    full: 'The Whisper confrontation changes Eli and the family. Krys shoves Eli out of danger and is shot. Matt holds her through the aftermath, and Eli kills Whisper. The event leaves Eli with guilt, fear, and the burden of what he had to do, even though Krys survives. It also deepens the way Krys becomes part of Eli’s healing because she understands violence, guilt, survival, and family without turning away from him.'
  },
  {
    keys: ['krys wedding', 'jake wedding', 'jake and krys wedding', 'gave krys away'],
    title: 'Jake and Krys wedding',
    short: 'Jake and Krys marry in the late 1880s, and Matt gives Krys away. The wedding matters because it shows that Krys’ chosen family is the family that stands with her.',
    full: 'Jake and Krys’ wedding is one of the clearest signs that Five Oaks is a chosen family before it is anything else. Matt gives Krys away, not because he is her father, but because he is her brother by choice and one of the safest people in her life. The wedding binds Jake and Krys as husband and wife, but it also shows the larger family structure around them: Matt standing for Krys, Luke and the others standing close, and Five Oaks becoming permanent.'
  },
  {
    keys: ['cole and tate', 'cole tate', 'barn kiss', 'creek meeting', 'book 17'],
    title: 'Cole and Tate love story',
    short: 'Cole and Tate’s love story is hidden, risky, and life-changing. It forces Cole to face what he feels and what he fears, while Tate has to decide whether love is worth the danger of being known.',
    full: 'Cole and Tate’s story begins with attraction, fear, secrecy, and careful testing of each other. Cole is fighting what he has been taught and what loving Tate could cost him. Tate understands the danger, but he also sees Cole clearly and wants something real with him. Their meetings at the saloon, the creek, and the barn build a relationship that is tender and dangerous at the same time. Their arc is about courage, shame, truth, and whether Five Oaks can make room for them as family.'
  },
  {
    keys: ['jennifer and waya', 'waya and jennifer', 'tsula', 'redhawk'],
    title: 'Jennifer and Waya arc',
    short: 'Jennifer and Waya’s relationship brings Waya and Tsula into Five Oaks and tests whether the family will defend them when the town does not.',
    full: 'Jennifer and Waya’s arc is about love, acceptance, and whether Five Oaks means what it claims to mean. Waya marries Jennifer and brings Tsula with him. By the end of their book, Waya and Tsula move to Five Oaks, and the family stands for them. The arc also shows the growth of Jace, Sawyer, Dawson, and the rest of the family as they accept Tate, Waya, Jennifer’s choices, and the broader meaning of family.'
  },
  {
    keys: ['matt spells', 'matt spell', 'matt episode', 'matt episodes'],
    title: 'Matt’s spells',
    short: 'Matt’s spells are tied to grief, control, trauma, and Clara’s death. They show how much pain Matt carries under all that planning and restraint.',
    full: 'Matt’s spells are not weakness. They are the place where the control he uses to survive finally breaks under the weight of grief, fear, and old trauma. Clara’s death is the wound that never really leaves him, and later crises can pull him back into that loss. Krys, Jake, Luke, and later Jennifer matter so much because they are among the few people who can reach him when that pain closes over him.'
  }
];

export function findEventKnowledge(question) {
  const text = question.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ');
  return eventKnowledge.find((item) => item.keys.some((key) => text.includes(key)));
}
