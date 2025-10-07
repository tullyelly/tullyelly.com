(function () {
  if (typeof window === "undefined") return;
  window.__navTest = window.__navTest || {};
  if (window.__analytics) return;
  const events = [];
  window.__analytics = {
    record(event) {
      events.push(event);
    },
    get() {
      return events.slice();
    },
    flush() {
      events.length = 0;
    },
  };
})();
