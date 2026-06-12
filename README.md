# AI Visual Conversation Assistant

AI 视觉对话助手 --- 一款通过摄像头看世界、通过语音聊天的 AI 应用。

## 功能亮点

- 摄像头实时画面 + AI 视觉理解
- 语音输入(中文) + 语音播报
- 四种目标场景模式
- 支持离线模拟 / OpenAI / Gemini
- 成本控制: 帧采样、图片压缩、detail:low
- 实时费用追踪

## 场景模式

| 模式 | 目标用户 | 核心能力 |
|------|---------|---------|
| 视障辅助 | 视觉障碍人士 | 环境描述、障碍物检测、文字识别 |
| 儿童教育 | 3-8 岁儿童 | 动物/颜色/字母识别、互动教学 |
| 老人陪伴 | 老年人 | 药品说明、保质期检查、操作指南 |
| 懒人模式 | 所有人 | 语音直接问"帮我看看..." |

## 快速开始

1. 打开 index.html (推荐 Chrome/Edge)
2. 点击"摄像头"按钮
3. 选择场景模式
4. 点击麦克风按钮说话，或直接打字
5. 在"高级设置"中配置 API Key 启用真实 AI

## 配置 API Key

### OpenAI (推荐)
- 在 settings 中选择 OpenAI
- 填入 API Key (sk-...)
- 默认使用 gpt-4o-mini (最省成本)

### Google Gemini
- 在 settings 中选择 Gemini
- 填入 API Key (AIza...)

### 离线模拟模式
- 无需任何配置
- 返回模拟响应，用于体验交互流程

## 成本控制

| 控制项 | 默认值 | 可选值 |
|--------|-------|-------|
| 帧采样间隔 | 3帧 | 1/3/5/10 |
| 图片质量 | 50% | 30%/50%/70%/90% |
| 图片最大宽度 | 640px | 320/640/1280 |
| AI 模型 | gpt-4o-mini | gpt-4o/gpt-4o-mini |

## 项目结构

```
index.html         主页面
css/style.css      全局样式
js/camera.js       摄像头模块
js/speech.js       语音模块
js/ai-service.js   AI 服务抽象层
js/scenes.js       场景模式配置
js/app.js          主控制器
DESIGN.md          设计文档
```

## 技术栈

- HTML5 / CSS3 / Vanilla JavaScript
- WebRTC (getUserMedia) 摄像头
- Web Speech API 语音识别 + 合成
- OpenAI / Gemini 视觉 API
- localStorage 配置持久化

## 浏览器兼容

最佳体验: Chrome / Edge (完整支持 Web Speech API)
部分支持: Firefox, Safari (不支持语音识别)
