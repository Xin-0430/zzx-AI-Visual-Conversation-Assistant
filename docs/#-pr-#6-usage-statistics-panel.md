# PR #6: Usage Statistics Panel

## 功能描述
侧边栏实时使用统计面板，显示：
- 总请求次数
- 总 Token 消耗（prompt + completion）
- 估算费用（USD）
- 已处理图像数
每次 AI 分析完成后自动更新。

## 实现思路
- 读取 CostTracker.getCostSummary() 获取全部指标
- 2x2 CSS Grid 网格布局置于侧边栏
- updateStatPanel() 在每次 processQuery 完成后调用
- 页面加载时初始化为零值
- Token 使用 toLocaleString() 格式化

## 测试方式
1. 打开应用，验证统计面板显示全零
2. 发送一条查询（模拟模式），验证请求数增加
3. 切换为 OpenAI/Gemini 模式，发送查询，验证 Token 计数
4. 验证模拟模式下费用显示 
5. 清空视觉记忆，验证统计不受影响

## 依赖声明
无外部依赖。读取 PR #2 的 CostTracker 系统。
