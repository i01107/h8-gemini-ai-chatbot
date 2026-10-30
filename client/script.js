document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');
  const highlightTheme = document.getElementById('highlight-theme');

  const setDarkTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      iconMoon.classList.add('hidden');
      iconSun.classList.remove('hidden');
      if (highlightTheme) highlightTheme.href = "https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css";
    } else {
      document.documentElement.classList.remove('dark');
      iconMoon.classList.remove('hidden');
      iconSun.classList.add('hidden');
      if (highlightTheme) highlightTheme.href = "https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css";
    }
  };

  // Default to light; respect saved preference if present
  const savedDark = localStorage.getItem('nextedu-dark');
  setDarkTheme(savedDark === 'true');

  themeToggleBtn?.addEventListener('click', () => {
    const isDarkNow = document.documentElement.classList.contains('dark');
    setDarkTheme(!isDarkNow);
    localStorage.setItem('nextedu-dark', String(!isDarkNow));
  });

  // Back to Top Button Logic
  const backToTopBtn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Chatbot Widget Toggle Logic
  const widget = document.getElementById('chat-widget');
  const widgetToggle = document.getElementById('widget-toggle');
  const iconChat = document.getElementById('widget-icon-chat');
  const iconClose = document.getElementById('widget-icon-close');
  const closeWidgetBtn = document.getElementById('close-widget-btn');
  const openHeroBtn = document.getElementById('open-widget-btn-hero');
  const openNavBtn = document.getElementById('open-widget-btn-nav');

  const toggleWidget = (forceOpen = null) => {
    const isClosed = widget.classList.contains('closed');
    const shouldOpen = forceOpen !== null ? forceOpen : isClosed;

    if (shouldOpen) {
      widget.classList.remove('closed');
      iconChat.classList.add('hidden');
      iconClose.classList.remove('hidden');
    } else {
      widget.classList.add('closed');
      iconChat.classList.remove('hidden');
      iconClose.classList.add('hidden');
    }
  };

  widgetToggle.addEventListener('click', () => toggleWidget());
  closeWidgetBtn.addEventListener('click', () => toggleWidget(false));
  openHeroBtn?.addEventListener('click', () => toggleWidget(true));
  openNavBtn?.addEventListener('click', () => toggleWidget(true));

  // Chatbot Messages Handler
  const chatBox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');

  // Append Bot Welcome Message
  const addBotWelcome = () => {
    const welcomeHTML = `
      <div class="msg-row msg-row--bot">
        <div class="msg-bubble msg-bubble--bot markdown-body">
          Hello! 👋 Welcome to <strong>NextEdu</strong>. How can I assist your study plans today? You can ask about:
          <ul>
            <li>September intake deadlines</li>
            <li>Featured university campuses & rankings</li>
            <li>Scholarship requirements</li>
          </ul>
        </div>
      </div>
    `;
    chatBox.innerHTML = welcomeHTML;
  };
  addBotWelcome();

  const conversation = [];

  // Form Submit Handler
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Render User Message
    const userMsgRow = document.createElement('div');
    userMsgRow.className = 'msg-row msg-row--user';
    userMsgRow.innerHTML = `<div class="msg-bubble msg-bubble--user">${escapeHtml(text)}</div>`;
    chatBox.appendChild(userMsgRow);
    conversation.push({ role: 'user', text });

    userInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Render Thinking State
    const thinkingRow = document.createElement('div');
    thinkingRow.className = 'msg-row msg-row--bot';
    thinkingRow.innerHTML = `
      <div class="msg-bubble msg-bubble--bot msg-thinking">
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      </div>
    `;
    chatBox.appendChild(thinkingRow);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const response = await fetch('https://organizer-mvp-api.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation }),
      });

      thinkingRow.remove();

      const botMsgRow = document.createElement('div');
      botMsgRow.className = 'msg-row msg-row--bot';

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      if (data?.result) {
        const sanitizedHTML = DOMPurify.sanitize(marked.parse(data.result));
        botMsgRow.innerHTML = `<div class="msg-bubble msg-bubble--bot markdown-body">${sanitizedHTML}</div>`;
        conversation.push({ role: 'model', text: data.result });
      } else {
        botMsgRow.innerHTML = `<div class="msg-bubble msg-bubble--bot">No response received.</div>`;
      }

      chatBox.appendChild(botMsgRow);
      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
      console.error('Chat error:', error);
      thinkingRow.remove();
      const errRow = document.createElement('div');
      errRow.className = 'msg-row msg-row--bot';
      errRow.innerHTML = `<div class="msg-bubble msg-bubble--bot" style="color:#b91c1c">Failed to connect to server. Make sure the server is running on port 3000.</div>`;
      chatBox.appendChild(errRow);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
});

// Major Details Modal Helper
function showMajorDetails(title, info) {
  alert(`📚 ${title}\n\nKey Highlights: ${info}\n\nAsk our AI Assistant in the bottom right corner for full curriculum details and prerequisites!`);
}
  
