// Embed script pre AI Social Agent chatbot
// Použitie: <script src="https://ai-social-agent-frontend.vercel.app/embed.js" data-bot-id="USER_ID"></script>

(function() {
  'use strict';

  // Získaj bot ID z data attribute
  const scriptTag = document.currentScript || 
    document.querySelector('script[data-bot-id]');
  
  if (!scriptTag) {
    console.error('AI Social Agent: Nenašiel sa script tag s data-bot-id');
    return;
  }

  const botId = scriptTag.getAttribute('data-bot-id');
  
  if (!botId) {
    console.error('AI Social Agent: Chýba data-bot-id atribút');
    return;
  }

  // API endpoint
  const API_BASE = 'https://ai-social-agent-frontend.vercel.app';
  
  // Vytvor container pre widget
  const widgetId = 'ai-social-agent-widget';
  if (document.getElementById(widgetId)) {
    return; // Widget už existuje
  }

  // Vytvor iframe alebo inline widget
  // Pre jednoduchosť použijeme iframe prístup
  const container = document.createElement('div');
  container.id = widgetId;
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    width: 380px;
    height: 600px;
    border: none;
    pointer-events: none;
  `;

  // Vytvor iframe
  const iframe = document.createElement('iframe');
  iframe.src = `${API_BASE}/embed/widget?botId=${encodeURIComponent(botId)}`;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
  `;
  iframe.allow = 'clipboard-read; clipboard-write';

  container.appendChild(iframe);
  document.body.appendChild(container);

  // Alternatívne: Ak chceš inline widget namiesto iframe, môžeš vytvoriť React komponentu
  // ale to by vyžadovalo načítať React a bundle na externých stránkach
  // Pre jednoduchosť a izoláciu používame iframe

})();
