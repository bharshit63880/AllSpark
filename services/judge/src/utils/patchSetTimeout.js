// Ensure no negative timeout values are passed to setTimeout / setInterval.
// Node.js emits `TimeoutNegativeWarning` when a negative delay is used.

const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;

const clampTimeout = (delay) => {
  const normalized = typeof delay === "number" ? delay : 0;
  return Math.max(1, normalized);
};

global.setTimeout = (fn, delay, ...args) => {
  return originalSetTimeout(fn, clampTimeout(delay), ...args);
};

global.setInterval = (fn, delay, ...args) => {  
  return originalSetInterval(fn, clampTimeout(delay), ...args);
};
