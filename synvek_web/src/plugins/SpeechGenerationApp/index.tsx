import { PluginDefinition } from '@/components/Utils'

const SpeechGenerationApp: PluginDefinition = {
  id: 'Speech Generation',
  name: 'Speech Generation',
  description: 'Speech Generation',
  type: 'app',
  category: 'tool',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <path
        fill="#15b354"
        d="M32.833 12.112a5.36 5.36 0 0 0-2.544-1.805l-2.603-.845a1.028 1.028 0 0 1 0-1.937l2.602-.845a5.36 5.36 0 0 0 3.323-3.33l.022-.064l.845-2.6a1.027 1.027 0 0 1 1.94 0l.845 2.6A5.36 5.36 0 0 0 40.66 6.68l2.602.845l.052.013a1.028 1.028 0 0 1 0 1.937l-2.602.845a5.36 5.36 0 0 0-3.397 3.394l-.846 2.6l-.025.064a1.027 1.027 0 0 1-1.538.433a1.03 1.03 0 0 1-.375-.497l-.846-2.6a5.4 5.4 0 0 0-.852-1.602m14.776 6.872l-1.378-.448a2.84 2.84 0 0 1-1.797-1.796l-.448-1.377a.544.544 0 0 0-1.027 0l-.448 1.377a2.84 2.84 0 0 1-1.77 1.796l-1.378.448a.545.545 0 0 0 0 1.025l1.378.448q.227.075.438.188l.003.015a2.84 2.84 0 0 1 1.357 1.61l.448 1.377a.545.545 0 0 0 1.01.039v-.01l.016-.039l.448-1.377a2.84 2.84 0 0 1 1.798-1.796l1.378-.448a.545.545 0 0 0 0-1.025zM24 4c1.966 0 3.866.284 5.662.813l-.022.007l-2.57.83a3.1 3.1 0 0 0-1.364.932A18 18 0 0 0 24 6.5C14.335 6.5 6.5 14.335 6.5 24S14.335 41.5 24 41.5c9.336 0 16.964-7.31 17.473-16.52q.219.319.527.56a2.55 2.55 0 0 0 1.904.429C42.915 36.09 34.381 44 24 44C12.954 44 4 35.046 4 24S12.954 4 24 4m7.5 13.25c0-.562.371-1.038.882-1.195l.278.855A3 3 0 0 0 34 18.563V30.75a1.25 1.25 0 1 1-2.5 0zM20.75 16c.69 0 1.25.56 1.25 1.25v13.5a1.25 1.25 0 1 1-2.5 0v-13.5c0-.69.56-1.25 1.25-1.25m-6 4c.69 0 1.25.56 1.25 1.25v5.5a1.25 1.25 0 1 1-2.5 0v-5.5c0-.69.56-1.25 1.25-1.25m13.25.25a1.25 1.25 0 1 0-2.5 0v7.5a1.25 1.25 0 1 0 2.5 0z"
      />
    </svg>`,
  vendor: 'Synvek',
  content: `
    <style>
:root {
  --primary: #1890ff;
  --bg: #f0f2f5;
  --card-bg: #ffffff;
  --text: #333333;
  --border: #e8e8e8;
}

body.dark {
  --primary: #177ddc;
  --bg: #1f1f1f;
  --card-bg: #141414;
  --text: #e8e8e8;
  --border: #303030;
}

body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  transition: background-color 0.3s, color 0.3s;
  margin: 0;
  display: flex;
  justify-content: center;
  justify-items: center;
  align-items: center;
}

.container {
  width: 600px;
  max-width: 600px;
  height: 600px;
  background: var(--card-bg);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: background 0.3s;
}

h2 { margin-top: 0; color: var(--primary); display: flex; align-items: center; gap: 10px; }

.input-group { margin-bottom: 20px; }

label { display: block; margin-bottom: 8px; font-weight: 500; }

textarea {
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}

button {
  background: var(--primary);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

button:hover { opacity: 0.9; }
button:disabled { opacity: 0.6; cursor: not-allowed; }

.result-area {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  display: none;
}

.result-area.visible { display: block; }

audio { width: 100%; margin-top: 10px; }

.status {
  margin-top: 10px;
  font-size: 0.9em;
  color: #888;
  text-align: center;
  min-height: 20px;
}

.loading-dots:after {
  content: '.';
  animation: dots 1.5s steps(5, end) infinite;
}

.web-content {
  width: 500px;
  height: 500px;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
}
</style>

  <div class="container">
    <h2>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
      AI Voice Generator
    </h2>
  
    <div class="input-group">
      <label for="text-input">Text to Speech</label>
      <textarea id="text-input" placeholder="Enter text here to generate speech..."></textarea>
    </div>
  
    <div class="controls">
      <select id="model-select">
        <option value="dia-basic">Dia Basic (Fast)</option>
        <option value="dia-pro">Dia Pro (High Quality)</option>
      </select>
      <button id="generate-btn" onclick="generateSpeech()">
        <span>Generate Audio</span>
      </button>
    </div>
  
    <div id="status" class="status"></div>
  
    <div id="result" class="result-area">
      <label>Generated Audio</label>
      <audio id="audio-player" controls></audio>
    </div>
  </div>

<script>
  // State
  let isGenerating = false;

  // Elements
  const textInput = document.getElementById('text-input');
  const modelSelect = document.getElementById('model-select');
  const generateBtn = document.getElementById('generate-btn');
  const statusEl = document.getElementById('status');
  const resultArea = document.getElementById('result');
  const audioPlayer = document.getElementById('audio-player');

  // Theme Handling
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  function applyLanguage(language) {
    
  }

  // Communication
  window.addEventListener('message', (event) => {
    const { type, payload } = event.data;
  
    if (type === 'INIT_CONTEXT') {
      applyTheme(payload.theme);
    } else if (type === 'THEME_CHANGED') {
      applyTheme(payload.theme);
    } else if (type === 'LANGUAGE_CHANGED') {
      applyLanguage(payload.language);
    } else if (type === 'TTS_RESULT') {
      handleSuccess(payload.audioUrl);
    } else if (type === 'TTS_ERROR') {
      handleError(payload.message);
    }
  });

  window.addEventListener('resize', () => {
    document.body.style.width = document.documentElement.clientWidth + 'px';
    document.body.style.height = document.documentElement.clientHeight + 'px'    
  })
  
  // Actions
  function generateSpeech() {
    const text = textInput.value.trim();
    if (!text) {
      statusEl.textContent = 'Please enter some text first.';
      statusEl.style.color = 'red';
      return;
    }

    setLoading(true);

    // Call Host
    window.parent.postMessage({
      type: 'REQUEST_TTS',
      payload: {
        text: text,
        model: modelSelect.value
      }
    }, '*');
  }

  function setLoading(loading) {
    isGenerating = loading;
    generateBtn.disabled = loading;
    if (loading) {
      generateBtn.innerHTML = 'Generating<span class="loading-dots"></span>';
      statusEl.textContent = 'Processing with AI model...';
      statusEl.style.color = '#888';
      resultArea.classList.remove('visible');
    } else {
      generateBtn.innerHTML = '<span>Generate Audio</span>';
    }
  }

  function handleSuccess(url) {
    setLoading(false);
    statusEl.textContent = 'Generation complete!';
    statusEl.style.color = 'green';
  
    audioPlayer.src = url;
    resultArea.classList.add('visible');
    audioPlayer.play().catch(e => console.log('Auto-play prevented:', e));
  }

  function handleError(msg) {
    setLoading(false);
    statusEl.textContent = 'Error: ' + msg;
    statusEl.style.color = 'red';
  }

  // Notify Ready
  window.parent.postMessage({ type: 'PLUGIN_READY' }, '*');
  
</script>
  `,
}

export default SpeechGenerationApp
