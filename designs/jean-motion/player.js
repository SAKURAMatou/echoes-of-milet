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
  function directionalFrameAt(clip, elapsed, hold = 650, rest = 450) {
    const durations = clip.durations || Array(clip.frameCount).fill(1000 / clip.fps);
    const forwardTotal = durations.reduce((sum, value) => sum + value, 0);
    const reverseDurations = durations.slice(0, -1).reverse();
    const reverseTotal = reverseDurations.reduce((sum, value) => sum + value, 0);
    let cursor = Math.max(0, elapsed) % (forwardTotal + hold + reverseTotal + rest);
    if (cursor < forwardTotal) return frameAt(clip, cursor, false).frame;
    cursor -= forwardTotal;
    if (cursor < hold) return clip.frameCount - 1;
    cursor -= hold;
    if (cursor < reverseTotal) {
      for (let index = 0; index < reverseDurations.length; index++) {
        if (cursor < reverseDurations[index]) return clip.frameCount - 2 - index;
        cursor -= reverseDurations[index];
      }
    }
    return 0;
  }
  class ClipPlayer {
    constructor(clips) { this.clips = clips; this.action = 'idle'; this.elapsed = 0; this.mode = 'loop'; this.playing = true; this.speed = 1; this.generation = 0; }
    select(action, mode = true) {
      if (!this.clips[action]) throw new Error('Unknown clip: ' + action);
      this.action = action; this.elapsed = 0;
      this.mode = mode === true ? 'loop' : mode === false ? 'once' : mode;
      this.generation++;
    }
    tick(delta) {
      if (this.playing) this.elapsed += Math.max(0, delta) * this.speed;
      const clip = this.clips[this.action];
      if (this.mode === 'direction-preview') {
        return { action: this.action, frame: directionalFrameAt(clip, this.elapsed) };
      }
      const result = frameAt(clip, this.elapsed, this.mode === 'loop');
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
  const api = { ClipPlayer, clamp, frameAt, directionalFrameAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.JeanMotion = api;
})(typeof window === 'undefined' ? globalThis : window);
