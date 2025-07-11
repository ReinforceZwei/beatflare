import { html } from 'htm/preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Metronome } from './metronome.js';
import { useWakeLock, useLocalStorage } from './hooks.js';

const QUARTER_NOTE = '4th';
const EIGHTH_NOTE = '8th';
const SIXTEENTH_NOTE = '16th';
const DOTTED_QUARTER_NOTE = 'dotted 4th';

const beats = {
  '2/4': [
    { beats: 2, noteValue: QUARTER_NOTE },
    { beats: 4, noteValue: EIGHTH_NOTE },
    { beats: 8, noteValue: SIXTEENTH_NOTE }
  ],
  '3/4': [
    { beats: 3, noteValue: QUARTER_NOTE },
    { beats: 6, noteValue: EIGHTH_NOTE },
    { beats: 12, noteValue: SIXTEENTH_NOTE }
  ],
  '4/4': [
    { beats: 4, noteValue: QUARTER_NOTE },
    { beats: 8, noteValue: EIGHTH_NOTE },
    { beats: 16, noteValue: SIXTEENTH_NOTE }
  ],
  '5/4': [
    { beats: 5, noteValue: QUARTER_NOTE },
    { beats: 10, noteValue: EIGHTH_NOTE },
    { beats: 20, noteValue: SIXTEENTH_NOTE }
  ],
  '6/4': [
    { beats: 6, noteValue: QUARTER_NOTE },
    { beats: 12, noteValue: EIGHTH_NOTE },
    { beats: 24, noteValue: SIXTEENTH_NOTE }
  ],
  '7/4': [
    { beats: 7, noteValue: QUARTER_NOTE },
    { beats: 14, noteValue: EIGHTH_NOTE },
    { beats: 28, noteValue: SIXTEENTH_NOTE }
  ],
  '3/8': [
    { beats: 1, noteValue: DOTTED_QUARTER_NOTE },
    { beats: 3, noteValue: EIGHTH_NOTE },
    { beats: 6, noteValue: SIXTEENTH_NOTE }
  ],
  '6/8': [
    { beats: 2, noteValue: DOTTED_QUARTER_NOTE },
    { beats: 6, noteValue: EIGHTH_NOTE },
    { beats: 12, noteValue: SIXTEENTH_NOTE }
  ],
  '9/8': [
    { beats: 3, noteValue: DOTTED_QUARTER_NOTE },
    { beats: 9, noteValue: EIGHTH_NOTE },
    { beats: 18, noteValue: SIXTEENTH_NOTE }
  ],
  '12/8': [
    { beats: 4, noteValue: DOTTED_QUARTER_NOTE },
    { beats: 12, noteValue: EIGHTH_NOTE },
    { beats: 24, noteValue: SIXTEENTH_NOTE }
  ]
};

// Display names for note values
const noteValueLabels = {
  [QUARTER_NOTE]: 'Quarter Note',
  [EIGHTH_NOTE]: 'Eighth Note',
  [SIXTEENTH_NOTE]: 'Sixteenth Note',
  [DOTTED_QUARTER_NOTE]: 'Dotted Quarter Note'
};

const noteValueUnicode = {
  [QUARTER_NOTE]: '𝅘𝅥',
  [EIGHTH_NOTE]: '𝅘𝅥𝅮',
  [SIXTEENTH_NOTE]: '𝅘𝅥𝅯',
  [DOTTED_QUARTER_NOTE]: '𝅘𝅥.'
}

// Tempo multipliers for different note values
const tempoMultipliers = {
  [QUARTER_NOTE]: 1,
  [EIGHTH_NOTE]: 2,
  [SIXTEENTH_NOTE]: 4,
  [DOTTED_QUARTER_NOTE]: 1 // For compound meters
};
const tempoMultipliersCompound = {
  [QUARTER_NOTE]: 1,
  [EIGHTH_NOTE]: 3,
  [SIXTEENTH_NOTE]: 6,
  [DOTTED_QUARTER_NOTE]: 1 // For compound meters
};

/**
 * Metronome component for keeping tempo
 * @returns {import('preact').VNode} Rendered component
 */
export function MetronomeComponent() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayTempo, setDisplayTempo] = useLocalStorage('metronome-tempo', 120);
  const [timeSignature, setTimeSignature] = useLocalStorage('metronome-time-signature', '4/4');
  const [noteValue, setNoteValue] = useLocalStorage('metronome-note-value', QUARTER_NOTE);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [accentEnabled, setAccentEnabled] = useLocalStorage('metronome-accent-enabled', true);
  const metronomeRef = useRef(null);
  const { acquireWakeLock, releaseWakeLock, error: wakeLockError } = useWakeLock();

  // Get current beat configuration based on time signature and note value
  const currentBeatConfig = beats[timeSignature].find(config => config.noteValue === noteValue) || beats[timeSignature][0];
  const beatsPerBar = currentBeatConfig.beats;
  const isCompoundMeter = timeSignature.split('/')[1] === '8';

  // Always get the quarter note or dotted quarter note count for visual display
  const quarterNoteConfig = beats[timeSignature].find(config => 
    config.noteValue === QUARTER_NOTE || config.noteValue === DOTTED_QUARTER_NOTE
  );
  const visualBeatsCount = quarterNoteConfig ? quarterNoteConfig.beats : beatsPerBar;

  // Calculate the beat to display based on the actual beat count vs visual beat count
  const displayBeat = currentBeat >= 0 ? Math.floor(currentBeat * visualBeatsCount / beatsPerBar) % visualBeatsCount : -1;

  // Calculate actual tempo to set on the metronome based on display tempo and note value
  const actualTempo = displayTempo * (isCompoundMeter ? tempoMultipliersCompound[noteValue] : tempoMultipliers[noteValue]);

  // Initialize metronome
  useEffect(() => {
    const initMetronome = async () => {
      metronomeRef.current = new Metronome();
      
      // Create blob URLs for the audio files
      const normalResponse = await fetch('click.mp3');
      const accentResponse = await fetch('click-high.mp3');
      const normalBlob = await normalResponse.blob();
      const accentBlob = await accentResponse.blob();

      // Load both sounds
      await metronomeRef.current.loadNormalSound(normalBlob);
      await metronomeRef.current.loadAccentSound(accentBlob);
      
      // Set initial beats per bar and tempo
      metronomeRef.current.setBeatsPerBar(beatsPerBar);
      metronomeRef.current.setTempo(actualTempo);
      metronomeRef.current.setAccentEnabled(accentEnabled);

      // Set beat callback
      metronomeRef.current.setOnBeatCallback((beat) => {
        setCurrentBeat(beat);
      });
    };

    initMetronome().catch(console.error);

    // Cleanup
    return () => {
      if (metronomeRef.current) {
        metronomeRef.current.stop(); // Stop if playing
      }
    };
  }, []);

  // Update metronome when time signature or note value changes
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.setBeatsPerBar(beatsPerBar);
    }
  }, [beatsPerBar]);
  
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.setTempo(actualTempo);
    }
  }, [actualTempo]);

  // Update accent setting when changed
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.setAccentEnabled(accentEnabled);
    }
  }, [accentEnabled]);

  // Keyboard events
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlaying]);

  // Update wake lock when playing state changes
  useEffect(() => {
    if (isPlaying) {
      acquireWakeLock().catch(console.error);
    } else {
      releaseWakeLock();
    }
  }, [isPlaying]);

  function togglePlayback() {
    if (!metronomeRef.current) return;
    
    if (isPlaying) {
      metronomeRef.current.stop();
      setCurrentBeat(-1); // Reset beat indicator
      releaseWakeLock();
    } else {
      metronomeRef.current.start();
      acquireWakeLock().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }

  function handleTempoChange(e) {
    const newDisplayTempo = Number(e.target.value);
    setDisplayTempo(newDisplayTempo);
  }

  function adjustTempo(amount) {
    // Ensure tempo stays within bounds
    const newTempo = Math.min(Math.max(30, displayTempo + amount), 300);
    setDisplayTempo(newTempo);
  }

  function handleTimeSignatureChange(e) {
    const newTimeSignature = e.target.value;
    setTimeSignature(newTimeSignature);
    
    // Find available note values for this time signature
    const availableNoteValues = beats[newTimeSignature].map(b => b.noteValue);
    
    // If current note value is not available in the new time signature, select the first one
    if (!availableNoteValues.includes(noteValue)) {
      setNoteValue(availableNoteValues[0]);
    }
  }

  function handleNoteValueChange(e) {
    setNoteValue(e.target.value);
  }

  function handleAccentChange(e) {
    setAccentEnabled(e.target.checked);
  }

  // Render note value with Unicode symbol
  function renderNoteValueOption(noteValueType) {
    return html`
      <div class="d-flex align-items-center">
        <span class="me-2 note-symbol">${noteValueUnicode[noteValueType]}</span>
        <span>${noteValueLabels[noteValueType]}</span>
      </div>
    `;
  }

  return html`
    <div class="text-center">
      ${wakeLockError && html`
        <div class="alert alert-warning small mb-2">
          <small>Screen may turn off while metronome is running: ${wakeLockError.message}</small>
        </div>
      `}
      <div class="bpm-number mb-2">${displayTempo}</div>
      <div class="mb-3 text-secondary d-flex align-items-center justify-content-center">
        BPM 
        <span class="ms-2 note-symbol">${noteValueUnicode[noteValue]}</span>
      </div>
      
      <div class="dots mb-4">
        ${Array.from({ length: visualBeatsCount }).map((_, i) =>
          html`<div class="dot${displayBeat === i ? ' active' : ''}"></div>`
        )}
      </div>

      <div class="mb-4">
        <div class="d-flex align-items-center justify-content-center">
          <button 
            class="btn btn-outline-secondary me-2" 
            onClick=${() => adjustTempo(-1)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"/>
            </svg>
          </button>
          
          <div class="flex-grow-1" style="max-width: 300px;">
            <input
              type="range"
              class="form-range"
              min="30"
              max="300"
              value=${displayTempo}
              onInput=${handleTempoChange}
            />
          </div>
          
          <button 
            class="btn btn-outline-secondary ms-2" 
            onClick=${() => adjustTempo(1)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="mb-4">
        <input
          type="checkbox"
          class="form-check-input"
          id="accentCheck"
          checked=${accentEnabled}
          onChange=${handleAccentChange}
        />
        <label class="form-check-label" for="accentCheck">
          Accent first beat
        </label>
      </div>

      <button
        class="btn btn-primary tap-btn mb-3"
        onClick=${togglePlayback}
      >
        ${isPlaying ? 'Stop' : 'Start'}
      </button>

      <div class="mb-3">
        <select
          class="form-select d-inline-block w-auto"
          value=${timeSignature}
          onChange=${handleTimeSignatureChange}
        >
          ${Object.keys(beats).map(sig => html`
            <option value=${sig}>${sig}</option>
          `)}
        </select>
        <span class="ms-2">time signature</span>
      </div>

      <div class="mb-4">
        <select
          class="form-select d-inline-block w-auto"
          value=${noteValue}
          onChange=${handleNoteValueChange}
        >
          ${beats[timeSignature].map(config => html`
            <option value=${config.noteValue}>
              ${noteValueUnicode[config.noteValue]} ${noteValueLabels[config.noteValue]}
            </option>
          `)}
        </select>
      </div>

      <div class="mt-5 text-secondary">
        <small>Press spacebar to start/stop.</small>
      </div>
    </div>
  `;
} 