import { h } from 'preact';
import { html } from 'htm/preact';
import { useState } from 'preact/hooks';
import { TapBPMComponent } from './tap-bpm.component.js';
import { MetronomeComponent } from './metronome.component.js';
import { useLocalStorage } from './hooks.js';

/**
 * Main application component with tab navigation
 * @returns {import('preact').VNode} Rendered component
 */
export function App() {
  const [activeTab, setActiveTab] = useLocalStorage('metronome-active-tab', 'metronome');

  return html`
    <div>
      <p class="lead text-center">BeatFlare</p>
      <div class="nav nav-tabs mb-4 justify-content-center">
        <button 
          class="nav-link ${activeTab === 'metronome' ? 'active' : ''}"
          onClick=${() => setActiveTab('metronome')}
        >
          Metronome
        </button>
        <button 
          class="nav-link ${activeTab === 'tapbpm' ? 'active' : ''}"
          onClick=${() => setActiveTab('tapbpm')}
        >
          Tap BPM
        </button>
      </div>

      ${activeTab === 'metronome' 
        ? html`<${MetronomeComponent} />`
        : html`<${TapBPMComponent} />`
      }
    </div>
  `;
} 