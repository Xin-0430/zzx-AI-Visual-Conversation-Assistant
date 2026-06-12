# AI 视觉对话助手 --- 设计文档

## 一、项目概述

项目名称: AI Visual Conversation Assistant (AI-VCA)
开发周期: 3 天
目标: 构建一款能够通过摄像头看到视频内容、通过麦克风听到用户语音、并给予恰当视觉理解回应的 AI 对话应用。
技术栈: 原生 JavaScript + CSS3 + HTML5 + Web Speech API + 可选 OpenAI/Gemini API

## 二、用户故事: 计划与实现对比

### 计划实现的用户故事

1. 打开摄像头让 AI 看到实时画面 [P0] [已实现]
2. 语音提问，AI 识别语音 [P0] [已实现]
3. AI 语音回答 [P0] [已实现]
4. 文字输入问题 [P0] [已实现]
5. 视障辅助: 描述环境+障碍物提示 [P0] [已实现]
6. 儿童教育: 动物/颜色/字母识别 [P0] [已实现]
7. 老人陪伴: 药品/保质期识别 [P0] [已实现]
8. 懒人模式: 语音直接让 AI 帮看 [P0] [已实现]
9. 控制帧率和图片质量 [P1] [已实现]
10. 查看 Token 消耗和费用 [P1] [已实现]
11. 切换 AI 服务商 [P1] [已实现]
12. 开关语音回放 [P1] [已实现]

### 额外实现

- 专属系统提示词(每个场景 300-500 字精细调校)
- 离线模拟模式(无需 API Key)
- 成本追踪(请求次数+Token+费用)
- 自动初始分析(开摄像头后自动触发)
- 配置本地持久化(localStorage)
- 响应式设计(桌面+移动端)
- 自定义提示词覆盖

## 三、架构设计

### 系统架构

Browser 前端层:
- Camera.js: getUserMedia 摄像头管理、帧捕获、压缩
- Speech.js: Web Speech API 语音识别 + 合成
- Scenes.js: 四种场景模式的提示词配置
- App.js: 主控制器，串接各模块

AI Service 抽象层:
- AIProvider 接口: analyze(image, text, systemPrompt)
- MockProvider: 离线模拟
- OpenAIProvider: GPT-4o/GPT-4o-mini 视觉API
- GeminiProvider: Gemini 2.0 Flash 视觉API
- CostTracker: 追踪Token和费用

### 交互流程

用户说话/打字 → App.js接收 → Camera.js捕获帧(采样+压缩) → AIService.analyze(image+text+systemPrompt) → AI Provider处理 → 返回响应+成本 → 聊天区显示+语音播报

### 关键技术决策

1. Vanilla JS: 减少依赖，3天开发更高效
2. AI Provider抽象: 可插拔后端，统一接口
3. Web Speech API(非云语音): 免费、零延迟、隐私保护

## 四、运营成本控制策略

### 思考过的技巧

已采用:
- 帧采样间隔(默认3帧,降67%调用量)
- JPEG压缩(30-90%,降90%传输量)
- 分辨率限制(320/640/1280px)
- 模型选型(gpt-4o-mini,便宜16x)
- detail:low(按85x85 tile计费)
- isProcessing防重复锁
- 数据量可视化引导

未采用:
- API缓存(牺牲实时性)
- 流式响应(增加复杂度)
- 本地OCR(Tesseract精度不够)
- 批处理(影响交互体验)
- 云端语音(Web Speech免费)
- 模型Fallback(增加复杂度)

### 成本估算 (gpt-4o-mini, 640px, detail:low, 3帧采样)

低频: ~$0.0003/图, 60次/时, ~$0.36/月
中度: ~$0.0003/图, 300次/时, ~$1.80/月
高频: ~$0.0003/图, 1000次/时, ~$6.00/月

## 五、项目文件

D:\ai-visual-assistant\
  index.html - 主页面
  css/style.css - 全局样式
  js/camera.js - 摄像头模块
  js/speech.js - 语音模块
  js/ai-service.js - AI 服务抽象层
  js/scenes.js - 场景模式配置
  js/app.js - 主控制器
  DESIGN.md - 设计文档
  README.md - 项目说明

## 六、后续改进

1. 端侧模型: WebLLM/MediaPipe 脱网运行
2. 连续视频流: MediaRecorder 实时流
3. 视觉记忆: 跨帧理解上下文
4. 本地OCR: Tesseract.js
5. 移动端触摸优化
6. 无障碍: 屏幕阅读器+大字体
7. 音频录制: Whisper补充兼容性
