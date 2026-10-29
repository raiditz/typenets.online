/* Race passages: 2 to 3 lines from public-domain novels and books.
   Multiplayer races always use one of these; players cannot change or choose the text.
   Typographic dashes and curly quotes are replaced with plain keyboard characters so every passage can be typed on any layout.
   A room stores only the passage NUMBER, so keep the order of this list stable: append new passages at the end. */
window.TP_PASSAGES = [
  {
    book: "Pride and Prejudice",
    author: "Jane Austen",
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.",
  },
  {
    book: "Moby-Dick",
    author: "Herman Melville",
    text: "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
  },
  {
    book: "A Tale of Two Cities",
    author: "Charles Dickens",
    text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness.",
  },
  {
    book: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    text: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.",
  },
  {
    book: "Great Expectations",
    author: "Charles Dickens",
    text: "My father's family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip. So, I called myself Pip, and came to be called Pip.",
  },
  {
    book: "Frankenstein",
    author: "Mary Shelley",
    text: "It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet.",
  },
  {
    book: "A Scandal in Bohemia",
    author: "Arthur Conan Doyle",
    text: "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex.",
  },
  {
    book: "Adventures of Huckleberry Finn",
    author: "Mark Twain",
    text: "You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter. That book was made by Mr. Mark Twain, and he told the truth, mainly.",
  },
  {
    book: "Treasure Island",
    author: "Robert Louis Stevenson",
    text: "Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island.",
  },
  {
    book: "Peter Pan",
    author: "J. M. Barrie",
    text: "All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this. One day when she was two years old she was playing in a garden, and she plucked another flower and ran with it to her mother.",
  },
  {
    book: "The Wonderful Wizard of Oz",
    author: "L. Frank Baum",
    text: "Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer's wife. Their house was small, for the lumber to build it had to be carried by wagon many miles.",
  },
  {
    book: "The Time Machine",
    author: "H. G. Wells",
    text: "The Time Traveller, for so it will be convenient to speak of him, was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.",
  },
  {
    book: "A Christmas Carol",
    author: "Charles Dickens",
    text: "Marley was dead: to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner.",
  },
  {
    book: "Walden",
    author: "Henry David Thoreau",
    text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.",
  },
  {
    book: "Emma",
    author: "Jane Austen",
    text: "Emma Woodhouse, handsome, clever, and rich, with a comfortable home and happy disposition, seemed to unite some of the best blessings of existence; and had lived nearly twenty-one years in the world with very little to distress or vex her.",
  },
  {
    book: "Anne of Green Gables",
    author: "L. M. Montgomery",
    text: "Mrs. Rachel Lynde lived just where the Avonlea main road dipped down into a little hollow, fringed with alders and ladies' eardrops and traversed by a brook that had its source away back in the woods of the old Cuthbert place.",
  },
  /* ---- appended passages (keep these at the end so saved room numbers stay valid) ---- */
  {
    book: "Jane Eyre",
    author: "Charlotte Bronte",
    text: "There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further out-door exercise was now out of the question.",
  },
  {
    book: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    text: 'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since. "Whenever you feel like criticizing anyone," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."',
  },
  {
    book: "Wuthering Heights",
    author: "Emily Bronte",
    text: "1801. I have just returned from a visit to my landlord, the solitary neighbour that I shall be troubled with. This is certainly a beautiful country! In all England, I do not believe that I could have fixed on a situation so completely removed from the stir of society.",
  },
  {
    book: "Little Women",
    author: "Louisa May Alcott",
    text: '"Christmas won\'t be Christmas without any presents," grumbled Jo, lying on the rug. "It\'s so dreadful to be poor!" sighed Meg, looking down at her old dress. "I don\'t think it\'s fair for some girls to have plenty of pretty things, and other girls nothing at all," added little Amy, with an injured sniff.',
  },
  {
    book: "Hamlet",
    author: "William Shakespeare",
    text: "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles and by opposing end them? To die, to sleep; no more.",
  },
  {
    book: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    text: "The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.",
  },
  {
    book: "The Metamorphosis",
    author: "Franz Kafka",
    text: "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections.",
  },
  {
    book: "The Call of the Wild",
    author: "Jack London",
    text: "Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, but for every tide-water dog, strong of muscle and with warm, long hair, from Puget Sound to San Diego.",
  },
  {
    book: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    text: "I had called upon my friend, Mr. Sherlock Holmes, one day in the autumn of last year and found him in deep conversation with a very stout, florid-faced, elderly gentleman with fiery red hair. With an apology for my intrusion, I was about to withdraw when Holmes pulled me abruptly into the room.",
  },
  {
    book: "Robinson Crusoe",
    author: "Daniel Defoe",
    text: "I was born in the year 1632, in the city of York, of a good family, though not of that country, my father being a foreigner of Bremen, who settled first at Hull. He got a good estate by merchandise, and leaving off his trade, lived afterwards at York.",
  },
  {
    book: "The Secret Garden",
    author: "Frances Hodgson Burnett",
    text: "When Mary Lennox was sent to Misselthwaite Manor to live with her uncle everybody said she was the most disagreeable-looking child ever seen. It was true, too. She had a little thin face and a little thin body, thin light hair and a sour expression.",
  },
  {
    book: "Sense and Sensibility",
    author: "Jane Austen",
    text: "The family of Dashwood had long been settled in Sussex. Their estate was large, and their residence was at Norland Park, in the centre of their property, where, for many generations, they had lived in so respectable a manner as to engage the general good opinion of their surrounding acquaintance.",
  },
  {
    book: "Through the Looking-Glass",
    author: "Lewis Carroll",
    text: "One thing was certain, that the white kitten had had nothing to do with it: it was the black kitten's fault entirely. For the white kitten had been having its face washed by the old cat for the last quarter of an hour, and bearing it pretty well, considering.",
  },
  {
    book: "The Strange Case of Dr Jekyll and Mr Hyde",
    author: "Robert Louis Stevenson",
    text: "Mr. Utterson the lawyer was a man of a rugged countenance that was never lighted by a smile; cold, scanty and embarrassed in discourse; backward in sentiment; lean, long, dusty, dreary and yet somehow lovable.",
  },
  {
    book: "The Wind in the Willows",
    author: "Kenneth Grahame",
    text: "The Mole had been working very hard all the morning, spring-cleaning his little home. First with brooms, then with dusters; then on ladders and steps and chairs, with a brush and a pail of whitewash; till he had dust in his throat and eyes, and splashes of whitewash all over his black fur.",
  },
  {
    book: "Middlemarch",
    author: "George Eliot",
    text: "Miss Brooke had that kind of beauty which seems to be thrown into relief by poor dress. Her hand and wrist were so finely formed that she could wear sleeves not less bare of style than those in which the Blessed Virgin appeared to Italian painters.",
  },
  {
    book: "The Adventures of Tom Sawyer",
    author: "Mark Twain",
    text: '"Tom!" No answer. "Tom!" No answer. "What\'s gone with that boy, I wonder? You TOM!" No answer. The old lady pulled her spectacles down and looked over them about the room; then she put them up and looked out under them.',
  },
  {
    book: "Pride and Prejudice",
    author: "Jane Austen",
    text: '"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?" Mr. Bennet replied that he had not. "But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."',
  },
  {
    book: "Gulliver's Travels",
    author: "Jonathan Swift",
    text: "My father had a small estate in Nottinghamshire; I was the third of five sons. He sent me to Emmanuel College in Cambridge at fourteen years old, where I resided three years, and applied myself close to my studies.",
  },
  {
    book: "Heart of Darkness",
    author: "Joseph Conrad",
    text: "The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest. The flood had made, the wind was nearly calm, and being bound down the river, the only thing for it was to come to and wait for the turn of the tide.",
  },
];

/* Picks passage numbers for the solo test and for new multiplayer rooms.
   Recently used passages (per browser, per scope) are skipped, so the text is different every time. */
window.TP_nextPassages = function (scope, n) {
  const all = window.TP_PASSAGES || [],
    key = "typepilotRecentPassages",
    keep = Math.max(1, Math.min(all.length - 1, 12));
  let store = {};
  try {
    store = JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch (_) {
    store = {};
  }
  let recent = Array.isArray(store[scope])
    ? store[scope].filter((i) => i < all.length)
    : [];
  const out = [];
  for (let k = 0; k < n; k++) {
    let pool = all
      .map((_, i) => i)
      .filter((i) => !recent.includes(i) && !out.includes(i));
    if (!pool.length) {
      recent = recent.slice(-Math.floor(keep / 2));
      pool = all
        .map((_, i) => i)
        .filter((i) => !recent.includes(i) && !out.includes(i));
    }
    if (!pool.length)
      pool = all.map((_, i) => i).filter((i) => !out.includes(i));
    if (!pool.length) pool = all.map((_, i) => i);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    out.push(pick);
    recent.push(pick);
    if (recent.length > keep) recent.shift();
  }
  store[scope] = recent;
  try {
    localStorage.setItem(key, JSON.stringify(store));
  } catch (_) {}
  return out;
};
