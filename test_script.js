    const form = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const messagesEl = document.getElementById('messages');
    const sendBtn = document.getElementById('send-btn');

    // Conversation history for multi-turn context
    const conversationHistory = [];

    function scrollToBottom() {
      if (!messagesEl) return;
      requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }

    // Keep chat scrolled to bottom on mobile keyboard resize
    if (typeof visualViewport !== 'undefined') {
      visualViewport.addEventListener('resize', () => {
        scrollToBottom();
      });
    }

    // Help panel toggle functionality
    const helpToggle = document.getElementById('help-toggle');
    const helpPanel = document.getElementById('help-panel');
    const helpClose = document.getElementById('help-close');
    const helpOverlay = document.getElementById('help-overlay');

    function openHelpPanel() {
      if (!helpPanel || !helpOverlay || !helpToggle) return;
      helpPanel.classList.add('open');
      helpOverlay.classList.add('visible');
      helpToggle.classList.add('active');
    }

    function closeHelpPanel() {
      if (!helpPanel || !helpOverlay || !helpToggle) return;
      helpPanel.classList.remove('open');
      helpOverlay.classList.remove('visible');
      helpToggle.classList.remove('active');
    }

    if (helpToggle && helpPanel && helpClose && helpOverlay) {
      helpToggle.addEventListener('click', () => {
        if (helpPanel.classList.contains('open')) {
          closeHelpPanel();
        } else {
          openHelpPanel();
        }
      });

      helpClose.addEventListener('click', closeHelpPanel);
      helpOverlay.addEventListener('click', closeHelpPanel);

      // Close help panel on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpPanel.classList.contains('open')) {
          closeHelpPanel();
        }
      });
    }

    function renderInlineMarkdown(text) {
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      html = html.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="sponsored noopener">$1</a>');
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
      return html;
    }

    // Rich markdown rendering for AI responses
    function renderMarkdown(text) {
      const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
      const blocks = [];
      let paragraphLines = [];
      let listType = null;
      let listItems = [];

      function flushParagraph() {
        if (!paragraphLines.length) return;
        blocks.push('<p>' + paragraphLines.join('<br>') + '</p>');
        paragraphLines = [];
      }

      function flushList() {
        if (!listItems.length) return;
        const openTag = listType === 'ol' ? '<ol>' : '<ul>';
        const closeTag = listType === 'ol' ? '</ol>' : '</ul>';
        blocks.push(openTag + listItems.map((item) => '<li>' + item + '</li>').join('') + closeTag);
        listType = null;
        listItems = [];
      }

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          flushParagraph();
          flushList();
          continue;
        }

        const h4Match = line.match(/^####\s+(.+)$/);
        if (h4Match) {
          flushParagraph();
          flushList();
          blocks.push('<h4>' + renderInlineMarkdown(h4Match[1]) + '</h4>');
          continue;
        }

        const h3Match = line.match(/^###\s+(.+)$/);
        if (h3Match) {
          flushParagraph();
          flushList();
          blocks.push('<h3>' + renderInlineMarkdown(h3Match[1]) + '</h3>');
          continue;
        }

        const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
          flushParagraph();
          if (listType && listType !== 'ol') flushList();
          listType = 'ol';
          listItems.push(renderInlineMarkdown(orderedMatch[1]));
          continue;
        }

        const unorderedMatch = line.match(/^[-•]\s+(.+)$/);
        if (unorderedMatch) {
          flushParagraph();
          if (listType && listType !== 'ul') flushList();
          listType = 'ul';
          listItems.push(renderInlineMarkdown(unorderedMatch[1]));
          continue;
        }

        flushList();
        paragraphLines.push(renderInlineMarkdown(line));
      }

      flushParagraph();
      flushList();

      if (!blocks.length) {
        return '<p></p>';
      }

      return blocks.join('');
    }

    async function fetchChatReply(payload, signal) {
      const endpoints = ['/.netlify/functions/ai-chat', '/api/ai-chat'];
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          };

          if (signal) {
            fetchOptions.signal = signal;
          }

          const res = await fetch(endpoint, fetchOptions);
          const rawBody = await res.text();
          let data = null;

          if (rawBody) {
            try {
              data = JSON.parse(rawBody);
            } catch (parseErr) {
              data = null;
            }
          }

          if (!res.ok) {
            if (res.status === 404) {
              lastError = new Error('AI endpoint not found.');
              continue;
            }
            const message = data && (data.error || data.message);
            throw new Error(message || `Request failed with status ${res.status}.`);
          }

          const reply = data && (data.reply || data.response || data.message);
          if (!reply || typeof reply !== 'string') {
            throw new Error('Sorry — I had trouble reading the AI response. Please try again.');
          }

          return reply;
        } catch (err) {
          if (err.name === 'AbortError') {
            throw err;
          }
          lastError = err;
        }
      }

      throw lastError || new Error('Sorry — I had trouble reaching the AI engine. Please try again in a moment.');
    }

    function appendMessage(text, role, isError) {
      if (!messagesEl) return;
      const div = document.createElement('div');
      div.classList.add('msg');
      if (role === 'user') div.classList.add('user');
      else if (role === 'assistant') div.classList.add('ai');
      else div.classList.add('system');
      if (isError) div.classList.add('msg-error');

      if (role === 'assistant') {
        try {
          div.innerHTML = renderMarkdown(text);
        } catch (e) {
          div.textContent = text;
        }
      } else {
        // Simple rendering for user messages
        const html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        div.innerHTML = html;
      }

      messagesEl.appendChild(div);
      scrollToBottom();
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!userInput || !sendBtn || !messagesEl) return;
      const content = userInput.value.trim();
      if (!content) return;

      // Prevent double submission
      if (sendBtn.disabled) return;

      appendMessage(content, 'user');
      conversationHistory.push({ role: 'user', content: content });
      userInput.value = '';
      userInput.style.height = 'auto';
      sendBtn.disabled = true;
      sendBtn.textContent = 'Thinking…';

      // Show typing indicator
      const typingEl = document.createElement('div');
      typingEl.classList.add('typing-indicator');
      typingEl.innerHTML = '<span></span><span></span><span></span>';
      messagesEl.appendChild(typingEl);
      scrollToBottom();

      // Safety timeout to ensure UI always recovers
      const safetyTimer = setTimeout(() => {
        if (sendBtn.disabled) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
          if (typingEl.parentNode) typingEl.remove();
          appendMessage('Sorry — the request timed out. Please try again.', 'assistant', true);
        }
      }, 30000);

      // Abort controller for fetch timeout
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const fetchTimeout = controller ? setTimeout(() => controller.abort(), 25000) : null;

      try {
        const reply = await fetchChatReply(
          { message: content, history: conversationHistory.slice(0, -1) },
          controller ? controller.signal : null
        );
        if (typingEl.parentNode) typingEl.remove();
        appendMessage(reply, 'assistant');
        conversationHistory.push({ role: 'assistant', content: reply });
      } catch (err) {
        console.error(err);
        if (fetchTimeout) clearTimeout(fetchTimeout);
        if (typingEl.parentNode) typingEl.remove();
        let errorMsg = 'Sorry — I had trouble reaching the AI engine. Please try again in a moment.';
        if (err.name === 'AbortError') {
          errorMsg = 'Sorry — the request took too long. Please try again.';
        } else if (err.message) {
          errorMsg = err.message;
        }
        appendMessage(errorMsg, 'assistant', true);
      } finally {
        clearTimeout(safetyTimer);
        if (fetchTimeout) clearTimeout(fetchTimeout);
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
        userInput.focus();
      }
      });
    }

    // Auto-resize textarea as user types
    if (userInput) {
      userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
      });
    }

    // Submit on Enter (without Shift)
    if (userInput) {
      userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (form && typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        }
      });
    }
