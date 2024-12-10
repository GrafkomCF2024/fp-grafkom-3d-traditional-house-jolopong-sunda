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
controls.minDistance = 5;
controls.maxDistance = 40;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

// Ground
// Load Ground Texture
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load("texture/grass2.jpg"); // Gunakan gambar seamless
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(200, 200); // Perbesar skala tekstur untuk efek infinity

const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture,
  side: THREE.DoubleSide,
});

const groundGeometry = new THREE.PlaneGeometry(2000, 2000); // Perluas geometri plane
groundGeometry.rotateX(-Math.PI / 2); // Rotasi agar sejajar dengan lantai
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

// Add Fog for Infinity Effect
scene.fog = new THREE.Fog(0xf4e3c1, 50, 1000); // Warna sesuai waktu siang, dan jarak untuk kabut

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

        if (child.material) {
          child.material.roughness = 1; // Material kasar
          child.material.metalness = 0; // Non-logam
        }
      }
    });

    mesh.position.set(0, 0.2, -1);
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

// Tambahkan variabel untuk highlight malam dan matahari
let spotLight1 = null;
let sun = null;
let sunLight = null; // Cahaya dari matahari
// Update Lighting
function updateLighting(time) {
  if (spotLight1) spotLight1.visible = false;
  if (sun) sun.visible = false;
  if (sunLight) sunLight.visible = false;

  switch (time) {
    case "pagi":
      renderer.setClearColor(0x9C4C12); // Warna latar belakang lebih gelap sedikit
      createSkyGradient(0xffcc88, 0xffc8a2); // Gradasi lebih gelap
      ambientLight.color.set(0xffb58c); // Ambient lebih gelap, warna kuning lembut
      ambientLight.intensity = 0.1;

      // Matahari lebih terang (lebih kuat sinarnya)
      if (!sun) {
        createSun();
      }
      sun.position.set(50, 20, 200); // Posisi matahari tetap
      sun.visible = true;

      // Paralel light searah dengan matahari dari arah timur (pagi)
      if (!sunLight) {
        sunLight = new THREE.DirectionalLight(0xffddaa, 10);
        sunLight.position.set(50, 200, -200); // Cahaya datang dari arah timur (pagi)
        sunLight.target.position.set(0, 0, 0); // Fokus ke pusat
        sunLight.castShadow = true;
        scene.add(sunLight);
      }
      sunLight.visible = true;
      sunLight.intensity = 0.7; // Terang, tapi tidak terlalu terang
      sunLight.shadow.bias = -0.0001;
      break;

    case "siang":
      renderer.setClearColor(0xb0e0e6); // Langit biru cerah
      createSkyGradient(0xb0e0e6, 0xf4e3c1); // Gradasi biru ke putih
      ambientLight.color.set(0xfdfbd3);
      ambientLight.intensity = 1.2;

      // Matahari di siang hari lebih tinggi
      if (!sun) {
        createSun();
      }
      sun.position.set(0, 200, 0);
      sun.visible = true;

      // Paralel light searah dengan matahari dari atas (siang)
      if (!sunLight) {
        sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(0, 200, 0); // Cahaya datang dari atas
        sunLight.target.position.set(0, 0, 0); // Fokus ke pusat
        sunLight.castShadow = true;
        scene.add(sunLight);
      }
      sunLight.visible = true;
      sunLight.intensity = 1; // Terang, cahaya tetap jelas
      sunLight.shadow.bias = -0.0001;
      break;

    case "sore":
      renderer.setClearColor(0xff9966); // Gradasi sore jingga
      createSkyGradient(0x2b1b17, 0xff9966); // Gradasi sore ke hitam
      ambientLight.color.set(0xffb86c);
      ambientLight.intensity = 0.6;

      // Matahari rendah di sore hari
      if (!sun) {
        createSun();
      }
      sun.position.set(-200, 30, -100); // Matahari rendah di belakang
      sun.visible = true;

      // Paralel light searah dengan matahari dari barat (sore)
      if (!sunLight) {
        sunLight = new THREE.DirectionalLight(0xff9966, 1.0);
        sunLight.position.set(-200, 30, -100); // Cahaya datang dari arah barat
        sunLight.target.position.set(0, 0, 0); // Fokus ke pusat
        sunLight.castShadow = true;
        scene.add(sunLight);
      }
      sunLight.visible = true;
      sunLight.intensity = 0.5; // Cahayanya lebih lembut sore
      sunLight.shadow.bias = -0.0001;
      break;

    case "malam":
      renderer.setClearColor(0x1a1a3d); // Langit malam biru tua
      createSkyGradient(0x000033, 0x1a1a3d); // Langit malam
      ambientLight.color.set(0x404066);
      ambientLight.intensity = 0.5;

      // Spotlight untuk pencahayaan malam tetap sama
      if (!spotLight1) {
        spotLight1 = new THREE.SpotLight(0xffff00, 0.3, 100, Math.PI / 4, 1);
        spotLight1.position.set(0, 30, 5); // Menambahkan spotlight di posisi malam
        spotLight1.castShadow = true;
        scene.add(spotLight1);
      }
      spotLight1.visible = true;
      break;
  }
}



// Tambahkan matahari (di awal)
function createSun() {
  const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(100, 20, 200); // Lebih rendah di ufuk timur

  scene.add(sun);
}

// Panggil createSun() saat inisialisasi
createSun();

// Toggle waktu pagi, siang, sore, malam
document.getElementById("toggle-time").addEventListener("change", (e) => {
  const selectedTime = e.target.value;
  updateLighting(selectedTime);
});


function createSkyGradient(colorTop, colorBottom) {
  const skyGeo = new THREE.SphereGeometry(500, 32, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(colorTop) },
      bottomColor: { value: new THREE.Color(colorBottom) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
  });

  const sky = new THREE.Mesh(skyGeo, skyMaterial);
  scene.add(sky);
}

function init() {
  // Inisialisasi lainnya
  createSkyGradient(0xffcc88, 0xfde3aa); // Default: gradasi pagi
  updateLighting("pagi"); // Atur posisi matahari, cahaya, dan langit ke pagi
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
