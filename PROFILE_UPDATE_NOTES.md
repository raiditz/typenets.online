# Profile / username / avatar update

- `profile-ui.js` (rewritten): live username check (300 ms debounce, stale answers ignored), taken names show up to 4 verified-free suggestions that auto-fill on click, avatar popover closes as soon as one is picked (also closes on Esc / outside click), monthly-change counter, locked username field at 0 changes left (avatar still editable).
- `leaderboard.js`: `checkUsername` returns a reason, new `suggestUsernames` and `usernameStatus`; `profile()` now trusts the server over the local cache.
- `supabase-profile-migration-v2.sql`: new `get_username_status()` RPC. Run it once.
- `multiplayer.html` / `multiplayer.js`: loads the profile, shows the profile panel, and asks new players for a username before matchmaking. The saved username is sent as the player name.
- `test.html`: inline modal markup replaced by `<div id="tpProfileMount" data-autopen>`; the editor markup now lives in `profile-ui.js`, styles in `style.css` (`.tpp-*`).
