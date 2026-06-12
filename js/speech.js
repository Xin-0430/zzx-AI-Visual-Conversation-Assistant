/**
 * Speech Module v2 — with voice command detection
 * Handles speech recognition (Web Speech API) and text-to-speech.
 * Detects built-in voice commands: save, repeat, switch mode, capture.
 */
class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.isListening = false;
    this.lang = "zh-CN";
    this._onResult = null;
    this._onInterim = null;
    this._onEnd = null;
    this._onError = null;
    this._onCommand = null;

    // Voice commands registry
    this.commands = {
      "baocun": "save",
      "cun": "save",
      "baocun zhe zhang": "save",
      "save": "save",
      "chongfu": "repeat",
      "chongfu yibian": "repeat",
      "zaishuo yici": "repeat",
      "repeat": "repeat",
      "paishe": "capture",
      "paizhao": "capture",
      "capture": "capture",
      "qiehuan": "mode_next",
      "huan moshi": "mode_next",
      "qiehuan moshi": "mode_next",
      "xiayige moshi": "mode_next",
      "switch": "mode_next",
      "antai moshi": "ambient",
      "huanjing ganshi": "ambient",
      "ambient": "ambient",
      "qingkong": "clear",
      "qingkong duihua": "clear",
      "qingli": "clear",
      "clear": "clear"
    };
  }

  startListening({ lang = "zh-CN", continuous = false } = {}) {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return false;
    if (this.isListening) return true;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.lang = lang;
    this.recognition.continuous = continuous;
    this.recognition.interimResults = !continuous;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      let interim = "", final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }

      // Check for commands in final result
      if (final) {
        const cmd = this._matchCommand(final);
        if (cmd && this._onCommand) {
          this._onCommand(cmd, final);
          return;
        }
        if (this._onResult) this._onResult(final);
      }
      if (interim && this._onInterim) this._onInterim(interim);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this._onEnd) this._onEnd();
    };

    this.recognition.onerror = (e) => {
      console.warn("Speech error:", e.error);
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (this._onError) this._onError(e.error);
    };

    try { this.recognition.start(); this.isListening = true; return true; }
    catch (err) { console.error("Speech start fail:", err); return false; }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.isListening = false;
  }

  startRecording(onBlobReady) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    this._mediaChunks = [];
    this._onBlobReady = onBlobReady;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
      var r = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      r.ondataavailable = function(e) { if (e.data.size > 0) this._mediaChunks.push(e.data); }.bind(this);
      r.onstop = function() {
        var blob = new Blob(this._mediaChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(function(t) { t.stop(); });
        if (this._onBlobReady) this._onBlobReady(blob);
      }.bind(this);
      r.start();
      this._mediaRecorder = r;
      this.isRecordingMedia = true;
    }.bind(this)).catch(function() { });
    return true;
  }

  stopRecording() {
    if (this._mediaRecorder && this.isRecordingMedia) {
      this._mediaRecorder.stop();
      this.isRecordingMedia = false;
    }
  }

  _matchCommand(text) {
    const normalized = text.toLowerCase().replace(/[.,!?\s]/g, "");
    for (const [pattern, cmd] of Object.entries(this.commands)) {
      if (normalized.includes(pattern)) return cmd;
    }
    return null;
  }

  speak(text, { rate = 1.0, pitch = 1.0, onEnd = null } = {}) {
    if (!this.synth || !("speak" in this.synth)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = rate;
    u.pitch = pitch;
    if (onEnd) u.onend = onEnd;
    const voices = this.synth.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith("zh"));
    if (zhVoice) u.voice = zhVoice;
    this.synth.speak(u);
    return true;
  }

  stopSpeaking() { if (this.synth) window.speechSynthesis.cancel(); }

  isSupported() { return "webkitSpeechRecognition" in window || "SpeechRecognition" in window; }
  isTTSupported() { return "speechSynthesis" in window; }

  on(event, cb) {
    switch (event) {
      case "result": this._onResult = cb; break;
      case "interim": this._onInterim = cb; break;
      case "end": this._onEnd = cb; break;
      case "error": this._onError = cb; break;
      case "command": this._onCommand = cb; break;
    }
  }
  off(event) {
    switch (event) {
      case "result": this._onResult = null; break;
      case "interim": this._onInterim = null; break;
      case "end": this._onEnd = null; break;
      case "error": this._onError = null; break;
      case "command": this._onCommand = null; break;
    }
  }
}

window.SpeechManager = SpeechManager;
