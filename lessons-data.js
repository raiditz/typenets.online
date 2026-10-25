/* TypePilot lessons: curriculum, finger map and text generators.
   34 lessons in 6 modules. Every lesson = guide -> 3 box exercises -> 2 interactive games.
   Edit the SPEC list below to change what is taught and in which order. */
window.TP_LESSONS = (() => {
  /* ---------- keyboard + finger map ---------- */
  const ROWS = [
    ["`1234567890-=", "num"],
    ["qwertyuiop[]\\", "top"],
    ["asdfghjkl;'", "home"],
    ["zxcvbnm,./", "bottom"],
  ];
  const FINGER_KEYS = {
    lp: "`1qaz",
    lr: "2wsx",
    lm: "3edc",
    li: "45rtfgvb",
    ri: "67yuhjnm",
    rm: "8ik,",
    rr: "9ol.",
    rp: "0p;/-=[]\\'",
    lt: " ",
    rt: " ",
  };
  const FINGER_NAME = {
    lp: "left pinky",
    lr: "left ring finger",
    lm: "left middle finger",
    li: "left index finger",
    ri: "right index finger",
    rm: "right middle finger",
    rr: "right ring finger",
    rp: "right pinky",
    lt: "left thumb",
    rt: "right thumb",
  };
  const FINGER_COLOR = {
    lp: "#ff647c",
    lr: "#ff922b",
    lm: "#ffd43b",
    li: "#a3e635",
    ri: "#a3e635",
    rm: "#ffd43b",
    rr: "#ff922b",
    rp: "#ff647c",
    lt: "#8792a5",
    rt: "#8792a5",
  };
  const HOME_OF = {
    lp: "A",
    lr: "S",
    lm: "D",
    li: "F",
    ri: "J",
    rm: "K",
    rr: "L",
    rp: ";",
  };
  const SHIFTED = {
    "!": "1",
    "@": "2",
    "#": "3",
    $: "4",
    "%": "5",
    "^": "6",
    "&": "7",
    "*": "8",
    "(": "9",
    ")": "0",
    _: "-",
    "+": "=",
    "{": "[",
    "}": "]",
    "|": "\\",
    ":": ";",
    '"': "'",
    "<": ",",
    ">": ".",
    "?": "/",
    "~": "`",
  };
  const fingerOf = (k) => {
    k = k.toLowerCase();
    if (k === " ") return "rt";
    for (const f in FINGER_KEYS)
      if (f !== "lt" && f !== "rt" && FINGER_KEYS[f].includes(k)) return f;
    return null;
  };
  const baseKey = (c) => (c === " " ? " " : SHIFTED[c] || c.toLowerCase());
  const needsShift = (c) =>
    c !== " " &&
    (!!SHIFTED[c] ||
      (c !== c.toLowerCase() && c.toLowerCase() !== c.toUpperCase()));
  const shiftSide = (c) => (fingerOf(baseKey(c))[0] === "l" ? "right" : "left"); // shift is pressed by the opposite hand
  const rowOf = (k) => {
    for (const [keys, name] of ROWS)
      if (keys.includes(k.toLowerCase())) return name;
    return "home";
  };

  /* ---------- word bank ---------- */
  const BASE_WORDS = (
    "ask asks add adds all alas dad dads fad fads fall falls flask flasks lad lads lass sad salad salads flak skald alfalfa " +
    "gas gag had has half hall hash glad glass flag flags gash slag slash dash lash sash gaffs shall shad hag gal gals jag jags hajj shag fag " +
    "life like side aid said field filed skid kid did lies file fled held heel flies slide glide ideal head heal seal sail fail gale hike hide hill his her she he " +
    "is it if in kiss lie lid lead leg led less sell self shed shelf shell sheikh seek seed sleek geek " +
    "run sun fun jump just duck dusk lurk hulk hurt hurl rush rug rust fur use used user sure sugar guide fruit rule rude jade " +
    "for from fire fair free fresh first sister father kerr ride rider rise rice rid red real read ready sir sit skirt shirt " +
    "work world word would wood wool will wish wise wide wife wild wind with wall walk was we well west what when while who why " +
    "old oil open or our out over one only other often hold hood hook hope horse house hour " +
    "quit quiz quick quiet quote queen quiet quilt pup pip pop pay play plan plate place point power paper park part past people pretty pull push put " +
    "to the that this there they them then these time top tree try true two take talk tall tell ten test text thing think three through today together toy " +
    "you your year yes yet young yard yell yellow yoga type ty typed " +
    "very van vest view voice visit vote five give have love move live over never ever even every " +
    "make many more most much must me my map man may mind mine miss mom month morning mouth " +
    "can come could cold call car cat cut care case catch cause chair child city clean clear close cloud coat code cool copy " +
    "six next fox box mix tax exit exam extra relax " +
    "zero zoo zone zip size lazy crazy dozen froze prize " +
    "bad back ball bank base be bed been before best better big bird bit black blue boat body book both boy bring brown build busy but buy by " +
    "name need new night no not now note number name nine none noon nose north " +
    "and any are about after again also always because between could every first found great group house large little long might never other place right round same school should small sound still such their these thought under until water where which while world write " +
    "brave crumb dumb bump number member number number monkey money moment " +
    "a an as at am go got good get girl give going green ground " +
    "bright light night sight right fight might flight " +
    "stone storm story street strong summer sunny support system table teach team thank thick thin thirty thousand " +
    "window winter wonder worth write wrong " +
    "quarter question quickly quietly equal " +
    "jelly jacket jungle journey joy joke job join judge juice july june " +
    "zebra zigzag zesty bronze blaze breeze freeze " +
    "happy hello help here high him his hand hard hat have heart heavy hill " +
    "water paper pencil people picture planet " +
    "knee keep key kind king kitchen knew know kick " +
    "ice idea if image inch into iron island issue item"
  )
    .split(/\s+/)
    .filter(Boolean);

  const WORDS = (() => {
    let extra = [];
    try {
      extra = (window.TM && TM.WORD_LIST) || [];
    } catch (_) {}
    return Array.from(
      new Set(
        BASE_WORDS.concat(extra)
          .map((w) => w.toLowerCase())
          .filter((w) => /^[a-z]+$/.test(w)),
      ),
    );
  })();

  /* ---------- helpers ---------- */
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const uniq = (s) => Array.from(new Set(Array.from(s))).join("");

  function groupText(newKeys, poolKeys, len, newShare) {
    const nk = Array.from(newKeys),
      pk = Array.from(poolKeys),
      out = [];
    let total = 0;
    while (total < len) {
      const size = 2 + rnd(3),
        g = [];
      for (let i = 0; i < size; i++)
        g.push(Math.random() < newShare ? pick(nk) : pick(pk));
      if (!g.some((c) => nk.includes(c))) g[rnd(size)] = pick(nk);
      const s = g.join("");
      out.push(s);
      total += s.length + 1;
    }
    return out.join(" ").slice(0, len).trim();
  }
  function wordsFor(letters, newKeys, count) {
    const set = new Set(Array.from(letters)),
      nk = Array.from(newKeys).filter((c) => /[a-z]/.test(c));
    let ok = WORDS.filter(
      (w) =>
        w.length >= 2 &&
        w.length <= 7 &&
        Array.from(w).every((c) => set.has(c)),
    );
    const withNew = ok.filter((w) => nk.some((c) => w.includes(c)));
    const base = withNew.length >= 5 ? withNew : ok;
    if (base.length < 5) return [];
    const out = [];
    const bag = shuffle(base);
    for (let i = 0; i < count; i++) out.push(bag[i % bag.length]);
    return out;
  }
  function pseudoWords(poolKeys, newKeys, count) {
    const pk = Array.from(poolKeys),
      nk = Array.from(newKeys),
      out = [];
    for (let i = 0; i < count; i++) {
      let w = "";
      const n = 3 + rnd(2);
      for (let j = 0; j < n; j++)
        w += Math.random() < 0.55 ? pick(nk) : pick(pk);
      out.push(w);
    }
    return out;
  }

  /* ---------- curriculum ---------- */
  const modules = [
    {
      id: 1,
      title: "Home Row",
      color: "#a3e635",
      blurb:
        "Where your fingers live. Start with the two bumps on F and J and grow outward.",
    },
    {
      id: 2,
      title: "Top Row",
      color: "#4dabf7",
      blurb: "Reach up from the home row and snap straight back.",
    },
    {
      id: 3,
      title: "Bottom Row",
      color: "#c084fc",
      blurb: "Curl your fingers down without letting your hands drift.",
    },
    {
      id: 4,
      title: "Capitals & Punctuation",
      color: "#ffd43b",
      blurb: "Shift, full sentences and the marks that make writing readable.",
    },
    {
      id: 5,
      title: "Numbers & Symbols",
      color: "#ff922b",
      blurb: "Stretch to the number row and master the shifted symbols.",
    },
    {
      id: 6,
      title: "Real-World Typing",
      color: "#ff647c",
      blurb: "Paragraphs, email, data entry, code and speed challenges.",
    },
  ];

  // Letter lessons: new keys are listed; the pool of earlier keys is added automatically.
  const L = (module, title, keys, tip, extra = {}) => ({
    module,
    title,
    keys,
    tip,
    ...extra,
  });
  // Text lessons: three hand-written exercises plus word/char banks for the games.
  const T = (module, title, keys, tip, ex, words, chars, extra = {}) => ({
    module,
    title,
    keys,
    tip,
    ex,
    words,
    chars,
    text: true,
    ...extra,
  });

  const SPEC = [
    /* Module 1 · Home row */
    L(
      1,
      "F and J",
      "fj",
      "Feel for the small bumps on F and J. They let you find home without looking.",
      {
        intro:
          "Welcome aboard! Place your index fingers on the bumps of F and J. Everything else grows from here.",
      },
    ),
    L(
      1,
      "D and K",
      "dk",
      "Middle fingers sit one key to the outside. Keep the index fingers anchored.",
    ),
    L(
      1,
      "S and L",
      "sl",
      "Ring fingers are the weakest at first. Go slowly and let them return to S and L each time.",
    ),
    L(
      1,
      "A and ;",
      "a;",
      "Pinkies rest on A and the semicolon. Keep them curved, never flat.",
    ),
    L(
      1,
      "G and H",
      "gh",
      "Index fingers reach sideways to the middle and snap straight back to F and J.",
    ),
    L(
      1,
      "The whole home row",
      "asdfghjkl;",
      "All eight fingers are home. Rest lightly and stay relaxed.",
      { review: true },
    ),
    /* Module 2 · Top row */
    L(
      2,
      "E and I",
      "ei",
      "Middle fingers reach up to E and I, then drop back to D and K.",
    ),
    L(
      2,
      "R and U",
      "ru",
      "Index fingers reach up and slightly inward. Return to F and J every time.",
    ),
    L(
      2,
      "W and O",
      "wo",
      "Ring fingers travel up to W and O. Move the finger, not the whole hand.",
    ),
    L(
      2,
      "Q and P",
      "qp",
      "Pinkies reach up to Q and P. Take your time, these are the longest reaches.",
    ),
    L(
      2,
      "T and Y",
      "ty",
      "Index fingers stretch across to T and Y, then return home.",
    ),
    L(
      2,
      "The whole top row",
      "qwertyuiop",
      "Reach up, tap, return. Your home row is the base camp.",
      { review: true },
    ),
    /* Module 3 · Bottom row */
    L(
      3,
      "V and M",
      "vm",
      "Index fingers curl down to V and M. Keep your wrists steady.",
    ),
    L(3, "C and comma", "c,", "Middle fingers curl down to C and the comma."),
    L(3, "X and period", "x.", "Ring fingers curl down to X and the period."),
    L(3, "Z and slash", "z/", "Pinkies curl down to Z and the slash."),
    L(3, "B and N", "bn", "Index fingers stretch inward to B and N."),
    L(
      3,
      "The whole bottom row",
      "zxcvbnm,./",
      "Curl down, tap, return home. Do not lift your palms.",
      { review: true },
    ),
    /* Module 4 · Capitals & punctuation */
    L(
      4,
      "Every letter",
      "abcdefghijklmnopqrstuvwxyz",
      "All 26 letters are yours now. Keep a steady rhythm between words.",
      { review: true, letterWords: true, wordsEx: true },
    ),
    T(
      4,
      "Shift and capitals",
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "Hold Shift with the pinky on the opposite hand, tap the letter, then release.",
      [
        "Fred Jill Kate Dan Sam Lena Omar",
        "Paris Rome Cairo Delhi Lima Oslo Kyiv",
        "Alice and Bob met Carol in Denver on Friday.",
      ],
      [
        "Mary",
        "Peter",
        "Sofia",
        "Daniel",
        "London",
        "Tokyo",
        "Monday",
        "Friday",
        "April",
        "March",
        "Anna",
        "Kevin",
        "Brazil",
        "Egypt",
      ],
      "ABCDEFGHJKLMNOPRSTW",
      { shift: true },
    ),
    T(
      4,
      "Full sentences",
      ".,",
      "Start with a capital, end with a period, and leave one space between words.",
      [
        "The sun is out. We can go now.",
        "She likes tea, and he likes milk.",
        "Keep your hands calm, your eyes up, and your pace steady.",
      ],
      [
        "today.",
        "later,",
        "again.",
        "maybe,",
        "ready.",
        "slowly,",
        "always.",
        "happy.",
        "quickly,",
        "finish.",
      ],
      ".,.,",
      { review: true },
    ),
    T(
      4,
      "Punctuation marks",
      "?!:;'\"",
      "Most marks are pinky keys. Shift + ; makes a colon, Shift + 1 makes an exclamation mark.",
      [
        "Why? Who? How? What? Where?",
        "Wow! Great! Nice! Hooray! Yes!",
        "She said, \"Hello!\" Don't worry; it's fine: really.",
      ],
      [
        '"hello"',
        "don't",
        "why?",
        "wow!",
        "it's",
        "yes;",
        "note:",
        '"stop"',
        "can't",
        "really?",
      ],
      "?!:;'\"",
    ),
    /* Module 5 · Numbers & symbols */
    T(
      5,
      "Numbers 1 to 5",
      "12345",
      "Left hand: pinky 1, ring 2, middle 3, index 4 and 5. Return to the home row after each reach.",
      [
        "1 2 3 4 5 5 4 3 2 1",
        "12 23 34 45 51 13 24 35",
        "3 cats, 4 dogs, 5 birds and 2 fish.",
      ],
      ["12", "345", "2345", "15", "24", "135", "4321", "5432", "1245", "321"],
      "12345",
    ),
    T(
      5,
      "Numbers 6 to 0",
      "67890",
      "Right hand: index 6 and 7, middle 8, ring 9, pinky 0.",
      [
        "6 7 8 9 0 0 9 8 7 6",
        "67 78 89 90 06 68 79 80",
        "7 apples, 8 pears, 9 plums and 10 figs.",
      ],
      ["67", "890", "6789", "70", "86", "968", "9876", "0987", "7890", "608"],
      "67890",
    ),
    T(
      5,
      "The full number row",
      "1234567890",
      "Eyes on the screen. Reach up with one finger and come straight back.",
      [
        "1234567890 0987654321",
        "2026 1999 3141 2718 4096 8080",
        "Room 405 is on floor 4, and room 1290 is on floor 12.",
      ],
      [
        "2026",
        "1984",
        "3.14",
        "4096",
        "1200",
        "7305",
        "6481",
        "9027",
        "5318",
        "1066",
      ],
      "1234567890",
      { review: true },
    ),
    T(
      5,
      "Shifted symbols",
      "!@#$%",
      "Hold Shift with the opposite pinky, then tap the number key.",
      [
        "! @ # $ % % $ # @ !",
        "!@ @# #$ $% %! !#",
        "Save 20% on 3 items for $45 #deal @shop!",
      ],
      [
        "!!",
        "@home",
        "#tag",
        "$50",
        "25%",
        "$9.99",
        "#1",
        "@me",
        "100%",
        "!#$",
      ],
      "!@#$%",
    ),
    T(
      5,
      "More symbols",
      "^&*()-_=+",
      "Right-hand symbols use the left Shift. Parentheses are Shift + 9 and Shift + 0.",
      [
        "^ & * ( ) ) ( * & ^",
        "- _ = + + = _ - (a) (b)",
        "Math: (3 + 4) * 2 = 14, and 10 - 6 = 4.",
      ],
      ["(a)", "(b+c)", "2*3", "x=5", "a-b", "a_b", "5+5", "(1)", "a&b", "x^2"],
      "^&*()-_=+",
      { review: true },
    ),
    T(
      5,
      "Brackets and code marks",
      "[]{}\\|<>/",
      "Brackets sit to the right of P. Braces are Shift + bracket. Use the pinky and snap back.",
      [
        "[ ] { } < > / \\ |",
        "[1] {2} <3> /4/ |5|",
        'if (x < 10) { list[0] = "ok"; }',
      ],
      [
        "[0]",
        "{a}",
        "<b>",
        "a|b",
        "</p>",
        "x[1]",
        "{id}",
        "a\\b",
        "<=",
        "[a,b]",
      ],
      "[]{}<>/\\|",
    ),
    /* Module 6 · Real-world typing */
    T(
      6,
      "Common words",
      "",
      "Read a few words ahead and keep a steady beat. Smooth beats fast.",
      [
        "the of and to in is you that it he was for on are as with his they at be this",
        "from have or one had by word but not what all were we when your can said there",
        "use an each which she do how their if will up other about out many then them these",
      ],
      "the of and to in is you that it was for on are as with they at be this from have or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these".split(
        " ",
      ),
      "etaoinshrdlu",
      { review: true, plain: true },
    ),
    T(
      6,
      "Paragraph practice",
      "",
      "Do not stop for small slips. Keep moving and let accuracy build with rhythm.",
      [
        "A good typist is calm. The fingers move a little, the eyes look ahead, and the mind stays relaxed.",
        "Every day brings a small chance to improve. A few minutes of careful practice beats an hour of rushing.",
        "When you type well, words seem to flow out of your hands. You no longer think about letters, only about ideas.",
      ],
      "calm fingers ahead relaxed improve careful practice rushing flow ideas steady rhythm patient breathe smooth accurate focus".split(
        " ",
      ),
      "etaoinshrdlu",
      { review: true, plain: true },
    ),
    T(
      6,
      "Email and business writing",
      "",
      "Greetings, commas and clear closings. Check capitals at the start of each sentence.",
      [
        "Dear Ms. Patel, thank you for your quick reply.",
        "Please find the report attached. Let me know if you have any questions.",
        "Meeting moved to Tuesday, 3:30 PM. Best regards, Sam Rivera",
      ],
      "Dear Hello Thanks Regards Please attached meeting report invoice schedule review follow-up Monday Tuesday agenda budget deadline".split(
        " ",
      ),
      "etaoinshrdlu",
      { review: true, plain: true },
    ),
    T(
      6,
      "Data entry",
      "",
      "Numbers, dates and addresses. Accuracy matters more than speed here.",
      [
        "Order 48213 shipped 03/14/2026 to 22 Elm St, Suite 7.",
        "Phone: (555) 013-4472  ID: 90-4471  Total: $1,284.50",
        "Invoice #7781 due 12/31/2026; balance $0.00; ref AB-2049.",
      ],
      [
        "48213",
        "03/14/2026",
        "(555)",
        "$1,284.50",
        "#7781",
        "12/31",
        "AB-2049",
        "22 Elm St.",
        "90-4471",
        "Suite 7",
      ],
      "0123456789/$#-.,()",
      { review: true, plain: true },
    ),
    T(
      6,
      "Code and technical typing",
      "",
      "Brackets, quotes and operators come up constantly. Treat each symbol like a letter.",
      [
        "const total = items.length * 2;",
        'if (a >= b && c !== d) { return "yes"; }',
        "for (let i = 0; i < 10; i++) { sum += i; }",
      ],
      [
        "const",
        "return",
        "items[0]",
        "==",
        "!==",
        "&&",
        "||",
        "(x)",
        "i++",
        "{ }",
        "=>",
        '"yes"',
      ],
      '(){}[]=<>!&|;"+*',
      { review: true, plain: true },
    ),
    T(
      6,
      "Final flight check",
      "",
      "Your last flight: capitals, numbers, punctuation and long runs. Breathe, relax and keep rhythm.",
      [
        "Typing well is a habit: calm hands, clear eyes, and a steady beat, all day long.",
        "On May 4, 2026, Maya typed 120 words in 2 minutes; her accuracy was 98%! Can you match it?",
        "Smooth is fast. Smooth is accurate. Fly steady, land clean, and keep your fingers home. Well done!",
      ],
      "Smooth steady accurate calm rhythm breathe flight landing home clean focus habit patient practice master".split(
        " ",
      ),
      "etaoinshrdlu0123456789.,",
      { review: true, plain: true, final: true },
    ),
  ];

  /* ---------- build final lesson objects ---------- */
  let seen = "",
    seenAll = "";
  const lessons = SPEC.map((s, i) => {
    const letters = Array.from(s.keys)
      .filter((c) => /[a-z]/.test(c))
      .join("");
    seen = uniq(seen + letters);
    seenAll = uniq(seenAll + s.keys.replace(/[A-Z]/g, ""));
    const mod = modules[s.module - 1];
    return {
      ...s,
      id: i + 1,
      mod,
      poolLetters: seen,
      poolAll: seenAll,
      kinds: [
        i % 2 === 0 ? "balloon" : "balloon",
        (s.text && s.words && s.words.length >= 8) || seen.length >= 8
          ? i % 2 === 0
            ? "sprint"
            : "rain"
          : "sprint",
      ],
    };
  });
  lessons.forEach((l) => {
    if (l.id % 3 === 0 && l.kinds[1] === "rain") l.kinds = ["rain", "balloon"];
  });

  /* ---------- generated (custom) lessons ----------
     A generated lesson (made on the Lessons page, stored by TM.genLessons) is turned into the same shape as a default
     lesson, so the runner treats it exactly alike: guide -> drills -> 2 games -> result. */
  function fromCustom(c) {
    const L = Array.from(new Set(Array.from(c.letters || c.keys || "")));
    const letters = L.join("");
    const score = (w) =>
      Array.from(w).filter((ch) => L.includes(ch)).length / w.length;
    const cand = WORDS.filter(
      (w) => w.length >= 3 && w.length <= 7 && L.some((ch) => w.includes(ch)),
    );
    const words = shuffle(
      cand.sort((a, b) => score(b) - score(a)).slice(0, 90),
    ).slice(0, 40);
    const items =
      words.length >= 8
        ? words
        : Array.from({ length: 24 }, () =>
            groupText(letters, letters, 4, 1).replace(/ .*/, ""),
          );
    const idx = Number(c.index) || 1;
    return {
      ...c,
      mod: { id: "\u2605", title: "Generated lessons", color: "#4dabf7" },
      keys: letters,
      poolLetters: letters,
      poolAll: letters,
      custom: true,
      review: idx >= 3,
      shift: false,
      text: false,
      intro:
        "Your own flight plan! These lessons train the letters you picked: " +
        L.map((x) => x.toUpperCase()).join(", ") +
        ".",
      kinds: [
        "balloon",
        words.length >= 8 ? (idx % 2 ? "rain" : "sprint") : "sprint",
      ],
      bank: {
        chars: L.concat(L, L),
        words: words.length >= 8 ? words : [],
        items,
      },
    };
  }

  /* ---------- exercise + game text ---------- */
  function exercises(l) {
    if (l.text) {
      const ex = l.ex.slice();
      return [
        {
          name: "Warm-up",
          help: "Type each character in the boxes. The glowing box is your next key.",
          text: ex[0],
        },
        {
          name: "Build the pattern",
          help: "Same keys, new order. Stay relaxed and keep your wrists still.",
          text: ex[1],
        },
        {
          name: l.final ? "The final flight" : "Put it together",
          help: "Everything from this lesson in one go.",
          text: ex[2],
        },
      ];
    }
    const nk = l.keys.replace(/[^a-z;,./]/g, "") || l.keys;
    const pool = l.poolAll.replace(/[^a-z;,./]/g, "");
    const ws = l.poolLetters.length >= 4 ? wordsFor(l.poolLetters, nk, 9) : [];
    const wordText = (ws.length ? ws : pseudoWords(pool, nk, 9)).join(" ");
    return [
      {
        name: "Find the keys",
        help: "Type each character in the boxes. The glowing box is your next key.",
        text: groupText(nk, nk, 28, 1),
      },
      {
        name: "Build the pattern",
        help: l.review
          ? "Every key you know so far, mixed together."
          : "New keys mixed with the ones you already know.",
        text: groupText(nk, pool, 38, l.review ? 0.5 : 0.65),
      },
      {
        name: ws.length ? "Real words" : "Rhythm drill",
        help: ws.length
          ? "Real words made from the keys you have learned."
          : "Nonsense on purpose. Your fingers learn patterns, not meanings.",
        text: wordText,
      },
    ];
  }
  function gameBank(l) {
    if (l.custom && l.bank)
      return {
        chars: l.bank.chars.slice(),
        words: shuffle(l.bank.words),
        items: shuffle(l.bank.items),
      };
    if (l.text) {
      const words = shuffle(l.words);
      return { chars: Array.from(l.chars || ""), words, items: words };
    }
    const nk = l.keys.replace(/[^a-z;,./]/g, "") || l.keys,
      pool = l.poolAll.replace(/[^a-z;,./]/g, "");
    const letters =
      l.poolLetters.length >= 4 ? wordsFor(l.poolLetters, nk, 30) : [];
    const chars = Array.from(
      nk + nk + (l.review ? pool : nk + pool.slice(0, 6)),
    );
    const items =
      letters.length >= 8
        ? letters
        : Array.from({ length: 24 }, () =>
            groupText(nk, pool, 3, 0.7).replace(/ .*/, ""),
          );
    return {
      chars: chars.filter((c) => c !== ";" || true),
      words: letters.length >= 8 ? letters : [],
      items,
    };
  }

  /* ---------- guide ---------- */
  function guide(l) {
    const keys = Array.from(l.keys).filter((c) => c !== " ");
    const rowsTxt = {
      home: "Rests on the home row",
      top: "Reach UP from",
      bottom: "Curl DOWN from",
      num: "Stretch UP two rows from",
    };
    const seenKeys = new Set();
    const rows = [];
    const list = keys.length > 12 ? [] : keys;
    list.forEach((c) => {
      const b = baseKey(c);
      if (seenKeys.has(b + c)) return;
      seenKeys.add(b + c);
      const f = fingerOf(b);
      if (!f) return;
      const row = rowOf(b),
        home = HOME_OF[f];
      let how = rowsTxt[row] + (row === "home" ? "" : " " + home);
      if (row === "home" && !/[fj;ask dl]/i.test(b))
        how = "Reach sideways from " + HOME_OF[f];
      if (row === "home" && /[asdkl;fj]/.test(b)) how = "Home key: rests here";
      if (/[tgbyhn56]/.test(b) && row !== "home") how += " and slightly inward";
      if (needsShift(c))
        how =
          "Hold Shift (" +
          shiftSide(c) +
          " pinky), then " +
          (row === "home"
            ? "press"
            : how.charAt(0).toLowerCase() + how.slice(1));
      rows.push({ key: c, finger: f, name: FINGER_NAME[f], how });
    });
    const used = Array.from(
      new Set(keys.map((c) => fingerOf(baseKey(c))).filter(Boolean)),
    );
    if (l.shift) {
      used.push("lp", "rp");
    }
    if (!keys.length)
      used.push("lp", "lr", "lm", "li", "ri", "rm", "rr", "rp", "rt");
    return {
      rows,
      fingers: Array.from(new Set(used)),
      keys: Array.from(new Set(keys.map(baseKey))),
    };
  }

  return {
    modules,
    lessons,
    ROWS,
    FINGER_KEYS,
    FINGER_NAME,
    FINGER_COLOR,
    HOME_OF,
    fingerOf,
    baseKey,
    needsShift,
    shiftSide,
    exercises,
    gameBank,
    guide,
    fromCustom,
    shuffle,
    pick,
    rnd,
    SHIFTED,
  };
})();
