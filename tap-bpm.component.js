import { html } from 'htm/preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { TapBPM } from './tap-bpm.js';

/**
 * TapBPM component for measuring tempo through tapping
 * @returns {import('preact').VNode} Rendered component
 */
export function TapBPMComponent() {
  const [tapEffect, setTapEffect] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [autoResetTimeout, setAutoResetTimeout] = useState(3);
  const [bpm, setBpm] = useState(0);
  const [beatCount, setBeatCount] = useState(-1);
  const [advanced, setAdvanced] = useState({});
  const autoResetTimer = useRef(null);
  const tapBtnRef = useRef();
  const tapBPM = useRef(new TapBPM());

  // Keyboard events
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;
      // Ignore meta keys and F1-F12
      if (
        e.ctrlKey || e.altKey || e.metaKey || e.shiftKey ||
        (e.key.length > 1 && /^F\d{1,2}$/.test(e.key))
      ) {
        return;
      }
      if (e.key === 'Escape') {
        onManualReset();
      } else {
        onTap();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.backgroundColor = '#22223b';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  function onTap() {
    document.body.style.backgroundColor = '#36223b';
    setTapEffect(true);
    setTimeout(() => setTapEffect(false), 200);

    const result = tapBPM.current.tap();
    setBpm(result.bpm);
    setBeatCount(result.beatCount);
    setAdvanced(result);

    // Auto reset timer
    clearTimeout(autoResetTimer.current);
    autoResetTimer.current = setTimeout(() => {
      onAutoReset();
    }, autoResetTimeout * 1000);
  }

  function onManualReset() {
    tapBPM.current.reset();
    setBpm(0);
    setBeatCount(-1);
    setAdvanced({});
    clearTimeout(autoResetTimer.current);
    document.body.style.backgroundColor = '#22223b';
  }

  function onAutoReset() {
    tapBPM.current.reset();
    document.body.style.backgroundColor = '#22223b';
  }

  function onTimeoutChange(e) {
    setAutoResetTimeout(Number(e.target.value));
  }

  function onToggleAdvanced() {
    setShowAdvanced(v => !v);
  }

  function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  return html`
    <div class="text-center">
      <div class="bpm-number mb-2">${bpm ? Math.round(bpm) : tapBPM.current.tapCount == 1 ? '1st' : '--'}</div>
      <div class="mb-3 text-secondary">BPM</div>
      <div class="dots mb-4">
        ${Array.from({ length: 4 }).map((_, i) =>
          html`<div class="dot${beatCount >= 0 && i === beatCount ? ' active' : ''}"></div>`
        )}
      </div>
      <button
        ref=${tapBtnRef}
        class="btn btn-primary tap-btn mb-3${tapEffect ? ' tap-effect' : ''}"
        onClick=${onTap}
        onTouchStart=${onTap}
        style="user-select:none;"
      >
        Tap!
      </button>
      <div class="mb-3">
        <button class="btn btn-outline-light me-2" onClick=${onManualReset}>Reset (ESC)</button>
        <input type="number" class="form-control d-inline w-auto" min="1" max="10" step="1" value=${autoResetTimeout} onChange=${onTimeoutChange} style="width:7em;" />
        <span class="ms-1">s auto reset</span>
      </div>
      <div>
        <button class="btn btn-sm btn-secondary" onClick=${onToggleAdvanced}>
          ${showAdvanced ? 'Hide' : 'Show'} Advanced Info
        </button>
      </div>
      ${showAdvanced && bpm ? html`
        <div class="advanced-info mt-3 text-start mx-auto" style="max-width:400px;">
          <div><b>Tap count:</b> ${advanced.tapCount}</div>
          <div><b>Last interval:</b> ${advanced.lastInterval ? advanced.lastInterval.toFixed(1) : '--'} ms</div>
          <div><b>Avg interval:</b> ${advanced.avgInterval ? advanced.avgInterval.toFixed(1) : '--'} ms</div>
          <div><b>Avg deviation:</b> ${advanced.avgDeviation ? advanced.avgDeviation.toFixed(2) : '--'} ms</div>
          <div><b>Raw tempo:</b> ${advanced.rawTempo ? advanced.rawTempo : '--'} BPM</div>
          <div><b>Duration:</b> ${advanced.firstTap && advanced.lastTap ? formatDuration(advanced.lastTap - advanced.firstTap) : '--'}</div>
        </div>
      ` : null}
      <div class="mt-5 text-secondary">
        <small>Tap with mouse, touch, or any key. Reset with ESC.</small>
      </div>
    </div>
  `;
} 