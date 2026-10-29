import * as THREE from 'three';

const DEG = Math.PI / 180;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Keeps the AR camera aimed: uses device orientation when the sensor is
 * available (phones), otherwise drag-to-look on pointer input (desktop).
 */
export class LookControls {
  constructor(camera) {
    this.camera = camera;
    this.hasSensor = false;
    this.yaw = 0;
    this.pitch = 0;
    this.alpha = 0;
    this.beta = 0;
    this.gamma = 0;
    this.screenAngle = 0;

    this._euler = new THREE.Euler();
    this._quat = new THREE.Quaternion();
    this._screenQuat = new THREE.Quaternion();
    this._axisZ = new THREE.Vector3(0, 0, 1);
    // Rotates the device frame (Y up out of the screen) into three.js space.
    this._deviceToWorld = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

    this._onOrientation = (event) => {
      if (event.alpha === null && event.beta === null && event.gamma === null) return;
      this.alpha = event.alpha || 0;
      this.beta = event.beta || 0;
      this.gamma = event.gamma || 0;
      this.hasSensor = true;
    };
    this._onScreenChange = () => {
      const orientation = window.screen && window.screen.orientation;
      this.screenAngle = (orientation && typeof orientation.angle === 'number' ? orientation.angle : window.orientation) || 0;
    };
  }

  /** iOS 13+ gates the sensor behind a user-gesture permission prompt. */
  async requestPermission() {
    const sensor = window.DeviceOrientationEvent;
    if (sensor && typeof sensor.requestPermission === 'function') {
      try {
        return (await sensor.requestPermission()) === 'granted';
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  start() {
    this._onScreenChange();
    window.addEventListener('deviceorientation', this._onOrientation);
    window.addEventListener('orientationchange', this._onScreenChange);
  }

  /** Only moves the view on devices without an orientation sensor. */
  drag(dx, dy) {
    if (this.hasSensor) return;
    this.yaw -= dx * 0.0038;
    this.pitch = clamp(this.pitch - dy * 0.0038, -1.3, 1.3);
  }

  update() {
    if (this.hasSensor) {
      this._euler.set(this.beta * DEG, this.alpha * DEG, -this.gamma * DEG, 'YXZ');
      this.camera.quaternion.setFromEuler(this._euler);
      this.camera.quaternion.multiply(this._deviceToWorld);
      this._screenQuat.setFromAxisAngle(this._axisZ, -this.screenAngle * DEG);
      this.camera.quaternion.multiply(this._screenQuat);
      return;
    }
    this._euler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this._euler);
  }
}
