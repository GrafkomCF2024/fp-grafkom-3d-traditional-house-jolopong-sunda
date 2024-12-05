import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xf4e3c1); // Default warm siang
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Scene and Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(10, 10, 20);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 40;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

// Ground
const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

// Lighting
const ambientLight = new THREE.AmbientLight(0xfdfbd3, 1); // Default siang warm
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffddaa, 1.5, 100, Math.PI / 4, 1);
spotLight.position.set(10, 20, 10);
spotLight.castShadow = true;
scene.add(spotLight);

// Load Model
const loader = new GLTFLoader().setPath("models/");
loader.load(
  "joloponggg.glb",
  (gltf) => {
    const mesh = gltf.scene;
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    mesh.position.set(0, 1.05, -1);
    scene.add(mesh);
    document.getElementById("progress-container").style.display = "none";
  },
  (xhr) => {
    document.getElementById("progress").innerHTML = `LOADING ${(xhr.loaded / xhr.total) * 100}%`;
  }
);

// Adjust on Window Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Update lighting based on time
function updateLighting(time) {
  switch (time) {
    case "siang":
      renderer.setClearColor(0xf4e3c1); // Warm siang
      ambientLight.color.set(0xfdfbd3); // Cahaya kuning lembut
      ambientLight.intensity = 1.2;
      spotLight.color.set(0xffddaa);
      spotLight.intensity = 1.5;
      break;

    case "sore":
      renderer.setClearColor(0xffcc99); // Jingga lembut
      ambientLight.color.set(0xffb86c); // Cahaya jingga
      ambientLight.intensity = 0.9;
      spotLight.color.set(0xff9966);
      spotLight.intensity = 1.2;
      break;

    case "malam":
      renderer.setClearColor(0x1a1a3d); // Biru tua gelap
      ambientLight.color.set(0x404066); // Cahaya biru lembut
      ambientLight.intensity = 0.5;
      spotLight.color.set(0x333366);
      spotLight.intensity = 0.8;
      break;
  }
}

// Toggle waktu siang, sore, malam
document.getElementById("toggle-time").addEventListener("change", (e) => {
  const selectedTime = e.target.value;
  updateLighting(selectedTime);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
