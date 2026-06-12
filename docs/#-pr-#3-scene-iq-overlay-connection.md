# PR #3: Scene IQ Overlay Connection

## 功能描述
将 Scene IQ 分析数据实时渲染到摄像头视口覆盖层上。打开摄像头后，画面左上角显示 HUD 风格信息：
- 环境亮度计（颜色编码：琥珀色/青色/紫色）
- 运动检测指示器（运动 > 8/100 时显示）
- 场景标签（暗光/室内/明亮/运动中）
- 实时帧率计数器
- 分辨率角标

## 实现思路
- 300ms setInterval 读取 CameraManager.getSceneIQ()
- 亮度映射为百分比 + CSS width 动画
- 运动阈值 8/100 过滤噪点
- 帧率通过每秒计数 interval tick 计算
- 所有渲染为 DOM 操作，无需额外 Canvas

## 测试方式
1. 打开摄像头，验证 Scene IQ 覆盖层出现（LIVE 标签、亮度条）
2. 在镜头前挥手，验证运动指示器出现
3. 遮挡镜头，验证场景标签切换为 "暗光"
4. 验证 FPS 计数器每秒更新
5. 关闭摄像头，验证覆盖层消失

## 依赖声明
无外部依赖。依赖 PR #2 的 CameraManager.getSceneIQ()。
