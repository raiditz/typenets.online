const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

initializeApp();

// This endpoint centralizes validation and prevents direct client writes to /leaderboard.
// Important: scores are still client-reported. This is abuse reduction, not proof of real typing.
exports.submitLeaderboardScore = onCall({ region: 'asia-southeast1', enforceAppCheck: false }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Anonymous or signed-in Firebase authentication is required.');
  const data = request.data || {};
  const name = typeof data.name === 'string' ? data.name.trim().slice(0, 24) : '';
  const wpm = Number(data.wpm);
  const accuracy = Number(data.accuracy);
  const duration = Number(data.duration);
  if (!name || !Number.isFinite(wpm) || wpm < 1 || wpm > 300 ||
      !Number.isFinite(accuracy) || accuracy < 90 || accuracy > 100 ||
      !Number.isFinite(duration) || duration < 15 || duration > 600) {
    throw new HttpsError('invalid-argument', 'Score is outside accepted limits.');
  }
  const ref = getDatabase().ref('leaderboard/' + request.auth.uid);
  const candidate = { name, wpm: Math.round(wpm), accuracy: Math.round(accuracy * 10) / 10,
    duration: Math.round(duration), at: Date.now() };
  const result = await ref.transaction(current => {
    if (current && Number(current.wpm) >= candidate.wpm) return; // abort: keep existing best
    return candidate;
  });
  if (!result.committed) return { status: 'kept', best: Number((result.snapshot.val() || {}).wpm) || 0 };
  return { status: 'saved', best: candidate.wpm };
});
