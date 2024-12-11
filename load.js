import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class SceneManager {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.outdoorCamera = null;
    this.indoorCamera = null;
    this.currentCamera = null;
    this.controls = null;
    this.sunLight = null;
    this.spotLight1 = null;
    this.isMouseDown = false;
    this.previousMousePosition = { x: 0, y: 0 };

    this.init();
  }

  init() {
    this.initRenderer();
    this.initCameras();
    this.initControls();
    this.setupScene();
    this.setupLighting();
    this.setupEventListeners();
    this.loadModel();
    this.updateLighting("pagi");
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xf4e3c1); // Default warm siang color
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
  }

  initCameras() {
    this.outdoorCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    this.indoorCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Outdoor camera position
    this.outdoorCamera.position.set(10, 10, 20);
    // Indoor camera position (looking out from inside the house)
    this.indoorCamera.position.set(0, 3, 3);
    this.indoorCamera.rotation.set(0, Math.PI, 0);

    this.currentCamera = this.outdoorCamera; // Start with outdoor camera
  }

  initControls() {
    this.controls = new OrbitControls(this.currentCamera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;
    this.controls.minPolarAngle = 0.5;
    this.controls.maxPolarAngle = 1.5;
    this.controls.autoRotate = false;
    this.controls.target = new THREE.Vector3(0, 1, 0);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xf4e3c1, 50, 1000);
    this.setupGround();
  }

  setupGround() {
    const textureLoader = new THREE.TextureLoader();
    const groundTexture = textureLoader.load("texture/grass2.jpg");
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(200, 200);

    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      side: THREE.DoubleSide,
    });

    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    groundGeometry.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xfdfbd3, 1);
    this.scene.add(this.ambientLight);

    const spotLight = new THREE.SpotLight(0xffddaa, 1.5, 100, Math.PI / 4, 1);
    spotLight.position.set(10, 20, 10);
    spotLight.castShadow = true;
    this.scene.add(spotLight);
  }

  setupEventListeners() {
    window.addEventListener("resize", this.onWindowResize.bind(this));
    document.getElementById("pov-indoor").addEventListener("click", this.togglePOV.bind(this));
    document.getElementById("pov-outdoor").addEventListener("click", this.togglePOV.bind(this));
    document.getElementById("toggle-time").addEventListener("change", this.onTimeChange.bind(this));

    this.setupIndoorCameraControls();
  }

  onWindowResize() {
    this.outdoorCamera.aspect = window.innerWidth / window.innerHeight;
    this.indoorCamera.aspect = window.innerWidth / window.innerHeight;
    this.outdoorCamera.updateProjectionMatrix();
    this.indoorCamera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  togglePOV() {
    if (this.currentCamera === this.outdoorCamera) {
      this.currentCamera = this.indoorCamera;
      this.controls.enabled = false; // Disable OrbitControls for first-person
    } else {
      this.currentCamera = this.outdoorCamera;
      this.controls.enabled = true; // Re-enable OrbitControls for outdoor view
    }
    this.controls.object = this.currentCamera; // Switch the control to the new camera
  }

  setupIndoorCameraControls() {
    const domElement = this.renderer.domElement;

    domElement.addEventListener("mousedown", this.onMouseDown.bind(this));
    domElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    domElement.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  onMouseDown(e) {
    if (this.currentCamera === this.indoorCamera) {
      this.isMouseDown = true;
      this.previousMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };
    }
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  onMouseMove(e) {
    if (this.isMouseDown && this.currentCamera === this.indoorCamera) {
      const movementX = e.clientX - this.previousMousePosition.x;
      const movementY = e.clientY - this.previousMousePosition.y;
      this.previousMousePosition = {
        x: e.clientX,
        y: e.clientY,
      };

      const sensitivity = 0.002;
      this.indoorCamera.rotation.y -= movementX * sensitivity;
      this.indoorCamera.rotation.x -= movementY * sensitivity;
    }
  }

  onKeyDown(e) {
    if (this.currentCamera === this.indoorCamera) {
      const moveSpeed = 0.1;

      const matrix = new THREE.Matrix4();
      matrix.extractRotation(this.indoorCamera.matrix);

      switch (e.key) {
        case "w":
          this.indoorCamera.translateZ(-moveSpeed);
          break;
        case "s":
          this.indoorCamera.translateZ(moveSpeed);
          break;
        case "a":
          this.indoorCamera.translateX(-moveSpeed);
          break;
        case "d":
          this.indoorCamera.translateX(moveSpeed);
          break;
        case " ":
          this.indoorCamera.position.y += moveSpeed;
          break;
        case "Shift":
          this.indoorCamera.position.y -= moveSpeed;
          break;
      }
    }
  }

  loadModel() {
    const loader = new GLTFLoader().setPath("models/");
    loader.load(
      "joloponggg.glb",
      (gltf) => {
        const mesh = gltf.scene;
        mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              child.material.roughness = 1;
              child.material.metalness = 0;
            }
          }
        });

        mesh.position.set(0, 0.2, -1);
        this.scene.add(mesh);
        document.getElementById("progress-container").style.display = "none";
      },
      (xhr) => {
        document.getElementById("progress").innerHTML = `LOADING ${(xhr.loaded / xhr.total) * 100}%`;
      }
    );
  }

  onTimeChange(e) {
    const selectedTime = e.target.value;
    this.updateLighting(selectedTime);
  }

  updateLighting(time) {
    this.resetLights();

    switch (time) {
      case "pagi":
        this.setupMorningLighting();
        break;
      case "siang":
        this.setupNoonLighting();
        break;
      case "sore":
        this.setupEveningLighting();
        break;
      case "malam":
        this.setupNightLighting();
        break;
    }
  }

  resetLights() {
    if (this.spotLight1) this.spotLight1.visible = false;
    if (this.sunLight) this.sunLight.visible = false;
  }

  setupMorningLighting() {
    // Pagi
    this.renderer.setClearColor(0x9c4c12);
    this.createSkyGradient(0xffda97, 0x82ebe0);
    this.ambientLight.color.set(0xffb58c);
    this.ambientLight.intensity = 0.1;

    if (!this.sunLight) {
      this.sunLight = new THREE.DirectionalLight(0xffddaa, 10);
      this.sunLight.position.set(50, 200, -200);
      this.sunLight.target.position.set(0, 0, 0);
      this.sunLight.castShadow = true;
      this.scene.add(this.sunLight);
    }
    this.sunLight.visible = true;
    this.sunLight.intensity = 0.7;
    this.sunLight.shadow.bias = -0.0001;
  }

  setupNoonLighting() {
    // Siang
    this.renderer.setClearColor(0xf4e3c1);
    this.createSkyGradient(0x87ceeb, 0xffffff);
    this.ambientLight.color.set(0xfdfbd3);
    this.ambientLight.intensity = 1;

    if (!this.sunLight) {
      this.sunLight = new THREE.DirectionalLight(0xffddaa, 10);
      this.sunLight.position.set(50, 20, -200);
      this.sunLight.target.position.set(0, 0, 0);
      this.sunLight.castShadow = true;
      this.scene.add(this.sunLight);
    }
    this.sunLight.visible = true;
    this.sunLight.intensity = 0.7;
    this.sunLight.shadow.bias = -0.0001;
  }

  setupEveningLighting() {
    // Sore
    this.renderer.setClearColor(0xf4e3c1);
    this.createSkyGradient(0x82ebe0,0xffda97);
    this.ambientLight.color.set(0xfdfbd3);
    this.ambientLight.intensity = 0.5;

    // Spot light untuk sinar matahari di langit
    if (!this.sunLight) {
      this.sunLight = new THREE.DirectionalLight(0xffddaa, 10);
      this.sunLight.position.set(50, 20, -200);
      this.sunLight.target.position.set(0, 0, 0);
      this.sunLight.castShadow = true;
      this.scene.add(this.sunLight);
    }
    this.sunLight.visible = true;
    this.sunLight.intensity = 0.7;
    this.sunLight.shadow.bias = -0.0001;
  }

  setupNightLighting() {
    // Malam
    this.renderer.setClearColor(0x0c1446);
    this.createSkyGradient(0x0c1446, 0x0c1446);
    this.ambientLight.color.set(0x0c1446);
    this.ambientLight.intensity = 0.1;

    if (!this.spotLight1) {
      this.spotLight1 = new THREE.SpotLight(0xffffff, 0.5, 100, Math.PI / 4, 1);
      this.spotLight1.position.set(50, 20, 200);
      this.spotLight1.castShadow = true;
      this.scene.add(this.spotLight1);
    }
    this.spotLight1.visible = true;
  }

  createSkyGradient(colorTop, colorBottom) {
    if (this.sky) {
      this.scene.remove(this.sky);
    }

    const skyGeometry = new THREE.SphereGeometry(1000, 5, 5);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        colorTop: { value: new THREE.Color(colorTop) },
        colorBottom: { value: new THREE.Color(colorBottom) },
      },
      vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
      fragmentShader: `
          uniform vec3 colorTop;
          uniform vec3 colorBottom;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            gl_FragColor = vec4(mix(colorBottom, colorTop, max(h, 0.0)), 1.0);
          }
        `,
      side: THREE.BackSide,
    });

    // Create the sky mesh
    this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.sky);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    if (this.controls.enabled) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.currentCamera);
  }

  start() {
    this.createSkyGradient(0xffcc88, 0xfde3aa);
    this.updateLighting("pagi");
    this.animate();
  }
}

// Initialize the scene
const sceneManager = new SceneManager();
sceneManager.start();
