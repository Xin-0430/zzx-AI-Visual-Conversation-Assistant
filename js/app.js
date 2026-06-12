"use strict";

(function(){
  // ---- State ----
  let camera, speech, ai;
  let currentMode = "general";
  let isProcessing = false;
  let isCameraActive = false;
  let isMicActive = false;
  let ambientTimer = null;
  let lastFrameData = null;
  const visualMemory = [];
  const MAX_MEMORY = 12;
  let sceneIQInterval = null;

  // ---- DOM ----
  const $ = id => document.getElementById(id);

  // Camera
  const video = $("cameraFeed");
  const canvas = $("cameraCanvas");
  const camPlaceholder = $("camPlaceholder");
  const sceneIQ = $("sceneIQ");
  const iqBrightnessFill = $("iqBrightnessFill");
  const iqBrightness = $("iqBrightness");
  const iqMotion = $("iqMotion");
  const iqScene = $("iqScene");
  const iqFps = $("iqFps");
  const iqRes = $("iqRes");

  // Toolbar
  const toggleCameraBtn = $("toggleCamera");
  const captureBtn = $("captureBtn");
  const toggleMicBtn = $("toggleMic");
  const toggleAmbientBtn = $("toggleAmbient");
  const frameBadge = $("frameBadge");
  const frameSizeText = $("frameSizeText");

  // Chat
  const chatMessages = $("chatMessages");
  const chatInput = $("chatInput");
  const sendBtn = $("sendBtn");
  const clearChatBtn = $("clearChat");
  const voiceIndicator = $("voiceIndicator");
  const voiceBar = $("voiceBar");
  const voiceInterim = $("voiceInterim");
  const autoSendChip = $("autoSendChip");
  const ttsChip = $("ttsChip");

  // Sidebar
  const sDot = $("sDot");
  const sText = $("sText");
  const sCost = $("sCost");
  const insightTitle = $("insightTitle");
  const insightDesc = $("insightDesc");
  const insightIcon = $("insightIcon");
  const suggestionChips = $("suggestionChips");
  const memoryStrip = $("memoryStrip");
  const memoryCount = $("memoryCount");
  const ambientToggle = $("ambientToggle");
  const settingsToggle = $("settingsToggle");

  // Settings modal
  const settingsModal = $("settingsModal");
  const settingsClose = $("settingsClose");
  const apiProvider = $("apiProvider");
  const apiKey = $("apiKey");
  const apiKeyGroup = $("apiKeyGroup");
  const systemPrompt = $("systemPrompt");
  const clearMemoryBtn = $("clearMemoryBtn");

  // ---- State flags ----
  let ambientEnabled = false;
  let autoSendEnabled = true;
  let ttsEnabled = true;
  let prevBrightness = 128;
  let fpsCounter = 0;
  let fpsTimer = 0;

  // ---- Init ----
  function init() {
    camera = new CameraManager(video, canvas);
    speech = new SpeechManager();
    ai = new AIService();

    bindEvents();
    applySavedSettings();
    updateModeUI("general");
    renderSuggestions("general");
    updateStatus("ready", "就绪 \u{1F916}");
  }

  // ---- Events ----
  function bindEvents() {
    // Mode chips
    document.querySelectorAll(".mode-chip").forEach(btn => {
      btn.addEventListener("click", () => switchMode(btn.dataset.mode));
    });

    // Camera
    toggleCameraBtn.addEventListener("click", toggleCamera);
    captureBtn.addEventListener("click", captureAndSend);
    toggleMicBtn.addEventListener("click", toggleMic);

    // Ambient
    toggleAmbientBtn.addEventListener("click", toggleAmbient);
    ambientToggle.addEventListener("click", toggleAmbient);

    // Chat
    sendBtn.addEventListener("click", sendMessage);
    chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    chatInput.addEventListener("input", autoResize);
    clearChatBtn.addEventListener("click", clearChat);

    // Chips
    autoSendChip.addEventListener("click", () => {
      autoSendEnabled = !autoSendEnabled;
      autoSendChip.classList.toggle("active");
    });
    ttsChip.addEventListener("click", () => {
      ttsEnabled = !ttsEnabled;
      ttsChip.classList.toggle("active");
    });

    // Settings
    settingsToggle.addEventListener("click", openSettings);
    settingsClose.addEventListener("click", closeSettings);
    settingsModal.addEventListener("click", e => {
      if (e.target === settingsModal) closeSettings();
    });
    apiProvider.addEventListener("change", () => {
      apiKeyGroup.style.display = apiProvider.value === "mock" ? "none" : "block";
    });
    clearMemoryBtn.addEventListener("click", () => {
      visualMemory.length = 0;
      renderMemory();
    });

    // Settings button groups
    setupBtnGroup("frameIntervalGroup", "frameInterval", "3");
    setupBtnGroup("qualityGroup", "imageQuality", "0.5");
    setupBtnGroup("sizeGroup", "maxImageWidth", "640");

    // Speech events
    speech.on("result", text => {
      voiceIndicator.style.display = "none";
      chatInput.value = text;
      autoResize();
      if (autoSendEnabled) sendMessage();
    });
    speech.on("interim", text => {
      voiceIndicator.style.display = "flex";
      voiceInterim.textContent = text;
    });
    speech.on("end", () => {
      voiceIndicator.style.display = "none";
      toggleMicBtn.classList.remove("recording");
      toggleMicBtn.innerHTML = '<span class="tool-icon">\u25CB</span><span class="tool-label">\u9EA6\u514B\u98CE</span>';
      isMicActive = false;
    });
    speech.on("error", err => {
      voiceIndicator.style.display = "none";
      toggleMicBtn.classList.remove("recording");
      toggleMicBtn.innerHTML = '<span class="tool-icon">\u25CB</span><span class="tool-label">\u9EA6\u514B\u98CE</span>';
      isMicActive = false;
    });
    speech.on("command", (cmd, raw) => {
      handleVoiceCommand(cmd, raw);
    });
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape') {
<<<<<<< Updated upstream
      var m = document.getElementById('settingsModal');
      if (m.style.display === 'flex') document.getElementById('settingsClose').click();
    }
    if (['1','2','3','4','5'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      var chips = document.querySelectorAll('.mode-chip');
      var idx = ['1','2','3','4','5'].indexOf(e.key);
      if (idx < chips.length) chips[idx].click();
=======
      if (document.getElementById('settingsModal').style.display === 'flex') {
        document.getElementById('settingsClose').click();
      }
    }
  });
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter: send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    // Escape: close settings or stop mic
    if (e.key === 'Escape') {
      var m = document.getElementById('settingsModal');
      if (m.style.display === 'flex') { document.getElementById('settingsClose').click(); }
    }
    // 1-5: switch scene modes
    if (['1','2','3','4','5'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      var modes = Object.keys(SCENE_MODES);
      var idx = ['1','2','3','4','5'].indexOf(e.key);
      if (idx < modes.length) document.querySelectorAll('.mode-chip')[idx].click();
>>>>>>> Stashed changes
    }
  });
  }

  function setupBtnGroup(groupId, configKey, defaultVal) {
    const group = $(groupId);
    if (!group) return;
    group.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const val = btn.dataset.v;
        const cfg = ai.getConfig();
        cfg[configKey] = parseFloat(val);
        ai.saveConfig(cfg);
      });
    });
  }

  function applySavedSettings() {
    const cfg = ai.getConfig();
    autoSendChip.classList.toggle("active", autoSendEnabled);
    ttsChip.classList.toggle("active", ttsEnabled);
    // Sync btn groups
    syncBtnGroup("frameIntervalGroup", String(cfg.frameInterval));
    syncBtnGroup("qualityGroup", String(cfg.imageQuality));
    syncBtnGroup("sizeGroup", String(cfg.maxImageWidth));
  }

  function syncBtnGroup(groupId, val) {
    const group = $(groupId);
    if (!group) return;
    group.querySelectorAll("button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.v === val);
    });
  }

  // ---- Mode ----
  function switchMode(modeId) {
    currentMode = modeId;
    document.querySelectorAll(".mode-chip").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === modeId);
    });
    updateModeUI(modeId);
    renderSuggestions(modeId);
    addSystemMessage("\u{1F3AF} \u5DF2\u5207\u6362\u5230\u300C" + SCENE_MODES[modeId].name + "\u300D");
  }

  function updateModeUI(modeId) {
    const m = SCENE_MODES[modeId];
    insightTitle.textContent = m.name;
    insightDesc.textContent = m.description;
    insightIcon.textContent = m.icon || "\u25CB";
  }

  // ---- Camera ----
  async function toggleCamera() {
    if (isCameraActive) {
      await camera.stop();
      isCameraActive = false;
      toggleCameraBtn.classList.remove("active");
      toggleCameraBtn.innerHTML = '<span class="tool-icon">\u25B3</span><span class="tool-label">\u6444\u50CF\u5934</span>';
      camPlaceholder.style.display = "flex";
      sceneIQ.style.display = "none";
      captureBtn.disabled = true;
      toggleMicBtn.disabled = true;
      toggleAmbientBtn.disabled = true;
      chatInput.disabled = true;
      sendBtn.disabled = true;
      if (ambientTimer) { clearInterval(ambientTimer); ambientTimer = null; }
      if (sceneIQInterval) { clearInterval(sceneIQInterval); sceneIQInterval = null; }
      frameBadge.style.display = "none";
      updateStatus("ready", "\u6444\u50CF\u5934\u5DF2\u5173\u95ED");
    } else {
      try {
        updateStatus("connecting", "\u6253\u5F00\u6444\u50CF\u5934...");
        const info = await camera.start();
        isCameraActive = true;
        toggleCameraBtn.classList.add("active");
        toggleCameraBtn.innerHTML = '<span class="tool-icon">\u25B3</span><span class="tool-label">\u5173\u95ED</span>';
        camPlaceholder.style.display = "none";
        sceneIQ.style.display = "flex";
        captureBtn.disabled = false;
        toggleMicBtn.disabled = false;
        toggleAmbientBtn.disabled = false;
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
        iqRes.textContent = info.width + "x" + info.height;
        startSceneIQ();
        setTimeout(() => captureAndSend("\u4F60\u770B\u5230\u4E86\u4EC0\u4E48\uFF1F\u8BF7\u4ECB\u7ECD\u4E00\u4E0B\u773C\u524D\u7684\u573A\u666F\u3002"), 800);
        updateStatus("online", "\u6444\u50CF\u5934\u5DF2\u5F00\u542F");
      } catch (err) {
        showToast("\u65E0\u6CD5\u6253\u5F00\u6444\u50CF\u5934: " + err.message, "error");
        updateStatus("error", "\u6444\u50CF\u5934\u9519\u8BEF");
      }
    }
  }

  function startSceneIQ() {
    if (sceneIQInterval) clearInterval(sceneIQInterval);
    let lastMotionDismiss = 0;
    sceneIQInterval = setInterval(() => {
      if (!isCameraActive) return;
      const iq = camera.getSceneIQ();
      if (!iq) return;

      // Brightness
      const b = iq.brightness;
      const bPct = Math.min(100, Math.round((b / 255) * 100));
      iqBrightnessFill.style.width = bPct + "%";
      iqBrightnessFill.style.background = b < 60 ? "#fbbf24" : b < 120 ? "#00d4aa" : "#7c5cfc";

      // Motion
      if (iq.motion > 8) {
        iqMotion.style.display = "flex";
        lastMotionDismiss = Date.now();
      } else if (Date.now() - lastMotionDismiss > 1500) {
        iqMotion.style.display = "none";
      }

      // Scene tag
      iqScene.innerHTML = iq.scene;

      // FPS
      fpsCounter++;
      const now = Date.now();
      if (now - fpsTimer > 1000) {
        iqFps.textContent = fpsCounter + " fps";
        fpsCounter = 0;
        fpsTimer = now;
      }

      prevBrightness = b;
    }, 300);
  }

  // ---- Microphone ----
  function toggleMic() {
    if (isMicActive) {
      speech.stopListening();
      toggleMicBtn.classList.remove("recording");
      toggleMicBtn.innerHTML = '<span class="tool-icon">\u25CB</span><span class="tool-label">\u9EA6\u514B\u98CE</span>';
      voiceIndicator.style.display = "none";
      isMicActive = false;
    } else {
      const m = SCENE_MODES[currentMode];
      if (speech.startListening({ lang: m.speechLang || "zh-CN", continuous: false })) {
        isMicActive = true;
        toggleMicBtn.classList.add("recording");
        toggleMicBtn.innerHTML = '<span class="tool-icon">\u25CB</span><span class="tool-label">\u505C\u6B62</span>';
      } else {
        showToast("\u60A8\u7684\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u8BED\u97F3\u8BC6\u522B\uFF0C\u8BF7\u4F7F\u7528 Chrome \u6216 Edge\u3002", "error");
      }
    }
  }

  // ---- Ambient Mode ----
  function toggleAmbient() {
    if (ambientEnabled) {
      ambientEnabled = false;
      if (ambientTimer) { clearInterval(ambientTimer); ambientTimer = null; }
      toggleAmbientBtn.classList.remove("active");
      ambientToggle.classList.remove("active");
      showToast("\u73AF\u5883\u611F\u77E5\u5DF2\u5173\u95ED");
      return;
    }
    if (!isCameraActive) { showToast("\u8BF7\u5148\u6253\u5F00\u6444\u50CF\u5934", "error"); return; }
    ambientEnabled = true;
    toggleAmbientBtn.classList.add("active");
    ambientToggle.classList.add("active");
    const interval = currentMode === "visually-impaired" ? 15000 : 30000;
    ambientTimer = setInterval(() => {
      if (!isCameraActive) { toggleAmbient(); return; }
      captureAndSend("\u63CF\u8FF0\u5F53\u524D\u73AF\u5883");
    }, interval);
    showToast("\u73AF\u5883\u611F\u77E5\u5DF2\u5F00\u542F\uFF0C\u6BCF" + Math.round(interval / 1000) + "\u79D2\u81EA\u52A8\u63CF\u8FF0");
  }

  // ---- Voice Commands ----
  function handleVoiceCommand(cmd, raw) {
    switch (cmd) {
      case "save":
        if (lastFrameData) {
          const entry = { dataUrl: lastFrameData.dataUrl, time: Date.now(), mode: currentMode };
          visualMemory.unshift(entry);
          if (visualMemory.length > MAX_MEMORY) visualMemory.pop();
          renderMemory();
          speech.speak("\u5DF2\u4FDD\u5B58\u5F53\u524D\u753B\u9762", { rate: 0.9 });
          showToast("\u89C6\u89C9\u8BB0\u5FC6\u5DF2\u4FDD\u5B58");
        }
        break;
      case "repeat":
        const lastMsg = chatMessages.querySelector(".msg.assistant:last-child .msg-body");
        if (lastMsg && speech.isTTSupported()) {
          const text = lastMsg.textContent || "";
          speech.speak(text, { rate: 0.95 });
        }
        break;
      case "capture":
        if (isCameraActive) captureAndSend();
        break;
      case "mode_next":
        const modes = Object.keys(SCENE_MODES);
        const idx = (modes.indexOf(currentMode) + 1) % modes.length;
        switchMode(modes[idx]);
        speech.speak("\u5DF2\u5207\u6362\u5230" + SCENE_MODES[modes[idx]].name, { rate: 0.9 });
        break;
      case "ambient":
        toggleAmbient();
        break;
      case "clear":
        clearChat();
        speech.speak("\u5DF2\u6E05\u7A7A\u5BF9\u8BDD", { rate: 0.9 });
        break;
    }
  }

  // ---- Capture & Send ----
  async function captureAndSend(overrideText) {
    if (!isCameraActive) { showToast("\u8BF7\u5148\u6253\u5F00\u6444\u50CF\u5934", "error"); return; }
    const text = overrideText || chatInput.value.trim();
    if (!text && !overrideText) { showToast("\u8BF7\u8F93\u5165\u6216\u8BF4\u51FA\u4F60\u60F3\u95EE\u7684", "error"); return; }

    const frame = camera.captureFrame(ai.config.imageQuality, ai.config.maxImageWidth);
    if (frame) {
      lastFrameData = frame;
      frameBadge.style.display = "inline";
      frameSizeText.textContent = frame.sizeKB;
    }
    if (text && !overrideText) addUserMessage(text, frame);
    chatInput.value = ""; autoResize();
    const thinkEl = addThinking();
    await processQuery(text || "\u63CF\u8FF0\u4F60\u770B\u5230\u7684\u753B\u9762", frame, thinkEl);
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    if (!isCameraActive) {
      addUserMessage(text, null);
      chatInput.value = "";
      const thinkEl = addThinking();
      await processQuery(text, null, thinkEl);
      return;
    }
    await captureAndSend(text);
  }

  // ---- Process Query ----
  async function processQuery(text, frame, thinkEl) {
    if (isProcessing) return;
    isProcessing = true;
    try {
      const m = SCENE_MODES[currentMode];
      const useFrame = frame || (isCameraActive ? camera.captureFrame(ai.config.imageQuality, ai.config.maxImageWidth) : null);
      const result = await ai.analyze({
        image: useFrame,
        text: text,
        systemPrompt: ai.config.systemPrompt || m.systemPrompt
      });
      if (thinkEl && thinkEl.parentNode) thinkEl.parentNode.removeChild(thinkEl);
      addAssistantMessage(result.text, result.cost, useFrame);

      // Visual memory
      if (useFrame) {
        visualMemory.unshift({ dataUrl: useFrame.dataUrl, time: Date.now(), mode: currentMode, query: text });
        if (visualMemory.length > MAX_MEMORY) visualMemory.pop();
        renderMemory();
      }

      if (ttsEnabled && speech.isTTSupported()) {
        speech.speak(result.text, {
          rate: currentMode === "elderly" ? 0.85 : currentMode === "children" ? 1.15 : 1.0,
          pitch: currentMode === "children" ? 1.2 : currentMode === "elderly" ? 0.9 : 1.0
        });
      }
      updateStatus("online", getStatusLabel());
    } catch (err) {
      if (thinkEl && thinkEl.parentNode) thinkEl.parentNode.removeChild(thinkEl);
      addErrorMessage("\u62B1\u6B49\uFF0C\u5904\u7406\u5931\u8D25: " + err.message);
      updateStatus("error", "\u8BF7\u6C42\u5931\u8D25");
    } finally {
      isProcessing = false;
    }
  }

  // ---- Chat UI ----
  function addUserMessage(text, frame) {
    const el = document.createElement("div");
    el.className = "msg user";
    let thumb = "";
    if (frame && frame.dataUrl) {
      thumb = '<div class="msg-thumb"><img src="' + frame.dataUrl + '" alt="snapshot"></div>';
    }
    el.innerHTML = '<div class="msg-avatar">\u{1F464}</div><div class="msg-body">' + thumb + '<p>' + esc(text) + "</p></div>";
    chatMessages.appendChild(el);
    scrollBottom();
  }

  function addAssistantMessage(text, cost, frame) {
    const costStr = cost ? fmtCost(cost) : "";
    const el = document.createElement("div");
    el.className = "msg assistant";
    el.innerHTML = '<div class="msg-avatar">\u{1F916}</div><div class="msg-body"><p>' + fmtResp(text) + "</p>" + (costStr ? '<div class="msg-cost">' + costStr + "</div>" : "") + "</div>";
    chatMessages.appendChild(el);
    scrollBottom();
  }

  function addSystemMessage(text) {
    const el = document.createElement("div");
    el.className = "msg system";
    el.innerHTML = '<div class="msg-avatar">\u{1F916}</div><div class="msg-body"><p>' + esc(text) + "</p></div>";
    chatMessages.appendChild(el);
    scrollBottom();
  }

  function addErrorMessage(text) {
    const el = document.createElement("div");
    el.className = "msg error";
    el.innerHTML = '<div class="msg-avatar">\u26A0</div><div class="msg-body"><p>' + esc(text) + "</p></div>";
    chatMessages.appendChild(el);
    scrollBottom();
  }

  function addThinking() {
    const el = document.createElement("div");
    el.className = "msg assistant";
    el.innerHTML = '<div class="msg-avatar">\u{1F916}</div><div class="msg-body"><div class="thinking-indicator">\u601D\u8003\u4E2D<div class="thinking-dots"><span></span><span></span><span></span></div></div></div>';
    chatMessages.appendChild(el);
    scrollBottom();
    return el;
  }

  function scrollBottom() { setTimeout(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }, 50); }

  function clearChat() {
    chatMessages.innerHTML = "";
    addSystemMessage("\u5BF9\u8BDD\u5DF2\u6E05\u7A7A");
  }

  // ---- Visual Memory ----
  function renderMemory() {
    memoryStrip.innerHTML = "";
    memoryCount.textContent = visualMemory.length;
    if (visualMemory.length === 0) {
      memoryStrip.innerHTML = '<div class="memory-empty">\u6682\u65E0\u8BB0\u5F55</div>';
      return;
    }
    visualMemory.forEach((entry, i) => {
      const cell = document.createElement("div");
      cell.className = "memory-cell";
      cell.innerHTML = '<img src="' + entry.dataUrl + '" alt="mem"><div class="mc-overlay">\u{1F50D}</div>';
      cell.addEventListener("click", () => {
        addUserMessage("\u{1F4F8} \u56DE\u987E\u8FD9\u5F20\u753B\u9762", entry);
        speech.speak("\u6B63\u5728\u67E5\u770B\u4E4B\u524D\u4FDD\u5B58\u7684\u753B\u9762", { rate: 0.9 });
        const q = entry.query || "\u63CF\u8FF0\u8FD9\u5F20\u56FE\u7247";
        setTimeout(() => captureAndSend(q), 300);
      });
      memoryStrip.appendChild(cell);
    });
  }

  // ---- Smart Suggestions ----
  const SUGGESTIONS = {
    general: ["\u8FD9\u662F\u4EC0\u4E48\u5730\u65B9", "\u6709\u4EC0\u4E48\u4E1C\u897F", "\u73AF\u5883\u600E\u4E48\u6837", "\u6709\u4EC0\u4E48\u6587\u5B57"],
    "visually-impaired": ["\u63CF\u8FF0\u5468\u56F4\u73AF\u5883", "\u524D\u9762\u6709\u969C\u788D\u7269\u5417", "\u5E2E\u6211\u8BFB\u6587\u5B57", "\u6709\u5371\u9669\u5417"],
    children: ["\u8FD9\u662F\u4EC0\u4E48\u989C\u8272", "\u8FD9\u662F\u4EC0\u4E48\u52A8\u7269", "\u6559\u6211\u8BA4\u8FD9\u4E2A\u5B57", "\u8FD9\u662F\u4EC0\u4E48\u5F62\u72B6"],
    elderly: ["\u5E2E\u6211\u770B\u8FD9\u4E2A\u836F", "\u8FC7\u671F\u4E86\u5417", "\u4E0A\u9762\u5199\u7740\u4EC0\u4E48", "\u8FD9\u662F\u4EC0\u4E48\u4E1C\u897F"],
    lazy: ["\u5E2E\u6211\u770B\u770B\u8FD9\u4E2A", "\u8FD9\u662F\u4EC0\u4E48", "\u6709\u4EC0\u4E48\u6587\u5B57", "\u600E\u4E48\u7528"]
  };

  function renderSuggestions(modeId) {
    const chips = SUGGESTIONS[modeId] || SUGGESTIONS.general;
    suggestionChips.innerHTML = chips.map(s => '<span class="s-chip">' + s + "</span>").join("");
    suggestionChips.querySelectorAll(".s-chip").forEach((chip, i) => {
      chip.addEventListener("click", () => {
        chatInput.value = chips[i];
        autoResize();
        if (isCameraActive) captureAndSend(chips[i]);
        else sendMessage();
      });
    });
  }

  // ---- Settings ----
  function openSettings() {
    const cfg = ai.getConfig();
    apiProvider.value = cfg.provider;
    apiKey.value = cfg.apiKey || "";
    apiKeyGroup.style.display = cfg.provider === "mock" ? "none" : "block";
    systemPrompt.value = cfg.systemPrompt || "";
    syncBtnGroup("frameIntervalGroup", String(cfg.frameInterval));
    syncBtnGroup("qualityGroup", String(cfg.imageQuality));
    syncBtnGroup("sizeGroup", String(cfg.maxImageWidth));
    settingsModal.style.display = "flex";
  }

  function closeSettings() {
    const cfg = {
      provider: apiProvider.value,
      apiKey: apiKey.value.trim(),
      frameInterval: parseInt(document.querySelector("#frameIntervalGroup .active")?.dataset?.v || "3"),
      imageQuality: parseFloat(document.querySelector("#qualityGroup .active")?.dataset?.v || "0.5"),
      maxImageWidth: parseInt(document.querySelector("#sizeGroup .active")?.dataset?.v || "640"),
      systemPrompt: systemPrompt.value.trim()
    };
    ai.saveConfig(cfg);
    settingsModal.style.display = "none";
    showToast("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
  }

  // ---- Utility ----
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function fmtResp(t) { return t ? esc(t).replace(/\n/g, "<br>") : ""; }
  function fmtCost(c) {
    if (!c) return "";
    const total = c.costUSD || 0;
    const tokens = (c.promptTokens || 0) + (c.completionTokens || 0);
    if (total === 0 && tokens === 0) return "";
    if (total < 1e-6) return "Tokens: " + tokens + " | \u6A21\u62DF\u6A21\u5F0F";
    return "$\u2248" + total.toFixed(6) + " | " + tokens + " tokens";
  }
  function getStatusLabel() {
    const cfg = ai.getConfig();
    const cost = ai.getCostSummary();
    const pn = cfg.provider === "mock" ? "\u6A21\u62DF" : cfg.provider.toUpperCase();
    return pn + " | " + cost.requests + " \u6B21\u8BF7\u6C42 | $" + cost.costUSD.toFixed(4);
  }
  function updateStatus(state, text) {
    sDot.className = "s-dot";
    if (state === "online") sDot.classList.add("online");
    if (state === "error") sDot.classList.add("error");
    if (state === "connecting") sDot.classList.add("connecting");
    sText.textContent = text;
  }
  function showToast(msg, type) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.className = "toast" + (type === "error" ? " error" : type === "success" ? " success" : "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
  function autoResize() {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + "px";
  }

  // ---- Init ----
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
