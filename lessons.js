document.addEventListener("DOMContentLoaded", () => {
  const D = window.TP_LESSONS,
    $ = (id) => document.getElementById(id),
    esc = TM.escapeHtml;
  const prog = TM.get("lessonProgressV3", {}),
    done = (l) => prog[l.id] && prog[l.id].done;
  const next = D.lessons.find((l) => !done(l)),
    finished = D.lessons.filter(done);
  const stars = finished.reduce((n, l) => n + (prog[l.id].stars || 0), 0),
    acc = finished.length
      ? Math.round(
          finished.reduce((n, l) => n + (prog[l.id].acc || 0), 0) /
            finished.length,
        )
      : null;
  $("hsDone").textContent = `${finished.length} / ${D.lessons.length}`;
  $("hsStars").textContent = stars;
  $("hsAcc").textContent = acc === null ? "–" : acc + "%";
  $("hsBar").style.width =
    Math.round((finished.length / D.lessons.length) * 100) + "%";
  $("hsGo").href = `lesson.html?id=${(next || D.lessons[0]).id}`;
  $("hsGo").textContent = !finished.length
    ? "Start lesson 1 →"
    : next
      ? `Continue: ${next.title} →`
      : "All done! Replay any lesson ↓";
  const pip = TPPip.mount($("heroPip"));
  setTimeout(
    () =>
      pip.say(
        !finished.length
          ? "Hi, I'm Pip! Ready for takeoff?"
          : next
            ? `Welcome back! Lesson ${next.id} is next.`
            : "You finished every lesson. Fabulous!",
        finished.length === D.lessons.length ? "wow" : "happy",
      ),
    250,
  );
  const keyChips = (l) => {
    const ks = Array.from(l.keys).filter((c) => c !== " ");
    const show = ks.length > 7 ? ks.slice(0, 6) : ks;
    return (
      show
        .map(
          (c) =>
            `<span class="lc-key">${esc(c.toUpperCase() === "\\" ? "\\" : c.length && /[a-z]/.test(c) && !l.shift ? c.toUpperCase() : c)}</span>`,
        )
        .join("") +
        (ks.length > 7
          ? `<span class="lc-key more">+${ks.length - 6}</span>`
          : "") || '<span class="lc-key more">Mixed practice</span>'
    );
  };
  $("modules").innerHTML = D.modules
    .map((m) => {
      const ls = D.lessons.filter((l) => l.module === m.id),
        n = ls.filter(done).length;
      return `<section class="lc-module" style="--mc:${m.color}"><div class="lc-mhead"><div class="lc-mbadge">${m.id}</div><div><h2>${esc(m.title)}</h2><p>${esc(m.blurb)}</p></div><span class="lc-mcount">${n} / ${ls.length} DONE</span></div><div class="lc-grid">${ls
        .map((l) => {
          const p = prog[l.id] || {},
            s = p.stars || 0;
          return `<a class="lc-card ${p.done ? "done" : ""} ${next && next.id === l.id ? "next" : ""}" href="lesson.html?id=${l.id}" style="--mc:${m.color}">${next && next.id === l.id ? '<span class="lc-pill-next">UP NEXT</span>' : ""}<div class="lc-top"><span>LESSON ${String(l.id).padStart(2, "0")}</span><span class="lc-stars">${[1, 2, 3].map((i) => (i <= s ? "<b>★</b>" : "★")).join("")}</span></div><div class="lc-keys">${keyChips(l)}</div><h3>${esc(l.title)}</h3><div class="lc-meta"><span>Guide</span><span>3 drills</span><span>2 games</span></div><div class="lc-cta"><span>${p.done ? `${p.acc}% accuracy · ${p.wpm} WPM` : "Start"}</span><span>→</span></div></a>`;
        })
        .join("")}</div></section>`;
    })
    .join("");
  if (next) {
    const c = document.querySelector(".lc-card.next");
    if (c && location.hash === "#continue")
      c.scrollIntoView({ block: "center" });
  }

  /* ---------- generated lessons: pick 1-5 letters on the A-Z bar ---------- */
  const MAX_LETTERS = 5,
    picked = [];
  const genBar = $("genBar"),
    genCount = $("genCount"),
    genGo = $("genGo"),
    genMsg = $("genMsg"),
    selLessons = $("genLessons"),
    selBoxes = $("genBoxes");
  selLessons.innerHTML = Array.from(
    { length: 10 },
    (_, i) =>
      `<option value="${i + 1}"${i === 4 ? " selected" : ""}>${i + 1} lesson${i ? "s" : ""}</option>`,
  ).join("");
  selBoxes.innerHTML = [20, 30, 40, 60, 80, 100]
    .map(
      (n) =>
        `<option value="${n}"${n === 40 ? " selected" : ""}>${n} boxes</option>`,
    )
    .join("");
  const mastery = (k) => {
    try {
      return Math.round((TM.keyPerformance(k).mastery || 0) * 100);
    } catch (_) {
      return 0;
    }
  };
  genBar.innerHTML = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .map(
      (k) =>
        `<button type="button" class="gen-key" data-k="${k}" aria-pressed="false" title="${k.toUpperCase()} · ${mastery(k)}% mastery"><i style="height:${mastery(k)}%"></i><b>${k}</b></button>`,
    )
    .join("");
  const paintGen = () => {
    genBar.querySelectorAll(".gen-key").forEach((b) => {
      const on = picked.includes(b.dataset.k);
      b.classList.toggle("sel", on);
      b.setAttribute("aria-pressed", on);
      b.disabled = !on && picked.length >= MAX_LETTERS;
    });
    genCount.textContent = `${picked.length} / ${MAX_LETTERS} letters`;
    genCount.classList.toggle("full", picked.length >= MAX_LETTERS);
    genGo.disabled = !picked.length;
    genMsg.textContent = picked.length
      ? `Letters: ${picked
          .slice()
          .sort()
          .map((x) => x.toUpperCase())
          .join(", ")}`
      : "Tap letters to choose them. You can pick up to five.";
  };
  genBar.addEventListener("click", (e) => {
    const b = e.target.closest(".gen-key");
    if (!b || b.disabled) return;
    const k = b.dataset.k,
      i = picked.indexOf(k);
    if (i >= 0) picked.splice(i, 1);
    else if (picked.length < MAX_LETTERS) picked.push(k);
    paintGen();
  });
  $("genClear").addEventListener("click", () => {
    picked.length = 0;
    paintGen();
  });
  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });
    } catch (_) {
      return "";
    }
  };
  function renderCustom(freshSet) {
    const all = TM.customLessons(),
      cp = TM.customProgress(),
      box = $("custom");
    if (!all.length) {
      box.innerHTML = "";
      return;
    }
    const sets = [];
    all.forEach((l) => {
      let s = sets.find((x) => x.id === l.setId);
      if (!s)
        sets.push(
          (s = {
            id: l.setId,
            letters: l.letters,
            boxes: l.boxes,
            at: l.createdAt,
            items: [],
          }),
        );
      s.items.push(l);
    });
    sets.reverse(); // newest first
    box.innerHTML = sets
      .map((s) => {
        const items = s.items.slice().sort((a, b) => a.index - b.index),
          n = items.filter((l) => cp[l.id] && cp[l.id].done).length,
          lt = s.letters.map((x) => x.toUpperCase());
        return `<section class="lc-module" data-set="${esc(s.id)}" style="--mc:#4dabf7"><div class="lc-mhead"><div class="lc-mbadge">★</div><div><h2>Letters ${esc(lt.join(" · "))}</h2><p>Generated set · ${items.length} lesson${items.length > 1 ? "s" : ""} · ${s.boxes} boxes per drill${fmtDate(s.at) ? " · " + fmtDate(s.at) : ""}</p></div><span class="lc-mcount">${n} / ${items.length} DONE</span><button class="lc-del" type="button" data-del="${esc(s.id)}" aria-label="Delete this generated set">Delete</button></div><div class="lc-grid">${items
          .map((l) => {
            const p = cp[l.id] || {},
              st = p.stars || 0;
            return `<a class="lc-card ${p.done ? "done" : ""} ${freshSet === s.id && l.index === 1 ? "fresh" : ""}" href="lesson.html?custom=${encodeURIComponent(l.id)}" style="--mc:#4dabf7"><div class="lc-top"><span>LESSON ${String(l.index).padStart(2, "0")}</span><span class="lc-stars">${[1, 2, 3].map((i) => (i <= st ? "<b>★</b>" : "★")).join("")}</span></div><div class="lc-keys">${l.letters.map((c) => `<span class="lc-key">${esc(c.toUpperCase())}</span>`).join("")}</div><h3>${esc(l.title)}</h3><div class="lc-meta"><span>Guide</span><span>5 drills</span><span>2 games</span></div><div class="lc-cta"><span>${p.done ? `${p.acc}% accuracy · ${p.wpm} WPM` : "Start"}</span><span>→</span></div></a>`;
          })
          .join("")}</div></section>`;
      })
      .join("");
  }
  $("custom").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    if (!confirm("Delete this generated set and its progress?")) return;
    const id = b.dataset.del,
      cp = TM.customProgress();
    const keep = TM.customLessons().filter((l) => {
      if (l.setId !== id) return true;
      delete cp[l.id];
      return false;
    });
    TM.save("customLessonsV1", keep);
    TM.save("customProgressV1", cp);
    renderCustom();
  });
  genGo.addEventListener("click", () => {
    if (!picked.length) return;
    const made = TM.genLessons(
      picked,
      Number(selLessons.value) || 5,
      Number(selBoxes.value) || 40,
    );
    TM.save("customLessonsV1", TM.customLessons().concat(made));
    renderCustom(made[0].setId);
    const sec = document.querySelector(`[data-set="${made[0].setId}"]`);
    if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    pip.say(
      `Your ${made.length} new lesson${made.length > 1 ? "s are" : " is"} ready!`,
      "happy",
    );
    picked.length = 0;
    paintGen();
    genMsg.textContent = `Done! ${made.length} lesson${made.length > 1 ? "s" : ""} added below.`;
  });
  paintGen();
  renderCustom();
});
