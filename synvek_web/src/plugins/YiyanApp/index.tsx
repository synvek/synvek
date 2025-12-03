import { PluginDefinition } from '@/components/Utils'
import { Icon } from './Icon'

const YiyanApp: PluginDefinition = {
  id: 'Yiyan',
  name: 'Yiyan',
  description: 'Yiyan',
  type: 'site',
  category: 'tool',
  icon: Icon,
  vendor: 'Synvek',
  content: `
<style>

  body {
    width: 100%;
    height: 100%;
    display: flex;
    margin: 0;
    justify-content: center;
    justify-items: center;
    align-items: center;
  }

  .web-content {
    width: 100%;
    height: 100%;
    border-width: 0;
  }
  
</style>

<script>
  // Communication
  window.addEventListener('message', (event) => {
    const { type, payload } = event.data;
  
    if (type === 'INIT_CONTEXT') {
      document.body.style.width = document.documentElement.clientWidth + 'px';
      document.body.style.height = document.documentElement.clientHeight + 'px'
    } else if (type === 'THEME_CHANGED') {
    } else if (type === 'LANGUAGE_CHANGED') {
    } else if (type === 'TTS_RESULT') {
    } else if (type === 'TTS_ERROR') {
    }
  });

  window.addEventListener('resize', () => {    
    document.body.style.width = document.documentElement.clientWidth + 'px';
    document.body.style.height = document.documentElement.clientHeight + 'px'
  })
  
  window.parent.postMessage({ type: 'PLUGIN_READY' }, '*');
  
</script>
  <iframe id="webContent" class="web-content" src="https://yiyan.baidu.com"/>
  `,
}

export default YiyanApp
