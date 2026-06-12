/**
 * Camera Module
 * Manages webcam stream, frame capture, and image compression.
 * Provides a simple event-driven API for the rest of the app.
 */
class CameraManager {
  constructor(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.stream = null;
    this.active = false;
    this.currentFacingMode = 'environment'; // prefer back camera by default
    this.frameCount = 0;
    this._onFrame = null;
  }

  async start(facingMode) {
    if (this.stream) await this.stop();
    this.currentFacingMode = facingMode || this.currentFacingMode;
    try {
      const constraints = {
        video: {
          facingMode: this.currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = this.stream.getVideoTracks()[0];
      const settings = track.getSettings();
      this.video.srcObject = this.stream;
      await this.video.play();
      this.active = true;
      this.frameCount = 0;

      // Set canvas size to match video
      this.canvas.width = settings.width || 640;
      this.canvas.height = settings.height || 480;

      return { width: settings.width, height: settings.height, label: track.label };
    } catch (err) {
      this.active = false;
      throw err;
    }
  }

  async stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
    this.active = false;
  }

  async switchCamera() {
    this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
    await this.start(this.currentFacingMode);
  }

  /**
   * Capture a frame as a compressed JPEG data URL.
   * @param {number} quality - JPEG quality 0-1
   * @param {number} maxWidth - Resize to this max width (preserving aspect ratio)
   * @returns {{ dataUrl: string, sizeKB: number }}
   */
  captureFrame(quality = 0.5, maxWidth = 640) {
    if (!this.active || !this.video.videoWidth) return null;
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    let sw = vw, sh = vh;
    if (vw > maxWidth) {
      sw = maxWidth;
      sh = Math.round((vh / vw) * maxWidth);
    }
    this.canvas.width = sw;
    this.canvas.height = sh;
    this.ctx.drawImage(this.video, 0, 0, sw, sh);
    const dataUrl = this.canvas.toDataURL('image/jpeg', quality);
    const sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024); // approximate
    this.frameCount++;
    return { dataUrl, sizeKB, width: sw, height: sh };
  }

  /**
   * Capture a frame conditionally based on sampling interval.
   * @returns captured frame data or null (skip)
   */
  sampleFrame(interval = 3, quality = 0.5, maxWidth = 640) {
    if (interval < 1) interval = 1;
    if (this.frameCount % interval === 0) {
      return this.captureFrame(quality, maxWidth);
    }
    this.frameCount++;
    return null;
  }

  getDeviceLabel() {
    if (!this.stream) return '';
    const track = this.stream.getVideoTracks()[0];
    return track ? track.label : '';
  }

  getStatus() {
    return {
      active: this.active,
      facingMode: this.currentFacingMode,
      frameCount: this.frameCount,
      label: this.getDeviceLabel(),
    };
  }
}

// Export for other scripts
window.CameraManager = CameraManager;
