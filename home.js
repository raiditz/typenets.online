document.addEventListener("DOMContentLoaded", () => {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"],
    kb = document.getElementById("homeKb"),
    st = TM.letterState(),
    active = new Set(st.unlocked.split(""));
  // Live keyboard: keys show your real mastery (fill) and light up as you press them on your own keyboard.
  kb.innerHTML =
    rows
      .map(
        (r) =>
          `<div class="home-kb-row">${[...r]
            .map((k) => {
              const p = TM.keyPerformance(k),
                on = !st.enabled || active.has(k);
              return `<div class="hk ${on ? "" : "dim"}" data-k="${k}"><i style="height:${on ? Math.round(p.mastery * 100) : 0}%"></i><span>${k}</span></div>`;
            })
            .join("")}</div>`,
      )
      .join("") +
    '<div class="home-kb-row"><div class="hk space" data-k=" "><span>&nbsp;</span></div></div>';
  const el = (k) => kb.querySelector(`[data-k="${CSS.escape(k)}"]`);
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Enter" &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      (document.activeElement === document.body || !document.activeElement)
    ) {
      const go = document.querySelector(".home-cta");
      if (go) go.click();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = el(e.key.toLowerCase());
    if (k) k.classList.add("press");
  });
  document.addEventListener("keyup", (e) => {
    const k = el(e.key.toLowerCase());
    if (k) k.classList.remove("press");
  });
  window.addEventListener("blur", () =>
    kb.querySelectorAll(".press").forEach((x) => x.classList.remove("press")),
  );
  // One-line description, typed out once with a minimal caret.
  const tl = document.getElementById("homeType"),
    tt = document.getElementById("homeTypeText");
  if (tl && tt) {
    const full = tl.dataset.text || "",
      still =
        window.matchMedia &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      tt.textContent = full;
      tl.classList.add("done");
    } else {
      let i = 0;
      const step = () => {
        i++;
        tt.textContent = full.slice(0, i);
        if (i < full.length) setTimeout(step, 48 + Math.random() * 50);
        else tl.classList.add("done");
      };
      setTimeout(step, 500);
    }
  }
});
