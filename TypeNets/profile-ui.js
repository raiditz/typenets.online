/* TypeNets profile: username + avatar editor shared by the solo test and multiplayer pages.
   - Username availability is checked live while typing; taken names get clickable free suggestions.
   - Avatars open in a small popover that closes the moment one is chosen.
   - Creating the first username is free; afterwards 2 username changes per calendar month (avatar changes are free).
   - The saved username is the display name for the leaderboard AND multiplayer races.
   Pages include <div id="tpProfileMount"></div> (add data-autopen to open the editor automatically for new users). */
(function () {
  "use strict";
  const LB = window.TPLeaderboard;
  const AVATARS = [
    "😀","😎","🤓","🥳","😊","🤠","🧐","😺","🐱","🐼","🐨","🐯","🦊","🐸","🐵","🐧","🦉",
    "🦄","🐲","🐙","🦋","🐝","🐢","🦖","🦈","🐬","🦜","🦚","🦁","🐻","🐰","🦝","🐮","🐷",
    "🐶","🐹","🐣","🦩","🐳","🦕","🍀","🌟","🔥","⚡","🌈","🎯","🚀","🎮",
  ];
  const MONTHLY_LIMIT = 2,
    DEBOUNCE_MS = 300;
  const esc = (s) =>
    String(s == null ? "" : s).replace(
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
  const configured = () => !!(LB && LB.configured && LB.configured());

  let profile = null,
    status = null,
    loadError = false;
  let selected = 0,
    seq = 0,
    timer = null,
    check = { state: "empty" },
    note = "",
    suggestions = null,
    saving = false,
    formMsg = "";
  let modal = null,
    els = {},
    opener = null,
    panelFlash = false;
  const waiters = [];
  const settle = (ok) => {
    while (waiters.length) waiters.shift()(ok);
  };

  /* ---------- data ---------- */
  const remaining = () =>
    status &&
    status.changes_remaining != null &&
    Number.isFinite(Number(status.changes_remaining))
      ? Number(status.changes_remaining)
      : null;
  const isLocked = () => !!profile && remaining() === 0;
  function resetLabel() {
    let d =
      status && status.next_change_at ? new Date(status.next_change_at) : null;
    if (!d || isNaN(d)) {
      const n = new Date();
      d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 1));
    }
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  }
  const plural = (n) => n + " username change" + (n === 1 ? "" : "s");

  const ready = (async () => {
    if (!configured()) return null;
    try {
      profile = await LB.profile();
    } catch (_) {
      loadError = true;
      profile = LB.cachedProfile ? LB.cachedProfile() : null;
    }
    if (profile && profile.username) status = await LB.usernameStatus();
    else profile = null;
    paintPanel();
    return profile;
  })();

  /* ---------- page panel ---------- */
  function renderMount() {
    const mount = document.getElementById("tpProfileMount");
    if (!mount) return;
    mount.innerHTML =
      '<section class="panel tpp-panel" id="tpProfilePanel"><div class="tpp-who"><span class="tpp-ava" id="tpProfileAvatar" aria-hidden="true">👤</span><div class="tpp-who-text"><div class="tpp-name" id="tpProfileDisplay"></div><div class="tpp-sub" id="tpProfileSub"></div></div></div><button class="btn btn-secondary" type="button" id="tpOpenProfile"></button></section>';
    document
      .getElementById("tpOpenProfile")
      .addEventListener("click", () => open(false));
    paintPanel();
  }
  function paintPanel() {
    const av = document.getElementById("tpProfileAvatar");
    if (!av) return;
    const nameEl = document.getElementById("tpProfileDisplay"),
      sub = document.getElementById("tpProfileSub"),
      btn = document.getElementById("tpOpenProfile");
    if (!configured()) {
      av.textContent = "👤";
      nameEl.textContent = "Profile unavailable";
      sub.textContent =
        "Add your Supabase keys in supabase-config.js to enable usernames.";
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    if (profile && profile.username) {
      av.textContent = AVATARS[Number(profile.avatar_id) || 0] || AVATARS[0];
      nameEl.textContent = "@" + profile.username;
      const r = remaining();
      sub.classList.toggle("is-warn", r === 0 && !panelFlash);
      sub.textContent = panelFlash
        ? "Profile saved ✓"
        : "Your name on the leaderboard and in multiplayer races · " +
          (r === null
            ? MONTHLY_LIMIT + " username changes per month"
            : r === 0
              ? "no username changes left until " + resetLabel()
              : plural(r) + " left this month");
      btn.textContent = "Edit profile";
    } else {
      av.textContent = "👤";
      nameEl.textContent = "Choose your username";
      sub.classList.remove("is-warn");
      sub.textContent =
        "Needed for the leaderboard and multiplayer races. Your first username is free.";
      btn.textContent = "Choose username";
    }
  }

  /* ---------- editor (built once, on demand) ---------- */
  function build() {
    modal = document.createElement("div");
    modal.className = "tpp-modal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="panel tpp-card" role="dialog" aria-modal="true" aria-labelledby="tppTitle">' +
      '<button type="button" class="tpp-x" id="tppClose" aria-label="Close">✕</button>' +
      '<h2 id="tppTitle"></h2><p class="tpp-intro" id="tppIntro"></p>' +
      '<form id="tppForm" novalidate>' +
      '<div class="tpp-row">' +
      '<div class="tpp-avawrap"><button type="button" class="tpp-avabtn" id="tppAvaBtn" aria-haspopup="dialog" aria-expanded="false" aria-label="Choose avatar"><span id="tppAvaCur">😀</span><i aria-hidden="true">✎</i></button>' +
      '<div class="tpp-pop" id="tppPop" role="dialog" aria-label="Choose an avatar" hidden><div class="tpp-grid" id="tppGrid"></div></div></div>' +
      '<div class="tpp-field"><label for="tppName">Username</label><div class="tpp-input" id="tppInputBox"><span aria-hidden="true">@</span>' +
      '<input id="tppName" maxlength="20" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="swift_typist" aria-describedby="tppStatus"></div></div>' +
      "</div>" +
      '<div class="tpp-status" id="tppStatus" aria-live="polite"></div>' +
      '<div class="tpp-sugg" id="tppSugg" hidden></div>' +
      '<div class="tpp-limit" id="tppLimit"></div>' +
      '<div class="tpp-actions"><button class="btn btn-primary" id="tppSave" type="submit">Save</button><button class="btn btn-secondary" id="tppCancel" type="button">Cancel</button></div>' +
      '<p class="tpp-msg" id="tppMsg" role="alert"></p>' +
      "</form></div>";
    document.body.appendChild(modal);
    [
      "Close",
      "Form",
      "AvaBtn",
      "AvaCur",
      "Pop",
      "Grid",
      "Name",
      "InputBox",
      "Status",
      "Sugg",
      "Limit",
      "Save",
      "Cancel",
      "Msg",
      "Title",
      "Intro",
    ].forEach((k) => {
      els[k.toLowerCase()] = modal.querySelector("#tpp" + k);
    });

    AVATARS.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = a;
      b.setAttribute("role", "option");
      b.setAttribute("aria-label", "Avatar " + (i + 1));
      b.addEventListener("click", () => {
        selected = i;
        paintAvatar();
        closePop(true);
        renderState();
      }); // choosing closes the popover straight away
      els.grid.appendChild(b);
    });
    els.grid.setAttribute("role", "listbox");
    els.grid.addEventListener("keydown", onGridKey);

    els.close.addEventListener("click", () => close(false));
    els.cancel.addEventListener("click", () => close(false));
    modal.addEventListener("mousedown", (e) => {
      if (!els.pop.hidden && !e.target.closest(".tpp-avawrap")) closePop(false);
    }); // click anywhere else closes it too
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close(false);
    });
    els.avabtn.addEventListener("click", () =>
      els.pop.hidden ? openPop() : closePop(true),
    );
    els.name.addEventListener("input", onInput);
    els.form.addEventListener("submit", submit);
    document.addEventListener("keydown", onKey);
  }

  function paintAvatar() {
    els.avacur.textContent = AVATARS[selected] || AVATARS[0];
    [...els.grid.children].forEach((b, i) => {
      const on = i === selected;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", String(on));
    });
  }
  function openPop() {
    els.pop.hidden = false;
    els.avabtn.setAttribute("aria-expanded", "true");
    const on = els.grid.children[selected];
    if (on) on.focus({ preventScroll: true });
  }
  function closePop(refocus) {
    if (!els.pop || els.pop.hidden) return;
    els.pop.hidden = true;
    els.avabtn.setAttribute("aria-expanded", "false");
    if (refocus) els.avabtn.focus({ preventScroll: true });
  }
  function onGridKey(e) {
    const items = [...els.grid.children],
      i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const cols =
      items.filter((x) => x.offsetTop === items[0].offsetTop).length || 1;
    const step = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: cols,
      ArrowUp: -cols,
    }[e.key];
    if (!step) return;
    e.preventDefault();
    items[Math.max(0, Math.min(items.length - 1, i + step))].focus();
  }
  function onKey(e) {
    if (!modal || modal.hidden) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (!els.pop.hidden) closePop(true);
      else close(false);
      return;
    }
    if (e.key === "Tab") {
      // keep keyboard focus inside the dialog
      const f = [
        ...modal.querySelectorAll(
          "button:not([disabled]):not([hidden]),input:not([readonly])",
        ),
      ].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const a = f[0],
        z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    }
  }

  /* ---------- username: live availability ---------- */
  function onInput() {
    const raw = els.name.value,
      clean = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
    note =
      clean !== raw.toLowerCase()
        ? "Only letters, numbers and underscores are allowed. "
        : "";
    if (clean !== raw) {
      const pos = Math.max(
        0,
        (els.name.selectionStart == null
          ? raw.length
          : els.name.selectionStart) -
          (raw.length - clean.length),
      );
      els.name.value = clean;
      els.name.setSelectionRange(pos, pos);
    }
    formMsg = "";
    schedule(DEBOUNCE_MS);
  }
  function setCheck(state) {
    check = { state };
    renderState();
  }
  function schedule(delay) {
    clearTimeout(timer);
    suggestions = null;
    const name = els.name.value,
      my = ++seq;
    if (!name) return setCheck("empty");
    if (name.length < 3) return setCheck("short");
    if (profile && name === profile.username) return setCheck("same");
    setCheck("checking");
    timer = setTimeout(async () => {
      try {
        const r = await LB.checkUsername(name);
        if (my !== seq) return; // ignore answers for text the user has already changed
        note = "";
        if (r.available)
          return setCheck(r.reason === "yours" ? "same" : "available");
        setCheck("taken");
        loadSuggestions(name, my);
      } catch (_) {
        if (my === seq) setCheck("error");
      }
    }, delay);
  }
  async function loadSuggestions(name, my) {
    suggestions = "loading";
    renderState();
    try {
      const list = await LB.suggestUsernames(name, 4);
      if (my !== seq) return;
      suggestions = list;
    } catch (_) {
      if (my !== seq) return;
      suggestions = [];
    }
    renderState();
  }

  /* ---------- rendering ---------- */
  function renderState() {
    if (!modal) return;
    const hasProfile = !!profile,
      locked = isLocked(),
      name = els.name.value,
      st = check.state;
    els.title.textContent = hasProfile
      ? "Edit your profile"
      : "Choose your username";
    els.intro.textContent = hasProfile
      ? "Your username is shown on the leaderboard and in multiplayer races."
      : "This is the name other typists see on the leaderboard and in multiplayer races.";
    els.name.readOnly = locked;
    els.inputbox.classList.toggle("is-locked", locked);
    els.inputbox.dataset.state = st;
    els.name.setAttribute("aria-invalid", String(st === "taken"));

    const msgs = {
      empty: ["", "3–20 characters: letters, numbers or underscores."],
      short: ["hint", "Keep going — usernames need at least 3 characters."],
      checking: ["wait", "Checking availability…"],
      available: ["ok", "@" + name + " is available"],
      taken: [
        "bad",
        "@" +
          name +
          " is already taken." +
          (suggestions === "loading"
            ? " Finding free names…"
            : Array.isArray(suggestions) && suggestions.length
              ? " Try one of these:"
              : ""),
      ],
      same: ["hint", "This is your current username."],
      error: ["hint", "Couldn’t check right now — you can still try saving."],
    };
    const [kind, text] = msgs[st] || msgs.empty;
    els.status.className = "tpp-status" + (kind ? " is-" + kind : "");
    els.status.textContent = (note || "") + text;

    els.sugg.replaceChildren();
    els.sugg.hidden = !(
      st === "taken" &&
      Array.isArray(suggestions) &&
      suggestions.length
    );
    if (!els.sugg.hidden)
      suggestions.forEach((n) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tpp-chip";
        b.textContent = "@" + n;
        b.title = "Use @" + n;
        b.addEventListener("click", () => {
          els.name.value = n;
          note = "";
          formMsg = "";
          schedule(0);
          els.name.focus();
        }); // click = auto-fill, then verify
        els.sugg.appendChild(b);
      });

    const r = remaining();
    const pips = hasProfile
      ? '<span class="tpp-pips" aria-hidden="true">' +
        [0, 1]
          .map(
            (i) =>
              '<b class="' + (r !== null && i >= r ? "is-used" : "") + '"></b>',
          )
          .join("") +
        "</span>"
      : "";
    let limit;
    if (!hasProfile)
      limit =
        "Your first username is free — it doesn’t use up a change. After that you can change it " +
        MONTHLY_LIMIT +
        " times per calendar month.";
    else if (r === null)
      limit =
        "You can change your username up to " +
        MONTHLY_LIMIT +
        " times per month. Avatar changes are always free.";
    else if (r === 0)
      limit =
        "You’ve used both username changes this month. You can pick a new one from " +
        resetLabel() +
        ". Your avatar is still free to change.";
    else
      limit =
        r +
        " of " +
        MONTHLY_LIMIT +
        " username changes left this month (resets " +
        resetLabel() +
        "). Avatar changes are always free.";
    els.limit.innerHTML = pips + "<span>" + esc(limit) + "</span>";
    els.limit.classList.toggle("is-warn", locked);

    const nameChanged = hasProfile ? name !== profile.username : true,
      avatarChanged = hasProfile
        ? selected !== (Number(profile.avatar_id) || 0)
        : true;
    let ok, label;
    if (!hasProfile) {
      ok = st === "available" || st === "error";
      label = "Create profile";
    } else if (nameChanged && !locked) {
      ok = st === "available" || st === "error";
      label = "Save · uses 1 change";
    } else {
      ok = avatarChanged;
      label = "Save avatar";
    }
    els.save.disabled = !ok || saving;
    els.save.textContent = saving ? "Saving…" : label;
    let msg = formMsg;
    if (
      !msg &&
      hasProfile &&
      nameChanged &&
      !locked &&
      st === "available" &&
      r !== null
    )
      msg = "Saving will leave you " + plural(r - 1) + " this month.";
    els.msg.textContent = msg;
    els.msg.classList.toggle("is-err", !!formMsg);
  }

  /* ---------- open / close / save ---------- */
  function open() {
    if (!configured()) return;
    if (!modal) build();
    opener = document.activeElement;
    formMsg = "";
    note = "";
    suggestions = null;
    saving = false;
    selected = profile ? Number(profile.avatar_id) || 0 : 0;
    els.name.value = profile ? profile.username : "";
    els.pop.hidden = true;
    els.avabtn.setAttribute("aria-expanded", "false");
    paintAvatar();
    modal.hidden = false;
    document.documentElement.classList.add("tpp-lock");
    check = { state: profile ? "same" : "empty" };
    renderState();
    setTimeout(
      () => (isLocked() ? els.avabtn : els.name).focus({ preventScroll: true }),
      0,
    );
    LB.usernameStatus().then((s) => {
      if (s) {
        status = s;
        renderState();
        paintPanel();
      }
    }); // refresh the monthly count in the background
  }
  function close(saved) {
    if (!modal || modal.hidden) return;
    clearTimeout(timer);
    seq++;
    closePop(false);
    modal.hidden = true;
    document.documentElement.classList.remove("tpp-lock");
    if (opener && opener.focus) {
      try {
        opener.focus({ preventScroll: true });
      } catch (_) {}
    }
    if (!saved) settle(!!profile);
  }
  async function submit(e) {
    e.preventDefault();
    if (saving || els.save.disabled) return;
    const name = els.name.value;
    saving = true;
    formMsg = "";
    renderState();
    try {
      const res = await LB.saveProfile(name, selected);
      profile = Object.assign({}, profile, {
        user_id: res.user_id,
        username: res.username,
        avatar_id: res.avatar_id,
      });
      status =
        (await LB.usernameStatus()) ||
        (res.changes_remaining != null
          ? Object.assign({}, status, {
              changes_remaining: res.changes_remaining,
              next_change_at: res.next_change_at,
            })
          : status);
      saving = false;
      panelFlash = true;
      paintPanel();
      setTimeout(() => {
        panelFlash = false;
        paintPanel();
      }, 2600);
      close(true);
      settle(true);
      window.dispatchEvent(
        new CustomEvent("tp:profile-saved", { detail: profile }),
      );
    } catch (err) {
      saving = false;
      const msg = String((err && err.message) || "");
      if (/duplicate|unique/i.test(msg)) {
        const my = ++seq;
        check = { state: "taken" };
        formMsg = "Someone just took that username — pick another.";
        loadSuggestions(name, my);
      } else if (/both username changes/i.test(msg)) {
        status = Object.assign({}, status, { changes_remaining: 0 });
        paintPanel();
        formMsg = "You’ve used both username changes this month.";
      } else formMsg = msg || "Could not save your profile. Try again.";
      renderState();
    }
  }

  /* ---------- public API (multiplayer uses needsProfile/require/get) ---------- */
  window.TPProfile = {
    avatars: AVATARS,
    ready,
    get: () => profile,
    needsProfile: () => configured() && !profile && !loadError,
    open: () => open(),
    require: () =>
      profile
        ? Promise.resolve(true)
        : new Promise((res) => {
            waiters.push(res);
            if (!modal || modal.hidden) open();
          }),
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderMount();
    const mount = document.getElementById("tpProfileMount");
    if (mount && mount.hasAttribute("data-autopen"))
      ready.then((p) => {
        if (!p && configured() && !loadError) open();
      });
  });
})();
