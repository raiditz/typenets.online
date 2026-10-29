# TypeNets + Supabase setup (staged migration)

This package switches the **solo-test global leaderboard** to Supabase. Lesson progress and solo statistics remain in browser `localStorage`. **Multiplayer rooms still use the existing Firebase Realtime Database**, so do not delete or disable Firebase yet. This is a safe staged migration, not a complete Firebase removal.

## 1. Create a Supabase project
1. Open https://supabase.com/dashboard and create a project. Save the database password somewhere private.
2. In Project Settings / Connect (or API settings), copy the Project URL and the **publishable** key (older projects may call it the `anon` key).
3. Open `supabase-config.js` and replace `https://YOUR_PROJECT_ID.supabase.co` and `YOUR_SUPABASE_PUBLISHABLE_KEY`. The publishable/anon key is intended for browser use with RLS enabled. **Never put a `service_role` or secret key in frontend files.**
4. In Authentication settings, enable **Anonymous sign-ins**. The leaderboard uses an anonymous Supabase user ID so no sign-up screen is required.
5. Open SQL Editor, create a query, paste all of `supabase-schema.sql`, and run it. Confirm the `leaderboard` table exists.

## 2. Run locally
Serve the folder over HTTP/HTTPS (for example VS Code Live Server), not by opening `index.html` as a `file://` URL. Open `typing-test.html` (served at `/typing-test`), finish an eligible test (15+ seconds and 90%+ accuracy), then check the All-time best performers board.

## 3. Deploy frontend
Deploy the TypeNets folder to Cloudflare Pages as a static site. The root should contain `index.html`, `typing-test.html`, `supabase-config.js`, and the other HTML/JS/CSS files. No build command is required for this vanilla HTML project.

## 4. Keep Firebase for multiplayer for now
`multiplayer.js` still depends on Firebase Authentication and Realtime Database. Keep the Firebase scripts/config/rules active until multiplayer is migrated and tested separately. The current Supabase integration does not yet replace Firebase multiplayer or cross-device progress sync.

## Security notes
- RLS policies restrict leaderboard writes to the signed-in user's own row and database constraints bound submitted values. Browser-submitted typing scores are still not proof of genuine typing; robust anti-cheat requires server-side validation.
- Anonymous auth sessions are browser/device-specific. Clearing browser data may lose access to that anonymous account's cloud leaderboard row.
- Never publish Supabase secret/service-role keys.

## Username + avatar profile (new)
After applying the existing schema, run `supabase-profile-migration.sql` in SQL Editor. This creates unique usernames, a profile table, an RPC that enforces two username changes per calendar month, and `avatar_id` on leaderboard rows. The browser profile uses the same Supabase anonymous-auth user, so it persists in that browser/profile; clearing site data or switching browsers can lose access to an anonymous account. For durable cross-device identity, add a real sign-in provider and account recovery. Never put a service-role key in the client. Username availability checks are advisory; the database unique constraint is authoritative.

In `supabase-config.js`, set the Project URL and the publishable/anon key. Then refresh the test page. Usernames are 3–20 lowercase letters, numbers, or underscores; 48 image avatars are included (`/avatars`).

## Profile update v2 (run once)
Run `supabase-profile-migration-v2.sql` in the SQL Editor (after the two earlier files). It adds `get_username_status()`, which lets the editor show "N of 2 username changes left" without spending one. The editor still works without it, but cannot show or pre-lock the monthly count.

Rules (enforced in the database by `save_username_profile`): creating your first username is free and is not a change; changing to a different username counts as 1 and 2 are allowed per calendar month (UTC, resets on the 1st); changing only the avatar is always free. Multiplayer uses the same saved username; new players are asked to choose one before matchmaking.
