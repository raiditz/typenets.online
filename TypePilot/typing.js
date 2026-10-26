document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id),
    capture = $("typingCapture"),
    display = $("typingText"),
    area = $("typingArea"),
    prompt = $("startPrompt"),
    result = $("sessionResult");
  const IDLE_CAP_MS = 5000; // gaps longer than this (pauses, thinking) are not counted as typing time
  let target = "",
    typed = "",
    started = null,
    lastKeyAt = null,
    activeMs = 0,
    timer = null,
    done = false,
    active = false,
    focused = false,
    entryPrompt = true;
  let recording = [],
    keyEvents = [],
    cfg = TM.settings(),
    lastSession = null,
    blockedErrorPositions = new Set();

  /* ---------- helpers ---------- */
  const correctChars = () => {
    let n = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) n++;
    return n;
  };
  const errorCount = () =>
    cfg.stopAtError
      ? blockedErrorPositions.size +
        keyEvents.reduce((n, k) => n + (!k.correct && !k.blocked ? 1 : 0), 0)
      : keyEvents.reduce((n, k) => n + (k.correct ? 0 : 1), 0);
  const activeSeconds = () =>
    (activeMs +
      (active && lastKeyAt
        ? Math.min(Date.now() - lastKeyAt, IDLE_CAP_MS)
        : 0)) /
    1000;
  function smoothnessScore() {
    const times = keyEvents
      .filter((e) => e.correct && Number(e.ms) > 0 && Number(e.ms) <= 2000)
      .map((e) => Number(e.ms));
    if (times.length < 3) return null;
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    if (!mean) return null;
    const variance =
      times.reduce((a, b) => a + (b - mean) ** 2, 0) / times.length;
    const cv = Math.sqrt(variance) / mean;
    return Math.round(Math.max(0, Math.min(100, 100 / (1 + cv))));
  }
  function metrics() {
    const sec = activeSeconds(),
      errors = errorCount(),
      total = cfg.stopAtError ? typed.length + errors : keyEvents.length,
      good = Math.max(0, total - errors);
    return {
      sec,
      total,
      errors,
      wpm:
        sec > 0 ? Math.round(correctChars() / 5 / (Math.max(sec, 1) / 60)) : 0,
      acc: total ? (good / total) * 100 : 100,
    };
  }
  function update() {
    // Keep the live metrics visible above the passage; persistence still happens only on completion.
    const m = metrics();
    $("liveWpm").textContent = m.wpm;
    $("liveAcc").textContent = m.acc.toFixed(1) + "%";
    $("liveTime").textContent = TM.duration(m.sec);
    $("liveErrors").textContent = m.errors;
  }
  function renderPrompt() {
    let msg = "";
    if (!done && entryPrompt) msg = "Start typing when you are ready";
    else if (!done && !active && keyEvents.length)
      msg = "Paused · continue typing to resume";
    area.classList.toggle("idle", !!msg);
    area.classList.toggle("is-active", active && !done);
    prompt.innerHTML = msg ? `<span>${msg}</span>` : "";
    prompt.classList.toggle("hidden", !msg);
  }
  function renderText() {
    TM.renderText(display, target, typed, cfg.highlightErrors);
    const cur = display.querySelector(".current");
    if (cur) {
      const lh = parseFloat(getComputedStyle(display).lineHeight) || 40;
      if (
        cur.offsetTop > display.scrollTop + lh * 3 ||
        cur.offsetTop < display.scrollTop
      )
        display.scrollTop = Math.max(0, cur.offsetTop - lh);
    }
  }
  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function focusCapture() {
    if (modalOpen()) return;
    if (document.activeElement !== capture)
      capture.focus({ preventScroll: true });
  }

  /* ---------- session lifecycle ---------- */
  function resetState() {
    stopTimer();
    typed = "";
    started = null;
    lastKeyAt = null;
    activeMs = 0;
    done = false;
    active = false;
    recording = [];
    keyEvents = [];
    blockedErrorPositions = new Set();
    cfg = TM.settings();
    lastSession = null;
    closeReplay();
    result.classList.add("hidden");
    result.innerHTML = "";
    $("previewSessionBtn").classList.add("hidden");
    $("practiceHint").textContent =
      "Esc pauses · statistics save when the passage is complete";
    display.scrollTop = 0;
    renderText();
    update();
    TM.renderLetterBar($("letterBar"), { detail: true });
    renderPrompt();
    focusCapture();
  }
  const fresh = () => {
    target = TM.makeText(
      Number($("practiceWords").value || cfg.wordCount || 50),
    );
    resetState();
  };
  const reset = () => resetState(); // same text, attempt discarded

  function buildSession() {
    const m = metrics(),
      dur = Math.max(1, Math.round(m.sec));
    return {
      type: "Practice",
      title: "Free practice",
      wpm: m.wpm,
      accuracy: Number(m.acc.toFixed(1)),
      errors: m.errors,
      duration: dur,
      correctChars: correctChars(),
      totalChars: m.total,
      smoothness: smoothnessScore(),
      detail: "free-practice",
      targetText: target,
      typedText: typed,
      recording,
      keyEvents,
      _m: m,
    };
  }
  function sessionKeyAnalysis() {
    const byKey = new Map();
    for (const ev of keyEvents) {
      const key = TM.normalizeKey(ev.expected);
      if (!key) continue;
      if (!byKey.has(key))
        byKey.set(key, {
          key,
          attempts: 0,
          correct: 0,
          errors: 0,
          msTotal: 0,
          msSamples: 0,
        });
      const row = byKey.get(key);
      row.attempts++;
      if (ev.correct) row.correct++;
      else row.errors++;
      const ms = Number(ev.ms);
      if (Number.isFinite(ms) && ms > 0) {
        row.msTotal += Math.min(ms, 5000);
        row.msSamples++;
      }
    }
    const rows = [...byKey.values()].sort(
      (a, b) => b.errors - a.errors || a.key.localeCompare(b.key),
    );
    if (!rows.length)
      return '<p class="muted">No individual key data was recorded.</p>';
    const label = (k) => (k === " " ? "Space" : k.toUpperCase());
    return `<div class="table-scroll session-key-table"><table><thead><tr><th>KEY</th><th>ATTEMPTS</th><th>ACCURACY</th><th>ERRORS</th><th>AVG. RESPONSE</th></tr></thead><tbody>${rows
      .map((r) => {
        const acc = r.attempts ? (r.correct / r.attempts) * 100 : 0,
          avg = r.msSamples ? r.msTotal / r.msSamples : 0;
        return `<tr><td><b>${TM.escapeHtml(label(r.key))}</b></td><td>${r.attempts}</td><td>${acc.toFixed(1)}%</td><td>${r.errors}</td><td>${avg ? `${Math.round(avg)} ms` : "—"}</td></tr>`;
      })
      .join("")}</tbody></table></div>`;
  }

  function finish() {
    if (done) return;
    if (!keyEvents.length) {
      result.classList.remove("hidden");
      result.innerHTML =
        '<div class="eyebrow">SESSION NOT STARTED</div><h2>Type a few characters first.</h2><p>Your session is saved when you finish after typing. Use Reset to start over or Next text for a new passage.</p>';
      return;
    }
    const before = TM.letterState().unlocked;
    done = true;
    active = false;
    stopTimer();
    const s = buildSession(),
      m = s._m;
    delete s._m;
    TM.saveResult({ ...s });
    lastSession = { ...s };
    const after = TM.letterState().unlocked,
      newOnes =
        after.length > before.length
          ? after.slice(before.length).toUpperCase().split("").join(", ")
          : "";
    TM.renderLetterBar($("letterBar"), { detail: true });
    renderPrompt();
    update();
    result.classList.add("hidden");
    result.innerHTML = "";
    $("previewSessionBtn").classList.remove("hidden");
    $("practiceHint").textContent = newOnes
      ? `Session complete · unlocked ${newOnes} · preview or continue`
      : "Session complete · preview or continue";
    $("previewSessionBtn").onclick = () => openReplay(lastSession);

    // Keep the typing area in place; session results appear below without forcing the page to scroll.
  }
  // Incomplete attempts are deliberately discarded; only finish() records a completed passage.
  function next() {
    entryPrompt = false;
    fresh();
  }

  /* ---------- keyboard input (no visible text box) ---------- */
  function start() {
    if (done) return;
    entryPrompt = false;
    cfg = TM.settings();
    active = true;
    lastKeyAt = null;
    if (!timer) timer = setInterval(update, 250);
    renderPrompt();
    renderText();
  }
  function pause() {
    if (!active) return;
    if (lastKeyAt) activeMs += Math.min(Date.now() - lastKeyAt, IDLE_CAP_MS);
    lastKeyAt = null;
    active = false;
    stopTimer();
    renderPrompt();
    update();
  }
  function press(ch) {
    if (done || typed.length >= target.length) return;
    if (!active) start();
    const now = Date.now();
    if (!started) started = now;
    const ms = lastKeyAt ? now - lastKeyAt : 0;
    if (lastKeyAt) activeMs += Math.min(ms, IDLE_CAP_MS);
    lastKeyAt = now;
    const index = typed.length,
      expected = target[index],
      ok = ch === expected,
      t = now - started;
    const blocked = !ok && cfg.stopAtError;
    keyEvents.push({ expected, actual: ch, correct: ok, ms, index, blocked });
    if (blocked) {
      blockedErrorPositions.add(index);
      // Stop cursor at error: the mistake is counted, but the cursor stays until the right character is typed.
      recording.push([t, "e", index]);
      renderText();
      const cur = display.querySelector(".current");
      if (cur) {
        cur.classList.add("blocked");
        setTimeout(() => cur.classList.remove("blocked"), 260);
      }
      update();
      return;
    }
    typed += ch;
    recording.push([t, "i", index, ch]);
    renderText();
    update();
    if (typed === target) finish();
  }
  function backspace() {
    if (!active || done || !typed.length) return;
    // Backspace is confined to the current word. A trailing space means the
    // previous word is complete, so Backspace must not cross that boundary.
    const wordStart = typed.lastIndexOf(" ") + 1;
    if (typed.length <= wordStart) return;
    const now = Date.now();
    if (lastKeyAt) activeMs += Math.min(now - lastKeyAt, IDLE_CAP_MS);
    lastKeyAt = now;
    recording.push([started ? now - started : 0, "d", typed.length - 1, 1]);
    typed = typed.slice(0, -1);
    renderText();
    update();
  }
  capture.addEventListener("keydown", (e) => {
    if (modalOpen()) {
      return;
    }
    if (e.key === "Tab") return; // let Tab move focus normally
    if (e.key === "Enter") {
      e.preventDefault();
      if (done) next();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      pause();
      return;
    }
    if (e.ctrlKey || e.metaKey || (e.altKey && !e.getModifierState("AltGraph")))
      return;
    if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
      return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
      press(e.key);
    }
  });
  // Fallback for on-screen / IME keyboards that do not report normal key events.
  capture.addEventListener("input", () => {
    const v = capture.value;
    capture.value = "";
    if (active) for (const ch of v) press(ch);
  });
  capture.addEventListener("focus", () => {
    focused = true;
    renderPrompt();
  });
  capture.addEventListener("blur", () => {
    focused = false;
    pause();
    renderPrompt();
  });
  // Mouse on the practice area selects the typing space; it stays selected until something else is used.
  // Focusing the hidden input must not dismiss the entry prompt. The prompt clears on the first typed key.
  $("practicePanel").addEventListener("mouseenter", () => {
    const a = document.activeElement;
    if (a && (a.tagName === "SELECT" || a.tagName === "INPUT")) return;
    focusCapture();
  });
  area.addEventListener("mousedown", (e) => {
    e.preventDefault();
    focusCapture();
  });

  /* ---------- controls ---------- */
  $("resetPractice").addEventListener("click", reset);
  $("nextPractice").addEventListener("click", next);
  const wc = [25, 50, 100].includes(Number(cfg.wordCount)) ? cfg.wordCount : 50;
  $("practiceWords").value = String(wc);
  $("practiceWords").addEventListener("change", () => {
    TM.save("typeSettings", {
      ...TM.settings(),
      wordCount: Number($("practiceWords").value),
    });
    fresh();
  });

  /* ---------- in-page session preview (kept only until the next session) ---------- */
  const modal = $("replayModal"),
    replayText = $("replayText"),
    playBtn = $("replayPlay"),
    scrub = $("replayScrub");
  let frames = [],
    frameIdx = 0,
    replayTimer = null,
    replayPlaying = false,
    replayTarget = "";
  const modalOpen = () => modal.classList.contains("open");
  // Pre-compute every state of the typed text so the preview can play, pause and seek reliably.
  function buildFrames(target, rec) {
    const out = [{ t: 0, value: "", note: "Ready to replay.", err: false }];
    let v = "";
    for (const e of rec) {
      const t = Number(e[0]) || 0;
      let note,
        err = false;
      if (e[1] === "i") {
        v = v.slice(0, e[2]) + e[3] + v.slice(e[2]);
        note = `Typed “${String(e[3]).replace(/ /g, "␠")}”`;
      } else if (e[1] === "d") {
        v = v.slice(0, e[2]) + v.slice(e[2] + (Number(e[3]) || 1));
        note = "Backspace";
      } else {
        note = "Wrong key · cursor held";
        err = true;
      }
      out.push({ t, value: v, note, err });
    }
    return out;
  }
  function stopReplay() {
    replayPlaying = false;
    clearTimeout(replayTimer);
    replayTimer = null;
    playBtn.textContent = "▶ Play preview";
  }
  function showFrame(i) {
    frameIdx = Math.max(0, Math.min(frames.length - 1, i));
    if (frameIdx === 0) replayText.scrollTop = 0;
    const f = frames[frameIdx];
    TM.renderText(replayText, replayTarget, f.value, true);
    const cur = replayText.querySelector(".current");
    if (cur && f.err) cur.classList.add("incorrect");
    if (cur) {
      const box = replayText.getBoundingClientRect(),
        rect = cur.getBoundingClientRect(),
        lh = parseFloat(getComputedStyle(replayText).lineHeight) || 34;
      // Keep the current line visible, but do not reset scrollTop on every frame (which traps manual scrolling).
      if (rect.bottom > box.bottom - 12)
        replayText.scrollTop += Math.max(lh, rect.bottom - box.bottom + lh);
      else if (rect.top < box.top + 12)
        replayText.scrollTop = Math.max(
          0,
          replayText.scrollTop - Math.max(lh, box.top - rect.top + lh),
        );
    }
    $("replayStatus").textContent = f.note;
    $("replayPosition").textContent =
      `${frameIdx} / ${frames.length - 1} actions`;
    scrub.value = frameIdx;
  }
  function tick() {
    if (!replayPlaying) return;
    if (frameIdx >= frames.length - 1) {
      stopReplay();
      $("replayStatus").textContent = "Replay complete.";
      return;
    }
    showFrame(frameIdx + 1);
    if (frameIdx >= frames.length - 1) {
      stopReplay();
      $("replayStatus").textContent = "Replay complete.";
      return;
    }
    const speed = Math.min(2, Number($("replaySpeed").value) || 2),
      delta = Math.max(0, frames[frameIdx + 1].t - frames[frameIdx].t);
    replayTimer = setTimeout(tick, Math.max(15, Math.min(500, delta / speed)));
  }
  function startReplay() {
    if (frames.length < 2) return;
    if (replayPlaying) {
      stopReplay();
      return;
    }
    if (frameIdx >= frames.length - 1) showFrame(0);
    replayPlaying = true;
    playBtn.textContent = "Ⅱ Pause";
    const speed = Math.min(2, Number($("replaySpeed").value) || 2),
      delta = Math.max(
        0,
        frames[Math.min(frames.length - 1, frameIdx + 1)].t -
          frames[frameIdx].t,
      );
    replayTimer = setTimeout(tick, Math.max(15, Math.min(500, delta / speed)));
  }
  function openReplay(sess) {
    if (!sess) return;
    pause();
    capture.blur();
    replayTarget = sess.targetText;
    frames = buildFrames(sess.targetText, sess.recording || []);
    scrub.max = Math.max(0, frames.length - 1);
    $("replaySubtitle").textContent =
      `${sess.wpm} WPM · ${sess.accuracy.toFixed(1)}% accuracy · ${sess.errors} ${sess.errors === 1 ? "typo" : "typos"}`;
    $("replayMetrics").innerHTML =
      `<div><small>WPM</small><b>${sess.wpm}</b></div><div><small>ACCURACY</small><b>${sess.accuracy.toFixed(1)}%</b></div><div><small>TYPOS INCLUDING CORRECTED</small><b>${sess.errors}</b></div><div><small>TIME</small><b>${TM.duration(sess.duration)}</b></div>`;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("replay-open");
    replayText.scrollTop = 0;
    stopReplay();
    showFrame(0);
    startReplay();
    $("replayPlay").focus();
  }
  function closeReplay() {
    stopReplay();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("replay-open");
  }
  const closeAndFocus = () => {
    closeReplay();
    focusCapture();
  };
  playBtn.addEventListener("click", startReplay);
  $("replayRestart").addEventListener("click", () => {
    stopReplay();
    showFrame(0);
    startReplay();
  });
  scrub.addEventListener("input", () => {
    stopReplay();
    showFrame(Number(scrub.value));
  });
  $("replaySpeed").addEventListener("change", () => {
    if (replayPlaying) {
      clearTimeout(replayTimer);
      replayPlaying = false;
      startReplay();
    }
  });
  $("closeReplay").addEventListener("click", closeAndFocus);
  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close-replay")) closeAndFocus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOpen()) {
      e.preventDefault();
      closeAndFocus();
    }
  });

  // Entering/re-entering the Practice page always starts with the welcome prompt.
  entryPrompt = true;
  fresh();
  renderPrompt();
  window.addEventListener("pageshow", () => {
    entryPrompt = true;
    cfg = TM.settings();
    $("practiceWords").value = String(cfg.wordCount || 50);
    fresh();
  });
});
