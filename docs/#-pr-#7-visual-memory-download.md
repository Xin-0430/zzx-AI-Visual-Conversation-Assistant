# PR #7: Visual Memory Download

## 功能描述
视觉记忆缩略图增加下载功能。悬停缩略图时，覆盖层分为两个按钮：
- 🔍（左侧）：回顾/重新分析 — 触发 AI 重新分析该画面
- ⬇（右侧）：下载保存 — 将该帧保存为 JPEG 文件到本地

## 实现思路
- renderMemory() 覆盖层拆分为 .mc-view 和 .mc-dl 两个 span
- 下载按钮创建临时 <a> 元素，href 指向 base64 data URL
- e.stopPropagation() 阻止下载点击触发回顾
- 文件名格式 'vca-memory-{timestamp}.jpg'
- CSS hover 状态和圆角边框

## 测试方式
1. 打开摄像头，发送查询创建视觉记忆
2. 悬停缩略图，验证 🔍（回顾）和 ⬇（下载）两个按钮出现
3. 点击 ⬇ 验证文件下载为 vca-memory-*.jpg
4. 点击 🔍 验证回顾功能正常（重新分析画面）
5. 验证下载不影响记忆列表

## 依赖声明
无外部依赖。纯 DOM + download 属性。
