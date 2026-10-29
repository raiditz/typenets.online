# TypeNets leaderboard function

## Deploy
1. Install Firebase CLI and sign in: `npm install -g firebase-tools` then `firebase login`.
2. From this `TypeNets` directory, select the existing project: `firebase use typepilot-6e955` (or `firebase use --add` if your project alias differs).
3. Install function dependencies: `cd functions && npm install && cd ..`.
4. Deploy the callable: `firebase deploy --only functions:submitLeaderboardScore`.
5. After the function is deployed, deploy database rules: `firebase deploy --only database`.

The app uses Firebase Anonymous Authentication; no login/profile UI is required. The function region matches the configured Realtime Database region. Function deployment may require the Firebase/Google Cloud billing plan required by your project.

## Security limitation
This moves leaderboard writes behind a server-controlled endpoint and applies centralized validation, but it does not prove the user physically typed the submitted text. A determined client can still submit a fabricated but in-range score to the callable. Stronger anti-cheat needs server-verifiable typing evidence and rate limiting/App Check. Multiplayer player WPM/progress remains client-reported; the rules constrain shape and numeric ranges, not truthfulness.
