import { Timer } from './timer.js';

export class Metronome {
  // Private fields
  #audioContext;
  #tempo;
  #isRunning;
  #scheduleAheadTime;
  #nextNoteTime;
  #normalBeatBuffer;
  #accentBeatBuffer;
  #currentBeat;
  #beatsPerBar;
  #onBeatCallback;
  #timer;
  #startTime;  // Track when we started playing
  #beatCount;  // Track total beats since start
  #accentEnabled; // Whether to play accented beats

  constructor() {
    this.#audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.#tempo = 120; // Default tempo (BPM)
    this.#isRunning = false;
    this.#scheduleAheadTime = 0.1; // How far ahead to schedule (seconds)
    this.#nextNoteTime = 0.0;
    this.#normalBeatBuffer = null;
    this.#accentBeatBuffer = null;
    this.#currentBeat = 0;
    this.#beatsPerBar = 4; // Default 4 beats per bar
    this.#onBeatCallback = null;
    this.#startTime = 0;
    this.#beatCount = 0;
    this.#accentEnabled = true; // Accent enabled by default
    
    // Initialize timer with 25ms interval
    this.#timer = new Timer(25, () => this.#scheduler());
  }

  // Load normal beat sound
  async loadNormalSound(file) {
    this.#normalBeatBuffer = await this.#loadAudioFile(file);
  }

  // Load accent beat sound
  async loadAccentSound(file) {
    this.#accentBeatBuffer = await this.#loadAudioFile(file);
  }

  // Private method to load audio file
  async #loadAudioFile(file) {
    try {
      const response = await fetch(URL.createObjectURL(file));
      const arrayBuffer = await response.arrayBuffer();
      return await this.#audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  // Private method to play a single note
  #playNote(time, isAccent) {
    // If accent is disabled, always use normal beat
    const useAccent = this.#accentEnabled && isAccent;
    const buffer = useAccent ? this.#accentBeatBuffer : this.#normalBeatBuffer;
    if (!buffer) return;

    const source = this.#audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.#audioContext.destination);
    source.start(time);
  }

  // Start the metronome
  start() {
    if (this.#isRunning) {
      return; // Already running
    }
    
    if (!this.#normalBeatBuffer) {
      throw new Error('Normal beat sound not loaded');
    }

    this.#isRunning = true;
    this.#currentBeat = 0;
    this.#beatCount = 0;
    this.#startTime = this.#audioContext.currentTime;
    this.#nextNoteTime = this.#startTime;
    this.#timer.start();
    console.log('Metronome started');
  }

  // Stop the metronome
  stop() {
    if (!this.#isRunning) {
      return; // Already stopped
    }

    this.#isRunning = false;
    this.#timer.stop();
    console.log('Metronome stopped');
  }

  // Check if metronome is running
  isRunning() {
    return this.#isRunning;
  }

  // Private scheduler method
  #scheduler() {
    // Schedule notes until we're ahead by the look-ahead time
    while (this.#nextNoteTime < this.#audioContext.currentTime + this.#scheduleAheadTime) {
      const isFirstBeat = this.#currentBeat === 0;
      this.#playNote(this.#nextNoteTime, isFirstBeat);
      
      // Notify beat callback if set
      if (this.#onBeatCallback) {
        this.#onBeatCallback(this.#currentBeat);
      }

      // Increment beat counters
      this.#currentBeat = (this.#currentBeat + 1) % this.#beatsPerBar;
      this.#beatCount++;

      // Calculate next note time based on start time and beat count
      // This prevents accumulating floating point errors
      const secondsPerBeat = 60.0 / this.#tempo;
      this.#nextNoteTime = this.#startTime + (this.#beatCount * secondsPerBeat);

      // Guard against drift: if we're too far off, resync with audio context
      const drift = Math.abs(this.#nextNoteTime - (this.#audioContext.currentTime + secondsPerBeat));
      if (drift > 0.1) { // If drift is more than 100ms
        console.warn('Drift detected, resyncing metronome');
        this.#startTime = this.#audioContext.currentTime;
        this.#nextNoteTime = this.#startTime;
        this.#beatCount = 0;
      }
    }
  }

  // Set callback for beat notifications
  setOnBeatCallback(callback) {
    this.#onBeatCallback = callback;
  }

  // Set beats per bar (for accent timing)
  setBeatsPerBar(beats) {
    this.#beatsPerBar = beats;
    //this.#currentBeat = 0; // Reset beat counter for clean accent timing
  }

  // Enable or disable accent on first beat
  setAccentEnabled(enabled) {
    this.#accentEnabled = enabled;
  }

  // Check if accent is enabled
  isAccentEnabled() {
    return this.#accentEnabled;
  }

  // Set tempo (BPM)
  setTempo(newTempo) {
    if (this.#isRunning) {
      // When changing tempo while running, maintain phase alignment
      const secondsPerBeat = 60.0 / this.#tempo;
      const oldPosition = (this.#audioContext.currentTime - this.#startTime) / secondsPerBeat;
      this.#tempo = newTempo;
      this.#startTime = this.#audioContext.currentTime - (oldPosition * 60.0 / newTempo);
      this.#beatCount = Math.floor(oldPosition);
    } else {
      this.#tempo = newTempo;
    }
  }

  // Get current tempo
  getTempo() {
    return this.#tempo;
  }

  // Get current beats per bar
  getBeatsPerBar() {
    return this.#beatsPerBar;
  }

  // Clean up resources
  destroy() {
    this.#timer.destroy();
    if (this.#audioContext) {
      this.#audioContext.close();
    }
  }
}