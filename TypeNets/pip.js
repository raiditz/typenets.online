/* Pip: the TypeNets co-pilot mascot. Cartoon pilot in the site's lime + dark theme.
   TPPip.markup()                  -> SVG string
   TPPip.mount(el, {bubble:true})  -> inserts mascot (+ speech bubble) into el, returns controller
   controller.mood(name)           -> idle | happy | wow | oops | think
   controller.say(text, mood, ms)  -> shows speech bubble, optionally returns to idle after ms
   TPPip.verdict(acc, wpm, hint)   -> {mood, text} comment for a performance */
window.TPPip = (() => {
  const markup =
    () => `<svg class="pip idle" viewBox="0 0 140 140" role="img" aria-label="Pip, your co-pilot">
  <g class="pip-sparks"><path d="M18 24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M122 18l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4z"/><path d="M126 70l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z"/></g>
  <g class="pip-body">
   <path class="pip-wing pip-wl" d="M26 78 L4 60 Q2 88 20 100 Z"/>
   <path class="pip-wing pip-wr" d="M114 78 L136 60 Q138 88 120 100 Z"/>
   <path class="pip-scarf" d="M38 106 Q70 124 102 106 L106 118 Q70 138 34 118 Z"/>
   <path class="pip-scarf-tail" d="M96 114 L118 128 L104 132 L90 122 Z"/>
   <ellipse class="pip-skin" cx="70" cy="80" rx="44" ry="40"/>
   <ellipse class="pip-belly" cx="70" cy="92" rx="28" ry="22"/>
   <path class="pip-cap" d="M24 70 Q22 26 70 26 Q118 26 116 70 Q94 54 70 54 Q46 54 24 70Z"/>
   <path class="pip-strap" d="M26 58 Q70 40 114 58 L114 63 Q70 46 26 63Z"/>
   <circle class="pip-lens" cx="52" cy="42" r="10"/><circle class="pip-lens" cx="88" cy="42" r="10"/>
   <rect class="pip-bridge" x="60" y="39" width="20" height="6" rx="3"/>
   <circle class="pip-glint" cx="49" cy="39" r="3"/><circle class="pip-glint" cx="85" cy="39" r="3"/>
   <g class="mx mx-idle mx-think mx-oops"><circle class="pip-eye" cx="54" cy="78" r="12"/><circle class="pip-eye" cx="86" cy="78" r="12"/>
     <circle class="pip-pupil pupil-l" cx="56" cy="80" r="6"/><circle class="pip-pupil pupil-r" cx="88" cy="80" r="6"/>
     <circle class="pip-spark" cx="58" cy="77" r="2"/><circle class="pip-spark" cx="90" cy="77" r="2"/></g>
   <g class="mx mx-wow"><circle class="pip-eye" cx="54" cy="78" r="15"/><circle class="pip-eye" cx="86" cy="78" r="15"/>
     <circle class="pip-pupil" cx="54" cy="78" r="5"/><circle class="pip-pupil" cx="86" cy="78" r="5"/></g>
   <g class="mx mx-happy"><path class="pip-arc" d="M43 82 Q54 68 65 82"/><path class="pip-arc" d="M75 82 Q86 68 97 82"/></g>
   <g class="mx mx-oops"><path class="pip-brow" d="M42 60 L64 66"/><path class="pip-brow" d="M98 60 L76 66"/><path class="pip-sweat" d="M112 62 q6 9 0 13 q-6 -4 0 -13z"/></g>
   <g class="mx mx-think"><path class="pip-brow" d="M42 64 L64 62"/><path class="pip-brow" d="M76 58 L98 62"/></g>
   <ellipse class="pip-cheek" cx="40" cy="94" rx="7" ry="4.5"/><ellipse class="pip-cheek" cx="100" cy="94" rx="7" ry="4.5"/>
   <path class="pip-beak mx mx-idle" d="M58 96 Q70 106 82 96"/>
   <path class="pip-mouth-big mx mx-happy" d="M56 94 Q70 114 84 94 Z"/>
   <ellipse class="pip-mouth-o mx mx-wow" cx="70" cy="101" rx="7" ry="9"/>
   <path class="pip-beak mx mx-oops" d="M58 104 Q70 94 82 104"/>
   <path class="pip-beak mx mx-think" d="M60 100 L80 98"/>
  </g></svg>`;

  function mount(el, opts = {}) {
    el.classList.add("pip-wrap");
    el.innerHTML = `${opts.bubble === false ? "" : '<div class="pip-bubble" role="status" aria-live="polite"><span class="pip-text"></span></div>'}${markup()}`;
    const svg = el.querySelector("svg"),
      bubble = el.querySelector(".pip-bubble"),
      textEl = el.querySelector(".pip-text");
    let timer = null;
    const moods = ["idle", "happy", "wow", "oops", "think"];
    const ctl = {
      el,
      svg,
      mood(m) {
        moods.forEach((x) => svg.classList.remove(x));
        svg.classList.add(moods.includes(m) ? m : "idle");
        svg.classList.remove("hop");
        void svg.getBoundingClientRect();
        if (m === "happy" || m === "wow") svg.classList.add("hop");
      },
      say(text, m = "idle", ms = 0) {
        clearTimeout(timer);
        ctl.mood(m);
        if (bubble) {
          textEl.textContent = text;
          bubble.classList.remove("pop");
          void bubble.offsetWidth;
          bubble.classList.add("pop", "show");
          bubble.dataset.mood = m;
        }
        if (ms) timer = setTimeout(() => ctl.mood("idle"), ms);
      },
      quiet() {
        if (bubble) bubble.classList.remove("show");
        ctl.mood("idle");
      },
    };
    return ctl;
  }

  const pickFrom = (a) => a[Math.floor(Math.random() * a.length)];
  function verdict(acc, wpm, hint) {
    let r;
    if (acc >= 98)
      r = {
        mood: "wow",
        text: pickFrom([
          "Fabulous! Flawless flying!",
          "Absolutely stellar!",
          "Wow, not a single wobble!",
          "Fabulous work, captain!",
        ]),
      };
    else if (acc >= 95)
      r = {
        mood: "happy",
        text: pickFrom([
          "Great work! Smooth landing!",
          "Great job, keep that rhythm!",
          "Nicely done, pilot!",
        ]),
      };
    else if (acc >= 90)
      r = {
        mood: "happy",
        text: pickFrom([
          "Good job! Almost perfect.",
          "Nice flying! A little more care and it is perfect.",
        ]),
      };
    else if (acc >= 80)
      r = {
        mood: "think",
        text: pickFrom([
          "Not bad, but slow down a little. Accuracy first!",
          "You can do better. Eyes on the glowing key.",
        ]),
      };
    else
      r = {
        mood: "oops",
        text: pickFrom([
          "Needs improvement. Slow down and watch each key.",
          "Turbulence! Let us try that again, slower this time.",
        ]),
      };
    if (hint && acc < 98) r.text += " " + hint;
    return r;
  }
  return { markup, mount, verdict };
})();
