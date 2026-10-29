/* TypeNets solo typing test: pick 30s / 60s / 2 min, type, then see full statistics.
   Multiplayer lives on its own page (multiplayer.html); reloading this page always opens the solo test. */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id),
    input = $("testInput"),
    display = $("testText"),
    result = $("testResult"),
    panel = $("testPanel");
  const esc = (v) =>
    String(v == null ? "" : v).replace(
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
  const safeName = () => {
    try {
      return (localStorage.getItem("typepilotDisplayName") || "")
        .trim()
        .slice(0, 24);
    } catch (_) {
      return "";
    }
  };
  const getScores = () => {
    try {
      return JSON.parse(
        localStorage.getItem("typepilotSoloHighScores") || "[]",
      );
    } catch (_) {
      return [];
    }
  };
  let target = "",
    duration = 60,
    started = null,
    deadline = null,
    timer = null,
    active = false,
    finished = false,
    errors = 0;
  let recording = [],
    keyEvents = [],
    lastValue = "",
    lastKeyAt = null,
    samples = [],
    lastSample = 0;
  try {
    const d = Number(localStorage.getItem("typepilotTestSeconds"));
    if ([30, 60, 120].includes(d)) duration = d;
  } catch (_) {}

  /* ---------- leaderboard (unchanged behaviour) ---------- */
  let boardSeq = 0;
  async function renderScores() {
    const old = $("soloHighScores");
    if (old) old.remove();
    const box = document.createElement("section");
    box.id = "soloHighScores";
    box.className = "panel score-board";
    box.innerHTML =
      '<h3>All-time best performers <span class="muted">· top 10 worldwide</span></h3><p class="muted">Loading the leaderboard…</p>';
    $("soloTestView").appendChild(box);
    const seq = ++boardSeq,
      mine = getScores()[0];
    const yours = mine
      ? `<p class="lb-you">Your best on this browser: <b>${mine.wpm} WPM</b> at ${mine.accuracy}% accuracy</p>`
      : "";
    try {
      const [rows, me] = await Promise.all([
        TPLeaderboard.top(10),
        TPLeaderboard.myUid(),
      ]);
      if (seq !== boardSeq) return;
      box.innerHTML = `<h3>All-time best performers <span class="muted">· top 10 worldwide</span></h3>${rows.length ? `<div class="table-scroll"><table><thead><tr><th>#</th><th>Typist</th><th>WPM</th><th>Accuracy</th><th>Test length</th></tr></thead><tbody>${rows.map((x, i) => `<tr class="${me && x.uid === me ? "lb-me" : ""}"><td>${i + 1}</td><td><span class="lb-ava">${TPAvatars.html(x.avatarId || 0)}</span>${esc(x.name)}${me && x.uid === me ? ' <span class="lb-tag">you</span>' : ""}</td><td><b>${x.wpm}</b></td><td>${x.accuracy}%</td><td>${x.duration}s</td></tr>`).join("")}</tbody></table></div>` : '<p class="muted">No scores yet — be the first on the board.</p>'}${yours}<p class="lb-need">Only your personal best counts. To qualify, finish a test of at least <b>${TPLeaderboard.MIN_SECONDS}s</b> with <b>${TPLeaderboard.MIN_ACCURACY}%+</b> accuracy.</p>`;
    } catch (_) {
      if (seq !== boardSeq) return;
      const scores = getScores();
      box.innerHTML = `<h3>All-time best performers <span class="muted">· unavailable right now</span></h3><p class="muted">The global leaderboard needs an internet connection and the updated Firebase rules. Showing your best runs on this browser for now.</p>${
        scores.length
          ? `<div class="table-scroll"><table><thead><tr><th>#</th><th>Name</th><th>WPM</th><th>Accuracy</th><th>Duration</th><th>Date</th></tr></thead><tbody>${scores
              .slice(0, 10)
              .map(
                (x, i) =>
                  `<tr><td>${i + 1}</td><td>${esc(x.name)}</td><td>${x.wpm}</td><td>${x.accuracy}%</td><td>${x.duration}s</td><td>${esc(x.date)}</td></tr>`,
              )
              .join("")}</tbody></table></div>`
          : ""
      }`;
    }
  }

  /* ---------- text: real book passages, always with capitals and punctuation ----------
     The solo test ignores the practice Settings (capitals / punctuation / word count / letter unlocking).
     Every new test uses different passages: recently used ones are skipped (see TP_nextPassages in passages.js). */
  let sources = [];
  function makeTest() {
    const all = window.TP_PASSAGES || [],
      need = duration * 10; // enough text for about 120 WPM
    let text = "",
      ids = [];
    if (!all.length) {
      target = "The quick brown fox jumps over the lazy dog, and then rests.";
      sources = [];
      return;
    }
    while (text.length < need && ids.length < all.length) {
      const [i] = window.TP_nextPassages
        ? window.TP_nextPassages("solo", 1)
        : [Math.floor(Math.random() * all.length)];
      if (ids.includes(i)) continue;
      ids.push(i);
      text += (text ? " " : "") + all[i].text;
    }
    target = text;
    sources = ids.map((i) => all[i]);
    const book = $("testBook");
    if (book)
      book.textContent =
        "From " + Array.from(new Set(sources.map((s) => s.book))).join(", ");
  }

  /* ---------- run ---------- */
  function paintDuration() {
    document.querySelectorAll(".tt-opt").forEach((b) => {
      const on = Number(b.dataset.sec) === duration;
      b.classList.toggle("active", on);
      b.setAttribute("aria-checked", on);
    });
  }
  function reset(newText) {
    clearInterval(timer);
    active = false;
    finished = false;
    started = null;
    deadline = null;
    input.value = "";
    input.disabled = false;
    recording = [];
    keyEvents = [];
    lastValue = "";
    lastKeyAt = null;
    errors = 0;
    samples = [];
    lastSample = 0;
    $("testTime").innerHTML = `${duration}<span>s</span>`;
    $("testWpm").textContent = "0";
    $("testAccuracy").textContent = "100%";
    $("testErrors").textContent = "0";
    $("testStatus").textContent =
      "Start typing to begin. The timer starts with your first key.";
    result.classList.add("hidden");
    panel.classList.remove("hidden");
    if (newText || !target) makeTest();
    active = true;
    display.scrollTop = 0;
    TM.renderText(display, target, "", TM.settings().highlightErrors);
    paintDuration();
    input.focus({ preventScroll: true });
  }
  function recordChange(value) {
    const prev = lastValue;
    let prefix = 0;
    while (
      prefix < prev.length &&
      prefix < value.length &&
      prev[prefix] === value[prefix]
    )
      prefix++;
    let oldEnd = prev.length,
      newEnd = value.length;
    while (
      oldEnd > prefix &&
      newEnd > prefix &&
      prev[oldEnd - 1] === value[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }
    const removed = oldEnd - prefix,
      inserted = value.slice(prefix, newEnd),
      t = started ? Math.max(0, Date.now() - started) : 0;
    if (removed) recording.push([t, "d", prefix, removed]);
    if (inserted) {
      recording.push([t, "i", prefix, inserted]);
      const now = Date.now(),
        ms = lastKeyAt ? now - lastKeyAt : 0;
      lastKeyAt = now;
      for (let i = 0; i < inserted.length; i++) {
        const expected = target[prefix + i] || "",
          actual = inserted[i];
        if (expected)
          keyEvents.push({
            expected,
            actual,
            correct: actual === expected,
            ms: i === 0 ? ms : 0,
          });
      }
    }
    lastValue = value;
  }
  const netCorrect = (v) => {
    let n = 0;
    for (let i = 0; i < v.length; i++) if (v[i] === target[i]) n++;
    return n;
  };
  function smoothnessScore() {
    const times = keyEvents
      .filter((e) => e.correct && Number(e.ms) > 0 && Number(e.ms) <= 2000)
      .map((e) => Number(e.ms));
    if (times.length < 3) return null;
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    if (!mean) return null;
    const variance =
      times.reduce((a, b) => a + (b - mean) ** 2, 0) / times.length;
    return Math.round(
      Math.max(0, Math.min(100, 100 / (1 + Math.sqrt(variance) / mean))),
    );
  }
  function scrollByLine() {
    const current = display.querySelector(".current");
    if (!current) return;
    const lh = parseFloat(getComputedStyle(display).lineHeight) || 30;
    const top =
      current.getBoundingClientRect().top -
      display.getBoundingClientRect().top +
      display.scrollTop;
    if (top > display.scrollTop + lh * 2.9)
      display.scrollTop = Math.max(0, top - lh * 2);
  }
  function update() {
    if (!active || !started) return;
    const now = Date.now(),
      left = Math.max(0, (deadline - now) / 1000);
    errors = keyEvents.reduce((n, k) => n + (!k.correct ? 1 : 0), 0);
    const total = keyEvents.length,
      correct = total - errors,
      elapsed = Math.max(1, (now - started) / 1000),
      wpm = Math.round(netCorrect(input.value) / 5 / (elapsed / 60));
    $("testTime").innerHTML = `${Math.ceil(left)}<span>s</span>`;
    $("testWpm").textContent = wpm;
    $("testAccuracy").textContent =
      (total ? Math.max(0, (correct / total) * 100) : 100).toFixed(1) + "%";
    $("testErrors").textContent = errors;
    const sec = Math.floor(elapsed);
    if (sec > lastSample) {
      lastSample = sec;
      samples.push(wpm);
    }
    if (left <= 0) finish();
  }
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      reset(true);
      return;
    }
    if (e.key === "Enter") e.preventDefault();
  });
  ["paste", "drop", "cut"].forEach((ev) =>
    input.addEventListener(ev, (e) => e.preventDefault()),
  );
  input.addEventListener("input", () => {
    if (!active) return;
    if (!started) {
      started = Date.now();
      deadline = started + duration * 1000;
      timer = setInterval(update, 200);
      $("testStatus").textContent = "Test in progress… stay relaxed.";
    }
    recordChange(input.value);
    TM.renderText(display, target, input.value, TM.settings().highlightErrors);
    scrollByLine();
    update();
    if (input.value.length >= target.length) finish();
  });
  display.addEventListener("click", () => input.focus());

  async function submitScore(wpm, acc, secs) {
    let msg = "";
    try {
      const r = await TPLeaderboard.submit({
        wpm,
        accuracy: acc,
        duration: secs,
      });
      msg =
        r.status === "saved"
          ? "New personal best — your score is on the all-time board!"
          : r.status === "kept"
            ? `Your all-time best stays at ${r.best} WPM.`
            : `Runs of ${TPLeaderboard.MIN_SECONDS}s+ with ${TPLeaderboard.MIN_ACCURACY}%+ accuracy qualify for the leaderboard.`;
    } catch (_) {
      msg =
        "Could not reach the leaderboard — your result is still saved to your statistics.";
    }
    const n = $("lbSubmitNote");
    if (n) n.textContent = msg;
    renderScores();
  }
  function chart(vals) {
    if (vals.length < 2)
      return '<p class="muted">Not enough time to draw a speed graph.</p>';
    const W = 560,
      H = 140,
      P = 26,
      max = Math.max(20, ...vals) * 1.1,
      x = (i) => P + (i * (W - P - 8)) / (vals.length - 1),
      y = (v) => H - P - (v / max) * (H - P - 10);
    const pts = vals
      .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" ");
    return `<svg viewBox="0 0 ${W} ${H}" class="tt-chart" role="img" aria-label="Speed over time"><line x1="${P}" y1="${H - P}" x2="${W - 8}" y2="${H - P}" stroke="#293142"/><line x1="${P}" y1="10" x2="${P}" y2="${H - P}" stroke="#293142"/><polyline fill="none" stroke="#a3e635" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/><text x="${P}" y="${H - 8}" fill="#8792a5" font-size="10">0s</text><text x="${W - 8}" y="${H - 8}" fill="#8792a5" font-size="10" text-anchor="end">${vals.length}s</text><text x="${P - 4}" y="16" fill="#8792a5" font-size="10" text-anchor="end">${Math.round(max)}</text></svg>`;
  }
  function finish() {
    if (!active || finished) return;
    active = false;
    finished = true;
    clearInterval(timer);
    input.disabled = true;
    const elapsed = Math.max(
        1,
        Math.min(duration, (Date.now() - (started || Date.now())) / 1000),
      ),
      val = input.value;
    errors = keyEvents.reduce((n, k) => n + (!k.correct ? 1 : 0), 0);
    const total = keyEvents.length,
      correct = total - errors,
      accuracy = total ? Math.max(0, (correct / total) * 100) : 100,
      wpm = Math.round(netCorrect(val) / 5 / (elapsed / 60)),
      smooth = smoothnessScore();
    const raw = Math.round(total / 5 / (elapsed / 60));
    TM.saveResult({
      type: "Test",
      title: `${duration}s test`,
      wpm,
      accuracy: Number(accuracy.toFixed(1)),
      errors,
      duration: Math.round(elapsed),
      correctChars: correct,
      totalChars: total,
      smoothness: smooth,
      detail: "typing-test",
      targetText: target,
      typedText: val,
      recording,
      keyEvents,
    });
    const scores = getScores();
    scores.push({
      name: safeName() || "You",
      wpm,
      accuracy: Number(accuracy.toFixed(1)),
      errors,
      duration: Math.round(elapsed),
      date: new Date().toLocaleDateString(),
    });
    scores.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);
    try {
      localStorage.setItem(
        "typepilotSoloHighScores",
        JSON.stringify(scores.slice(0, 30)),
      );
    } catch (_) {}
    submitScore(wpm, accuracy, Math.round(elapsed));
    const missed = {};
    keyEvents.forEach((k) => {
      if (!k.correct) missed[k.expected] = (missed[k.expected] || 0) + 1;
    });
    const worst = Object.entries(missed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    panel.classList.add("hidden");
    result.classList.remove("hidden");
    result.innerHTML = `<div class="eyebrow">TEST COMPLETE · ${duration >= 120 ? "2 MINUTES" : duration + " SECONDS"}</div><h2>${wpm >= 60 ? "Fast and focused. Excellent!" : wpm >= 40 ? "Great pace. Keep pushing." : "Every test is a baseline to build on."}</h2>
      <div class="result-grid"><div><small>WPM</small><strong>${wpm}</strong></div><div><small>ACCURACY</small><strong>${accuracy.toFixed(1)}%</strong></div><div><small>RAW SPEED</small><strong>${raw}</strong></div><div><small>ERRORS</small><strong>${errors}</strong></div><div><small>TIME</small><strong>${TM.duration(elapsed)}</strong></div><div><small>CHARACTERS</small><strong>${correct}/${total}</strong></div><div><small>SMOOTHNESS</small><strong>${smooth === null ? "—" : smooth + "/100"}</strong></div></div>
      <div class="tt-split"><div><h3>Speed over time <span class="muted">· WPM each second</span></h3>${chart(samples)}</div><div><h3>Keys to practise</h3>${worst.length ? `<div class="tt-keys">${worst.map(([k, n]) => `<span><b>${esc(k === " " ? "space" : k)}</b>×${n}</span>`).join("")}</div>` : '<p class="muted">No mistakes. Clean run!</p>'}<p class="muted tt-note">Typos stay in the analysis even when fixed with Backspace. Saved to your all-time statistics.</p></div></div>
      <div class="score-board"><h3>All-time best performers</h3><p class="muted" id="lbSubmitNote">Checking whether this run makes the leaderboard…</p></div>
      <div class="result-actions"><button class="btn btn-primary" id="againTest" type="button">↻ New test <span class="kbd" style="margin-left:6px">Enter</span></button><button class="btn btn-secondary" id="sameTest" type="button">Repeat same text</button><a class="btn btn-secondary" href="multiplayer.html">Multiplayer race →</a><a class="btn btn-secondary" href="statistics.html">View statistics →</a></div>`;
    $("againTest").addEventListener("click", () => reset(true));
    $("sameTest").addEventListener("click", () => reset(false));
    result.scrollIntoView({ block: "start", behavior: "smooth" });
    renderScores();
  }
  document.addEventListener("keydown", (e) => {
    if (finished && e.key === "Enter") {
      e.preventDefault();
      reset(true);
    }
  });
  document.querySelectorAll(".tt-opt").forEach((b) =>
    b.addEventListener("click", () => {
      duration = Number(b.dataset.sec);
      try {
        localStorage.setItem("typepilotTestSeconds", duration);
      } catch (_) {}
      reset(true);
    }),
  );
  $("restartTest").addEventListener("click", () => reset(true));
  reset(true);
  renderScores();
});
