document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const ids = [
      "capitals",
      "punctuation",
      "visibility",
      "wordCount",
      "proficiency",
      "highlightErrors",
      "soundFeedback",
      "dailyGoal",
      "adaptivePractice",
      "letterUnlock",
      "targetWpm",
      "stopAtError",
    ],
    s = TM.settings();
  if (!["normal", "advanced"].includes(s.proficiency)) s.proficiency = "normal";
  function fill() {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === "checkbox") el.checked = !!s[id];
      else el.value = s[id] ?? TM.DEFAULTS[id];
    });
    $("visibilityValue").textContent = $("visibility").value + "%";
    if ($("targetWpmValue"))
      $("targetWpmValue").textContent = $("targetWpm").value + " WPM";
    preview();
    renderUnlockPreview();
    TM.applyOpacity();
  }
  function preview() {
    let txt = "The best way to improve is to practice a little every day.";
    if ($("capitals").checked)
      txt = "The Best Way To Improve Is To Practice A Little Every Day.";
    if ($("punctuation").checked)
      txt = txt.replace(/\./g, ", then keep going!");
    $("settingsPreview").textContent = txt;
    $("settingsPreview").style.opacity = Number($("visibility").value) / 100;
  }
  function save() {
    const val = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      val[id] =
        el.type === "checkbox"
          ? el.checked
          : el.type === "range" ||
              ["wordCount", "dailyGoal", "targetWpm"].includes(id)
            ? Number(el.value)
            : el.value;
    });
    TM.save("typeSettings", val);
    Object.assign(s, val);
    $("visibilityValue").textContent = $("visibility").value + "%";
    if ($("targetWpmValue"))
      $("targetWpmValue").textContent = $("targetWpm").value + " WPM";
    $("settingsSaved").textContent = "✓ Settings saved automatically";
    preview();
    renderUnlockPreview();
    TM.applyOpacity();
  }
  function renderUnlockPreview() {
    const el = document.getElementById("unlockSettingsPreview");
    if (!el) return;
    const state = TM.letterState();
    const active = state.unlocked
      .split("")
      .map((k) => k.toUpperCase())
      .join(" ");
    const next = state.next ? state.next.toUpperCase() : "All letters unlocked";
    el.innerHTML = `<div class="unlock-preview-label">CURRENT STARTING SET <b>${active}</b></div><p>${state.enabled ? `Next letter: <strong>${next}</strong>. Each active key must meet <strong>${$("targetWpm").value} WPM</strong> in its all-time statistics. New letters are checked after a completed session.` : "Letter unlocking is disabled. Practice can use the full alphabet."}</p>`;
  }
  ids.forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", save);
    if (el.tagName === "SELECT") el.addEventListener("change", save);
  });
  $("resetSettings").addEventListener("click", () => {
    TM.save("typeSettings", TM.DEFAULTS);
    Object.assign(s, TM.DEFAULTS);
    fill();
    save();
  });
  fill();
  $("clearData").addEventListener("click", () => {
    if (
      !confirm(
        "Erase ALL sessions, key statistics and lesson progress on this device? Your settings are kept. This cannot be undone.",
      )
    )
      return;
    [
      "typingHistory",
      "keyStatsV1",
      "lessonProgressV2",
      "uiStats",
      "unlockedCountV1",
      "customProgressV1",
    ].forEach((k) => localStorage.removeItem(k));
    renderUnlockPreview();
    $("settingsSaved").textContent = "✓ All progress and statistics erased";
  });
});
