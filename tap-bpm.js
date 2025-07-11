export class TapBPM {
  /** @type {number[]} Array of tap timestamps in milliseconds */
  taps = [];

  /** @type {number[]} Array of time intervals between taps in milliseconds */
  intervals = [];

  /** @type {number|null} Timestamp of the last tap in milliseconds */
  lastTapTime = null;

  /** @type {number} Current beat position (0-3), starts at -1 before first tap */
  beatCount = -1;

  /** @type {number} Current calculated BPM (beats per minute) */
  bpm = 0;
  
  // Advanced metrics
  /** @type {number} Total number of taps recorded */
  get tapCount() {
    return this.taps.length;
  }

  /** @type {number|null} Duration of the last interval in milliseconds */
  lastInterval = null;

  /** @type {number|null} Average interval duration in milliseconds */
  avgInterval = null;

  /** @type {number|null} Average deviation of intervals in milliseconds */
  avgDeviation = null;

  /** @type {string|null} Last calculated raw tempo in BPM (as string with 2 decimal places) */
  rawTempo = null;

  /** @type {number|null} Timestamp of the first tap in milliseconds */
  get firstTap() {
    return this.taps.length > 0 ? this.taps[0] : null;
  }

  /** @type {number|null} Timestamp of the last tap in milliseconds */
  get lastTap() {
    return this.taps.length > 0 ? this.taps[this.taps.length - 1] : null;
  }

  /**
   * Creates a new TapBPM instance and initializes all properties
   */
  constructor() {
    this.reset();
  }

  /**
   * Records a new tap, updates all metrics, and returns the current state
   * @returns {{
   *   bpm: number,
   *   beatCount: number,
   *   tapCount: number,
   *   lastInterval: number|null,
   *   avgInterval: number|null,
   *   avgDeviation: number|null,
   *   rawTempo: string|null,
   *   firstTap: number|null,
   *   lastTap: number|null
   * }} Current state of all metrics
   */
  tap() {
    const now = Date.now();
    
    // Calculate time since last tap
    if (this.lastTapTime) {
      const timeSinceLastTap = now - this.lastTapTime;
      this.intervals.push(timeSinceLastTap);
      this.#calculateMetrics();
    }

    this.lastTapTime = now;
    this.taps.push(now);
    this.beatCount = (this.beatCount + 1) % 4;

    // Return all metrics
    return {
      bpm: this.bpm,
      beatCount: this.beatCount,
      tapCount: this.tapCount,
      lastInterval: this.lastInterval,
      avgInterval: this.avgInterval,
      avgDeviation: this.avgDeviation,
      rawTempo: this.rawTempo,
      firstTap: this.firstTap,
      lastTap: this.lastTap
    };
  }

  /**
   * Resets all properties to their initial values
   * @returns {void}
   */
  reset() {
    this.taps = [];
    this.intervals = [];
    this.lastTapTime = null;
    this.beatCount = -1;
    this.bpm = 0;
    
    // Reset advanced metrics
    this.lastInterval = null;
    this.avgInterval = null;
    this.avgDeviation = null;
    this.rawTempo = null;
  }

  /**
   * Calculates BPM and other metrics based on recorded intervals
   * @private
   */
  #calculateMetrics() {
    if (this.intervals.length === 0) return;

    const avg = this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length;
    const bpmVal = 60000 / avg;
    
    const deviation = this.intervals.map(x => x - avg);
    const avgDev = deviation.reduce((a, b) => a + Math.abs(b), 0) / deviation.length;
    const lastRawTempo = (60000 / this.intervals[this.intervals.length - 1]).toFixed(2);

    this.bpm = bpmVal;
    this.lastInterval = this.intervals[this.intervals.length - 1];
    this.avgInterval = avg;
    this.avgDeviation = avgDev;
    this.rawTempo = lastRawTempo;
  }
} 