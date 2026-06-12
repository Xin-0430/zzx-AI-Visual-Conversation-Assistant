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

    const msg = text || '（未提供语音或文字）';
    const hasImage = !!image;

    let response;
    if (!hasImage) {
      response = `📷 我没有接收到摄像头画面。请先打开摄像头，然后我才能帮你分析看到的内容。`;
    } else if (systemPrompt && systemPrompt.includes('视障')) {
      response = this._mockVisualAid(msg);
    } else if (systemPrompt && systemPrompt.includes('儿童')) {
      response = this._mockChildEducation(msg);
    } else if (systemPrompt && systemPrompt.includes('老人')) {
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
      `👋 我看到了摄像头中的画面。关于"${msg}"，在离线模拟模式下，我模拟了视觉分析过程。要获得真实的 AI 视觉理解能力，请配置 API Key（OpenAI 或 Gemini）。`,
      `📸 画面已捕获！关于"${msg}"的问题，离线模式提供模拟回答。在设置中配置 API 密钥即可启用真实的视觉分析。`,
      `🔍 我观察到了画面内容。关于"${msg}"——这是一个模拟响应。要体验真正的视觉 AI 对话，请在高级设置中添加 API Key。`,
    ];
    return responses[this.callCount % responses.length];
  }

  _mockVisualAid(msg) {
    return `🔊 环境描述（模拟）：我正通过摄像头观察周围环境。关于"${msg}"，在完整模式下，我会检测障碍物、识别文字、描述场景。请配置 API Key 启用真实视觉分析。`;
  }

  _mockChildEducation(msg) {
    return `🎨 太棒了！我看到你在看东西！关于"${msg}"，在完整模式下，我可以帮你认识颜色、识别动物、学习字母。让爸爸妈妈配置 API Key 就能开始学习啦！`;
  }

  _mockElderly(msg) {
    return `👴 好的，我来帮您看看。关于"${msg}"，在完整模式下，我可以帮您读取药品说明书、查看食品保质期。请在设置中配置 API Key 来启用这个功能。`;
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
    var supportsImage = !this.model?.startsWith('deepseek');
    if (image && supportsImage) {
      userContent.push({
        type: 'image_url',
        image_url: { url: image.dataUrl, detail: 'low' },
      });
    }
    if (text) {
      userContent.push({ type: 'text', text });
    } else if (image) {
      userContent.push({ type: 'text', text: '请描述你看到的画面内容，尽可能详细。' });
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
    if (image && !this.model?.startsWith('deepseek')) {
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
      userParts.push({ text: '请详细描述你看到的画面内容。' });
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
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '（无响应）';

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
    const defaults = {
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
    try {
      const saved = localStorage.getItem('ai_visual_config');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch (e) { /* ignore */ }
    return defaults;
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
  async analyze({ image, text, systemPrompt, sceneIQ, maxWidth, quality } = {}) {
    const provider = this.getProvider();
    const opts = {
      maxWidth: maxWidth || this.config.maxImageWidth,
      quality: quality || this.config.imageQuality,
    };

    const result = await provider.analyze({
      image: image ? { ...image, dataUrl: this._compressIfNeeded(image, opts) } : null,
      text: text || '',
      systemPrompt: systemPrompt || this.config.systemPrompt,
      sceneIQ: sceneIQ,
    });

    this.costTracker.addRecord(result.cost);
    return result;
  }

  _compressIfNeeded(image, opts) {
    // If image is already smaller than target, use as-is
    if (image.width <= opts.maxWidth && image.quality >= opts.quality) {
      return image.dataUrl;
    }
    // Recompress — this is handled by camera.captureFrame with desired params
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