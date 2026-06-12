/**
 * AI Service Module
 * Abstraction layer for visual AI services.
 * Supports: Mock (offline), OpenAI GPT-4o, Google Gemini.
 * Tracks cost, handles image optimization, and manages API key storage.
 */

// ===== Base Cost Tracker =====
class CostTracker {
  constructor() {
    this.totalPromptTokens = 0;
    this.totalCompletionTokens = 0;
    this.totalCostUSD = 0;
    this.totalRequests = 0;
    this.totalImagesProcessed = 0;
    this.sessionStart = Date.now();
  }

  addRecord({ promptTokens = 0, completionTokens = 0, costUSD = 0, images = 0 }) {
    this.totalPromptTokens += promptTokens;
    this.totalCompletionTokens += completionTokens;
    this.totalCostUSD += costUSD;
    this.totalRequests += 1;
    this.totalImagesProcessed += images;
  }

  getSummary() {
    return {
      requests: this.totalRequests,
      imagesProcessed: this.totalImagesProcessed,
      promptTokens: this.totalPromptTokens,
      completionTokens: this.totalCompletionTokens,
      totalTokens: this.totalPromptTokens + this.totalCompletionTokens,
      costUSD: parseFloat(this.totalCostUSD.toFixed(6)),
      sessionMinutes: Math.round((Date.now() - this.sessionStart) / 60000),
    };
  }

  reset() {
    this.totalPromptTokens = 0;
    this.totalCompletionTokens = 0;
    this.totalCostUSD = 0;
    this.totalRequests = 0;
    this.totalImagesProcessed = 0;
  }
}

// ===== Base Provider Interface =====
class AIProvider {
  constructor(config) {
    this.config = config;
    this.name = 'base';
  }

  async analyze({ image, text, systemPrompt }) {
    throw new Error('Subclasses must implement analyze()');
  }

  async transcribeAudio(audioBlob) {
    throw new Error('Subclasses must implement transcribeAudio()');
  }

  getCost() {
    return 0;
  }
}

// ===== Mock Provider (offline demo mode) =====
class MockProvider extends AIProvider {
  constructor() {
    super({});
    this.name = 'mock';
    this.callCount = 0;
  }

  async analyze({ image, text, systemPrompt }) {
    this.callCount++;
    // Simulate delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    const msg = text || '锛堟湭鎻愪緵璇煶鎴栨枃瀛楋級';
    const hasImage = !!image;

    let response;
    if (!hasImage) {
      response = `馃摲 鎴戞病鏈夋帴鏀跺埌鎽勫儚澶寸敾闈€傝鍏堟墦寮€鎽勫儚澶达紝鐒跺悗鎴戞墠鑳藉府浣犲垎鏋愮湅鍒扮殑鍐呭銆俙;
    } else if (systemPrompt && systemPrompt.includes('瑙嗛殰')) {
      response = this._mockVisualAid(msg);
    } else if (systemPrompt && systemPrompt.includes('鍎跨')) {
      response = this._mockChildEducation(msg);
    } else if (systemPrompt && systemPrompt.includes('鑰佷汉')) {
      response = this._mockElderly(msg);
    } else {
      response = this._mockGeneral(msg);
    }

    return {
      text: response,
      cost: { promptTokens: 0, completionTokens: 0, costUSD: 0, images: hasImage ? 1 : 0 },
      provider: 'mock',
    };
  }

  _mockGeneral(msg) {
    const responses = [
      `馃憢 鎴戠湅鍒颁簡鎽勫儚澶翠腑鐨勭敾闈€傚叧浜?${msg}"锛屽湪绂荤嚎妯℃嫙妯″紡涓嬶紝鎴戞ā鎷熶簡瑙嗚鍒嗘瀽杩囩▼銆傝鑾峰緱鐪熷疄鐨?AI 瑙嗚鐞嗚В鑳藉姏锛岃閰嶇疆 API Key锛圤penAI 鎴?Gemini锛夈€俙,
      `馃摳 鐢婚潰宸叉崟鑾凤紒鍏充簬"${msg}"鐨勯棶棰橈紝绂荤嚎妯″紡鎻愪緵妯℃嫙鍥炵瓟銆傚湪璁剧疆涓厤缃?API 瀵嗛挜鍗冲彲鍚敤鐪熷疄鐨勮瑙夊垎鏋愩€俙,
      `馃攳 鎴戣瀵熷埌浜嗙敾闈㈠唴瀹广€傚叧浜?${msg}"鈥斺€旇繖鏄竴涓ā鎷熷搷搴斻€傝浣撻獙鐪熸鐨勮瑙?AI 瀵硅瘽锛岃鍦ㄩ珮绾ц缃腑娣诲姞 API Key銆俙,
    ];
    return responses[this.callCount % responses.length];
  }

  _mockVisualAid(msg) {
    return `馃攰 鐜鎻忚堪锛堟ā鎷燂級锛氭垜姝ｉ€氳繃鎽勫儚澶磋瀵熷懆鍥寸幆澧冦€傚叧浜?${msg}"锛屽湪瀹屾暣妯″紡涓嬶紝鎴戜細妫€娴嬮殰纰嶇墿銆佽瘑鍒枃瀛椼€佹弿杩板満鏅€傝閰嶇疆 API Key 鍚敤鐪熷疄瑙嗚鍒嗘瀽銆俙;
  }

  _mockChildEducation(msg) {
    return `馃帹 澶浜嗭紒鎴戠湅鍒颁綘鍦ㄧ湅涓滆タ锛佸叧浜?${msg}"锛屽湪瀹屾暣妯″紡涓嬶紝鎴戝彲浠ュ府浣犺璇嗛鑹层€佽瘑鍒姩鐗┿€佸涔犲瓧姣嶃€傝鐖哥埜濡堝閰嶇疆 API Key 灏辫兘寮€濮嬪涔犲暒锛乣;
  }

  _mockElderly(msg) {
    return `馃懘 濂界殑锛屾垜鏉ュ府鎮ㄧ湅鐪嬨€傚叧浜?${msg}"锛屽湪瀹屾暣妯″紡涓嬶紝鎴戝彲浠ュ府鎮ㄨ鍙栬嵂鍝佽鏄庝功銆佹煡鐪嬮鍝佷繚璐ㄦ湡銆傝鍦ㄨ缃腑閰嶇疆 API Key 鏉ュ惎鐢ㄨ繖涓姛鑳姐€俙;
  }

  getCost() {
    return { totalCostUSD: 0, totalRequests: this.callCount };
  }
}

// ===== OpenAI Provider =====
class OpenAIProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.name = 'openai';
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    // Pricing per 1K tokens (as of mid-2025)
    this.pricing = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4o-turbo': { input: 0.0025, output: 0.01 },
    };
  }

  async analyze({ image, text, systemPrompt }) {
    const messages = [
      { role: 'system', content: systemPrompt || 'You are a helpful AI assistant that analyzes visual content from camera input. Respond in Chinese.' },
    ];

    const userContent = [];
    if (image) {
      userContent.push({
        type: 'image_url',
        image_url: { url: image.dataUrl, detail: 'low' },
      });
    }
    if (text) {
      userContent.push({ type: 'text', text });
    } else if (image) {
      userContent.push({ type: 'text', text: '璇锋弿杩颁綘鐪嬪埌鐨勭敾闈㈠唴瀹癸紝灏藉彲鑳借缁嗐€? });
    }

    messages.push({ role: 'user', content: userContent });

    const body = {
      model: this.model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    };

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const textResponse = data.choices[0].message.content;
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

      // Calculate cost
      const modelPricing = this.pricing[this.model] || this.pricing['gpt-4o'];
      const costUSD = ((usage.prompt_tokens / 1000) * modelPricing.input) +
                      ((usage.completion_tokens / 1000) * modelPricing.output);

      return {
        text: textResponse,
        cost: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          costUSD: parseFloat(costUSD.toFixed(6)),
          images: image ? 1 : 0,
        },
        provider: 'openai',
        model: this.model,
      };
    } catch (err) {
      console.error('OpenAI API call failed:', err);
      throw err;
    }
  }

  async transcribeAudio(audioBlob) {
    // OpenAI Whisper API for audio transcription
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'zh');

    try {
      const res = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error(`Whisper error ${res.status}`);
      const data = await res.json();
      return data.text;
    } catch (err) {
      console.error('Audio transcription failed:', err);
      return null;
    }
  }
}

// ===== Gemini Provider =====
class GeminiProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.name = 'gemini';
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.0-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    // Gemini pricing (approximate, per character)
  }

  async analyze({ image, text, systemPrompt }) {
    const contents = [];
    const parts = [];

    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: `[System Instruction] ${systemPrompt}` }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] });
    }

    const userParts = [];
    if (image) {
      // Convert data URL to base64
      const base64 = image.dataUrl.split(',')[1];
      const mimeType = image.dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      userParts.push({
        inlineData: { mimeType, data: base64 },
      });
    }
    if (text) {
      userParts.push({ text });
    } else if (image) {
      userParts.push({ text: '璇疯缁嗘弿杩颁綘鐪嬪埌鐨勭敾闈㈠唴瀹广€? });
    }

    contents.push({ role: 'user', parts: userParts });

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    };

    try {
      const res = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '锛堟棤鍝嶅簲锛?;

      return {
        text: textResponse,
        cost: {
          promptTokens: 0, // Gemini doesn't expose token counts simply
          completionTokens: 0,
          costUSD: 0.0001, // nominal
          images: image ? 1 : 0,
        },
        provider: 'gemini',
        model: this.model,
      };
    } catch (err) {
      console.error('Gemini API call failed:', err);
      throw err;
    }
  }
}

// ===== AIService Factory =====
class AIService {
  constructor() {
    this.provider = null;
    this.costTracker = new CostTracker();
    this.config = this._loadConfig();
  }

  _loadConfig() {
    try {
      const saved = localStorage.getItem('ai_visual_config');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {
      provider: 'mock',
      apiKey: '',
      openAIModel: 'gpt-4o-mini',
      deepseekModel: 'deepseek-chat',
      geminiModel: 'gemini-2.0-flash',
      frameInterval: 3,
      imageQuality: 0.5,
      maxImageWidth: 640,
      systemPrompt: '',
    };
  }

  saveConfig(updates) {
    Object.assign(this.config, updates);
    localStorage.setItem('ai_visual_config', JSON.stringify(this.config));
    this._initProvider();
  }

  _initProvider() {
    switch (this.config.provider) {
      case 'openai':
        this.provider = new OpenAIProvider({
          apiKey: this.config.apiKey,
          model: this.config.openAIModel,
        });
        break;
      case 'deepseek':
        this.provider = new OpenAIProvider({
          apiKey: this.config.apiKey,
          model: this.config.deepseekModel,
          baseUrl: 'https://api.deepseek.com/v1',
        });
        break;
      case 'gemini':
        this.provider = new GeminiProvider({
          apiKey: this.config.apiKey,
          model: this.config.geminiModel,
        });
        break;
      default:
        this.provider = new MockProvider();
    }
  }

  getProvider() {
    if (!this.provider) this._initProvider();
    return this.provider;
  }

  /**
   * Analyze an image with optional text query.
   * @param {Object} options
   * @param {Object} [options.image] - Image data from camera captureFrame()
   * @param {string} [options.text] - User's text/voice query
   * @param {string} [options.systemPrompt] - System prompt override
   * @param {number} [options.maxWidth] - Override max width
   * @param {number} [options.quality] - Override JPEG quality
   * @returns {Promise<{text: string, cost: Object}>}
   */
  async analyze({ image, text, systemPrompt, maxWidth, quality } = {}) {
    const provider = this.getProvider();
    const opts = {
      maxWidth: maxWidth || this.config.maxImageWidth,
      quality: quality || this.config.imageQuality,
    };

    const result = await provider.analyze({
      image: image ? { ...image, dataUrl: this._compressIfNeeded(image, opts) } : null,
      text: text || '',
      systemPrompt: systemPrompt || this.config.systemPrompt,
    });

    this.costTracker.addRecord(result.cost);
    return result;
  }

  _compressIfNeeded(image, opts) {
    // If image is already smaller than target, use as-is
    if (image.width <= opts.maxWidth && image.quality >= opts.quality) {
      return image.dataUrl;
    }
    // Recompress 鈥?this is handled by camera.captureFrame with desired params
    return image.dataUrl;
  }

  async transcribeAudio(audioBlob) {
    const provider = this.getProvider();
    if (typeof provider.transcribeAudio !== 'function') return null;
    return provider.transcribeAudio(audioBlob);
  }

  getCostSummary() {
    return this.costTracker.getSummary();
  }

  getConfig() {
    return { ...this.config };
  }

  setProvider(providerName) {
    this.config.provider = providerName;
    this._initProvider();
    this.saveConfig({ provider: providerName });
  }
}

window.CostTracker = CostTracker;
window.MockProvider = MockProvider;
window.OpenAIProvider = OpenAIProvider;
window.GeminiProvider = GeminiProvider;
window.AIService = AIService;

