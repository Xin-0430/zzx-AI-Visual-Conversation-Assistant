# PR #1: UI Redesign with Glassmorphism Design System

## 功能描述
将基础 UI 替换为玻璃拟态（Glassmorphism）设计系统。全新的侧边栏品牌区域、场景模式导航卡片、洞察卡片和状态栏。摄像头区域为 HUD 覆盖层预留视口。对话区域增加语音波形指示器、自动发送芯片和 TTS 开关。

## 实现思路
- Vanilla CSS 自定义属性设计 Token 系统
- backdrop-filter: blur() 实现毛玻璃效果
- 径向渐变背景增加层次深度
- Unicode 几何形状替代图标库（零外部依赖）
- CSS Grid/Flexbox 响应式布局
- 媒体查询 768px 断点适配移动端

## 测试方式
1. 用 Chrome/Edge 打开 index.html
2. 验证毛玻璃面板渲染效果
3. 点击模式按钮验证洞察卡片更新
4. 缩小浏览器窗口至 768px 以下验证响应式布局
5. 打开设置弹窗验证保存/关闭

## 依赖声明
无外部依赖。所有样式均为原生 CSS。
