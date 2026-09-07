/* A clock-driven player: no timers per clip, no stale completion callbacks. */
(function (root) {
  'use strict';
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function frameAt(clip, elapsed, loop) {
    const durations = clip.durations || Array(clip.frameCount).fill(1000 / clip.fps);
    const total = durations.reduce((sum, value) => sum + value, 0);
    let cursor = loop ? Math.max(0, elapsed) % total : clamp(elapsed, 0, total - 0.001);
    for (let i = 0; i < durations.length; i++) {
      if (cursor < durations[i]) return { frame: i, ended: !loop && elapsed >= total };
      cursor -= durations[i];
    }
    return { frame: clip.frameCount - 1, ended: !loop && elapsed >= total };
  }
  class ClipPlayer {
    constructor(clips) { this.clips = clips; this.action = 'idle'; this.elapsed = 0; this.loop = true; this.playing = true; this.speed = 1; this.generation = 0; }
    select(action, loop = true) {
      if (!this.clips[action]) throw new Error('Unknown clip: ' + action);
      this.action = action; this.elapsed = 0; this.loop = loop; this.generation++;
    }
    tick(delta) {
      if (this.playing) this.elapsed += Math.max(0, delta) * this.speed;
      const result = frameAt(this.clips[this.action], this.elapsed, this.loop);
      if (result.ended) { this.select('idle'); return { action: 'idle', frame: 0 }; }
      return { action: this.action, frame: result.frame };
    }
    seek(frame) {
      const clip = this.clips[this.action];
      const durations = clip.durations || Array(clip.frameCount).fill(1000 / clip.fps);
      this.elapsed = durations.slice(0, clamp(frame, 0, clip.frameCount - 1)).reduce((sum, value) => sum + value, 0);
      this.playing = false;
    }
  }
  const api = { ClipPlayer, clamp, frameAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.JeanMotion = api;
})(typeof window === 'undefined' ? globalThis : window);
