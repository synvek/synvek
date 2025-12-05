import { PluginDefinition } from '@/components/Plugin'

const TranslationApp: PluginDefinition = {
  id: 'Translation',
  name: 'Translation',
  description: 'Translation',
  type: 'app',
  category: 'tool',
  //Icon source: https://icon-sets.iconify.design/ph/translate-fill
  icon: `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<path fill="#15b354" d="M160 129.89L175.06 160h-30.12l6.36-12.7ZM224 48v160a16 16 0 0 1-16 16H48a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16m-16.84 140.42l-40-80a8 8 0 0 0-14.32 0l-13.18 26.38a62.3 62.3 0 0 1-23.61-10A79.6 79.6 0 0 0 135.6 80H152a8 8 0 0 0 0-16h-40v-8a8 8 0 0 0-16 0v8H56a8 8 0 0 0 0 16h63.48a63.73 63.73 0 0 1-15.3 34.05a66 66 0 0 1-9-13.61a8 8 0 0 0-14.32 7.12a81.8 81.8 0 0 0 11.4 17.15A63.6 63.6 0 0 1 56 136a8 8 0 0 0 0 16a79.56 79.56 0 0 0 48.11-16.13a78.3 78.3 0 0 0 28.18 13.66l-19.45 38.89a8 8 0 0 0 14.32 7.16l9.78-19.58h46.12l9.78 19.58a8 8 0 1 0 14.32-7.16" />
</svg>
`,
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
  height: 170px;
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

.status {
  margin-top: 10px;
  font-size: 0.9em;
  color: #888;
  text-align: center;
  min-height: 20px;
}

.translation {
  margin-top: 10px;
  font-size: 0.9em;
  color: #888;
  text-align: left;
  min-height: 20px;
}

.loading-dots:after {
  content: '.';
  animation: dots 1.5s steps(5, end) infinite;
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
      AI Translation
    </h2>
  
    <div class="controls">
      <label for="text-input">Text to Translate</label>
      <select id="target-language-select">
        <option value="english">English</option>
        <option value="chinese">Chinese</option>
      </select>
    </div>
    <div class="input-group">
      <textarea id="text-input" placeholder="Enter text here to translate..."></textarea>
    </div>
  
    <div class="controls">
     <div></div>
      <button id="translate-btn" onclick="processTranslation()">
        <span>Translate input to target language:</span>
      </button>
    </div>
  
    <div id="status" class="status"></div>
  
    <div id="result" class="result-area">
      <div id="translation" class="translation"></div>
    </div>
  </div>

<script>
  // State
  let isTranslating = false;

  // Elements
  const textInput = document.getElementById('text-input');
  const targetLanguageSelect = document.getElementById('target-language-select');
  const translateBtn = document.getElementById('translate-btn');
  const statusEl = document.getElementById('status');
  const resultArea = document.getElementById('result');
  const translation = document.getElementById('translation');

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
    //console.log('type, payload',type, payload);
    if (type === 'INIT_CONTEXT') {
      document.body.style.width = document.documentElement.clientWidth + 'px';
      document.body.style.height = document.documentElement.clientHeight + 'px'
      applyTheme(payload.theme);
    } else if (type === 'THEME_CHANGED') {
      applyTheme(payload.theme);
    } else if (type === 'LANGUAGE_CHANGED') {
    } else if (type === 'CHAT_COMPLETION_RESPONSE') {
      console.log('speech=', payload);
      if(payload.success) {
        handleSuccess(payload.data)
      } else {
        handleError(payload.message)
      }
    }
  });

  window.addEventListener('resize', () => {
    document.body.style.width = document.documentElement.clientWidth + 'px';
    document.body.style.height = document.documentElement.clientHeight + 'px'    
  })
  
  // Actions
  function processTranslation() {
    const text = textInput.value.trim();
    if (!text) {
      statusEl.textContent = 'Please enter some text first.';
      statusEl.style.color = 'red';
      return;
    }

    setLoading(true);
    const targetLanguage = targetLanguageSelect.value
    const systemPrompt = "Please use language and style: " + targetLanguage +  " and translate user inputs. Please translate precisely, no extra comments. /no_thinking"

    // Call Host
    window.parent.postMessage({
      type: 'CHAT_COMPLETION_REQUEST',
      payload: {
        //modelName: modelSelect.value,
        system_prompts: [{type: 'text', text: systemPrompt}],
        user_prompts: [{type: 'text', text: text}],
        temperature: 0.8,
        topN: 0.8
      }
    }, '*');
  }

  function setLoading(loading) {
    isTranslating = loading;
    translateBtn.disabled = loading;
    if (loading) {
      translateBtn.innerHTML = 'Translating<span class="loading-dots"></span>';
      statusEl.textContent = 'Processing with AI model...';
      statusEl.style.color = '#888';
      resultArea.classList.remove('visible');
    } else {
      translateBtn.innerHTML = '<span>Translate Now</span>';
    }
  }

  function handleSuccess(data) {
    setLoading(false);
    statusEl.textContent = 'Translation complete!';
    statusEl.style.color = 'green';
  
    translation.textContent = data
    resultArea.classList.add('visible');
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

export default TranslationApp
