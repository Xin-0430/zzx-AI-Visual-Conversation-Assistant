/**
 * Speech Module
 * Handles speech recognition (Web Speech API) and text-to-speech.
 * Provides event-driven voice input and output.
 */
class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.isListening = false;
    this._onResult = null;
    this._onInterim = null;
    this._onEnd = null;
    this._onError = null;
    this.lang = 'zh-CN';
    this.continuous = false; // single utterance mode for push-to-talk
    this._restartTimeout = null;
  }

  /**
   * Start speech recognition.
   * @param {Object} options
   * @param {string} options.lang - Language code (default zh-CN)
   * @param {boolean} options.continuous - Keep listening after result
   * @returns {boolean} success
   */
  startListening({ lang = 'zh-CN', continuous = false } = {}) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return false;
    }
    if (this.isListening) return true;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = lang;
    this.recognition.continuous = continuous;
    this.recognition.interimResults = !continuous;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final && this._onResult) this._onResult(final);
      if (interim && this._onInterim) this._onInterim(interim);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this._onEnd) this._onEnd();
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Silently handle these
        return;
      }
      if (this._onError) this._onError(event.error);
    };

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.error('Failed to start recognition:', err);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) { /* ignore */ }
    }
    this.isListening = false;
    if (this._restartTimeout) {
      clearTimeout(this._restartTimeout);
      this._restartTimeout = null;
    }
  }

  /**
   * Speak text using speech synthesis.
   * @param {string} text - Text to speak
   * @param {Object} options
   * @param {number} options.rate - Speech rate 0.1-10 (default 1.0)
   * @param {number} options.pitch - Speech pitch 0-2 (default 1.0)
   * @param {Function} options.onEnd - Callback when speech ends
   */
  speak(text, { rate = 1.0, pitch = 1.0, onEnd = null } = {}) {
    if (!this.synth || !('speak' in this.synth)) return false;
    window.speechSynthesis.cancel(); // cancel previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (onEnd) utterance.onend = onEnd;
    // Get a Chinese voice if available
    const voices = this.synth.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) utterance.voice = zhVoice;
    this.synth.speak(utterance);
    return true;
  }

  stopSpeaking() {
    if (this.synth) window.speechSynthesis.cancel();
  }

  isSupported() {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }

  isTTSupported() {
    return 'speechSynthesis' in window;
  }

  on(event, callback) {
    switch (event) {
      case 'result': this._onResult = callback; break;
      case 'interim': this._onInterim = callback; break;
      case 'end': this._onEnd = callback; break;
      case 'error': this._onError = callback; break;
    }
  }

  off(event) {
    switch (event) {
      case 'result': this._onResult = null; break;
      case 'interim': this._onInterim = null; break;
      case 'end': this._onEnd = null; break;
      case 'error': this._onError = null; break;
    }
  }
}

window.SpeechManager = SpeechManager;
