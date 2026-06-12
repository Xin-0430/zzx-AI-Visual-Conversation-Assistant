/**
 * Camera Module v2 — with Scene IQ
 * Manages webcam stream, frame capture, compression, and scene intelligence.
 * Scene IQ: brightness analysis, motion detection, scene categorization.
 */
class CameraManager {
  constructor(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.stream = null;
    this.active = false;
    this.currentFacingMode = "environment";
    this.frameCount = 0;
    this._prevFrameData = null;
    this._motionThreshold = 15;
  }

  async start(facingMode) {
    if (this.stream) await this.stop();
    this.currentFacingMode = facingMode || this.currentFacingMode;
    try {
      const constraints = {
        video: { facingMode: this.currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = this.stream.getVideoTracks()[0];
      const settings = track.getSettings();
      this.video.srcObject = this.stream;
      await this.video.play();
      this.active = true;
      this.frameCount = 0;
      this._prevFrameData = null;
      this.canvas.width = settings.width || 640;
      this.canvas.height = settings.height || 480;
      return { width: settings.width, height: settings.height, label: track.label };
    } catch (err) {
      this.active = false;
      throw err;
    }
  }

  async stop() {
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    this.video.srcObject = null;
    this.active = false;
  }

  async switchCamera() {
    this.currentFacingMode = this.currentFacingMode === "environment" ? "user" : "environment";
    await this.start(this.currentFacingMode);
  }

  captureFrame(quality = 0.5, maxWidth = 640) {
    if (!this.active || !this.video.videoWidth) return null;
    const vw = this.video.videoWidth, vh = this.video.videoHeight;
    let sw = vw, sh = vh;
    if (vw > maxWidth) { sw = maxWidth; sh = Math.round((vh / vw) * maxWidth); }
    this.canvas.width = sw;
    this.canvas.height = sh;
    this.ctx.drawImage(this.video, 0, 0, sw, sh);
    const dataUrl = this.canvas.toDataURL("image/jpeg", quality);
    const sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
    this.frameCount++;
    return { dataUrl, sizeKB, width: sw, height: sh };
  }

  sampleFrame(interval = 3, quality = 0.5, maxWidth = 640) {
    if (interval < 1) interval = 1;
    if (this.frameCount % interval === 0) return this.captureFrame(quality, maxWidth);
    this.frameCount++;
    return null;
  }

  // ---- Scene IQ ----

  /** Analyze brightness (0-255 average) from video */
  getBrightness() {
    if (!this.active || !this.video.videoWidth) return 128;
    const vw = this.video.videoWidth, vh = this.video.videoHeight;
    this.canvas.width = Math.min(vw, 160);
    this.canvas.height = Math.min(vh, 120);
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    let sum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      count++;
    }
    return count > 0 ? Math.round(sum / count) : 128;
  }

  /** Detect motion level (0-100) by comparing frames */
  getMotionLevel() {
    if (!this.active || !this.video.videoWidth) return 0;
    const w = 80, h = 60;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.drawImage(this.video, 0, 0, w, h);
    const data = new Uint8Array(this.ctx.getImageData(0, 0, w, h).data);
    if (!this._prevFrameData) {
      this._prevFrameData = data;
      return 0;
    }
    let diff = 0;
    for (let i = 0; i < data.length; i += 4) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const pg = 0.299 * this._prevFrameData[i] + 0.587 * this._prevFrameData[i + 1] + 0.114 * this._prevFrameData[i + 2];
      diff += Math.abs(g - pg);
    }
    this._prevFrameData = data;
    const maxDiff = w * h * 255;
    const level = Math.min(100, Math.round((diff / maxDiff) * 1000));
    return level;
  }

  /** Categorize scene type */
  getSceneTag() {
    if (!this.active || !this.video.videoWidth) return "\u25CB \u672A\u77E5";
    const b = this.getBrightness();
    const motion = this.getMotionLevel();
    if (b < 40) return "\u{1F319} \u6697\u5149\u73AF\u5883";
    if (b < 80) return "\u{1F4A1} \u5F31\u5149";
    if (b < 160) return "\u2601 \u5BA4\u5185";
    if (motion > 30) return "\u{1F3C3} \u6709\u79FB\u52A8";
    return "\u2600 \u660E\u4EAE";
  }

  /** Get dominant hue description for scene overlay */
  getDominantColor() {
    if (!this.active || !this.video.videoWidth) return null;
    const w = 40, h = 30;
    this.canvas.width = w; this.canvas.height = h;
    this.ctx.drawImage(this.video, 0, 0, w, h);
    const data = this.ctx.getImageData(0, 0, w, h).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 16) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
    if (n === 0) return null;
    r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
    return { r, g, b, hex: "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("") };
  }

  /** Get full Scene IQ snapshot */
  getSceneIQ() {
    if (!this.active) return null;
    const brightness = this.getBrightness();
    const motion = this.getMotionLevel();
    const scene = this.getSceneTag();
    const color = this.getDominantColor();
    return { brightness, motion, scene, color, frameCount: this.frameCount };
  }

  getDeviceLabel() {
    if (!this.stream) return "";
    const track = this.stream.getVideoTracks()[0];
    return track ? track.label : "";
  }

  getStatus() {
    return {
      active: this.active,
      facingMode: this.currentFacingMode,
      frameCount: this.frameCount,
      label: this.getDeviceLabel()
    };
  }
}

window.CameraManager = CameraManager;
