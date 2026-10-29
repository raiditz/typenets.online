/* TypeNets avatars: 48 unique manga-style portraits in /avatars/000.webp … 047.webp (no names, no emoji).
   - The saved profile stores only the numeric avatar_id (0–47); the picture is looked up here.
   - Multiplayer stores the compact string "img:<id>" in the room (see TPAvatars.token / parse). */
(function () {
  "use strict";
  const COUNT = 48;
  const clamp = (i) => {
    i = Math.floor(Number(i));
    return Number.isFinite(i) && i >= 0 && i < COUNT ? i : 0;
  };
  const url = (i) => "avatars/" + String(clamp(i)).padStart(3, "0") + ".webp?v=2";
  const random = () => Math.floor(Math.random() * COUNT);
  const token = (i) => "img:" + clamp(i);
  const parse = (s) => {
    const m = /^img:(\d{1,3})$/.exec(String(s == null ? "" : s));
    return m && Number(m[1]) < COUNT ? Number(m[1]) : null;
  };
  /* neutral silhouette shown only while no profile exists yet (never a "default avatar") */
  const BLANK =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8.5" r="4" fill="currentColor"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="currentColor"/></svg>';
  /* <img> markup for any avatar id, or the neutral silhouette when id is null/unknown */
  const html = (i, cls) => {
    if (i === null || i === undefined || i === "")
      return '<span class="ava-blank ' + (cls || "") + '">' + BLANK + "</span>";
    return (
      '<img class="ava-img ' + (cls || "") + '" src="' + url(i) +
      '" alt="" width="160" height="160" loading="lazy" decoding="async" draggable="false">'
    );
  };
  const htmlFromToken = (s, cls) => html(parse(s), cls);
  window.TPAvatars = { COUNT, url, random, token, parse, html, htmlFromToken, BLANK };
})();
