/* Supabase-backed leaderboard and persistent username/avatar profile. */
(function () {
  const cfg = window.TYPEPILOT_SUPABASE_CONFIG || {};
  const MIN_ACCURACY = 90,
    MIN_SECONDS = 15;
  let client = null,
    ready = null;
  const configured = () =>
    !!(
      cfg.url &&
      cfg.publishableKey &&
      !cfg.url.includes("YOUR_PROJECT_ID") &&
      !cfg.publishableKey.includes("YOUR_SUPABASE")
    );
  const localProfile = () => {
    try {
      return JSON.parse(
        localStorage.getItem("typepilotLeaderboardProfile") || "null",
      );
    } catch (_) {
      return null;
    }
  };
  async function connect() {
    if (ready) return ready;
    ready = (async () => {
      if (!configured())
        throw new Error(
          "Supabase is not configured. Add your project URL and publishable key.",
        );
      if (!window.supabase?.createClient)
        throw new Error("Supabase SDK is unavailable.");
      client = window.supabase.createClient(cfg.url, cfg.publishableKey);
      let {
        data: { session },
        error,
      } = await client.auth.getSession();
      if (error) throw error;
      if (!session) {
        const r = await client.auth.signInAnonymously();
        if (r.error) throw r.error;
      }
      const {
        data: { user },
        error: ue,
      } = await client.auth.getUser();
      if (ue) throw ue;
      return user;
    })();
    try {
      return await ready;
    } catch (e) {
      ready = null;
      client = null;
      throw e;
    }
  }
  async function profile() {
    const user = await connect();
    const { data, error } = await client
      .from("username_profiles")
      .select("user_id,username,avatar_id,created_at,updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      const cached = localProfile();
      if (cached && cached.username) return cached;
      throw error;
    } // offline: fall back to the cache
    if (!data) {
      try {
        localStorage.removeItem("typepilotLeaderboardProfile");
      } catch (_) {}
      return null;
    } // server says no profile: do not trust a stale cache
    try {
      localStorage.setItem("typepilotLeaderboardProfile", JSON.stringify(data));
      localStorage.setItem("typepilotDisplayName", data.username);
    } catch (_) {}
    return data;
  }
  // Username changes used/left this calendar month (UTC). Returns null if supabase-profile-migration-v2.sql has not been run yet.
  async function usernameStatus() {
    try {
      await connect();
      const { data, error } = await client.rpc("get_username_status");
      return error ? null : data;
    } catch (_) {
      return null;
    }
  }
  const NAME_RE = /^[a-z0-9_]{3,20}$/;
  async function checkUsername(username) {
    await connect();
    const clean = String(username || "")
      .trim()
      .toLowerCase();
    if (!NAME_RE.test(clean))
      return {
        available: false,
        reason: "invalid",
        message: "Use 3–20 letters, numbers, or underscores.",
      };
    const me = await client.auth.getUser();
    if (me.error) throw me.error;
    const { data, error } = await client
      .from("username_profiles")
      .select("user_id")
      .eq("username", clean)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      return {
        available: true,
        reason: "ok",
        message: "Username is available.",
      };
    if (data.user_id === me.data.user.id)
      return {
        available: true,
        reason: "yours",
        message: "This is your current username.",
      };
    return {
      available: false,
      reason: "taken",
      message: "That username is already taken.",
    };
  }
  // Returns up to `count` usernames that are free right now (checked against the database in one query per round).
  async function suggestUsernames(base, count) {
    await connect();
    count = Math.max(1, Math.min(8, Number(count) || 4));
    let stem = String(base || "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .replace(/^_+|_+$/g, "");
    if (stem.length < 3) stem = "typist";
    stem = stem.slice(0, 14);
    const tags = [
        "fast",
        "swift",
        "keys",
        "wpm",
        "pilot",
        "ace",
        "flow",
        "turbo",
      ],
      rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
      pick = () => tags[rnd(0, tags.length - 1)];
    const me = await client.auth.getUser();
    const myId = me.data && me.data.user ? me.data.user.id : null;
    const found = [],
      seen = new Set([stem]);
    for (let round = 0; round < 3 && found.length < count; round++) {
      const batch = [];
      for (let i = 0; i < 14 && batch.length < 10; i++) {
        const c = [
          stem + "_" + rnd(10, 99),
          stem + rnd(100, 999),
          stem + "_" + pick(),
          pick() + "_" + stem,
          stem + "_" + rnd(2, 9) + pick(),
        ][i % 5];
        if (NAME_RE.test(c) && !seen.has(c)) {
          seen.add(c);
          batch.push(c);
        }
      }
      if (!batch.length) continue;
      const { data, error } = await client
        .from("username_profiles")
        .select("user_id,username")
        .in("username", batch);
      if (error) throw error;
      const taken = new Set(
        (data || []).filter((r) => r.user_id !== myId).map((r) => r.username),
      );
      batch.forEach((c) => {
        if (!taken.has(c) && found.length < count) found.push(c);
      });
    }
    return found;
  }
  async function saveProfile(username, avatarId) {
    const user = await connect();
    const clean = String(username || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(clean))
      throw new Error("Use 3–20 letters, numbers, or underscores.");
    if (
      !Number.isInteger(Number(avatarId)) ||
      Number(avatarId) < 0 ||
      Number(avatarId) > 47
    )
      throw new Error("Choose one of the available avatars.");
    const { data, error } = await client.rpc("save_username_profile", {
      p_username: clean,
      p_avatar_id: Number(avatarId),
    });
    if (error) throw new Error(error.message || "Could not save profile.");
    const value = {
      user_id: user.id,
      username: clean,
      avatar_id: Number(avatarId),
      changes_remaining: data?.changes_remaining,
      next_change_at: data?.next_change_at,
    };
    try {
      localStorage.setItem(
        "typepilotLeaderboardProfile",
        JSON.stringify(value),
      );
      localStorage.setItem("typepilotDisplayName", clean);
    } catch (_) {}
    return value;
  }
  async function top(limit) {
    await connect();
    const { data, error } = await client
      .from("leaderboard")
      .select("user_id,name,avatar_id,wpm,accuracy,duration,at")
      .order("wpm", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("at", { ascending: true })
      .limit(Math.max(1, Math.min(100, Number(limit) || 10)));
    if (error) throw error;
    return (data || []).map((v) => ({
      uid: v.user_id,
      name: String(v.name || "Typist"),
      avatarId: Number(v.avatar_id) || 0,
      wpm: Number(v.wpm) || 0,
      accuracy: Number(v.accuracy) || 0,
      duration: Number(v.duration) || 0,
      at: v.at ? new Date(v.at).getTime() : 0,
    }));
  }
  async function submit(r) {
    if (r.accuracy < MIN_ACCURACY || r.duration < MIN_SECONDS || r.wpm < 1)
      return { status: "ineligible" };
    const user = await connect(),
      prof = await profile();
    if (!prof?.username) return { status: "no-profile" };
    const { data: old, error: re } = await client
      .from("leaderboard")
      .select("wpm,accuracy")
      .eq("user_id", user.id)
      .maybeSingle();
    if (re) throw re;
    if (
      old &&
      (Number(old.wpm) > Number(r.wpm) ||
        (Number(old.wpm) === Number(r.wpm) &&
          Number(old.accuracy) >= Number(r.accuracy)))
    )
      return { status: "kept", best: Number(old.wpm) };
    const row = {
      user_id: user.id,
      name: prof.username,
      avatar_id: Number(prof.avatar_id) || 0,
      wpm: Math.round(Number(r.wpm)),
      accuracy: Math.round(Number(r.accuracy) * 100) / 100,
      duration: Math.round(Number(r.duration)),
      at: new Date().toISOString(),
    };
    const { error } = await client
      .from("leaderboard")
      .upsert(row, { onConflict: "user_id" });
    if (error) throw error;
    return { status: "saved" };
  }
  async function deleteProfile() {
    await connect();
    const { error } = await client.rpc("delete_my_username_profile");
    if (error) throw new Error(error.message || "Could not delete the Supabase profile.");
    try {
      localStorage.removeItem("typepilotLeaderboardProfile");
      localStorage.removeItem("typepilotDisplayName");
    } catch (_) {}
    return true;
  }
  async function myUid() {
    try {
      return (await connect()).id;
    } catch (_) {
      return null;
    }
  }
  window.TPLeaderboard = {
    top,
    submit,
    myUid,
    profile,
    usernameStatus,
    checkUsername,
    suggestUsernames,
    saveProfile,
    configured,
    cachedProfile: localProfile,
    MIN_ACCURACY,
    MIN_SECONDS,
  };
})();
