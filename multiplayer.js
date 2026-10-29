/* TypeNets multiplayer race.
   - Opening the Multiplayer tab searches for a race automatically. There is no room code, host, or start button.
   - When 5 typists are in the same room, a 5-second countdown starts for everyone, then the race begins.
   - The text is always one of the passages stored in passages.js (the room stores only the passage number).
   Rooms live in Firebase Realtime Database under /rooms (see firebase-database.rules.json). */
(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.TYPEPILOT_FIREBASE_CONFIG || {};
  const PASSAGES = window.TP_PASSAGES || [];
  const NEED = 5; // maximum players in one race
  const MIN_PLAYERS = 2; // start with at least two players
  const MATCH_WINDOW_MS = 10000; // search for players for 10 seconds
  const COUNTDOWN_MS = 5000; // countdown once the room is full
  const GRACE_MS = 45000; // after the first finisher, everyone else has this long
  const MAX_RACE_MS = 180000; // hard stop for any race
  const COLORS = [
    "#ff5d73",
    "#4dabf7",
    "#ffd43b",
    "#a3e635",
    "#c084fc",
    "#ff922b",
  ];

  let db = null,
    auth = null,
    uid = null,
    offset = 0;
  let active = false; // Multiplayer tab is open
  let busy = false; // matchmaking call in progress
  let roomId = null,
    roomRef = null,
    room = null;
  let tickTimer = null,
    scanTimer = null,
    startTried = 0,
    timeoutHandling = false;
  let race = null; // per-race local state, built when the countdown begins
  let frozen = null; // final results once the race is over

  const serverNow = () => Date.now() + offset;
  const esc = (s) =>
    String(s ?? "").replace(
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
  const count = (r) => Object.keys((r && r.players) || {}).length;
  const configured = () =>
    !!(
      cfg.apiKey &&
      cfg.databaseURL &&
      cfg.projectId &&
      cfg.appId &&
      window.firebase &&
      firebase.database
    );

  /* ---------- who am I ---------- */
  function myRecord() {
    let name = "",
      avatar = "";
    // The saved Supabase username/avatar is the canonical identity for both solo
    // leaderboard results and Firebase multiplayer. Keep older hints as fallback.
    try {
      const profile =
        (window.TPProfile && TPProfile.get()) ||
        JSON.parse(
          localStorage.getItem("typepilotLeaderboardProfile") || "null",
        );
      if (profile && profile.username) {
        name = String(profile.username).trim();
        avatar = TPAvatars.token(Number(profile.avatar_id) || 0);
      }
    } catch (_) {}
    if (!name) {
      try {
        name = (localStorage.getItem("typepilotDisplayName") || "")
          .trim()
          .slice(0, 24);
      } catch (_) {}
      try {
        const h = JSON.parse(
          localStorage.getItem("typepilotAuthHint") || "null",
        );
        if (h && h.uid) {
          name = h.displayName || h.username || name;
          avatar = TPAvatars.parse(h.avatar) !== null ? h.avatar : avatar;
        }
      } catch (_) {}
    }
    if (!name) {
      let g = null;
      try {
        g = JSON.parse(localStorage.getItem("typepilotRaceGuest") || "null");
      } catch (_) {}
      if (!g || !g.name) {
        const n = String(Math.floor(1000 + Math.random() * 9000));
        g = {
          name: "Typist " + n,
          avatar: TPAvatars.token(TPAvatars.random()),
        };
        try {
          localStorage.setItem("typepilotRaceGuest", JSON.stringify(g));
        } catch (_) {}
      }
      name = g.name;
      avatar = TPAvatars.parse(g.avatar) !== null ? g.avatar : TPAvatars.token(TPAvatars.random());
    }
    return {
      name: String(name).slice(0, 24),
      avatar: avatar || TPAvatars.token(TPAvatars.random()),
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
    };
  }

  /* ---------- connection ---------- */
  async function connect() {
    if (db && uid) return;
    if (!configured()) throw new Error("not-configured");
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.database();
    // Wait for Firebase to restore any saved session first, so a signed-in account is never replaced by a guest.
    let user = await new Promise((res) => {
      const off = auth.onAuthStateChanged((u) => {
        off();
        res(u);
      });
    });
    if (!user) user = (await auth.signInAnonymously()).user;
    uid = user.uid;
    try {
      offset =
        (await db.ref(".info/serverTimeOffset").once("value")).val() || 0;
    } catch (_) {
      offset = 0;
    }
  }

  /* ---------- matchmaking ---------- */
  async function openRooms() {
    const snap = await db
      .ref("rooms")
      .orderByChild("open")
      .equalTo(true)
      .limitToFirst(25)
      .once("value");
    const out = [];
    snap.forEach((ch) => {
      const r = ch.val() || {};
      out.push({
        id: ch.key,
        createdAt: r.createdAt || 0,
        n: count(r),
        started: !!r.startAt,
      });
    });
    return out;
  }
  async function joinRoom(id) {
    await db.ref("rooms/" + id + "/players/" + uid).set(myRecord());
    db.ref("rooms/" + id + "/players/" + uid)
      .onDisconnect()
      .remove();
    return id;
  }
  // A different passage every race: numbers used recently in this browser are skipped (see TP_nextPassages in passages.js).
  const pickPassage = () =>
    window.TP_nextPassages
      ? window.TP_nextPassages("race", 1)[0]
      : Math.floor(Math.random() * PASSAGES.length);
  async function createRoom() {
    const ref = db.ref("rooms").push(),
      id = ref.key;
    await ref.set({
      open: true,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      textId: pickPassage(),
      players: { [uid]: myRecord() },
    });
    db.ref("rooms/" + id + "/players/" + uid)
      .onDisconnect()
      .remove();
    return id;
  }
  // Join the fullest open room that is "ahead" of `mine` (or any open room when mine is null).
  async function joinBest(mine) {
    const rooms = await openRooms();
    const cands = [];
    for (const r of rooms) {
      if (r.id === (mine && mine.id) || r.started) continue;
      if (r.n === 0) {
        db.ref("rooms/" + r.id)
          .remove()
          .catch(() => {});
        continue;
      } // tidy abandoned rooms
      if (r.n >= NEED) continue;
      if (mine) {
        // only move toward a bigger room, or an older one of equal size, so rooms always converge
        const ahead =
          r.n > mine.n ||
          (r.n === mine.n &&
            (r.createdAt < mine.createdAt ||
              (r.createdAt === mine.createdAt && r.id < mine.id)));
        if (!ahead) continue;
      }
      cands.push(r);
    }
    cands.sort((a, b) => b.n - a.n || a.createdAt - b.createdAt);
    for (const r of cands) {
      try {
        return await joinRoom(r.id);
      } catch (_) {
        /* full or closed: try the next */
      }
    }
    return null;
  }

  async function search() {
    if (busy || roomId || !active) return;
    busy = true;
    frozen = null;
    race = null;
    // Multiplayer uses the saved profile username. New players pick one first, then matchmaking starts.
    if (window.TPProfile) {
      try {
        await TPProfile.ready;
      } catch (_) {}
      if (TPProfile.needsProfile()) {
        busy = false;
        setPhase("idle");
        say(
          "Choose a username to join a race. It is the name other racers see.",
        );
        TPProfile.require().then((ok) => {
          if (ok && active) search();
        });
        return;
      }
    }
    setPhase("searching");
    say("");
    try {
      await connect();
      if (!active) return;
      let id = null;
      // After a reload, try to resume the same room using the persistent Firebase UID.
      let savedRoom = "";
      try {
        savedRoom = localStorage.getItem("typepilotActiveRaceRoom") || "";
      } catch (_) {}
      if (savedRoom) {
        const saved = await db.ref("rooms/" + savedRoom).once("value");
        const data = saved.val();
        if (data && data.players && data.players[uid] && data.startAt) {
          id = savedRoom;
        } else {
          try {
            localStorage.removeItem("typepilotActiveRaceRoom");
          } catch (_) {}
        }
      }
      if (!id) id = await joinBest(null);
      if (!id) id = await createRoom();
      if (!active) {
        await leaveRoom(id);
        return;
      }
      attach(id);
    } catch (e) {
      fail(e);
    } finally {
      busy = false;
    }
  }
  function attach(id) {
    detach();
    roomId = id;
    timeoutHandling = false;
    try {
      localStorage.setItem("typepilotActiveRaceRoom", id);
    } catch (_) {}
    roomRef = db.ref("rooms/" + id);
    roomRef.on("value", onRoom, fail);
    if (!tickTimer) tickTimer = setInterval(frame, 100);
    scanTimer = setInterval(rescan, 2500 + Math.random() * 1500);
  }
  function detach() {
    if (roomRef) {
      roomRef.off();
    }
    if (scanTimer) {
      clearInterval(scanTimer);
      scanTimer = null;
    }
    roomRef = null;
  }
  // While still waiting, drift toward a fuller/older room so two half-empty rooms become one.
  async function rescan() {
    if (!active || busy || !room || room.startAt || !roomId) return;
    busy = true;
    try {
      const old = roomId,
        mine = { id: old, n: count(room), createdAt: room.createdAt || 0 };
      const next = await joinBest(mine);
      if (next && active && !(room && room.startAt)) {
        db.ref("rooms/" + old + "/players/" + uid)
          .onDisconnect()
          .cancel();
        detach();
        roomId = null;
        room = null;
        await removeFrom(old);
        attach(next);
      } else if (next) {
        await removeFrom(next);
      }
    } catch (_) {
    } finally {
      busy = false;
    }
  }
  async function removeFrom(id) {
    try {
      await db.ref("rooms/" + id + "/players/" + uid).remove();
      const left = (
        await db.ref("rooms/" + id + "/players").once("value")
      ).exists();
      if (!left) await db.ref("rooms/" + id).remove();
    } catch (_) {}
  }
  async function leaveRoom(idOverride, keepRoomRecord = false) {
    const id = idOverride || roomId;
    detach();
    roomId = null;
    room = null;
    race = null;
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
    if (id && db && uid) {
      db.ref("rooms/" + id + "/players/" + uid)
        .onDisconnect()
        .cancel();
      if (!keepRoomRecord) await removeFrom(id);
    }
    if (!keepRoomRecord) {
      try {
        localStorage.removeItem("typepilotActiveRaceRoom");
        sessionStorage.removeItem("typepilotRaceDraft");
      } catch (_) {}
    }
  }

  /* ---------- room updates ---------- */
  function onRoom(snap) {
    const r = snap.val();
    if (!r) {
      // the room disappeared: search again
      if (active && !frozen) {
        detach();
        roomId = null;
        room = null;
        race = null;
        search();
      }
      return;
    }
    room = r;
    // Match for exactly 10 seconds. Start only with at least two players; otherwise
    // close this lobby and return the remaining player to the Find a race option.
    if (
      !r.startAt &&
      r.open &&
      r.createdAt &&
      serverNow() >= r.createdAt + MATCH_WINDOW_MS &&
      Date.now() - startTried > 1500 &&
      !timeoutHandling
    ) {
      startTried = Date.now();
      if (count(r) >= MIN_PLAYERS) {
        roomRef
          .child("startAt")
          .set(serverNow() + COUNTDOWN_MS)
          .then(() => roomRef.child("open").set(false))
          .catch(() => {});
      } else {
        timeoutHandling = true;
        roomRef
          .child("open")
          .set(false)
          .catch(() => {});
        const id = roomId;
        leaveRoom(id).then(() => {
          if (active) {
            frozen = null;
            race = null;
            setPhase("idle");
            say(
              "No second typist joined within 10 seconds. Select Find a race to try again.",
            );
          }
        });
      }
    }
    if (r.startAt) {
      // Keep the player record during the race so a refresh can reconnect to the same room.
      db.ref("rooms/" + roomId + "/players/" + uid)
        .onDisconnect()
        .cancel()
        .catch(() => {});
      if (!race) buildRace();
    }
    paint();
  }

  /* ---------- phases ---------- */
  function phaseNow() {
    if (frozen) return "done";
    if (!room || !room.startAt) return "searching";
    const now = serverNow();
    if (now < room.startAt) return "countdown";
    return isOver() ? "done" : "racing";
  }
  const players = () =>
    Object.entries((room && room.players) || {}).map(([id, p]) => ({
      id,
      ...p,
    }));
  function isOver() {
    if (frozen) return true;
    const ps = players();
    if (!ps.length || !room.startAt) return false;
    const now = serverNow(),
      fin = ps.filter((p) => p.finished);
    if (fin.length === ps.length) return true;
    if (
      fin.length &&
      now > Math.min(...fin.map((p) => p.finishAt || now)) + GRACE_MS
    )
      return true;
    return now > room.startAt + MAX_RACE_MS;
  }
  function standings() {
    const done = players()
      .filter((p) => p.finished)
      .sort((a, b) => (a.finishAt || 0) - (b.finishAt || 0) || b.wpm - a.wpm);
    const rest = players()
      .filter((p) => !p.finished)
      .sort((a, b) => (b.progress || 0) - (a.progress || 0));
    return [...done, ...rest];
  }

  /* ---------- the race ---------- */
  function buildRace() {
    const p = PASSAGES[room.textId] || PASSAGES[0];
    const order = players().sort(
      (a, b) => (a.joinedAt || 0) - (b.joinedAt || 0) || (a.id < b.id ? -1 : 1),
    );
    race = {
      text: p.text,
      book: p.book,
      author: p.author,
      ids: order.map((x) => x.id),
      total: 0,
      errors: 0,
      prevLen: 0,
      finished: false,
      lastPub: 0,
      pubTimer: null,
      started: false,
    };
    $("mpTrack").innerHTML = order
      .map(
        (pl, i) => `
      <div class="mp-lane${pl.id === uid ? " is-me" : ""}" data-id="${esc(pl.id)}" style="--c:${COLORS[i % COLORS.length]};--p:0">
        <div class="mp-who"><span class="mp-ava">${TPAvatars.htmlFromToken(pl.avatar)}</span><span class="mp-name"><b>${esc(pl.name || "Typist")}${pl.id === uid ? " (you)" : ""}</b><small class="mp-lane-wpm">0 WPM</small></span></div>
        <div class="mp-road"><div class="mp-car">${CAR}</div><i class="mp-flag" aria-hidden="true"></i></div>
      </div>`,
      )
      .join("");
    $("raceText").innerHTML = [...race.text]
      .map((c) => `<span>${esc(c)}</span>`)
      .join("");
    $("mpBook").textContent = `From ${race.book}, by ${race.author}`;
    const input = $("raceInput");
    input.value = "";
    input.disabled = true;
    $("raceWpm").textContent = "0";
    $("raceAccuracy").textContent = "100%";
    $("raceProgress").textContent = "0%";
    // Restore the current player's draft after a page refresh during an active race.
    try {
      const draft = JSON.parse(
        sessionStorage.getItem("typepilotRaceDraft") || "null",
      );
      if (draft && draft.roomId === roomId && typeof draft.value === "string") {
        input.value = draft.value.slice(0, race.text.length);
        race.prevLen = input.value.length;
        race.total = Number(draft.total) || input.value.length;
        race.errors = Number(draft.errors) || 0;
        const k = prefixLen(input.value),
          progress = Math.round((k / race.text.length) * 1000) / 10;
        $("raceWpm").textContent = Math.round(
          k / 5 / Math.max(0.0005, (serverNow() - room.startAt) / 60000),
        );
        $("raceAccuracy").textContent =
          (race.total
            ? Math.round(((race.total - race.errors) / race.total) * 100)
            : 100) + "%";
        $("raceProgress").textContent = Math.floor(progress) + "%";
        const kids = $("raceText").children;
        for (let i = 0; i < kids.length; i++)
          kids[i].className =
            i < input.value.length
              ? input.value[i] === race.text[i]
                ? "ok"
                : "bad"
              : i === input.value.length
                ? "cur"
                : "";
      }
    } catch (_) {}
  }
  function frame() {
    // runs 10x per second while in a room
    if (!room) return;
    const ph = phaseNow();
    if (ph === "done" && !frozen && room.startAt) {
      frozen = standings();
      paint();
      return;
    }
    if (ph === "countdown") {
      const left = Math.max(0, Math.ceil((room.startAt - serverNow()) / 1000));
      $("mpClock").innerHTML = `<b>${left}</b><small>Race starts in</small>`;
    } else if (ph === "racing") {
      if (race && !race.started) {
        race.started = true;
        const input = $("raceInput");
        if (!race.finished) {
          input.disabled = false;
          input.focus({ preventScroll: true });
        }
        setPhase("racing");
      }
      const secs = Math.floor((serverNow() - room.startAt) / 1000);
      $("mpClock").innerHTML =
        `<b>${race && race.finished ? "Finished" : "GO!"}</b><small>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")} elapsed</small>`;
    }
    if (ph !== uiPhase) paint();
  }

  /* ---------- typing ---------- */
  function prefixLen(val) {
    let k = 0;
    const t = race.text;
    while (k < val.length && k < t.length && val[k] === t[k]) k++;
    return k;
  }
  function onInput() {
    if (!race || phaseNow() !== "racing" || race.finished) return;
    const input = $("raceInput");
    let val = input.value;
    if (val.length > race.text.length) {
      val = val.slice(0, race.text.length);
      input.value = val;
    }
    for (let i = race.prevLen; i < val.length; i++) {
      race.total++;
      if (val[i] !== race.text[i]) race.errors++;
    }
    race.prevLen = val.length;
    try {
      sessionStorage.setItem(
        "typepilotRaceDraft",
        JSON.stringify({
          roomId,
          value: val,
          total: race.total,
          errors: race.errors,
        }),
      );
    } catch (_) {}
    const k = prefixLen(val),
      progress = Math.round((k / race.text.length) * 1000) / 10;
    const mins = Math.max(0.0005, (serverNow() - room.startAt) / 60000);
    const wpm = Math.round(k / 5 / mins),
      acc = race.total
        ? Math.round(((race.total - race.errors) / race.total) * 100)
        : 100;
    const kids = $("raceText").children;
    for (let i = 0; i < kids.length; i++)
      kids[i].className =
        i < val.length
          ? val[i] === race.text[i]
            ? "ok"
            : "bad"
          : i === val.length
            ? "cur"
            : "";
    $("raceWpm").textContent = wpm;
    $("raceAccuracy").textContent = acc + "%";
    $("raceProgress").textContent = Math.floor(progress) + "%";
    const me = {
      progress,
      wpm,
      accuracy: acc,
      errors: race.errors,
      typedChars: race.total,
    };
    if (k === race.text.length) {
      race.finished = true;
      input.disabled = true;
      publish(
        {
          ...me,
          progress: 100,
          finished: true,
          finishAt: firebase.database.ServerValue.TIMESTAMP,
        },
        true,
      );
    } else publish(me, false);
  }
  function publish(data, now) {
    // at most ~8 updates per second
    const send = () => {
      race.lastPub = Date.now();
      race.pubTimer = null;
      roomRef &&
        roomRef
          .child("players/" + uid)
          .update(data)
          .catch(() => {});
    };
    if (race.pubTimer) clearTimeout(race.pubTimer);
    const wait = now ? 0 : Math.max(0, 120 - (Date.now() - race.lastPub));
    race.pubTimer = setTimeout(send, wait);
    if (data.finished)
      db.ref("rooms/" + roomId + "/players/" + uid)
        .onDisconnect()
        .cancel(); // keep a finisher's result even if they close the tab
  }

  /* ---------- drawing ---------- */
  const CAR =
    '<svg viewBox="0 0 74 32" aria-hidden="true"><path d="M5 22v-6c0-2 1.2-3.200 3.500-3.800L18 10l6-6.200C25.500 2.200 27 2 29 2h16c2.600 0 4.300.8 6 2.800L56 11l10 2c3 .6 5 2.500 5 5.500V22c0 1.200-.8 2-2 2H7c-1.200 0-2-.8-2-2z" fill="var(--c)"/><path d="M27 5h18l6 6H21z" fill="#d5ecff" opacity=".9"/><path d="M5 20h66v2.500H5z" fill="#000" opacity=".18"/><rect x="66" y="14" width="5" height="3.500" rx="1" fill="#ffe27a"/><circle cx="19" cy="24" r="6" fill="#0d1017" stroke="#aab3c2" stroke-width="2"/><circle cx="57" cy="24" r="6" fill="#0d1017" stroke="#aab3c2" stroke-width="2"/></svg>';
  let uiPhase = "";
  const badge = {
    idle: "OFFLINE",
    searching: "SEARCHING",
    countdown: "STARTING",
    racing: "RACING",
    done: "FINISHED",
    error: "OFFLINE",
  };
  function setPhase(ph) {
    uiPhase = ph;
    $("mpPanel").dataset.phase = ph;
    $("mpBadge").textContent = badge[ph] || "";
    $("mpLobby").classList.toggle(
      "hidden",
      !(ph === "idle" || ph === "searching" || ph === "error"),
    );
    $("mpRace").classList.toggle(
      "hidden",
      !(ph === "countdown" || ph === "racing" || ph === "done"),
    );
    $("mpResults").classList.toggle("hidden", ph !== "done");
    const titles = {
      idle: "Multiplayer race",
      searching: "Searching for typists…",
      countdown: "Get ready",
      racing: "Race in progress",
      done: "Race complete",
      error: "Can’t reach the race service",
    };
    $("mpTitle").textContent = titles[ph] || "";
    const subs = {
      idle: "We’ll search for online typists for 10 seconds. At least 2 players are required.",
      searching: `Matchmaking lasts 10 seconds. If at least 2 players join, a ${COUNTDOWN_MS / 1000}-second countdown begins; otherwise, you can search again.`,
      countdown: "Everyone has the same passage. Hands on the keys.",
      racing:
        "Type the passage exactly. Your car moves with every correct character.",
      done: "",
      error: "",
    };
    $("mpSub").textContent = subs[ph] || "";
    $("mpCancel").classList.toggle("hidden", ph !== "searching");
    $("mpSearch").classList.toggle(
      "hidden",
      !(ph === "idle" || ph === "error"),
    );
  }
  function paint() {
    const ph = phaseNow();
    if (ph !== uiPhase) setPhase(ph);
    if (ph === "searching") {
      const ps = players().sort(
        (a, b) => (a.joinedAt || 0) - (b.joinedAt || 0),
      );
      let html = "";
      for (let i = 0; i < NEED; i++) {
        const p = ps[i];
        html += p
          ? `<div class="mp-slot is-in" style="--c:${COLORS[i % COLORS.length]}"><span class="mp-slot-ava">${TPAvatars.htmlFromToken(p.avatar)}</span><small>${esc(p.id === uid ? "You" : p.name)}</small></div>`
          : `<div class="mp-slot"><span class="mp-slot-ava" aria-hidden="true"></span><small>Waiting…</small></div>`;
      }
      $("mpSlots").innerHTML = html;
      $("mpCount").textContent =
        `${ps.length} of ${NEED} players · ${Math.max(0, Math.ceil(((room.createdAt || serverNow()) + MATCH_WINDOW_MS - serverNow()) / 1000))}s to match`;
      return;
    }
    if (!race) return;
    const byId = {};
    players().forEach((p) => (byId[p.id] = p));
    $("mpTrack")
      .querySelectorAll(".mp-lane")
      .forEach((l) => {
        const p = byId[l.dataset.id];
        l.classList.toggle("is-gone", !p);
        if (!p) return;
        l.style.setProperty(
          "--p",
          Math.max(0, Math.min(100, p.progress || 0)) / 100,
        );
        l.classList.toggle("is-done", !!p.finished);
        l.querySelector(".mp-lane-wpm").textContent =
          `${Math.round(p.wpm || 0)} WPM${p.finished ? " · finished" : ""}`;
      });
    if (ph === "done") showResults();
  }
  function showResults() {
    const rows = frozen || standings();
    const start = (room && room.startAt) || 0,
      ordinal = (n) => {
        const sfx = ["th", "st", "nd", "rd"],
          v = n % 100;
        return n + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
      };
    const myIdx = rows.findIndex((r) => r.id === uid),
      me = rows[myIdx];
    const headline =
      me && me.finished
        ? myIdx === 0
          ? "You won the race!"
          : `You finished ${ordinal(myIdx + 1)}`
        : "Race over";
    $("raceInput").disabled = true;
    let localScores = [];
    try {
      if (me && localStorage.getItem("typepilotMultiRecordedRoom") !== roomId) {
        localScores = JSON.parse(
          localStorage.getItem("typepilotMultiHighScores") || "[]",
        );
        localScores.push({
          name: me.name || "You",
          wpm: Math.round(me.wpm || 0),
          accuracy: Math.round(me.accuracy ?? 100),
          place: myIdx + 1,
          date: new Date().toLocaleDateString(),
        });
        localScores.sort((a, b) => a.place - b.place || b.wpm - a.wpm);
        localScores = localScores.slice(0, 30);
        localStorage.setItem(
          "typepilotMultiHighScores",
          JSON.stringify(localScores),
        );
        localStorage.setItem("typepilotMultiRecordedRoom", roomId || "");
      } else
        localScores = JSON.parse(
          localStorage.getItem("typepilotMultiHighScores") || "[]",
        );
    } catch (_) {}
    $("mpResults").innerHTML =
      `<h3>${esc(headline)}</h3><div class="table-scroll"><table><thead><tr><th>Place</th><th>Typist</th><th>WPM</th><th>Accuracy</th><th>Time</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${r.id === uid ? "is-me" : ""}"><td>${r.finished ? i + 1 : "–"}</td><td><span class="mp-res-ava">${TPAvatars.htmlFromToken(r.avatar)}</span>${esc(r.name || "Typist")}${r.id === uid ? " (you)" : ""}</td><td>${Math.round(r.wpm || 0)}</td><td>${Math.round(r.accuracy ?? 100)}%</td><td>${r.finished && r.finishAt && start ? ((r.finishAt - start) / 1000).toFixed(1) + "s" : "Did not finish"}</td></tr>`).join("")}</tbody></table></div><section class="score-board"><h3>Your multiplayer history <span class="muted">· this browser</span></h3>${
        localScores.length
          ? `<div class="table-scroll"><table><thead><tr><th>Date</th><th>Name</th><th>Place</th><th>WPM</th><th>Accuracy</th></tr></thead><tbody>${localScores
              .slice(-10)
              .reverse()
              .map(
                (x) =>
                  `<tr><td>${esc(x.date)}</td><td>${esc(x.name)}</td><td>${x.place}</td><td>${x.wpm}</td><td>${x.accuracy}%</td></tr>`,
              )
              .join("")}</tbody></table></div>`
          : '<p class="muted">Finish a race to build your history.</p>'
      }</section><div class="mp-result-actions"><button class="btn btn-primary" id="mpAgain" type="button">Race again</button></div>`;
    $("mpAgain").addEventListener("click", again, { once: true });
  }

  /* ---------- UI actions ---------- */
  function say(msg, bad) {
    const e = $("mpMessage");
    if (e) {
      e.textContent = msg || "";
      e.classList.toggle("error-text", !!bad);
    }
  }
  function fail(e) {
    const m = (e && e.message) || "",
      code = (e && e.code) || "";
    let text =
      "Could not connect to the race service. Check your connection and try again.";
    if (m === "not-configured")
      text =
        "Live racing needs the Firebase settings in firebase-config.js. See the README.";
    else if (/permission_denied/i.test(code + m))
      text =
        "The race service refused the request. Publish the updated firebase-database.rules.json in Firebase, then try again.";
    leaveRoom().catch(() => {});
    busy = false;
    frozen = null;
    setPhase("error");
    say(text, true);
  }
  async function again() {
    await leaveRoom();
    frozen = null;
    busy = false;
    search();
  }
  async function cancel() {
    await leaveRoom();
    setPhase("idle");
    say("");
  }
  async function stop() {
    active = false;
    await leaveRoom();
    frozen = null;
    busy = false;
    setPhase("idle");
  }

  function bind() {
    $("mpCancel").addEventListener("click", cancel);
    $("mpSearch").addEventListener("click", () => {
      active = true;
      busy = false;
      search();
    });
    const input = $("raceInput");
    input.addEventListener("input", onInput);
    ["paste", "drop", "cut"].forEach((ev) =>
      input.addEventListener(ev, (e) => e.preventDefault()),
    );
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
    document.addEventListener("tp:multiplayer", (e) => {
      if (e.detail && e.detail.active) {
        active = true;
        if (!roomId && !busy) search();
      } else stop();
    });
    // Do not explicitly delete a player on pagehide: that broke refresh/reconnect and could erase finished results.
    // Firebase's onDisconnect removes waiting players; once a race starts it is cancelled to preserve race state.
    setPhase("idle");
    if (!configured()) {
      setPhase("error");
      say(
        "Live racing needs the Firebase settings in firebase-config.js. See the README.",
        true,
      );
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    if ($("mpPanel")) bind();
  });
})();
