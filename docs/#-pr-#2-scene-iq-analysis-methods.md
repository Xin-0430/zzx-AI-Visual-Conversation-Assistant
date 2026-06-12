# PR #2: Scene IQ Analysis Methods

## 功能描述
为摄像头模块增加实景智能分析能力（纯客户端，零 API 成本）：
- getBrightness(): 通过 Canvas 像素数据计算平均亮度 (0-255)
- getMotionLevel(): 帧间差分法检测运动 (0-100)
- getSceneTag(): 场景分类（暗光/室内/明亮/运动中）
- getDominantColor(): 提取画面主色 RGB
- getSceneIQ(): 一次性获取全部指标

## 实现思路
- Canvas 2D API 下采样像素分析（缩放到 40-160px 提高性能）
- 帧差分存储在 _prevFrameData 缓存中
- 纯整数运算，无浮点操作
- 300ms 间隔读取（非每帧），节约 CPU
- 零网络请求，零 API 成本

## 测试方式
1. 打开摄像头，打开 DevTools Console
2. 执行 camera.getBrightness() 查看 0-255 数值
3. 执行 camera.getMotionLevel() 查看 0-100 数值
4. 在镜头前挥手，重新执行 getMotionLevel() 观察变化
5. 遮挡镜头，执行 getSceneTag() 查看 "暗光环境" 标签

## 依赖声明
无外部依赖。纯 Canvas 2D API 分析。
