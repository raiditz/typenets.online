/* TypePilot lesson runner.
   Flow: guide -> 3 box drills -> 2 interactive games -> result.
   Enter always means "go on" (skip the guide, start a game, next step, next lesson). */
document.addEventListener("DOMContentLoaded", () => {
  const D = window.TP_LESSONS,
    $ = (id) => document.getElementById(id),
    esc = TM.escapeHtml;
  const params = new URLSearchParams(location.search);
  // ?custom=<id> runs a lesson generated on the Lessons page; ?id=<n> runs one of the default lessons.
  const customId = params.get("custom");
  const cdata = customId
    ? TM.customLessons().find((c) => c.id === customId)
    : null;
  if (customId && !cdata) {
    location.replace("lessons.html");
    return;
  }
  const id = cdata
    ? cdata.index
    : Math.max(1, Math.min(D.lessons.length, Number(params.get("id")) || 1));
  const lesson = cdata ? D.fromCustom(cdata) : D.lessons[id - 1],
    mod = lesson.mod;
  const total = cdata ? cdata.setSize : D.lessons.length;
  const nextCustom = cdata
    ? TM.customLessons().find(
        (c) => c.setId === cdata.setId && c.index === cdata.index + 1,
      )
    : null;
  const rnd = D.rnd,
    pick = D.pick;

  /* ---------- header ---------- */
  $("lpMain").style.setProperty("--mc", mod.color);
  document.title = `Lesson ${id}: ${lesson.title} — TypePilot`;
  $("bcTitle").textContent = lesson.title;
  $("lpEyebrow").textContent = cdata
    ? `GENERATED · LETTERS ${Array.from(cdata.letters)
        .map((x) => x.toUpperCase())
        .join(" ")}`
    : `MODULE ${mod.id} · ${mod.title.toUpperCase()}`;
  $("lpTitle").innerHTML = esc(lesson.title) + '<span class="accent">.</span>';
  $("lpNum").innerHTML = `${String(id).padStart(2, "0")} <em>/ ${total}</em>`;
  const chipKeys = Array.from(lesson.keys).filter((c) => c !== " ");
  $("lpChips").innerHTML = chipKeys.length
    ? chipKeys
        .slice(0, 10)
        .map(
          (c) =>
            `<span class="lc-key">${esc(/[a-z]/.test(c) ? c.toUpperCase() : c)}</span>`,
        )
        .join("") +
      (chipKeys.length > 10
        ? `<span class="lc-key more" style="color:var(--muted);background:none">+${chipKeys.length - 10}</span>`
        : "")
    : '<span class="lc-key more" style="background:none;color:var(--muted)">Mixed practice</span>';

  const pip = TPPip.mount($("coach"));
  const exs = cdata ? TM.genDrills(cdata) : D.exercises(lesson),
    bank = D.gameBank(lesson),
    G = D.guide(lesson);
  const STEPS = [
    { t: "guide", label: "Guide", icon: "?" },
    ...exs.map((_, i) => ({ t: "box", i, label: "Drill " + (i + 1) })),
    { t: "game", k: lesson.kinds[0], n: 1, label: "Game 1" },
    { t: "game", k: lesson.kinds[1], n: 2, label: "Game 2" },
  ];
  $("lpTrack").innerHTML = STEPS.map(
    (s, i) =>
      `<div class="lp-pip ${s.t === "game" ? "game" : ""}" data-i="${i}"><i>${s.icon || (s.t === "game" ? "★" : s.i + 1)}</i>${s.label}</div>`,
  ).join("");
  const results = [];
  let si = 0,
    cur = null,
    lastAdvance = 0;
  const stage = $("stage");

  /* ---------- keyboard + hands ---------- */
  const OFFSET = { num: 0, top: 17, home: 30, bottom: 52 };
  function kbdHTML(showFingers) {
    const key = (k, extra = "") => {
      const f = D.fingerOf(k),
        c = f ? D.FINGER_COLOR[f] : "#8792a5";
      return `<span class="kbd-key ${showFingers ? "fc" : ""} ${k === "f" || k === "j" ? "bump" : ""} ${extra}" data-k="${esc(k)}" style="--fc:${c}">${esc(k)}</span>`;
    };
    const rows = D.ROWS.map(([keys, name]) => {
      let h = Array.from(keys)
        .map((k) => key(k))
        .join("");
      if (name === "bottom")
        h =
          `<span class="kbd-key wide" data-k="shiftL" style="--fc:${D.FINGER_COLOR.lp}">shift</span>` +
          h +
          `<span class="kbd-key wide" data-k="shiftR" style="--fc:${D.FINGER_COLOR.rp}">shift</span>`;
      return `<div class="kbd-row" style="padding-left:${name === "bottom" ? 0 : OFFSET[name]}px">${h}</div>`;
    }).join("");
    return `<div class="kbd-wrap" aria-hidden="true">${rows}<div class="kbd-row"><span class="kbd-key space" data-k="space" style="--fc:#8792a5">space</span></div></div>`;
  }
  const keyEl = (root, k) =>
    root.querySelector(`[data-k="${CSS.escape(k === " " ? "space" : k)}"]`);
  function setTarget(root, ch) {
    root
      .querySelectorAll(".kbd-key.target")
      .forEach((e) => e.classList.remove("target"));
    if (ch === undefined || ch === null) return;
    const base = D.baseKey(ch),
      el = keyEl(root, base);
    if (el) el.classList.add("target");
    if (D.needsShift(ch)) {
      const s = keyEl(root, D.shiftSide(ch) === "right" ? "shiftR" : "shiftL");
      if (s) s.classList.add("target");
    }
  }
  function handsSVG(active, labels) {
    const L = {
      lp: { x: 22, y: 82, w: 30, h: 66 },
      lr: { x: 60, y: 54, w: 30, h: 94 },
      lm: { x: 98, y: 42, w: 30, h: 106 },
      li: { x: 136, y: 56, w: 30, h: 92 },
    };
    const R = { rp: "lp", rr: "lr", rm: "lm", ri: "li" };
    const fing = (fid, r, mirror) => {
      const x = mirror ? 520 - r.x - r.w : r.x,
        on = active.includes(fid),
        c = D.FINGER_COLOR[fid];
      return (
        `<rect class="hf ${on ? "on" : ""}" style="--fc:${c}" x="${x}" y="${r.y}" width="${r.w}" height="${r.h + 20}" rx="15"/>` +
        (on && labels[fid]
          ? `<text class="hl" x="${x + r.w / 2}" y="${r.y + 24}">${esc(labels[fid])}</text>`
          : "")
      );
    };
    let s =
      '<svg class="hands-svg" viewBox="0 0 520 215" role="img" aria-label="Finger placement">';
    s +=
      '<rect class="hp" x="16" y="128" width="158" height="62" rx="28"/><rect class="hp" x="346" y="128" width="158" height="62" rx="28"/>';
    Object.entries(L).forEach(([f, r]) => (s += fing(f, r, false)));
    Object.entries(R).forEach(([f, lf]) => (s += fing(f, L[lf], true)));
    const th = (fid, x, rot, cx) =>
      `<rect class="hf ${active.includes(fid) ? "on" : ""}" style="--fc:${D.FINGER_COLOR[fid]}" x="${x}" y="136" width="30" height="58" rx="15" transform="rotate(${rot} ${cx} 165)"/>`;
    s += th("lt", 166, -30, 181) + th("rt", 324, 30, 339);
    s +=
      '<text class="hcap" x="95" y="209">LEFT HAND</text><text class="hcap" x="425" y="209">RIGHT HAND</text></svg>';
    return s;
  }

  /* ---------- step plumbing ---------- */
  function paintTrack() {
    document.querySelectorAll(".lp-pip").forEach((p, i) => {
      p.classList.toggle("on", i === si);
      p.classList.toggle("done", i < si);
    });
  }
  function go(i) {
    if (cur && cur.destroy) cur.destroy();
    cur = null;
    si = i;
    paintTrack();
    if (document.activeElement && document.activeElement.blur)
      document.activeElement.blur();
    if (i >= STEPS.length) return resultStep();
    const s = STEPS[i];
    cur =
      s.t === "guide"
        ? guideStep()
        : s.t === "box"
          ? boxStep(s.i)
          : gameStep(s.k, s.n);
  }
  function advance() {
    const now = Date.now();
    if (now - lastAdvance < 280) return;
    lastAdvance = now;
    go(si + 1);
  }
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter") e.preventDefault(); // never let Enter "click" a focused button as well
    if (cur && cur.onKey) cur.onKey(e);
  });
  const btn = (label, cls, fn, hint) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn " + cls;
    b.innerHTML =
      label +
      (hint ? ` <span class="kbd" style="margin-left:6px">${hint}</span>` : "");
    b.addEventListener("click", fn);
    return b;
  };
  const stars = (n) =>
    `<div class="sm-stars" aria-label="${n} of 3 stars">${[1, 2, 3].map((i) => (i <= n ? "<b>★</b>" : "★")).join("")}</div>`;
  const starsFor = (acc) => (acc >= 96 ? 3 : acc >= 90 ? 2 : 1);

  /* ---------- guide ---------- */
  function guideStep() {
    const labels = {};
    G.rows.forEach((r) => {
      labels[r.finger] =
        (labels[r.finger] ? labels[r.finger] + " " : "") + r.key.toUpperCase();
    });
    const rows = G.rows
      .map(
        (r) =>
          `<li style="--fc:${D.FINGER_COLOR[r.finger]}"><span class="lc-key">${esc(/[a-z]/.test(r.key) ? r.key.toUpperCase() : r.key)}</span><div><b>${esc(r.name)}</b><span>${esc(r.how)}</span></div></li>`,
      )
      .join("");
    let note;
    if (lesson.shift)
      note =
        "<b>Shift rule:</b> if the letter is typed with your left hand, hold the <b>right</b> Shift with your right pinky. If it is typed with your right hand, hold the <b>left</b> Shift with your left pinky.";
    else if (!G.rows.length && !lesson.keys.length)
      note =
        "<b>No new keys.</b> This lesson trains speed and rhythm with everything you know. Keep every finger on its home key between reaches.";
    else if (!G.rows.length)
      note =
        "<b>All your fingers are in play.</b> Glowing fingers are the ones you use most in this lesson. Always return them to the home row.";
    else if (lesson.id === 1)
      note =
        "<b>Home position:</b> rest your left index finger on <b>F</b> and your right index finger on <b>J</b>. Feel the small bumps. Thumbs hover over the space bar.";
    else note = `<b>Remember:</b> ${esc(lesson.tip)}`;
    stage.innerHTML = `<div class="st-eyebrow">LESSON GUIDE</div><h2 class="st-title">Where do your fingers go?</h2><p class="st-help">Look at the glowing fingers and keys, then press Enter to begin.</p>
    <div class="gd-grid"><div><div class="gd-hands">${handsSVG(G.fingers, labels)}</div></div>
    <div>${rows ? `<ul class="gd-rows">${rows}</ul>` : ""}<div class="gd-note">${note}</div>
    <div class="gd-posture"><div><b>Sit tall</b>Feet flat, back straight</div><div><b>Float wrists</b>Do not rest them on the desk</div><div><b>Eyes up</b>Look at the screen, not your hands</div></div></div></div>
    ${kbdHTML(true)}
    <div class="lp-actions" id="gdAct"></div><div class="hint-line">Press <kbd>Enter</kbd> to skip the guide</div>`;
    G.keys.forEach((k) => {
      const el = keyEl(stage, k);
      if (el) el.classList.add("target");
    });
    if (lesson.shift) {
      keyEl(stage, "shiftL").classList.add("target");
      keyEl(stage, "shiftR").classList.add("target");
    }
    $("gdAct").appendChild(
      btn("Skip guide →", "btn-primary", advance, "Enter"),
    );
    pip.say(
      lesson.intro ||
        (G.rows.length
          ? "Fingers first! Place them like this, then we practise."
          : "Quick refresher, then off we go!"),
      "idle",
    );
    return {
      onKey(e) {
        if (e.key === "Enter") advance();
      },
    };
  }

  /* ---------- summary card (shared by drills and games) ---------- */
  function summary({ title, sub, stats, verdict, onRetry, nextLabel }) {
    const el = document.createElement("div");
    el.className = "sm";
    el.innerHTML = `<h3>${esc(title)}</h3><p>${esc(sub || "")}</p><div class="sm-stats">${stats.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div><div class="lp-actions"></div><div class="hint-line">Press <kbd>Enter</kbd> to continue</div>`;
    const act = el.querySelector(".lp-actions");
    act.appendChild(btn("↻ Try again", "btn-secondary", onRetry));
    act.appendChild(
      btn(nextLabel || "Next →", "btn-primary", advance, "Enter"),
    );
    pip.say(verdict.text, verdict.mood);
    return el;
  }
  const hintFromMiss = (miss) => {
    const e = Object.entries(miss).sort((a, b) => b[1] - a[1])[0];
    return e && e[1] >= 2
      ? `Watch the "${e[0] === " " ? "space" : e[0].toUpperCase()}" key, it tripped you ${e[1]} times.`
      : "";
  };
  const pushResult = (name, acc, wpm, extra = {}) => {
    const k = results.findIndex((r) => r.step === si);
    const r = { step: si, name, acc, wpm, ...extra };
    if (k >= 0) results[k] = r;
    else results.push(r);
  };

  /* ---------- box drills ---------- */
  function boxStep(i) {
    const ex = exs[i],
      chars = Array.from(ex.text);
    let pos = 0,
      hits = 0,
      errs = 0,
      streak = 0,
      startT = 0,
      done = false,
      recent = [],
      lastTip = 0;
    const miss = {};
    stage.innerHTML = `<div class="st-eyebrow">DRILL ${i + 1} OF ${exs.length}</div><h2 class="st-title">${esc(ex.name)}</h2><p class="st-help">${esc(ex.help)}</p>
      <div class="tb-boxes ${chars.length > 70 ? "dense" : ""}" id="boxes"></div>${kbdHTML(true)}
      <div id="low"><div class="live-row"><div><b id="lvAcc">100%</b>ACCURACY</div><div><b id="lvErr">0</b>MISTAKES</div><div><b id="lvStr">0</b>STREAK</div></div><div class="hint-line">Type the glowing key. A wrong key will not move you on.</div></div>`;
    const boxes = $("boxes");
    boxes.innerHTML = chars
      .map(
        (c) =>
          `<span class="tb ${c === " " ? "space" : ""}">${c === " " ? "␣" : esc(c)}</span>`,
      )
      .join("");
    const els = Array.from(boxes.children);
    const paint = () => {
      els.forEach((e, k) => {
        e.classList.toggle("done", k < pos);
        e.classList.toggle("cur", k === pos);
      });
      setTarget(stage, chars[pos]);
    };
    paint();
    pip.say(
      i === exs.length - 1 && i > 0
        ? "Last drill. Keep that rhythm!"
        : i === 0
          ? "Eyes on the glowing key. Slow and steady!"
          : "Nice. Now we mix it up.",
      "idle",
    );
    function finish() {
      done = true;
      const ms = Math.max(1500, Date.now() - startT),
        acc = Math.round((hits / (hits + errs)) * 1000) / 10,
        wpm = Math.round(chars.length / 5 / (ms / 60000));
      pushResult(`Drill ${i + 1}: ${ex.name}`, acc, wpm, { errors: errs });
      setTarget(stage, null);
      const kb = stage.querySelector(".kbd-wrap");
      if (kb) kb.remove();
      const v = TPPip.verdict(acc, wpm, hintFromMiss(miss));
      $("low").replaceWith(
        summary({
          title:
            acc >= 98
              ? "Perfect run!"
              : acc >= 90
                ? "Drill complete"
                : "Drill finished",
          sub: ex.name,
          stats: [
            ["ACCURACY", acc + "%"],
            ["SPEED", wpm + " WPM"],
            ["MISTAKES", errs],
          ],
          verdict: v,
          onRetry: () => go(si),
          nextLabel:
            i === exs.length - 1 ? "Start the games →" : "Next drill →",
        }),
      );
    }
    return {
      onKey(e) {
        if (done) {
          if (e.key === "Enter") advance();
          return;
        }
        if (e.key.length !== 1) return;
        e.preventDefault();
        if (!startT) startT = Date.now();
        if (e.key === chars[pos]) {
          hits++;
          streak++;
          recent.push(1);
          pos++;
          if (streak && streak % 12 === 0)
            pip.say(
              pick([
                "On fire!",
                "Smooth flying!",
                "Look at you go!",
                "Keep it up!",
              ]),
              "happy",
              1600,
            );
          if (pos >= chars.length) {
            paint();
            finish();
            return;
          }
        } else {
          errs++;
          streak = 0;
          recent.push(0);
          miss[chars[pos]] = (miss[chars[pos]] || 0) + 1;
          const b = els[pos];
          b.classList.remove("bad");
          void b.offsetWidth;
          b.classList.add("bad");
          setTimeout(() => b.classList.remove("bad"), 320);
          if (
            recent.slice(-8).filter((x) => !x).length >= 3 &&
            Date.now() - lastTip > 6000
          ) {
            lastTip = Date.now();
            pip.say("Oops! Slow down and watch the glowing key.", "oops", 2200);
          }
        }
        recent = recent.slice(-12);
        paint();
        $("lvAcc").textContent = Math.round((hits / (hits + errs)) * 100) + "%";
        $("lvErr").textContent = errs;
        $("lvStr").textContent = streak;
      },
    };
  }

  /* ---------- games ---------- */
  const GAMES = {
    balloon: {
      name: "Balloon Pop",
      icon: "🎈",
      desc: "Type the character on each balloon to pop it before it floats away. Five escapes and the flight ends.",
    },
    rain: {
      name: "Word Rain",
      icon: "☁️",
      desc: "Words fall from the clouds. Type a whole word to clear it before it lands. Backspace fixes a slip.",
    },
    sprint: {
      name: "Combo Sprint",
      icon: "✈️",
      desc: "Type each target as fast as you can for 30 seconds. Keep a streak going to build your combo!",
    },
  };
  const COLORS = [
    "#ff647c",
    "#4dabf7",
    "#ffd43b",
    "#a3e635",
    "#c084fc",
    "#ff922b",
  ];
  function gameStep(kind, n) {
    const meta = GAMES[kind];
    stage.innerHTML = `<div class="st-eyebrow">GAME ${n} OF 2</div><h2 class="st-title">${meta.name}</h2><p class="st-help">${esc(meta.desc)}</p>
      <div class="gm-hud" id="hud"></div><div class="gm-arena ${kind === "sprint" ? "night" : ""}" id="arena"><div class="gm-ground"></div></div><div id="gmLow"></div>`;
    const arena = $("arena"),
      hud = $("hud");
    let phase = "ready",
      raf = 0,
      last = 0,
      impl = null;
    const overlay = document.createElement("div");
    overlay.className = "gm-overlay";
    overlay.innerHTML = `<div style="font-size:46px">${meta.icon}</div><h3>${meta.name}</h3><p>${esc(meta.desc)}</p>`;
    overlay.appendChild(btn("Start game", "btn-primary", start, "Enter"));
    arena.appendChild(overlay);
    pip.say("Ready? Press Enter to take off!", "idle");
    function start() {
      if (phase !== "ready") return;
      phase = "play";
      overlay.remove();
      impl = IMPL[kind](arena, hud, end);
      last = performance.now();
      const loop = (t) => {
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        if (phase === "play") {
          impl.tick(dt);
          if (phase === "play") raf = requestAnimationFrame(loop);
        }
      };
      raf = requestAnimationFrame(loop);
    }
    function end(r) {
      if (phase !== "play") return;
      phase = "over";
      cancelAnimationFrame(raf);
      const acc = Math.max(0, Math.round(r.acc * 10) / 10);
      pushResult(`Game ${n}: ${meta.name}`, acc, r.wpm || null, {
        score: r.score,
      });
      const v = TPPip.verdict(acc, r.wpm, hintFromMiss(r.miss || {}));
      if (r.lost) {
        v.text =
          "Turbulence! " +
          (acc >= 90
            ? "So close, give it another go."
            : "Slow down and try again.");
        if (v.mood === "wow" || v.mood === "happy") v.mood = "think";
      }
      $("gmLow").appendChild(
        summary({
          title: r.lost ? "Flight ended early" : "Landing complete!",
          sub: meta.name,
          stats: r.stats,
          verdict: v,
          onRetry: () => go(si),
          nextLabel: n === 2 ? "See my results →" : "Next game →",
        }),
      );
    }
    return {
      onKey(e) {
        if (phase === "ready") {
          if (e.key === "Enter") start();
          return;
        }
        if (phase === "over") {
          if (e.key === "Enter") advance();
          return;
        }
        if (e.key === "Backspace" && impl.back) {
          e.preventDefault();
          impl.back();
          return;
        }
        if (e.key.length === 1) {
          e.preventDefault();
          impl.key(e.key);
        }
      },
      destroy() {
        cancelAnimationFrame(raf);
        phase = "over";
      },
    };
  }
  const hearts = (n) =>
    Array.from(
      { length: 5 },
      (_, i) => `<span class="${i < n ? "" : "lost"}">♥</span>`,
    ).join("");
  const fx = (arena, x, y, text, color) => {
    const e = document.createElement("div");
    e.className = "gm-fx";
    e.textContent = text;
    e.style.cssText = `left:${x}px;top:${y}px;color:${color || "#fff"}`;
    arena.appendChild(e);
    setTimeout(() => e.remove(), 800);
  };

  const IMPL = {
    /* ---- Balloon Pop ---- */
    balloon(arena, hud, end) {
      const goal = lesson.review ? 16 : 12,
        maxLive = lesson.keys.length <= 2 ? 3 : 4,
        chars = bank.chars.length ? bank.chars : ["f", "j"];
      let lives = 5,
        hits = 0,
        wrong = 0,
        missed = 0,
        spawn = 0,
        live = [],
        streak = 0;
      const t0 = performance.now(),
        miss = {};
      const paint = () => {
        hud.innerHTML = `<span>POPPED<b>${hits}/${goal}</b></span><span class="gm-hearts" aria-label="${lives} lives left">${hearts(lives)}</span>`;
      };
      paint();
      const W = () => arena.clientWidth,
        H = () => arena.clientHeight;
      function spawnOne() {
        const taken = live.map((b) => b.ch),
          pool = chars.filter((c) => !taken.includes(c)),
          ch = pick(pool.length ? pool : chars);
        const el = document.createElement("div");
        el.className = "balloon";
        el.textContent = ch;
        el.style.setProperty("--bc", pick(COLORS));
        const x = 8 + rnd(Math.max(1, W() - 70));
        el.style.left = x + "px";
        arena.appendChild(el);
        live.push({ el, ch, x, y: 0, v: 40 + hits * 1.6 + rnd(10) });
      }
      function finish(lost) {
        const tot = hits + wrong + missed,
          acc = tot ? (hits / tot) * 100 : 0,
          secs = (performance.now() - t0) / 1000;
        live.forEach((b) => b.el.remove());
        end({
          acc,
          lost,
          miss,
          score: hits,
          stats: [
            ["POPPED", `${hits}/${goal}`],
            ["ACCURACY", Math.round(acc) + "%"],
            ["WRONG KEYS", wrong],
            ["TIME", Math.round(secs) + "s"],
          ],
        });
      }
      return {
        tick(dt) {
          spawn -= dt;
          if (spawn <= 0 && live.length < maxLive) {
            spawnOne();
            spawn = Math.max(0.95, 1.7 - hits * 0.045);
          }
          for (const b of live.slice()) {
            b.y += b.v * dt;
            b.el.style.transform = `translateY(${-b.y}px)`;
            if (b.y > H() + 20) {
              b.el.remove();
              live = live.filter((x) => x !== b);
              lives--;
              missed++;
              streak = 0;
              miss[b.ch] = (miss[b.ch] || 0) + 1;
              paint();
              pip.say(
                pick(["Oops, one got away!", "Missed one! Stay focused."]),
                "oops",
                1600,
              );
              if (lives <= 0) return finish(true);
            }
          }
        },
        key(k) {
          const m = live.filter((b) => b.ch === k).sort((a, b) => b.y - a.y)[0];
          if (!m) {
            wrong++;
            streak = 0;
            miss[k] = (miss[k] || 0) + 1;
            return;
          }
          live = live.filter((x) => x !== m);
          m.el.classList.add("pop");
          setTimeout(() => m.el.remove(), 260);
          hits++;
          streak++;
          fx(arena, m.x + 8, H() - m.y - 40, "+1");
          paint();
          if (streak && streak % 6 === 0)
            pip.say(
              pick(["Pop pop pop!", "On fire!", "Great aim!"]),
              "happy",
              1500,
            );
          if (hits >= goal) finish(false);
        },
      };
    },
    /* ---- Word Rain ---- */
    rain(arena, hud, end) {
      const goal = 8,
        words = bank.words.length ? bank.words : bank.items;
      let lives = 5,
        hits = 0,
        wrong = 0,
        missed = 0,
        spawn = 0.2,
        live = [],
        buf = "",
        typedOk = 0,
        bag = [];
      const t0 = performance.now(),
        miss = {};
      const bufEl = document.createElement("div");
      bufEl.className = "wr-buffer";
      arena.appendChild(bufEl);
      const paint = () => {
        hud.innerHTML = `<span>CLEARED<b>${hits}/${goal}</b></span><span class="gm-hearts">${hearts(lives)}</span>`;
        bufEl.textContent = buf || "…";
      };
      const H = () => arena.clientHeight,
        W = () => arena.clientWidth;
      const nextWord = () => {
        if (!bag.length) bag = D.shuffle(words);
        const taken = live.map((w) => w.text);
        let w = bag.pop();
        if (taken.includes(w)) w = bag.pop() || w;
        return w;
      };
      const draw = (w) => {
        const k = w.locked ? buf.length : 0;
        w.el.innerHTML = `<i>${esc(w.text.slice(0, k))}</i>${esc(w.text.slice(k))}`;
        w.el.classList.toggle("lock", !!w.locked);
      };
      function spawnOne() {
        const text = nextWord(),
          el = document.createElement("div");
        el.className = "wr-word";
        arena.appendChild(el);
        const w = { text, el, y: -30, locked: false, x: 0, v: 20 + hits * 1.2 };
        draw(w);
        w.x = 8 + rnd(Math.max(1, W() - el.offsetWidth - 16));
        el.style.left = w.x + "px";
        live.push(w);
      }
      function relock() {
        live.forEach((w) => {
          w.locked = false;
        });
        const c = live
          .filter((w) => buf && w.text.startsWith(buf))
          .sort((a, b) => b.y - a.y)[0];
        if (c) c.locked = true;
        live.forEach(draw);
      }
      function finish(lost) {
        const denom = typedOk + wrong + missed,
          acc = denom ? (typedOk / denom) * 100 : 0,
          secs = Math.max(1, (performance.now() - t0) / 1000);
        const wpm = Math.round(typedOk / 5 / (secs / 60));
        live.forEach((w) => w.el.remove());
        bufEl.remove();
        end({
          acc,
          lost,
          wpm,
          miss,
          score: hits,
          stats: [
            ["CLEARED", `${hits}/${goal}`],
            ["ACCURACY", Math.round(acc) + "%"],
            ["SPEED", wpm + " WPM"],
            ["WRONG KEYS", wrong],
          ],
        });
      }
      paint();
      return {
        tick(dt) {
          spawn -= dt;
          if (spawn <= 0 && live.length < 3) {
            spawnOne();
            spawn = Math.max(1.7, 3.3 - hits * 0.12);
          }
          for (const w of live.slice()) {
            w.y += w.v * dt;
            w.el.style.transform = `translateY(${w.y}px)`;
            if (w.y > H() - 64) {
              w.el.remove();
              live = live.filter((x) => x !== w);
              lives--;
              missed++;
              for (const c of w.text) miss[c] = (miss[c] || 0) + 1;
              if (w.locked) buf = "";
              if (!live.some((x) => buf && x.text.startsWith(buf))) buf = "";
              relock();
              paint();
              pip.say("Splash! One landed. Keep your eyes up.", "oops", 1700);
              if (lives <= 0) return finish(true);
            }
          }
        },
        key(k) {
          const nb = buf + k;
          if (live.some((w) => w.text.startsWith(nb))) {
            buf = nb;
            typedOk++;
            relock();
            const dn = live.find((w) => w.text === buf);
            if (dn) {
              live = live.filter((x) => x !== dn);
              dn.el.classList.add("pop");
              setTimeout(() => dn.el.remove(), 260);
              hits++;
              buf = "";
              relock();
              fx(arena, dn.x, dn.y, "+1");
              if (hits % 3 === 0)
                pip.say(
                  pick(["Word wizard!", "Clear skies!", "Great work!"]),
                  "happy",
                  1500,
                );
              if (hits >= goal) {
                paint();
                return finish(false);
              }
            }
            paint();
          } else {
            wrong++;
            miss[k] = (miss[k] || 0) + 1;
            bufEl.classList.remove("bad");
            void bufEl.offsetWidth;
            bufEl.classList.add("bad");
          }
        },
        back() {
          buf = buf.slice(0, -1);
          relock();
          paint();
        },
      };
    },
    /* ---- Combo Sprint ---- */
    sprint(arena, hud, end) {
      const total = 30,
        items = D.shuffle(bank.items.length ? bank.items : bank.chars);
      let idx = 0,
        pos = 0,
        combo = 0,
        bestCombo = 0,
        score = 0,
        ok = 0,
        bad = 0,
        elapsed = 0;
      const miss = {};
      const card = document.createElement("div");
      card.className = "sp-card";
      arena.appendChild(card);
      const comboEl = document.createElement("div");
      comboEl.className = "sp-combo";
      arena.appendChild(comboEl);
      const plane = document.createElement("div");
      plane.className = "sp-plane";
      plane.textContent = "✈️";
      arena.appendChild(plane);
      const bar = document.createElement("div");
      bar.className = "sp-timebar";
      bar.innerHTML = "<span></span>";
      arena.parentNode.insertBefore(bar, arena.nextSibling);
      const item = () => items[idx % items.length];
      const paint = () => {
        const t = Array.from(item());
        const vis = (a) => esc(a.join("").replace(/ /g, "␣")); // same glyph for typed and untyped spaces, so the card never changes width while you type
        card.innerHTML = `<i>${vis(t.slice(0, pos))}</i>${vis(t.slice(pos))}`;
        comboEl.textContent =
          combo >= 2
            ? `COMBO ×${1 + Math.floor(combo / 5)} · ${combo}`
            : "COMBO";
        hud.innerHTML = `<span>SCORE<b>${score}</b></span><span>TIME<b>${Math.max(0, Math.ceil(total - elapsed))}s</b></span>`;
        bar.firstChild.style.width =
          Math.max(0, (1 - elapsed / total) * 100) + "%";
        plane.style.left = Math.min(92, (elapsed / total) * 92) + "%";
      };
      paint();
      return {
        tick(dt) {
          elapsed += dt;
          paint();
          if (elapsed >= total) {
            bar.remove();
            const acc = ok + bad ? (ok / (ok + bad)) * 100 : 0,
              wpm = Math.round(ok / 5 / (total / 60));
            end({
              acc,
              wpm,
              miss,
              score,
              stats: [
                ["SCORE", score],
                ["ACCURACY", Math.round(acc) + "%"],
                ["SPEED", wpm + " WPM"],
                ["BEST COMBO", bestCombo],
              ],
            });
          }
        },
        key(k) {
          const t = Array.from(item());
          if (k === t[pos]) {
            ok++;
            pos++;
            if (pos >= t.length) {
              combo++;
              bestCombo = Math.max(bestCombo, combo);
              score += 1 + Math.floor(combo / 5);
              pos = 0;
              idx++;
              card.classList.remove("sp-hit");
              void card.offsetWidth;
              card.classList.add("sp-hit");
              if (combo === 5 || combo === 10 || combo === 20)
                pip.say(
                  `Combo ${combo}! ${pick(["Unstoppable!", "Fabulous!", "Keep going!"])}`,
                  "wow",
                  1700,
                );
            }
          } else {
            bad++;
            combo = 0;
            miss[t[pos]] = (miss[t[pos]] || 0) + 1;
            card.classList.remove("sp-bad");
            void card.offsetWidth;
            card.classList.add("sp-bad");
          }
          paint();
        },
      };
    },
  };

  /* ---------- result ---------- */
  function resultStep() {
    const accs = results.map((r) => r.acc),
      acc = accs.length
        ? Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10
        : 0;
    const wp = results.filter((r) => r.wpm).map((r) => r.wpm),
      wpm = wp.length
        ? Math.round(wp.reduce((a, b) => a + b, 0) / wp.length)
        : 0;
    const st = starsFor(acc),
      pKey = cdata ? "customProgressV1" : "lessonProgressV3",
      pId = cdata ? cdata.id : id,
      prog = TM.get(pKey, {}),
      prev = prog[pId] || {};
    if (
      !prev.done ||
      st > (prev.stars || 0) ||
      (st === prev.stars && acc >= (prev.acc || 0))
    )
      prog[pId] = {
        done: true,
        stars: st,
        acc,
        wpm,
        at: new Date().toISOString(),
      };
    else prog[pId] = { ...prev, done: true };
    TM.save(pKey, prog);
    const next = cdata ? nextCustom : D.lessons[id];
    stage.innerHTML = `<div class="sm"><div class="st-eyebrow">LESSON COMPLETE</div>${stars(st)}<h3>${next ? esc(lesson.title) + " cleared!" : cdata ? "You finished the whole set!" : "You finished the whole course!"}</h3><p>${st === 3 ? "Three stars: brilliant flying." : st === 2 ? "Two stars. Aim for 96% accuracy to earn the third." : "One star. Replay for a higher score whenever you like."}</p>
      <div class="sm-stats"><div><small>ACCURACY</small><b>${acc}%</b></div><div><small>AVG SPEED</small><b>${wpm} WPM</b></div><div><small>STARS</small><b>${st}/3</b></div></div>
      <div class="sm-steps">${results.map((r) => `<div>${esc(r.name)}<span>${r.acc}%${r.wpm ? " · " + r.wpm + " WPM" : ""}</span></div>`).join("")}</div><div class="lp-actions" id="rsAct"></div>
      <div class="hint-line">Press <kbd>Enter</kbd> for ${next ? "the next lesson" : "all lessons"}</div></div>`;
    const goNext = () => {
      location.href = next
        ? cdata
          ? `lesson.html?custom=${next.id}`
          : `lesson.html?id=${id + 1}`
        : "lessons.html";
    };
    const act = $("rsAct");
    act.appendChild(
      btn("↻ Replay lesson", "btn-secondary", () => location.reload()),
    );
    act.appendChild(
      btn("All lessons", "btn-secondary", () => {
        location.href = "lessons.html";
      }),
    );
    act.appendChild(
      btn(next ? "Next lesson →" : "Finish ✓", "btn-primary", goNext, "Enter"),
    );
    const v = TPPip.verdict(acc, wpm, "");
    pip.say(
      next
        ? v.text
        : cdata
          ? "Set complete! Generate another one whenever you like."
          : "Course complete! You are a real TypePilot!",
      st === 3 ? "wow" : v.mood,
    );
    lastAdvance = Date.now();
    cur = {
      onKey(e) {
        if (e.key === "Enter" && Date.now() - lastAdvance > 280) goNext();
      },
    };
  }

  paintTrack();
  go(0);
});
