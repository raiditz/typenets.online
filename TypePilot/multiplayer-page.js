/* The multiplayer page starts matchmaking automatically. Avoid explicit leave-on-pagehide:
   Firebase handles waiting-room disconnects, while active-race records are preserved for refresh/reconnect. */
document.addEventListener('DOMContentLoaded', () => {
  document.dispatchEvent(new CustomEvent('tp:multiplayer', { detail: { active: true } }));
});
