const TM = (() => {
  const DEFAULTS = {
    capitals: false,
    punctuation: false,
    visibility: 100,
    showKeyboard: true,
    wordCount: 25,
    proficiency: "normal",
    highlightErrors: true,
    soundFeedback: false,
    dailyGoal: 30,
    adaptivePractice: true,
    letterUnlock: true,
    targetWpm: 30,
    stopAtError: true,
  };
  // Parsed values are cached by their raw string, so repeated reads (26 letters x several lookups per page)
  // cost one localStorage lookup instead of a JSON.parse each time. Any outside change invalidates it automatically.
  const cache = new Map();
  const get = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      const hit = cache.get(key);
      if (hit && hit.raw === raw) return hit.val == null ? fallback : hit.val;
      const v = JSON.parse(raw);
      cache.set(key, { raw, val: v });
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  };
  const save = (key, val) => {
    try {
      const raw = JSON.stringify(val);
      if (localStorage.getItem(key) !== raw) localStorage.setItem(key, raw); // skip no-op writes (e.g. unlockedCountV1 on every render)
      cache.set(key, { raw, val });
      // When signed in, mirror local practice data to the account in the background.
      if (
        window.TypePilotCloudSync &&
        [
          "typeSettings",
          "typingHistory",
          "keyStatsV1",
          "unlockedCountV1",
          "lessonProgressV2",
          "lessonProgressV3",
          "customProgressV1",
          "customLessonsV1",
          "uiStats",
        ].includes(key)
      )
        window.TypePilotCloudSync.queue();
      return true;
    } catch (e) {
      console.warn("TypeNets: could not save", key, e);
      return false;
    }
  };
  try {
    if (navigator.storage && navigator.storage.persist)
      navigator.storage.persist();
  } catch {}
  const settings = () => {
    const merged = {
      ...DEFAULTS,
      ...get("typeSettings", {}),
      showKeyboard: true,
    };
    if (![25, 50, 100].includes(Number(merged.wordCount)))
      merged.wordCount = 50;
    if (merged.proficiency === "advanced") merged.proficiency = "advanced";
    else merged.proficiency = "normal";
    return merged;
  };
  const history = () => get("typingHistory", []);
  const lessonProgress = () => get("lessonProgressV2", "lessonProgressV3", {});
  const { lessons, modules } = window.TM_CURRICULUM;

  const wordBanks = {
    easy: "the and you that was for are with his they this have from one your all can had her were said use each which she do how their if will up other about out many then them these so some would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part",
    medium:
      "practice keyboard rhythm steady focus progress accuracy fingers movement improve learning challenge careful speed control sentence explore create useful build muscle memory patient confident skill repeat correct common words smooth effort",
    hard: "consistency deliberate extraordinary efficiency precision coordination sophisticated concentration adaptability punctuation perseverance synchronization complexity responsibility technique uninterrupted challenging thoughtful",
  };
  const WORD_LIST =
    "a about all amaze an and ant are at ate attention back bad bag ball band bank base bed been bell best big bird bit black block blue boat body bone book born both box boy bring brown build busy but buy buzz by cake call calm came camp can card care case cat catch cause chair change chart check child city class clean clear clock close cloud coat cold color come cook cool copy corn cost could count course cover cut dark data date day dear deep desk did dinner dish dog door down dozen draw dream dress drink drive drop dry duck dust each early earth east easy eat edge egg end enjoy enough equal equip even evening every exact exam example excellent exercise exit expect experience expert explain explore extra extreme eye face fact fall family farm fast fat father fear feel feet fell field fight fill film final find fine finger fingers fire first fish five fix fizz flat floor flower fly focus food foot for force forest forget form found four fox free friend from front fruit full fun funny game garden gate gave get gift girl give glad glass goal gold good grass great green ground group grow guess gym had hair half hall hand happy hard has hat have head hear heart help her here high hill him his history hold hole holiday home hope horse hot hour house how huge hundred idea image improve in inn inside intention into ion iron island it its jacket jade jail jam jar jaw jazz jelly jet jewel job jog join joke journey joy judge jug juice jump june jungle junior just keep kept key keyboard keys kick kid kill kind kitchen kite knee knife knock know lab lady lake lamp land lane large last late laugh lay lazy lead leaf lean learn left leg lemon less letter life light like likely line lion lip list listen little live lock lonely long look lost loud love low luck lunch machine made magazine magic mail main major make many map march mark market master match math may maybe maze meal mean meat meet melon member metal middle mile milk million mind minute mirror miss mix model moment money month moon more morning mother mountain mouse mouth move movie music must my name narrow nation near neck need nest net never new news next nice night nine no noise none noon north nose not note nothing notice now number nut oak object ocean off often old on once one only open orange order other out over owl own pack page paint pair pan paper park part party pass past path pay peace pen penny people pick picture piece pig pile pink place plan plant plate play please plus pocket point pond pool poor pot pound power practice prize problem project pull puppy purple push put puzzle quack quake quality quarter quartz queen quest question queue quick quiet quilt quit quite quiz quote rabbit race rain raise ran rate reach read ready real realize red relax remember request require rest rhythm rice rich ride right ring river road rock roll roof room root rose rough round row rule run sad safe said sail salt same sand sat saw say school science screen sea seat second see seed seem sell send sent serve set seven shake shape share sharp she sheep shelf shine ship shirt shoe shop short shoulder show shut sick side sign silent silver simple sin single sister sit six size skill skin sky sleep slow small smart smell smile smoke snow soap soft soil sold solid some son song soon sorry sound south space speak speed spell spend spot spring square squash squeeze squid stage stain stand star start steady stick still stone stop store storm story straight street strong student study subject such sugar summer sun sunday sure surface sweet swim table tail take talk tall tan task taste tax taxi tea teach team teen tell ten test text than thank that the their them then there these they thick thin thing think third thirty this those thought three throw thumb thunder ticket tie tiger tight time tin tired title today toe together told tomorrow tone too tool tooth top total touch tower town toy track trade train tree trick trip truck true try tube turn twelve twenty twice two type typed typing umbrella uncle under unit until upon use usual valley value very vex video view village visit voice wait walk wall want warm was wash watch water wave wax way wear weather week weight well were west wet whale what wheel when where which white who whole why wide wife wild will win wind window winter wish with woman wonder wood word words work world worry would wrap write wrong xylophone yard year yellow yes yesterday you young your zebra zero zigzag zip zone zoo".split(
      " ",
    );
  // Curated short-word additions broaden coverage for every letter, especially Q.
  const EXTRA_NORMAL_WORDS =
    `able acid acre acts adds aged ages aids aims airs airy alas alias also amid amps angel anger angle ankle ants apart apple apply arena argue arise armed aroma array arrow aside asked asset atlas audio avoid awake award aware awful axis baby bacon badge badly baker basic basin basis batch beach beads beard beast began begin being below bench berry birth black blade blame blank blast blend bless blind blink blood bloom board boast bonus booth bound brain brand brass brave bread break brick bride brief bring broad broke brown brush build built bunch burst cabin cable cache cakes camel canal candy cargo carve casey catch cause cedar chain chair chalk charm chart chase cheap cheat check cheek cheer chess chest chief child chill china chips choir chose civic civil claim clamp class clean clear clerk click cliff climb cling cloak clock close cloth cloud coach coast color comet comic coral could count court cover craft crash cream creek crest crime crisp cross crowd crown crude cruel crush curve cycle daily dairy dance dated dealt death debut decay delay delta dense depth devil diary digit diner dirty disco ditch diver dodge doing donor doubt dozen draft drain drama drank drape draw dream dress dried drift drill drink drive drove drown drunk eager eagle early earth easel eaten eight elbow elder elect elite empty enact enemy enjoy enter entry equal equip erase error essay ether ethic evade event every exact exist extra fable faced facet facts faith false fancy fatal fault feast fence fetch fever fewer fiber field fifth fifty fight final first fixed flame flash fleet flesh flick fling float flood floor flour fluid flush focus force forge forth found frame frank fraud fresh fried front frost fruit fully funny gamma gamer games gauge genre ghost giant given glass glide globe gloom glory glove going grace grade grain grand grant grape graph grasp grass great green greet grief grind gross group grown guard guess guest guide guilt habit happy hardy harsh haste hatch hated haunt haven havoc headed heard heart heavy hedge hence herbs hobby honey honor hoped horse hotel house human humid humor hurry ideal image imply inbox index inner input inset issue items ivory jewel joint judge juice jumbo jump kayak keeps kettle keyboard kicks kidnap kindly kingdom kisses knight knobby knot known label labor laden ladle lager lakes lance lands large later laugh layer learn lease leave legal lemon level light liked limit linen liner links listed liter liver local logic lonely loose lower lucky lunar lunch lyric magic major maker maple march match maybe mayor meals means medal mercy merit merry metal meter micro might minor minus mixed model modem moist money month moral motor mount mouse mouth movie music naive naked named names nasal nasty naval never newly night ninja noble noise noisy north noted novel nurse nutty obey occur ocean offer often olive onion onset opera optic orbit order other ought ounce outer owned owner oxide ozone paint panel panic paper party paste patch patio pause peace pearl pedal penny people perky phase phone photo piano piece pilot pinch pitch place plain plane plant plate plead pluck point polar porch pound power press price pride prime print prior prize proof proud prove proxy pulse punch pupil puppy pure queen queer quell query quest queue quick quiet quilt quirk quito quiver quota quote quack quail quake qualm quant quart quash quasi quark quaff qubit quill quip quit quiz rabbit radar radio raise range rapid ratio reach react ready realm rebel refer relax relay rely remix renew repay reply reset resin retro rhyme rider ridge rifle right rigid rinse risen risky rival river roast robin robot rocky roles rough round route royal ruler rural sadly saint salad salon sandy sauce saved scale scare scene scent scope score scout scrap screw script scrub sedan seeds seeks seems seize sense serve seven shade shaft shake shall shame shape share shark sharp shave shelf shell shift shine shiny shirt shock shoes shoot shore short shout shown shrub shrug siege sight sigma silly since sixes sized sketch skill skirt skull slate sleep slice slide slight slime sling slope sloth small smart smash smell smile smoke snack snake sneak solid solve sonar sonic sorry sound south spare spark speak speed spell spend spice spicy spill spine spite split spoke sport spray squad stack staff stage stain stake stale stamp stand stare stark start state steam steel steep steer stern stick stiff still stock stone stood store storm story strap straw strip study stuff style sugar suite sunny super surge swear sweat sweep sweet swift swing swirl sword table taken tales tally taste teach teeth tempo tenet tense tenth terms thank theft theme there thick thief thing think third those three threw thumb tiger tight timer tired title today token topic torch total touch tough tower toxic trace track trade trail train trait treat trend trial tribe trick tried tries trite troll troop truck truly trunk trust truth twice twist typed types ultra uncle under union unity until upper upset urban usage usual utter vague valid value valve vapor vault vegan venue verse video views vigor villa vinyl viral virus visit vital vivid vocal voice voted voter wagon waist waste watch water weary weave wedge weigh weird whale wheat wheel where which while white whole whose wider widow width wield windy winner winter wired wiser witch woman women wonder world worry worse worst worth would wound woven wrack wrist write wrong wrote xenon xerox yacht yearn yeast yield young youth zebra zesty zones`.split(
      /\s+/,
    );
  const EXTRA_ADVANCED_WORDS =
    `abyss adept agile alibi amble anode apex arid aura axiom banal beret bias blithe brash brisk cache cairn canny chaos chasm cipher civic cleft clout coax covert crypt daunt dearth delve dense dirge dour drab ebb edict elude enigma epoch ethos evade facet fallow feint fervor fickle finite fluke foible forage frugal gaunt glean gloat guile guise hallow havoc heed heresy hoard homage hybrid idiom inert infer innate invoke jargon jostle karma kernel kindle latent lucid lurid mantra meager melee merit mimic myriad naive nuance oasis omen ornate opaque ordeal overt pallid pariah parley patron pique plight plume porous preen primal quaff quail quark quash query quell quirk quota quasar quaver quench quince quirky quorum quibble quizzed quondam quahog quinary quinoid quorate quiesce quirked quashed queller quenched quested quitted quartic quartet quantum qualify rabid rancor rebuke recant relic remit repose robust rueful sagely scant scorn sear shrewd solace sparse spurn static stoic subtle taunt taut temper tenet terse thrive tirade tome toxic tract trite umbra unison urbane usurp vague valor vex viable vigor virtue wary wily wry xenon yield zeal zephyr`.split(
      /\s+/,
    );
  const unique = (arr) => [
    ...new Set(
      arr
        .map((w) => String(w).toLowerCase())
        .filter((w) => /^[a-z]{2,7}$/.test(w)),
    ),
  ];
  // Word banks are built on first use only, so pages that never generate text (Home, Statistics, Help...) skip this work.
  let _banks = null;
  const banks = () =>
    _banks ||
    (_banks = (() => {
      const normal = unique(WORD_LIST.concat(EXTRA_NORMAL_WORDS)).filter(
        (w) => w.length <= 5,
      );
      const advanced = unique(
        WORD_LIST.concat(EXTRA_NORMAL_WORDS, EXTRA_ADVANCED_WORDS),
      ).filter((w) => w.length >= 3 && w.length <= 7);
      // Every letter has its own two proficiency compartments. Word selection later
      // intersects these banks with the currently unlocked alphabet.
      const letter = Object.fromEntries(
        "abcdefghijklmnopqrstuvwxyz".split("").map((l) => [
          l,
          {
            normal: normal.filter((w) => w.includes(l)),
            advanced: advanced.filter((w) => w.includes(l)),
          },
        ]),
      );
      return { normal, advanced, letter };
    })());

  function keyStats() {
    return get("keyStatsV1", {});
  }
  function normalizeKey(ch) {
    if (!ch) return null;
    if (ch === " ") return " ";
    const shifted = {
      "~": "`",
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
      '\"': "'",
      "<": ",",
      ">": ".",
      "?": "/",
    };
    const k = shifted[ch] || ch.toLowerCase();
    return /^[a-z0-9;,./'\[\]\\\-=+`?]$/.test(k) ? k : null;
  }
  const LETTER_ORDER = "etaoinshrdlucmfwypvbgkjqxz";
  const STARTER_LETTERS = LETTER_ORDER.slice(0, 6);
  function keySpeed(v) {
    // Preferred: real per-key speed from the time between keystrokes (12000 / avg ms = WPM).
    if (Number(v.timeSamples) > 0 && Number(v.timeTotal) > 0)
      return 12000 / (Number(v.timeTotal) / Number(v.timeSamples));
    // Fallback for data saved before per-key timing existed: average WPM of sessions that included the key.
    return Number(v.speedSamples)
      ? (Number(v.speedTotal) || 0) / Number(v.speedSamples)
      : 0;
  }
  function keyPerformance(k) {
    const v = keyStats()[k] || {},
      attempts = Number(v.attempts) || 0,
      s = settings();
    // Letter unlocking uses lifetime key statistics, never a recent-performance EMA.
    const accuracy = attempts ? ((Number(v.correct) || 0) / attempts) * 100 : 0;
    const speed = keySpeed(v);
    const tA = 75,
      tW = Math.max(1, Number(s.targetWpm) || 20);
    const ready = attempts > 0 && accuracy >= tA && speed >= tW;
    const ratio = attempts ? Math.min(accuracy / tA, speed / tW) : 0;
    // Discrete key-intensity levels are based on meeting the same proportion of both targets.
    const mastery = attempts
      ? ratio >= 1
        ? 1
        : ratio >= 0.9
          ? 0.75
          : ratio >= 0.8
            ? 0.5
            : ratio >= 0.7
              ? 0.25
              : ratio >= 0.5
                ? 0.1
                : 0
      : 0;
    return {
      key: k,
      attempts,
      accuracy,
      speed,
      lifeAcc: accuracy,
      lifeSpeed: speed,
      ready,
      mastery,
      tA,
      tW,
      errors: Number(v.errors) || 0,
      clicks: Number(v.clicks) || 0,
      badClicks: Number(v.badClicks) || 0,
      trackedClicks: Number(v.trackedClicks) || 0,
    };
  }
  // What is still stopping the next letter from unlocking.
  function unlockBlockers() {
    const st = letterState();
    if (!st.enabled || !st.next) return [];
    return st.unlocked
      .split("")
      .map(keyPerformance)
      .filter((p) => !p.ready)
      .map((p) => {
        const why = [];
        if (!p.attempts) why.push("no completed-session data yet");
        else if (p.accuracy < p.tA)
          why.push(`accuracy ${Math.round(p.accuracy)}% → ${p.tA}%`);
        if (p.attempts && p.speed < p.tW)
          why.push(`speed ${Math.round(p.speed)} → ${p.tW} WPM`);
        return {
          key: p.key,
          text: `${p.key.toUpperCase()}: ${why.join(", ") || "keep practicing"}`,
        };
      });
  }
  function letterState() {
    const s = settings(),
      ks = keyStats();
    if (s.letterUnlock === false)
      return {
        enabled: false,
        order: LETTER_ORDER,
        unlocked: "abcdefghijklmnopqrstuvwxyz",
        next: null,
        focus: null,
        progress: 100,
        ready: 0,
        total: 26,
        keys: LETTER_ORDER.split("").map(keyPerformance),
      };
    // Re-evaluate the saved boundary every time: changing target speed/accuracy can lock or unlock letters.
    let count = Math.min(
      26,
      Math.max(
        STARTER_LETTERS.length,
        Number(get("unlockedCountV1", 0)) || STARTER_LETTERS.length,
      ),
    );
    while (
      count > STARTER_LETTERS.length &&
      !LETTER_ORDER.slice(0, count - 1)
        .split("")
        .every((k) => keyPerformance(k).ready)
    )
      count--;
    // New letters are added only after a completed session, never as a side effect of rendering.
    save("unlockedCountV1", count);
    const unlocked = LETTER_ORDER.slice(0, count);
    const active = unlocked.split("");
    const keys = LETTER_ORDER.split("").map((k) => ({
      ...keyPerformance(k),
      unlocked: active.includes(k),
      next: k === LETTER_ORDER[unlocked.length],
    }));
    const ready = active.filter((k) => keyPerformance(k).ready).length;
    const weakest =
      active.slice().sort((a, b) => {
        const A = keyPerformance(a),
          B = keyPerformance(b);
        const score = (x) =>
          Math.min(
            x.accuracy / 75,
            x.speed / Math.max(1, Number(s.targetWpm) || 20),
          );
        return score(A) - score(B);
      })[0] || null;
    return {
      enabled: true,
      order: LETTER_ORDER,
      unlocked,
      next: LETTER_ORDER[unlocked.length] || null,
      focus: weakest,
      progress: active.length ? (ready / active.length) * 100 : 0,
      ready,
      total: active.length,
      keys,
    };
  }
  function makeText(count = 50, opts = {}) {
    const s = { ...settings(), ...opts };
    const level = s.proficiency === "advanced" ? "advanced" : "normal";
    // Both modes stay compact: normal 2–5 characters, advanced 3–7. Adaptive
    // focus only changes which letters are favored; it never changes word length.
    const minLen = level === "advanced" ? 3 : 2,
      maxLen = level === "advanced" ? 7 : 5;
    const state =
      s.letterUnlock !== false
        ? letterState()
        : { unlocked: "abcdefghijklmnopqrstuvwxyz", focus: null };
    const allowed = new Set(state.unlocked.split(""));
    const allAllowed = (words) =>
      words.filter(
        (w) =>
          w.length >= minLen &&
          w.length <= maxLen &&
          [...w].every((ch) => allowed.has(ch)),
      );
    // Gather the per-letter compartments, then deduplicate overlapping words.
    let pool = unique(
      state.unlocked
        .split("")
        .flatMap((ch) => banks().letter[ch]?.[level] || []),
    );
    pool = allAllowed(pool);
    if (!pool.length) pool = allAllowed(banks().normal);
    const allPool = pool.slice();
    const ks = keyStats();
    const weakKeys = state.unlocked.split("").filter((k) => {
      const v = ks[k] || {};
      return (
        !(Number(v.attempts) || 0) ||
        (Number(v.correct) || 0) / Math.max(1, Number(v.attempts) || 0) < 0.75
      );
    });
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    function pseudo() {
      const vowels = "aeiou".split("").filter((k) => allowed.has(k));
      const consonants = "abcdefghijklmnopqrstuvwxyz"
        .split("")
        .filter((k) => allowed.has(k) && !"aeiou".includes(k));
      const n = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
      let out = "";
      for (let i = 0; i < n; i++) {
        const chars =
          i % 2 === 0
            ? consonants.length
              ? consonants
              : vowels
            : vowels.length
              ? vowels
              : consonants;
        out += pick(chars.length ? chars : [...allowed]) || "e";
      }
      return out;
    }
    let previous = "";
    function pickWord() {
      let candidates = allPool;
      // Advanced mode favors the deliberately curated harder vocabulary, without
      // forcing long words. Adaptive focus only biases words inside the same pool.
      if (level === "advanced" && Math.random() < 0.68) {
        const hard = allAllowed(
          (() => {
            const adv = new Set(banks().advanced);
            return EXTRA_ADVANCED_WORDS.filter((w) => adv.has(w));
          })(),
        );
        if (hard.length) candidates = hard;
      }
      const focus =
        s.adaptivePractice !== false
          ? state.focus || (weakKeys.length ? pick(weakKeys) : null)
          : null;
      if (focus && Math.random() < 0.7) {
        const matched = candidates.filter((w) => w.includes(focus));
        if (matched.length) candidates = matched;
      }
      let w = pick(candidates) || pick(allPool) || pseudo(),
        tries = 0;
      while (w === previous && tries++ < 6)
        w = pick(candidates) || pick(allPool) || pseudo();
      previous = w;
      return w;
    }
    const out = [];
    for (let i = 0; i < Math.max(1, Number(count) || 50); i++) {
      let w = pickWord();
      if (s.capitals && Math.random() < 0.22)
        w = w[0].toUpperCase() + w.slice(1);
      if (s.punctuation && i % 7 === 5) w += ",";
      else if (s.punctuation && i % 11 === 9) w += ".";
      out.push(w);
    }
    return out.join(" ");
  }
  function saveResult(result) {
    const entry = { ...result, id: Date.now(), date: new Date().toISOString() };
    const bulky = ["Practice", "Test"].includes(entry.type) && entry.targetText;
    if (bulky) {
      const ks = keyStats();
      const ensure = (k) =>
        ks[k] ||
        (ks[k] = {
          attempts: 0,
          correct: 0,
          errors: 0,
          clicks: 0,
          speedTotal: 0,
          speedSamples: 0,
          timeTotal: 0,
          timeSamples: 0,
        });
      for (const ke of Array.isArray(entry.keyEvents) ? entry.keyEvents : []) {
        // Every keystroke counts, including typos that were corrected or blocked by "stop cursor at error".
        const expected = normalizeKey(ke.expected),
          actual = normalizeKey(ke.actual);
        if (expected) {
          const v = ensure(expected),
            n = v.attempts,
            hit = ke.correct ? 1 : 0;
          if (typeof v.emaAcc !== "number")
            v.emaAcc = n ? (v.correct || 0) / n : hit;
          if (n > 0) v.emaAcc += Math.max(1 / (n + 1), 0.1) * (hit - v.emaAcc);
          v.attempts++;
          if (ke.correct) {
            v.correct++;
            const ms = Math.min(Number(ke.ms) || 0, 2000);
            if (ms > 0) {
              const m = v.timeSamples || 0;
              if (!(v.emaMs > 0)) v.emaMs = m ? (v.timeTotal || 0) / m : ms;
              if (m > 0) v.emaMs += Math.max(1 / (m + 1), 0.1) * (ms - v.emaMs);
              v.timeTotal = (v.timeTotal || 0) + ms;
              v.timeSamples = m + 1;
            }
          } else v.errors++;
          v.speedTotal += Number(entry.wpm) || 0;
          v.speedSamples++;
        }
        if (actual) {
          const c = ensure(actual);
          c.clicks++;
          c.trackedClicks = (c.trackedClicks || 0) + 1;
          if (expected !== actual) c.badClicks = (c.badClicks || 0) + 1;
        }
      }
      save("keyStatsV1", ks);
      // After a completed practice/test only, unlock at most one next letter if every current letter qualifies.
      if (settings().letterUnlock !== false) {
        let count = Math.min(
          26,
          Math.max(
            STARTER_LETTERS.length,
            Number(get("unlockedCountV1", 0)) || STARTER_LETTERS.length,
          ),
        );
        while (
          count > STARTER_LETTERS.length &&
          !LETTER_ORDER.slice(0, count - 1)
            .split("")
            .every((k) => keyPerformance(k).ready)
        )
          count--;
        if (
          count < 26 &&
          LETTER_ORDER.slice(0, count)
            .split("")
            .every((k) => keyPerformance(k).ready)
        )
          count++;
        save("unlockedCountV1", count);
      }
      // Keep storage small: the per-session text and keystroke timeline are not stored in history.
      delete entry.targetText;
      delete entry.typedText;
      delete entry.keyEvents;
      delete entry.recording;
    }
    const h = history();
    h.push(entry);
    save("typingHistory", h);
    return entry;
  }

  /* ---------- generated (custom) lessons ---------- */
  const customLessons = () => get("customLessonsV1", []);
  const customProgress = () => get("customProgressV1", {});
  const LESSON_LABELS = ["Warm-up", "Patterns", "Rhythm", "Words", "Mastery"];
  function genLessons(letters, count = 5, boxes = 40) {
    letters = [...new Set(letters)].sort().slice(0, 5);
    count = Math.max(1, Math.min(10, Number(count) || 5));
    boxes = Math.max(10, Math.min(120, Number(boxes) || 40));
    const setId = "g" + Date.now().toString(36);
    return Array.from({ length: count }, (_, i) => ({
      id: `${setId}-${i + 1}`,
      setId,
      generated: true,
      index: i + 1,
      setSize: count,
      letters,
      boxes,
      level: i,
      createdAt: new Date().toISOString(),
      title: `${i < 5 ? LESSON_LABELS[i] : "Mixed practice " + (i + 1)}`,
      desc: `Letters: ${letters.map((x) => x.toUpperCase()).join(", ")}`,
      keys: letters.join(""),
      tip:
        i < 2
          ? "Go slowly and keep your eyes on the box that is highlighted. Accuracy first."
          : i < 4
            ? "Find an even beat. Let the words flow instead of hunting for each key."
            : "Type whole words smoothly. Speed will follow clean accuracy.",
    }));
  }
  function genDrills(l) {
    const S = l.letters,
      B = Math.max(10, l.boxes || 40),
      lvl = l.level || 0,
      rnd = (n) => Math.floor(Math.random() * n),
      pick = (a) => a[rnd(a.length)];
    const build = (next) => {
      let out = "";
      for (let g = 0; g < 500; g++) {
        const w = next(g);
        if (!w) break;
        const t = out ? out + " " + w : w;
        if (t.length > B) {
          if (!out) out = w.slice(0, B);
          break;
        }
        out = t;
        if (out.length >= B - 1) break;
      }
      return out || S[0];
    };
    const rep = (ch, n) => ch.repeat(n);
    // exercise 1: each letter in short repeated groups
    let c = 0;
    const reps = lvl < 2 ? 3 : 2,
      e1 = build(() => rep(S[c++ % S.length], reps));
    // exercise 2: random groups from the selected letters
    const gl = Math.min(5, 2 + Math.floor(lvl / 2) + (S.length === 1 ? 1 : 0)),
      e2 = build(() =>
        Array.from({ length: gl + rnd(2) }, () => pick(S)).join(""),
      );
    // exercise 3: alternating and mirrored patterns
    const e3 = build(() => {
      const a = pick(S),
        b = pick(S);
      return pick([
        a + b + a + b,
        a + a + b + b,
        a + b + b + a,
        a + b + a,
        a + a + a,
        b + a,
      ]);
    });
    // exercise 4: real words that contain the selected letters
    const score = (w) =>
      [...w].filter((ch) => S.includes(ch)).length / w.length;
    let pool = WORD_LIST.filter((w) => S.some((ch) => w.includes(ch)))
      .map((w) => [w, score(w) + Math.random() * 0.25])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25 + lvl * 15)
      .map((x) => x[0]);
    const vow = [
        ...new Set([
          ...S.filter((k) => "aeiou".includes(k)),
          "a",
          "e",
          "i",
          "o",
        ]),
      ],
      con = S.filter((k) => !"aeiou".includes(k));
    const pseudo = () => {
      let o = "",
        n = 3 + rnd(3);
      for (let i = 0; i < n; i++) {
        const p = i % 2 ? vow : con.length ? con : S;
        o += pick(p);
      }
      return o;
    };
    if (pool.length < 6) pool = pool.concat(Array.from({ length: 12 }, pseudo));
    let last = "";
    const word = () => {
      let w = pick(pool),
        t = 0;
      while (w === last && t++ < 5) w = pick(pool);
      last = w;
      return w;
    };
    const e4 = build(word);
    // exercise 5: a mix of words and patterns (more words in later lessons)
    const mixWords = Math.min(0.9, 0.4 + lvl * 0.12),
      e5 = build(() =>
        Math.random() < mixWords
          ? word()
          : Array.from({ length: 3 + rnd(3) }, () => pick(S)).join(""),
      );
    return [
      {
        name: "Find the letters",
        type: "KEY DRILL",
        text: e1,
        help: "Type each letter in order. Spaces count too.",
      },
      {
        name: "Practice the patterns",
        type: "PATTERN DRILL",
        text: e2,
        help: "Keep your eyes on the highlighted box and type the whole pattern.",
      },
      {
        name: "Keep the rhythm going",
        type: "RHYTHM",
        text: e3,
        help: "Same letters, new order. Keep a steady, even beat.",
      },
      {
        name: "Type real words",
        type: "WORDS",
        text: e4,
        help: "Real words that use your chosen letters.",
      },
      {
        name: "Put it together",
        type: "REVIEW",
        text: e5,
        help: "Words and patterns mixed. Your WPM and accuracy are recorded.",
      },
    ];
  }
  function duration(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  }
  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function renderText(el, text, input, highlight = true) {
    const typed = input || "";
    el.innerHTML = Array.from(text)
      .map((ch, i) => {
        let cls = "";
        if (i < typed.length) {
          cls = typed[i] === ch ? "correct" : highlight ? "incorrect" : "";
        } else if (i === typed.length) cls = "current";
        return `<span class="${cls}">${escapeHtml(ch)}</span>`;
      })
      .join("");
  }
  function applyOpacity() {
    document.documentElement.style.setProperty(
      "--text-opacity",
      settings().visibility / 100,
    );
  }
  function setupNav() {
    const btn = document.querySelector(".menu-toggle"),
      nav = document.querySelector(".nav");
    if (btn && nav)
      btn.addEventListener("click", () => nav.classList.toggle("open"));
  }
  function stats() {
    const h = history().filter(
      (x) => ["Practice", "Test"].includes(x.type) && !x.lessonId,
    );
    const completed = Object.values(lessonProgress()).filter(
      (x) => x && x.completed,
    ).length;
    const best = Math.max(0, ...h.map((x) => Number(x.wpm) || 0));
    const avg = h.length
      ? h.reduce((a, x) => a + (Number(x.accuracy) || 0), 0) / h.length
      : 0;
    const seconds = h.reduce((a, x) => a + (Number(x.duration) || 0), 0);
    return { history: h, best, avg, seconds, completed };
  }

  /* ---------- single alphabetical letter bar (unlocked letters + mastery), shared by Practice, Statistics and Home ---------- */
  function renderLetterBar(el, opts = {}) {
    if (!el) return;
    const st = letterState(),
      s = settings(),
      active = new Set(st.unlocked.split("")),
      alpha = "abcdefghijklmnopqrstuvwxyz".split("");
    const cells = alpha
      .map((k) => {
        const p = keyPerformance(k),
          unlocked = !st.enabled || active.has(k),
          focus = st.enabled && st.focus === k,
          next = st.enabled && st.next === k;
        const pct = Math.round(p.mastery * 100);
        const tip = !unlocked
          ? `${k.toUpperCase()} · locked${next ? " · unlocks next" : ""}`
          : p.attempts
            ? `${k.toUpperCase()} · ${pct}% mastery · ${p.accuracy.toFixed(0)}% accuracy · ${Math.round(p.speed)} WPM · ${p.attempts} keystrokes`
            : `${k.toUpperCase()} · unlocked, not practiced yet`;
        return `<span class="lb-cell ${unlocked ? "on" : "off"} ${p.ready && unlocked ? "done" : ""} ${focus ? "focus" : ""} ${next ? "next" : ""}" title="${escapeHtml(tip)}" aria-label="${escapeHtml(tip)}" data-key="${k}"><i style="height:${unlocked ? pct : 0}%"></i><b>${k}</b></span>`;
      })
      .join("");
    const bl = opts.detail ? unlockBlockers() : [];
    const blockText =
      st.enabled && st.next && opts.detail
        ? bl.length
          ? `<div class="lb-need">To unlock <b>${st.next.toUpperCase()}</b> · ${bl
              .slice(0, 4)
              .map((x) => escapeHtml(x.text))
              .join(
                " · ",
              )}${bl.length > 4 ? ` · +${bl.length - 4} more` : ""}</div>`
          : `<div class="lb-need"><b>${st.next.toUpperCase()}</b> unlocks as soon as you finish your next session.</div>`
        : "";
    const status = st.enabled
      ? `${st.unlocked.length} of 26 letters unlocked${st.next ? ` · next: <b>${st.next.toUpperCase()}</b>` : " · all unlocked"}`
      : "All 26 letters in use";
    el.innerHTML = `<div class="lb-bar" role="group" aria-label="Letter mastery, a to z">${cells}</div>${opts.caption === false ? "" : `<div class="lb-caption"><span>${status}</span><span class="lb-legend"><i class="lb-l-fill"></i>mastery <i class="lb-l-focus"></i>focus letter <i class="lb-l-locked"></i>locked</span></div>${blockText}`}`;
  }
  function updateHome() {
    const s = stats(),
      has = s.history.length;
    const set = (id, v) => {
      const e = document.getElementById(id);
      if (e) e.textContent = v;
    };
    set("homeBest", has ? `${Math.round(s.best)} WPM` : "—");
    set("homeAccuracy", has ? `${s.avg.toFixed(1)}%` : "—");
    set("homeTime", `${Math.round(s.seconds / 60)} min`);
    set("homeLessons", s.completed);
  }
  function setupPrefetch() {
    // Warm the next page when the pointer or finger lands on an internal link.
    const seen = new Set();
    const warm = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="/"]');
      if (
        !a ||
        a.target ||
        seen.has(a.href) ||
        a.origin !== location.origin ||
        a.href === location.href
      )
        return;
      seen.add(a.href);
      const l = document.createElement("link");
      l.rel = "prefetch";
      l.href = a.href;
      document.head.appendChild(l);
    };
    document.addEventListener("pointerover", warm, { passive: true });
    document.addEventListener("touchstart", warm, { passive: true });
  }
  /* Clean URLs (/practice, /statistics ...) are served by Cloudflare Pages. When the site is opened
     from a file or a plain local server that does not map them, send the click to the matching .html file. */
  function setupCleanUrlsFallback() {
    const local =
      location.protocol === "file:" ||
      /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (!local) return;
    const files = {
      "/": "index.html",
      "/practice": "practice.html",
      "/typing-test": "typing-test.html",
      "/statistics": "statistics.html",
      "/settings": "settings.html",
      "/help": "help.html",
      "/multiplayer": "multiplayer.html",
      "/privacy": "privacy.html",
      "/terms": "terms.html",
    };
    const base = () =>
      location.protocol === "file:"
        ? location.href.replace(/[^/]*$/, "")
        : location.origin + "/";
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[href^='/']");
      if (!a || a.target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const f = files[a.getAttribute("href")];
      if (!f) return;
      e.preventDefault();
      location.href = base() + f;
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    setupCleanUrlsFallback();
    setupNav();
    applyOpacity();
    updateHome();
    setupPrefetch();
  });
  return {
    customLessons,
    customProgress,
    genLessons,
    genDrills,
    WORD_LIST,
    get,
    unlockBlockers,
    renderLetterBar,
    keySpeed,
    DEFAULTS,
    settings,
    save,
    history,
    lessonProgress,
    lessons,
    modules,
    wordBanks,
    get letterWordBanks() {
      return banks().letter;
    },
    makeText,
    saveResult,
    duration,
    escapeHtml,
    renderText,
    stats,
    applyOpacity,
    keyStats,
    normalizeKey,
    letterState,
    keyPerformance,
  };
})();
