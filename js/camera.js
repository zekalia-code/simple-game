/** Live camera feed management (rear camera by default). */
export class CameraFeed {
  constructor(video) {
    this.video = video;
    this.stream = null;
    this.facing = 'environment';
  }

  get active() {
    return Boolean(this.stream && this.video.srcObject);
  }

  get mirrored() {
    return this.facing === 'user';
  }

  async start(facing = this.facing) {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      const error = new Error('Camera API unavailable');
      error.code = 'unsupported';
      throw error;
    }

    this.stop();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });

    this.stream = stream;
    this.video.srcObject = stream;

    const [track] = stream.getVideoTracks();
    const settings = track && typeof track.getSettings === 'function' ? track.getSettings() : {};
    this.facing = settings.facingMode || facing;
    this.video.classList.toggle('mirrored', this.mirrored);

    try {
      await this.video.play();
    } catch (error) {
      // Autoplay may be blocked; the stream still renders once it plays.
    }

    if (!this.video.videoWidth) {
      await new Promise((resolve) => {
        this.video.addEventListener('loadedmetadata', resolve, { once: true });
        setTimeout(resolve, 1500);
      });
    }
    return this.facing;
  }

  async flip() {
    this.facing = this.facing === 'user' ? 'environment' : 'user';
    await this.start(this.facing);
    return this.facing;
  }

  stop() {
    if (!this.stream) return;
    this.stream.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
