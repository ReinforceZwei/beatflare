/**
 * High-precision timer using Web Workers
 */
export class Timer {
  #worker;
  #interval;
  #isRunning;
  #callback;

  /**
   * Create a new Timer
   * @param {number} interval - Interval in milliseconds
   * @param {Function} callback - Function to call on each tick
   */
  constructor(interval = 25, callback = null) {
    this.#interval = interval;
    this.#isRunning = false;
    this.#callback = callback;
    this.#initWorker();
  }

  /**
   * Initialize the Web Worker
   * @private
   */
  #initWorker() {
    this.#worker = new Worker('timer-worker.js');
    this.#worker.onmessage = (e) => {
      if (e.data === 'tick' && this.#isRunning && this.#callback) {
        this.#callback();
      }
    };
    this.#worker.postMessage({ interval: this.#interval });
  }

  /**
   * Start the timer
   */
  start() {
    if (!this.#isRunning) {
      this.#isRunning = true;
      this.#worker.postMessage('start');
    }
  }

  /**
   * Stop the timer
   */
  stop() {
    if (this.#isRunning) {
      this.#isRunning = false;
      this.#worker.postMessage('stop');
    }
  }

  /**
   * Set a new callback function
   * @param {Function} callback - Function to call on each tick
   */
  setCallback(callback) {
    this.#callback = callback;
  }

  /**
   * Set a new interval
   * @param {number} interval - Interval in milliseconds
   */
  setInterval(interval) {
    this.#interval = interval;
    this.#worker.postMessage({ interval });
  }

  /**
   * Check if timer is running
   * @returns {boolean}
   */
  isRunning() {
    return this.#isRunning;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    this.#worker.terminate();
  }
} 