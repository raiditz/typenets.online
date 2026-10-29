# TypeNets — typing practice website

A multi-page static typing website for free adaptive typing practice, typing speed tests and real-time multiplayer races. Built with HTML, CSS, and vanilla JavaScript; no framework or build step is required.

## Files
- `index.html`, `home.js` — typing-first homepage: live keyboard that lights up as you press keys, your real letter bar, and quick links
- `typing.html`, `typing.js` — free practice typed directly on the text (no text box), Reset / Next text, stop-cursor-at-error, completed-session preview
- `pip.js` — Pip, the cartoon co-pilot mascot (moods + speech bubble + performance comments)
- `lessons.css` — shared styles still used by the typing-test and multiplayer pages
- `multiplayer.html`, `multiplayer-page.js` — multiplayer race on its own page (searches automatically on arrival)
- `curriculum.js` — legacy 40-lesson data, still read by app.js for older stats code (4 modules x 10 lessons): keys, drills, words and tips for every lesson. Edit this file to change lesson content
- `test.html`, `test.js` — solo typing test: choose 30s, 60s or 2 min only; full statistics (speed graph, keys to practise) appear after the test
- `statistics.html`, `statistics.js` — all-time totals, WPM chart, session history, JSON export
- `type-settings.html`, `type-settings.js` — capitals, punctuation, text visibility, word count, proficiency, target speed, and feedback settings
- `app.js` — shared data storage, settings, text generation, and utilities
- `style.css` — shared responsive dark theme

## Run in VS Code
1. Extract the ZIP file.
2. Open the `TypeNets` folder in Visual Studio Code.
3. Recommended: install the **Live Server** extension.
4. Right-click `index.html` and select **Open with Live Server**.

You can also open `index.html` directly in a browser, but Live Server is more reliable for local development.

## Data storage
Settings and session history are saved in browser `localStorage` on the current device/browser. This is a static front-end project; data is not synced across devices or users. Use **Export data** on Statistics to download a JSON copy of your saved statistics.

## Notes
- This project uses no backend and requires no API keys.
- Google Fonts are imported by the stylesheet; system fallbacks are included.
- This is a complete starter project you can extend with accounts, cloud sync, adaptive key selection, and server-side leaderboards later.

## Adaptive practice, key mastery, and typing tests

- The Statistics page is focused on all-time free-practice and typing-test results; only free-practice and typing-test results are included.
- The keyboard mastery map tracks key attempts, correct presses, errors, total clicks, and average session speed for each physical key. New key-level measurements are collected from sessions completed after this update; older sessions do not contain per-key input detail and cannot be reconstructed.
- Free-practice word selection uses key-level accuracy and practice exposure to give more weight to words containing weaker or less-practiced keys, while respecting the selected proficiency level. This can be enabled or disabled with the Adaptive key focus switch in Settings.
- The solo typing test ignores the practice Settings. It always uses passages from books (capital letters and punctuation included), picks different passages every time (recently used ones are skipped), and gives enough text for the chosen time. The text viewport keeps a few lines visible and scrolls in line-sized steps as the test progresses.
- All data is stored locally in this browser using `localStorage`; it is not synchronized across devices.


## Practice page behaviour
- The text itself is the typing space. Typing begins with the first character; there is no Enter-to-start step. If you leave the page or switch tabs, the prompt appears again when you return.
- **Enter** or **Next text** loads the next passage after a completed session; **Esc** pauses.
- **Reset** restarts the same text and discards the incomplete attempt. **Next text** also discards any incomplete attempt. Only a fully completed passage is saved to session history and all-time key statistics.
- **Preview** appears after a session ends and replays the completed typing, including Backspace and blocked keys. Long previews start at the top and auto-follow the current line. The preview is held in memory only and disappears when the next session starts.
- **Stop cursor at error** (Settings): a wrong key is counted as an error but the cursor stays until you type the correct character.

## Letter bar
One A–Z bar is shown on Home, Practice and Statistics. Unlocked letters are bright; the fill height is each letter's mastery (0–100%, based on measured per-key speed, accuracy and attempts versus your targets in Settings). Locked letters are dim, the next letter has a dashed outline, and the weakest active letter is outlined as the focus letter.

## Data accuracy and storage
- Everything is saved automatically in this browser's `localStorage` (settings, sessions, per-key statistics, chart range) and is restored on the next visit. Use Live Server (or any fixed address) so the browser always uses the same storage. Browser "clear site data" erases it.
- No demo or sample data is included. A fresh install starts empty.
- WPM = correctly typed characters in the final text / 5 / active minutes. Pauses longer than 5 seconds are not counted as typing time. Accuracy = correct keystrokes / all keystrokes, so corrected typos still count as errors.
- Per-key speed is measured from the time between keystrokes. Old data saved before this version falls back to session speed.
- Saved sessions keep only their summary numbers; per-key totals hold the detail, which keeps storage small.
- Settings has **Erase all progress & statistics** if you want a clean start.

## Letter unlocking
- Unlocking uses all-time per-key statistics, not recent-performance smoothing. A key must meet the selected target speed and at least **75% all-time accuracy**. There is no configurable accuracy target or minimum-attempt setting.
- At most one new letter unlocks after a completed practice/test session, and only when every currently active key meets the requirements.
- Proficiency has two levels: Normal uses short common words (2–5 characters), while Advanced favors more challenging vocabulary (3–7 characters). Each letter has separate Normal and Advanced word compartments. Adaptive key focus biases selection toward weaker keys but never changes the selected level’s word-length range. When letter unlocking is enabled, practice stays within the unlocked alphabet.

## Statistics page
- Eight summary cards: average speed, average accuracy, top speed, top accuracy, time today, sessions today, all-time time, all-time sessions.
- Board 1 shows accuracy and speed per key. Board 2 shows clicks and click accuracy, where click accuracy = (clicks - wrong clicks) / clicks x 100 and a wrong click is pressing the key when another was expected (tracked from this version on). Both boards colour keys by mastery.

## Generated lessons
Lessons page > Generate lessons: pick 1-5 letters on the A-Z bar (the fill behind each letter is your current mastery), choose how many lessons (1-10, default 5) and boxes per exercise (default 40). Each lesson has 5 exercises (letters, patterns, rhythm, real words, mixed review) that get harder through the set. Sets are stored in `customLessonsV1`, progress in `customProgressV1`, and they can be deleted per set. Generated lessons do not count toward the 40 curriculum lessons.

## Practice preview (v7)
The preview is rebuilt from pre-computed frames: play/pause, restart, speed and a draggable position bar. While it is open, typing and Enter are ignored so it cannot be reset by accident.

## Multiplayer race

Open **Typing test -> Multiplayer** and the site starts searching for a race automatically. There are no room codes, no host and no start button.

- Typists are matched into a room. When **5 typists** are in the same room, a **5-second countdown** starts for everyone, then the race begins and a car for each typist appears on the track.
- Your car moves with every correct character. The first to type the whole passage wins; slower typists have 45 seconds after the first finisher.
- Nobody can change the text. Each race uses one of the passages in `passages.js` (36 now; a new room picks one that this browser has not used recently) (2 to 3 lines from public-domain books such as Pride and Prejudice, Moby-Dick and Alice's Adventures in Wonderland). Add more by appending to that list (keep the existing order, because a room stores only the passage number).
- Guests get a random name and picture; signed-in typists race under their profile name and avatar.
- If fewer than 5 typists are online the search simply keeps waiting; TypeNets never invents opponents.

### Enable live multiplayer

1. Create a Firebase project and register a Web app; paste its values into `firebase-config.js`.
2. Enable **Authentication -> Sign-in method -> Anonymous** (plus Email/Password, Google and Microsoft for accounts).
3. Create a **Realtime Database**.
4. Publish the contents of `firebase-database.rules.json` as the database rules. These rules replace the old `races` / `raceLobby` rules.
5. Host on HTTPS (or Live Server) and open the Multiplayer tab in five browsers or devices.

The rules cap each room at 5 players and only let the room start once it is full, but they are a starter set: a determined player could still send false progress values. Add server-side validation before running a public competitive service.


### Multiplayer matchmaking update
The multiplayer page searches for players during a 10-second matching window. A race starts with at least 2 and at most 5 players, followed by a 5-second countdown. Publish the included `firebase-database.rules.json` in Firebase Realtime Database before testing this version.

## Updated defaults and account data sync
- Default practice settings for new users: capitals off, punctuation off, visibility 100%, 25 words, 30-minute daily goal, Normal proficiency, adaptive key focus on, letter unlocking on, target 30 WPM, and stop-at-error on.
- Firebase Auth persistence is explicitly awaited using LOCAL persistence so a signed-in account stays signed in across refreshes unless the user logs out (subject to browser storage/privacy settings).
- Before sign-in, settings and practice analytics remain in browser localStorage. On sign-in, the local practice data is merged with the account's `users/{uid}/appData` data and subsequent changes are synchronized to that account.
- Letter-unlock boundary and per-key statistics are retained when letter unlocking is toggled off and on; disabling the feature does not erase the stored letter history.

## Global leaderboard (Typing test → "All-time best performers")
Deploy the included Firebase callable function and updated Realtime Database rules. Client apps can read `/leaderboard`, but direct client writes are denied; score submissions go through `submitLeaderboardScore` in `functions/index.js`. Anonymous Firebase Authentication is supported, so no login/profile UI is needed. This reduces direct database tampering but does not fully prove that submitted scores came from real typing; see `functions/README.md`.


## Generated lessons play like the default ones
A generated lesson opens as `lesson.html?custom=<id>` and uses the same runner as the default lessons: finger guide, 5 drills (new random text on every visit), then 2 games (Balloon Pop plus Word Rain or Combo Sprint), then stars and a result. Sets appear above the default modules on the Lessons page and can be deleted per set.

## Fixed: Combo Sprint text jumping
The sprint card used the class name `pulse`, which clashed with a global `.pulse` dot style (6 x 6 px) in `style.css`. After the first completed word the white card collapsed and the text spilled out. It now uses its own `sp-hit` / `sp-bad` classes and keyframes that keep the card centred.


## Supabase staged integration
The solo-test global leaderboard can use Supabase. Configure `supabase-config.js`, run `supabase-schema.sql` in the Supabase SQL Editor, and follow `SUPABASE_SETUP.md`. The frontend uses Supabase anonymous Auth and Row Level Security for leaderboard rows. Local lesson progress and statistics remain in localStorage. Multiplayer is still Firebase-backed in this version; keep Firebase configured until that separate migration is completed.
