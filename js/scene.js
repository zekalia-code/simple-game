import * as THREE from 'three';

const PALETTE = [0x57f5ff, 0xff4fd8, 0x9d7bff, 0x7dffcf];
const PLACE_DISTANCE = 4;

/** WebGL layer that floats relics in front of whatever the camera sees. */
export class ARScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 120);
    this.camera.position.set(0, 0, 0);

    this.world = new THREE.Group();
    this.scene.add(this.world);

    this.clock = new THREE.Clock();
    this.placed = [];
    this.flashes = [];
    this.raycaster = new THREE.Raycaster();
    this.beaconFading = false;
    this.beaconFade = 0;

    this._buildLights();
    this._buildDust();
    this._buildCenterpiece();
    this.resize();
  }

  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0x9fd3ff, 1.2));

    const key = new THREE.DirectionalLight(0xbdf8ff, 1.5);
    key.position.set(-3, 5, 2);
    this.scene.add(key);

    const cyan = new THREE.PointLight(0x57f5ff, 18, 16);
    cyan.position.set(-2.4, 1.6, 3);
    const magenta = new THREE.PointLight(0xff4fd8, 20, 16);
    magenta.position.set(2.6, -1.2, 2.4);
    this.scene.add(cyan, magenta);
  }

  _buildDust() {
    const count = 150;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 2.4 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.6;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dust = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0x9fe9ff,
        size: 0.022,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.world.add(this.dust);
  }

  _buildCenterpiece() {
    const group = new THREE.Group();
    group.position.set(0, 0.05, -PLACE_DISTANCE);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.3, 0),
      new THREE.MeshStandardMaterial({
        color: 0x0b1a2c,
        emissive: 0x57f5ff,
        emissiveIntensity: 2.2,
        metalness: 0.6,
        roughness: 0.25,
        flatShading: true,
      }),
    );

    const cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.58, 1),
      new THREE.MeshBasicMaterial({ color: 0x57f5ff, wireframe: true, transparent: true, opacity: 0.42 }),
    );

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.011, 6, 64),
      new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.8 }),
    );
    ring.rotation.x = Math.PI / 2.4;

    const ringB = ring.clone();
    ringB.material = ring.material.clone();
    ringB.material.color.set(0x9d7bff);
    ringB.rotation.set(Math.PI / 1.7, 0.5, 0);

    group.add(core, cage, ring, ringB);
    this.centerpiece = group;
    this.world.add(group);
  }

  _makeRelic() {
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshStandardMaterial({
        color: 0x0a1524,
        emissive: color,
        emissiveIntensity: 2.4,
        metalness: 0.5,
        roughness: 0.2,
        flatShading: true,
      }),
    );
    gem.scale.y = 1.35;

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.011, 6, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }),
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 12),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );

    const group = new THREE.Group();
    group.add(glow, gem, halo);
    group.userData = {
      phase: Math.random() * Math.PI * 2,
      spin: 0.5 + Math.random() * 0.7,
      baseY: 0,
      color,
    };
    return group;
  }

  _spawnFlash(point) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.09, 0.115, 40),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.position.copy(point);
    this.world.add(ring);
    this.flashes.push({ mesh: ring, time: 0, life: 0.65 });
  }

  /** Places a relic where the tap ray meets a 4m sphere around the viewer. */
  place(ndcX, ndcY) {
    this.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    const point = this.raycaster.ray.at(PLACE_DISTANCE, new THREE.Vector3());
    point.y = THREE.MathUtils.clamp(point.y, -1.5, 2.5);

    const relic = this._makeRelic();
    relic.position.copy(point);
    relic.userData.baseY = point.y;
    this.world.add(relic);
    this.placed.push(relic);
    this._spawnFlash(point);
    if (this.placed.length === 1) this._fadeBeacon();
    return relic;
  }

  /** The empty-state beacon gives way to the first placed relic. */
  _fadeBeacon() {
    if (!this.centerpiece.visible) return;
    this.beaconFading = true;
    this.beaconFade = 0;
  }

  clearPlaced() {
    this.placed.forEach((relic) => {
      this.world.remove(relic);
      relic.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) node.material.dispose();
      });
    });
    this.placed = [];
    this.centerpiece.visible = true;
    this.centerpiece.scale.setScalar(1);
    this.beaconFading = false;
    this.beaconFade = 0;
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    const dt = Math.min(this.clock.getDelta(), 0.06);
    const time = this.clock.elapsedTime;

    if (this.centerpiece.visible) {
      this.centerpiece.rotation.y += dt * 0.3;
      this.centerpiece.position.y = 0.05 + Math.sin(time * 0.9) * 0.06;
      this.centerpiece.children[1].rotation.z -= dt * 0.5;
      this.centerpiece.children[2].rotation.z += dt * 0.4;

      if (this.beaconFading) {
        this.beaconFade = Math.min(1, this.beaconFade + dt / 0.45);
        this.centerpiece.scale.setScalar(Math.max(1 - this.beaconFade, 0.001));
        if (this.beaconFade >= 1) {
          this.beaconFading = false;
          this.centerpiece.visible = false;
        }
      }
    }

    this.dust.rotation.y += dt * 0.02;

    this.placed.forEach((relic) => {
      relic.position.y = relic.userData.baseY + Math.sin(time * 1.2 + relic.userData.phase) * 0.07;
      relic.children[1].rotation.y += dt * relic.userData.spin;
      relic.children[2].rotation.z += dt * 0.6;
    });

    this.flashes = this.flashes.filter((flash) => {
      flash.time += dt;
      const progress = flash.time / flash.life;
      if (progress >= 1) {
        this.world.remove(flash.mesh);
        flash.mesh.geometry.dispose();
        flash.mesh.material.dispose();
        return false;
      }
      flash.mesh.scale.setScalar(0.4 + progress * 7);
      flash.mesh.material.opacity = (1 - progress) * 0.85;
      flash.mesh.lookAt(this.camera.position);
      return true;
    });

    this.renderer.render(this.scene, this.camera);
  }
}
