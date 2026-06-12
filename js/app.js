"use strict";
(function(){
  const $ = id => document.getElementById(id);
  let camera, speech, ai;
  let currentMode = "general";
  let isProcessing = false, isCameraActive = false, isMicActive = false;
  let sceneIQInterval = null, fpsCounter = 0, fpsTimer = 0, prevBrightness = 128;

  // DOM refs
  const video = $("cameraFeed"), canvas = $("cameraCanvas");
  const camPlaceholder = $("camPlaceholder");
  const sceneIQ = $("sceneIQ"), iqBrightnessFill = $("iqBrightnessFill");
  const iqMotion = $("iqMotion"), iqScene = $("iqScene"), iqFps = $("iqFps"), iqRes = $("iqRes");
  const toggleCameraBtn = $("toggleCamera"), captureBtn = $("captureBtn");
  const toggleMicBtn = $("toggleMic"), frameBadge = $("frameBadge"), frameSizeText = $("frameSizeText");
  const chatMessages = $("chatMessages"), chatInput = $("chatInput"), sendBtn = $("sendBtn");
  const clearChatBtn = $("clearChat"), voiceIndicator = $("voiceIndicator"), voiceInterim = $("voiceInterim");
  const sDot = $("sDot"), sText = $("sText"), sCost = $("sCost");
  const insightTitle = $("insightTitle"), insightDesc = $("insightDesc"), insightIcon = $("insightIcon");
  const settingsToggle = $("settingsToggle"), settingsModal = $("settingsModal"), settingsClose = $("settingsClose");
  const apiProvider = $("apiProvider"), apiKey = $("apiKey"), apiKeyGroup = $("apiKeyGroup"), systemPrompt = $("systemPrompt");
  const autoSendChip = $("autoSendChip"), ttsChip = $("ttsChip");
  let autoSend = true, ttsEnabled = true;

  function init() {
    camera = new CameraManager(video, canvas);
    speech = new SpeechManager();
    ai = new AIService();
    bindEvents();
    updateModeUI("general");
    updateStatus("ready", "\u{1F916} \u5C31\u7EEA");
  }

  function bindEvents() {
    document.querySelectorAll(".mode-chip").forEach(btn => {
      btn.addEventListener("click", () => switchMode(btn.dataset.mode));
    });
    toggleCameraBtn.addEventListener("click", toggleCamera);
    captureBtn.addEventListener("click", sendWithCapture);
    toggleMicBtn.addEventListener("click", toggleMic);
    sendBtn.addEventListener("click", sendMessage);
    chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    chatInput.addEventListener("input", () => autoResize(chatInput));
    clearChatBtn.addEventListener("click", () => { chatMessages.innerHTML = ""; addSystemMessage("\u5BF9\u8BDD\u5DF2\u6E05\u7A7A"); });
    settingsToggle.addEventListener("click", openSettings);
    settingsClose.addEventListener("click", closeSettings);
    settingsModal.addEventListener("click", e => { if (e.target === settingsModal) closeSettings(); });
    apiProvider.addEventListener("change", () => { apiKeyGroup.style.display = apiProvider.value === "mock" ? "none" : "block"; });
    autoSendChip.addEventListener("click", () => { autoSend = !autoSend; autoSendChip.classList.toggle("active"); });
    ttsChip.addEventListener("click", () => { ttsEnabled = !ttsEnabled; ttsChip.classList.toggle("active"); });
    speech.on("result", text => {
      voiceIndicator.style.display = "none";
      chatInput.value = text; autoResize(chatInput);
      if (autoSend) sendMessage();
    });
    speech.on("interim", text => { voiceIndicator.style.display = "flex"; voiceInterim.textContent = text; });
    speech.on("end", () => { voiceIndicator.style.display = "none"; toggleMicBtn.classList.remove("recording"); isMicActive = false; });
  }

  function switchMode(modeId) {
    currentMode = modeId;
    document.querySelectorAll(".mode-chip").forEach(b => b.classList.toggle("active", b.dataset.mode === modeId));
    updateModeUI(modeId);
    addSystemMessage("\u{1F3AF} \u5DF2\u5207\u6362\u5230\u300C" + SCENE_MODES[modeId].name + "\u300D");
  }

  function updateModeUI(modeId) {
    const m = SCENE_MODES[modeId];
    insightTitle.textContent = m.name;
    insightDesc.textContent = m.description;
    insightIcon.textContent = m.icon || "\u25CB";
  }

  // ---- Scene IQ ----
  function startSceneIQ() {
    if (sceneIQInterval) clearInterval(sceneIQInterval);
    sceneIQInterval = setInterval(() => {
      if (!isCameraActive) return;
      const iq = camera.getSceneIQ();
      if (!iq) return;
      const bPct = Math.min(100, Math.round((iq.brightness / 255) * 100));
      iqBrightnessFill.style.width = bPct + "%";
      iqBrightnessFill.style.background = iq.brightness < 60 ? "#fbbf24" : iq.brightness < 120 ? "#00d4aa" : "#7c5cfc";
      iqMotion.style.display = iq.motion > 8 ? "flex" : "none";
      iqScene.innerHTML = iq.scene;
      fpsCounter++;
      if (Date.now() - fpsTimer > 1000) { iqFps.textContent = fpsCounter + " fps"; fpsCounter = 0; fpsTimer = Date.now(); }
      prevBrightness = iq.brightness;
    }, 300);
  }

  async function toggleCamera() {
    if (isCameraActive) {
      if (sceneIQInterval) { clearInterval(sceneIQInterval); sceneIQInterval = null; }
      await camera.stop(); isCameraActive = false;
      toggleCameraBtn.classList.remove("active");
      toggleCameraBtn.innerHTML = '<span class="tool-icon">\u25B3</span><span class="tool-label">\u6444\u50CF\u5934</span>';
      camPlaceholder.style.display = "flex";
      sceneIQ.style.display = "none";
      captureBtn.disabled = true; toggleMicBtn.disabled = true;
      chatInput.disabled = true; sendBtn.disabled = true;
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
        iqRes.textContent = info.width + "x" + info.height;
        captureBtn.disabled = false; toggleMicBtn.disabled = false;
        chatInput.disabled = false; sendBtn.disabled = false;
        chatInput.focus();
        startSceneIQ();
        setTimeout(() => sendQuery("\u4F60\u770B\u5230\u4E86\u4EC0\u4E48\uFF1F"), 800);
        updateStatus("online", "\u6444\u50CF\u5934\u5DF2\u5F00\u542F");
      } catch (err) {
        showToast("\u65E0\u6CD5\u6253\u5F00\u6444\u50CF\u5934: " + err.message, "error");
        updateStatus("error", "\u6444\u50CF\u5934\u9519\u8BEF");
      }
    }
  }

  function toggleMic() {
    if (isMicActive) {
      speech.stopListening(); toggleMicBtn.classList.remove("recording"); voiceIndicator.style.display = "none"; isMicActive = false;
    } else {
      if (speech.startListening({ lang: "zh-CN", continuous: false })) {
        isMicActive = true; toggleMicBtn.classList.add("recording");
      } else { showToast("\u8BED\u97F3\u8BC6\u522B\u4E0D\u652F\u6301\uFF0C\u8BF7\u7528 Chrome", "error"); }
    }
  }

  function sendWithCapture() {
    if (!isCameraActive) { showToast("\u8BF7\u5148\u6253\u5F00\u6444\u50CF\u5934", "error"); return; }
    const text = chatInput.value.trim();
    if (!text) { showToast("\u8BF7\u8F93\u5165\u95EE\u9898", "error"); return; }
    sendQuery(text, true);
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = ""; autoResize(chatInput);
    sendQuery(text, isCameraActive);
  }

  async function sendQuery(text, useCapture) {
    const frame = useCapture ? camera.captureFrame(ai.config.imageQuality, ai.config.maxImageWidth) : null;
    if (frame) { frameBadge.style.display = "inline"; frameSizeText.textContent = frame.sizeKB; }
    addUserMessage(text);
    const thinkEl = addThinking();
    await processQuery(text, frame, thinkEl);
  }

  async function processQuery(text, frame, thinkEl) {
    if (isProcessing) return;
    isProcessing = true;
    try {
      const m = SCENE_MODES[currentMode];
      const result = await ai.analyze({
        image: frame, text: text,
        systemPrompt: ai.config.systemPrompt || m.systemPrompt
      });
      if (thinkEl.parentNode) thinkEl.parentNode.removeChild(thinkEl);
      addAssistantMessage(result.text, result.cost);
      if (ttsEnabled && speech.isTTSupported()) {
        speech.speak(result.text, { rate: currentMode === "elderly" ? 0.85 : 1.0 });
      }
      updateStatus("online", getStatusLabel());
    } catch (err) {
      if (thinkEl.parentNode) thinkEl.parentNode.removeChild(thinkEl);
      addErrorMessage("\u62B1\u6B49: " + err.message);
    } finally { isProcessing = false; }
  }

  function addUserMessage(text) {
    const el = document.createElement("div"); el.className = "msg user";
    el.innerHTML = '<div class="msg-avatar">\u{1F464}</div><div class="msg-body"><p>' + esc(text) + "</p></div>";
    chatMessages.appendChild(el); scrollBottom();
  }

  function addAssistantMessage(text, cost) {
    const costStr = cost ? fmtCost(cost) : "";
    const el = document.createElement("div"); el.className = "msg assistant";
    el.innerHTML = '<div class="msg-avatar">\u{1F916}</div><div class="msg-body"><p>' + fmtResp(text) + "</p>" + (costStr ? '<div class="msg-cost">' + costStr + "</div>" : "") + "</div>";
    chatMessages.appendChild(el); scrollBottom();
  }

  function addSystemMessage(text) {
    const el = document.createElement("div"); el.className = "msg system";
    el.innerHTML = '<div class="msg-avatar">\u{1F916}</div><div class="msg-body"><p>' + esc(text) + "</p></div>";
    chatMessages.appendChild(el); scrollBottom();
  }

  function addErrorMessage(text) {
    const el = document.createElement("div"); el.className = "msg error";
    el.innerHTML = '<div class="msg-avatar">\u26A0</div><div class="msg-body"><p>' + esc(text) + "</p></div>";
    chatMessages.appendChild(el); scrollBottom();
  }

  function addThinking() {
    const el = document.createElement("div"); el.className = "msg assistant";
    el.innerHTML = '<div class="msg-avatar">\u{1F916}</div><div class="msg-body"><div class="thinking-indicator">\u601D\u8003\u4E2D<div class="thinking-dots"><span></span><span></span><span></span></div></div></div>';
    chatMessages.appendChild(el); scrollBottom(); return el;
  }

  function scrollBottom() { setTimeout(() => chatMessages.scrollTop = chatMessages.scrollHeight, 50); }

  function openSettings() {
    const cfg = ai.getConfig();
    apiProvider.value = cfg.provider;
    apiKey.value = cfg.apiKey || "";
    apiKeyGroup.style.display = cfg.provider === "mock" ? "none" : "block";
    systemPrompt.value = cfg.systemPrompt || "";
    settingsModal.style.display = "flex";
  }

  function closeSettings() {
    ai.saveConfig({
      provider: apiProvider.value, apiKey: apiKey.value.trim(),
      frameInterval: 3, imageQuality: 0.5, maxImageWidth: 640,
      systemPrompt: systemPrompt.value.trim()
    });
    settingsModal.style.display = "none";
    showToast("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
  }

  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function fmtResp(t) { return t ? esc(t).replace(/\n/g, "<br>") : ""; }
  function fmtCost(c) { if (!c) return ""; const t = (c.promptTokens||0)+(c.completionTokens||0); return (c.costUSD > 1e-6 ? "$\u2248"+c.costUSD.toFixed(6)+" | " : "") + t + " tokens"; }
  function getStatusLabel() { const c = ai.getConfig(); const cs = ai.getCostSummary(); return (c.provider === "mock" ? "\u6A21\u62DF" : c.provider.toUpperCase()) + " | " + cs.requests + " \u6B21\u8BF7\u6C42"; }
  function updateStatus(state, text) { sDot.className = "s-dot"; if (state === "online") sDot.classList.add("online"); if (state === "error") sDot.classList.add("error"); if (state === "connecting") sDot.classList.add("connecting"); sText.textContent = text; }
  function showToast(msg, type) { const old = document.querySelector(".toast"); if (old) old.remove(); const t = document.createElement("div"); t.className = "toast" + (type === "error" ? " error" : ""); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3500); }
  function autoResize(el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 80) + "px"; }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
