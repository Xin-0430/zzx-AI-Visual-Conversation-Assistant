/**
 * App Controller
 * Main orchestrator — wires up Camera, Speech, AI Service, and Scene Modes.
 * Handles UI state, message flow, and event coordination.
 */
(function () {
  'use strict';

  // ---- State ----
  let camera, speech, ai;
  let currentMode = 'general';
  let isProcessing = false;
  let isCameraActive = false;
  let isMicActive = false;
  let conversationHistory = [];
  let lastFrameData = null;

  // ---- DOM refs ----
  const $ = (id) => document.getElementById(id);
  const video = $('cameraFeed');
  const canvas = $('cameraCanvas');
  const chatMessages = $('chatMessages');
  const chatInput = $('chatInput');
  const sendBtn = $('sendBtn');
  const toggleCameraBtn = $('toggleCamera');
  const toggleMicBtn = $('toggleMic');
  const captureBtn = $('captureFrame');
  const clearChatBtn = $('clearChat');
  const voiceIndicator = $('voiceIndicator');
  const statusDot = $('statusDot');
  const statusText = $('statusText');
  const modeDescription = $('modeDescription');
  const settingsBtn = $('settingsBtn');
  const settingsModal = $('settingsModal');
  const settingsClose = $('settingsClose');
  const saveSettingsBtn = $('saveSettings');
  const ttsToggle = $('ttsToggle');
  const autoSendToggle = $('autoSendToggle');
  const frameBadge = $('frameBadge');
  const lastFrameSize = $('lastFrameSize');

  // ---- Init ----
  function init() {
    camera = new CameraManager(video, canvas);
    speech = new SpeechManager();
    ai = new AIService();

    setupEventListeners();
    applySettings();
    updateConnectionStatus('ready', '就绪');
  }

  // ---- Event Listeners ----
  function setupEventListeners() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Camera controls
    toggleCameraBtn.addEventListener('click', toggleCamera);
    captureBtn.addEventListener('click', captureAndSend);
    toggleMicBtn.addEventListener('click', toggleMicrophone);

    // Chat controls
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    chatInput.addEventListener('input', autoResizeInput);

    // Clear chat
    clearChatBtn.addEventListener('click', clearChat);

    // Settings
    settingsBtn.addEventListener('click', () => openSettings());
    settingsClose.addEventListener('click', () => closeSettings());
    saveSettingsBtn.addEventListener('click', saveSettings);
    $('apiProvider').addEventListener('change', (e) => {
      $('apiKeyGroup').style.display = e.target.value === 'mock' ? 'none' : 'block';
    });

    // Close modal on overlay click
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettings();
    });

    // Speech events
    speech.on('result', (text) => {
      voiceIndicator.style.display = 'none';
      chatInput.value = text;
      chatInput.dispatchEvent(new Event('input'));

      // Auto-send if enabled
      if (autoSendToggle.checked) {
        sendMessage();
      }
    });

    speech.on('interim', (text) => {
      voiceIndicator.style.display = 'flex';
    });

    speech.on('end', () => {
      voiceIndicator.style.display = 'none';
      toggleMicBtn.classList.remove('recording');
      isMicActive = false;
    });

    speech.on('error', (err) => {
      voiceIndicator.style.display = 'none';
      toggleMicBtn.classList.remove('recording');
      isMicActive = false;
      showToast(`语音识别错误: ${err}`);
    });
  }

  // ---- Mode Switching ----
  function switchMode(modeId) {
    currentMode = modeId;

    // Update UI
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === modeId);
    });

    const modeConfig = SCENE_MODES[modeId];
    modeDescription.innerHTML = `<p>${modeConfig.description}</p>`;

    // Update settings toggles
    ttsToggle.checked = modeConfig.ttsEnabled;
    autoSendToggle.checked = modeConfig.autoSend;

    // Add system message about mode switch
    addSystemMessage(`已切换到「${modeConfig.name}」`);
  }

  // ---- Camera ----
  async function toggleCamera() {
    if (isCameraActive) {
      await camera.stop();
      isCameraActive = false;
      toggleCameraBtn.classList.remove('active');
      toggleCameraBtn.innerHTML = '<span>\u{1F4F7}</span> 摄像头';
      $('cameraPlaceholder').style.display = 'flex';
      captureBtn.disabled = true;
      toggleMicBtn.disabled = true;
      chatInput.disabled = true;
      sendBtn.disabled = true;
      updateConnectionStatus('ready', '摄像头已关闭');
      frameBadge.style.display = 'none';
    } else {
      try {
        updateConnectionStatus('connecting', '正在打开摄像头...');
        const info = await camera.start();
        isCameraActive = true;
        toggleCameraBtn.classList.add('active');
        toggleCameraBtn.innerHTML = '<span>\u{1F4F7}</span> 关闭';
        $('cameraPlaceholder').style.display = 'none';
        captureBtn.disabled = false;
        toggleMicBtn.disabled = false;
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();

        const wasAutoSend = autoSendToggle.checked;
        if (wasAutoSend) {
          // Trigger an initial analysis
          setTimeout(() => captureAndSend('你看到了什么？请介绍一下。'), 500);
        }
        updateConnectionStatus('online', '摄像头已开启');
      } catch (err) {
        console.error('Camera error:', err);
        showToast(`无法打开摄像头: ${err.message}`, 'error');
        updateConnectionStatus('error', '摄像头错误');
      }
    }
  }

  // ---- Microphone ----
  function toggleMicrophone() {
    if (isMicActive) {
      speech.stopListening();
      toggleMicBtn.classList.remove('recording');
      voiceIndicator.style.display = 'none';
      isMicActive = false;
      toggleMicBtn.innerHTML = '<span>\u{1F3A4}</span> 麦克风';
    } else {
      const mode = SCENE_MODES[currentMode];
      const started = speech.startListening({
        lang: mode.speechLang || 'zh-CN',
        continuous: false,
      });
      if (started) {
        isMicActive = true;
        toggleMicBtn.classList.add('recording');
        toggleMicBtn.innerHTML = '<span>\u{1F3A4}</span> 停止';
      } else {
        showToast('您的浏览器不支持语音识别，请使用 Chrome 或 Edge。', 'error');
      }
    }
  }

  // ---- Capture & Send ----
  async function captureAndSend(overrideText) {
    if (!isCameraActive) {
      showToast('请先打开摄像头', 'error');
      return;
    }

    const text = overrideText || chatInput.value.trim();
    if (!text && !overrideText) {
      showToast('请输入消息或说出你想问的内容', 'error');
      return;
    }

    // Capture frame
    const frame = camera.captureFrame(
      ai.config.imageQuality,
      ai.config.maxImageWidth
    );

    if (frame) {
      lastFrameData = frame;
      frameBadge.style.display = 'inline';
      lastFrameSize.textContent = frame.sizeKB;
    }

    // Add user message
    if (text) addUserMessage(text);
    chatInput.value = '';
    autoResizeInput();

    // Show thinking
    const thinkingEl = addThinkingIndicator();

    // Process
    await processQuery(text || '描述你看到的画面', frame, thinkingEl);
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (!isCameraActive) {
      // Text-only mode (no image)
      addUserMessage(text);
      chatInput.value = '';
      const thinkingEl = addThinkingIndicator();
      await processQuery(text, null, thinkingEl);
      return;
    }

    await captureAndSend(text);
  }

  // ---- Process Query ----
  async function processQuery(text, frame, thinkingEl) {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const modeConfig = SCENE_MODES[currentMode];
      const useFrame = frame || (isCameraActive ? camera.captureFrame(
        ai.config.imageQuality,
        ai.config.maxImageWidth
      ) : null);

      const result = await ai.analyze({
        image: useFrame,
        text: text,
        systemPrompt: ai.config.systemPrompt || modeConfig.systemPrompt,
      });

      // Remove thinking
      if (thinkingEl && thinkingEl.parentNode) {
        thinkingEl.parentNode.removeChild(thinkingEl);
      }

      // Add assistant response
      addAssistantMessage(result.text, result.cost);

      // Speak response
      if (ttsToggle.checked && speech.isTTSupported()) {
        const isElderly = currentMode === 'elderly';
        speech.speak(result.text, {
          rate: isElderly ? 0.85 : 1.0,
          pitch: currentMode === 'children' ? 1.2 : 1.0,
        });
      }

      // Update cost display
      updateConnectionStatus('online', getStatusText());
    } catch (err) {
      console.error('Query error:', err);
      if (thinkingEl && thinkingEl.parentNode) {
        thinkingEl.parentNode.removeChild(thinkingEl);
      }
      addErrorMessage(`抱歉，处理请求时出错: ${err.message}`);
      updateConnectionStatus('error', '请求失败');
    } finally {
      isProcessing = false;
    }
  }

  // ---- Chat UI ----
  function addUserMessage(text) {
    const el = document.createElement('div');
    el.className = 'message user';
    el.innerHTML = `
      <div class="msg-avatar">\u{1F464}</div>
      <div class="msg-content"><p>${escapeHtml(text)}</p></div>`;
    chatMessages.appendChild(el);
    scrollToBottom();
  }

  function addAssistantMessage(text, cost) {
    const costStr = cost ? formatCost(cost) : '';
    const el = document.createElement('div');
    el.className = 'message assistant';
    el.innerHTML = `
      <div class="msg-avatar">\u{1F916}</div>
      <div class="msg-content">
        <p>${formatResponse(text)}</p>
        ${costStr ? `<div class="cost-info">${costStr}</div>` : ''}
      </div>`;
    chatMessages.appendChild(el);
    scrollToBottom();
  }

  function addSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'message system';
    el.innerHTML = `
      <div class="msg-avatar">\u{1F916}</div>
      <div class="msg-content"><p>${escapeHtml(text)}</p></div>`;
    chatMessages.appendChild(el);
    scrollToBottom();
  }

  function addErrorMessage(text) {
    const el = document.createElement('div');
    el.className = 'message error';
    el.innerHTML = `
      <div class="msg-avatar">\u{26A0}</div>
      <div class="msg-content"><p>${escapeHtml(text)}</p></div>`;
    chatMessages.appendChild(el);
    scrollToBottom();
  }

  function addThinkingIndicator() {
    const el = document.createElement('div');
    el.className = 'message assistant';
    el.innerHTML = `
      <div class="msg-avatar">\u{1F916}</div>
      <div class="msg-content">
        <div class="thinking-indicator">
          思考中
          <div class="thinking-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>`;
    chatMessages.appendChild(el);
    scrollToBottom();
    return el;
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }

  function clearChat() {
    chatMessages.innerHTML = '';
    addSystemMessage('对话已清空');
    conversationHistory = [];
  }

  // ---- Settings ----
  function openSettings() {
    const cfg = ai.getConfig();
    $('apiProvider').value = cfg.provider;
    $('apiKey').value = cfg.apiKey || '';
    $('apiKeyGroup').style.display = cfg.provider === 'mock' ? 'none' : 'block';
    $('frameInterval').value = cfg.frameInterval;
    $('imageQuality').value = cfg.imageQuality;
    $('maxImageWidth').value = cfg.maxImageWidth;
    $('systemPrompt').value = cfg.systemPrompt || '';

    // Populate model selection based on provider
    updateModelOptions(cfg.provider);
    settingsModal.style.display = 'flex';
  }

  function updateModelOptions(provider) {
    const select = $('apiProvider');
    // Ensure the select shows the right value — models are embedded in the provider UX
  }

  function closeSettings() {
    settingsModal.style.display = 'none';
  }

  function saveSettings() {
    const cfg = {
      provider: $('apiProvider').value,
      apiKey: $('apiKey').value.trim(),
      frameInterval: parseInt($('frameInterval').value),
      imageQuality: parseFloat($('imageQuality').value),
      maxImageWidth: parseInt($('maxImageWidth').value),
      systemPrompt: $('systemPrompt').value.trim(),
    };

    ai.saveConfig(cfg);
    closeSettings();
    showToast('设置已保存', 'success');
    updateConnectionStatus('online', getStatusText());
  }

  // ---- Apply Settings ----
  function applySettings() {
    // The AI service already loads from localStorage
    const cfg = ai.getConfig();
    if (cfg.provider !== 'mock' && !cfg.apiKey) {
      // Prompt user to configure
      setTimeout(() => {
        showToast('请配置 API Key 以启用 AI 视觉分析', 'error');
      }, 2000);
    }
  }

  // ---- Utility ----
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatResponse(text) {
    if (!text) return '';
    // Simple line break handling
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function formatCost(cost) {
    if (!cost) return '';
    const total = cost.costUSD || 0;
    const tokens = (cost.promptTokens || 0) + (cost.completionTokens || 0);
    if (total === 0 && tokens === 0) return '';
    if (total < 0.0001) {
      return `Tokens: ${tokens} | 模拟模式`;
    }
    return `$${total.toFixed(6)} | Tokens: ${tokens}`;
  }

  function getStatusText() {
    const cfg = ai.getConfig();
    const cost = ai.getCostSummary();
    const providerName = cfg.provider === 'mock' ? '模拟' : cfg.provider.toUpperCase();
    return `${providerName} | ${isCameraActive ? '摄像头开' : '摄像头关'} | 请求: ${cost.requests}`;
  }

  function updateConnectionStatus(state, text) {
    statusDot.className = 'status-dot';
    if (state === 'online') statusDot.classList.add('online');
    if (state === 'error') statusDot.classList.add('error');
    if (state === 'connecting') statusDot.classList.add('connecting');
    statusText.textContent = text;
  }

  function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function autoResizeInput() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  }

  // ---- Init ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
