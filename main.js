// --- CONFIGURATION ---
const PARTICLE_COUNT = 6000;
const PARTICLE_SIZE = 0.18;
const MORPH_SPEED = 0.12; // Kecepatan perubahan bentuk

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 35;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// --- PARTICLE SYSTEM ---
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
const colors = new Float32Array(PARTICLE_COUNT * 3);

// Inisialisasi posisi awal (Bola)
for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 50;
  targetPositions[i] = positions[i];
  colors[i] = 1;
}

geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  size: PARTICLE_SIZE,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.85,
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

// --- TEXT GENERATOR (NANDRA) ---
function generateTextPositions(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = 400;
  const height = 200;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const coords = [];

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const index = (y * width + x) * 4;
      if (data[index] > 128) {
        coords.push((x - width / 2) * 0.15, -(y - height / 2) * 0.15, 0);
      }
    }
  }
  return coords;
}

const nandraCoords = generateTextPositions("NANDRA");

// --- SHAPE GENERATORS ---
const shapes = {
  // ✊ BOLA (Sphere) - Mode Standby
  sphere: () => {
    const temp = [];
    const radius = 12;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      temp.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }
    return temp;
  },
  // 🫰 HATI (Heart)
  heart: () => {
    const temp = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      let x = 16 * Math.pow(Math.sin(t), 3);
      let y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      let z = (Math.random() - 0.5) * 4;
      x *= 0.8;
      y *= 0.8;
      temp.push(x, y, z);
    }
    return temp;
  },
  // ✌️ SIMBOL PEACE (Lambang Perdamaian)
  // (Nama internal tetap 'flower' agar logika gesture tidak perlu diubah)
  flower: () => {
    const temp = [];
    const R = 13; // Radius lingkaran
    let x, y, z;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const part = Math.random();
      const jitter = (Math.random() - 0.5) * 0.8; // Sedikit variasi ketebalan garis

      if (part < 0.5) {
        // Bagian 1: Lingkaran Luar (50% partikel)
        const theta = Math.random() * Math.PI * 2;
        x = R * Math.cos(theta);
        y = R * Math.sin(theta);
        z = jitter;
      } else if (part < 0.7) {
        // Bagian 2: Garis Vertikal Tengah (20% partikel)
        x = jitter;
        y = Math.random() * 2 * R - R; // Dari atas ke bawah
        z = jitter;
      } else if (part < 0.85) {
        // Bagian 3: Kaki Diagonal Kanan (15% partikel)
        const t = Math.random(); // interpolasi 0 ke 1
        x = t * (R * 0.707); // cos(45deg)
        y = t * (-R * 0.707); // sin(45deg) ke bawah
        z = jitter;
      } else {
        // Bagian 4: Kaki Diagonal Kiri (15% partikel)
        const t = Math.random();
        x = t * (-R * 0.707);
        y = t * (-R * 0.707);
        z = jitter;
      }
      temp.push(x, y, z);
    }
    return temp;
  },
  // 🖐️ TEKS "NANDRA"
  nandra: () => {
    const temp = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const coordIndex = (i % (nandraCoords.length / 3)) * 3;
      temp.push(
        nandraCoords[coordIndex],
        nandraCoords[coordIndex + 1],
        nandraCoords[coordIndex + 2] + (Math.random() - 0.5) * 2
      );
    }
    return temp;
  },
};

let currentShapeName = "sphere";
let isChangingShape = false;

function changeShapeTo(shapeName) {
  if (currentShapeName === shapeName) return;
  currentShapeName = shapeName;
  isChangingShape = true;
  particles.material.color.setHex(0xffffff); // Efek Kilatan
  setTimeout(() => {
    isChangingShape = false;
  }, 250);

  const newPositions = shapes[shapeName]();
  for (let i = 0; i < newPositions.length; i++) {
    targetPositions[i] = newPositions[i];
  }
}
changeShapeTo("sphere");

// --- INTERACTION VARIABLES ---
let targetHandX = 0,
  currentHandX = 0;
let targetHandY = 0,
  currentHandY = 0;
let targetPinch = 0,
  currentPinch = 0;
let lastGestureTime = 0;

// --- MEDIAPIPE LOGIC ---
const videoElement = document.getElementById("input-video");

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const now = Date.now();

    // 1. Posisi Tangan
    targetHandX = (0.5 - landmarks[9].x) * 30;
    targetHandY = (0.5 - landmarks[9].y) * 30;

    // 2. Jarak Pinch
    const pinchDist = Math.sqrt(
      Math.pow(landmarks[4].x - landmarks[8].x, 2) +
        Math.pow(landmarks[4].y - landmarks[8].y, 2)
    );
    targetPinch = Math.max(0, (pinchDist - 0.04) * 15);

    // 3. Status Jari (Lurus/Tekuk)
    const wrist = landmarks[0];
    const distToWrist = (idx) =>
      Math.sqrt(
        Math.pow(landmarks[idx].x - wrist.x, 2) +
          Math.pow(landmarks[idx].y - wrist.y, 2)
      );
    const iOpen = distToWrist(8) > 0.35;
    const mOpen = distToWrist(12) > 0.35;
    const rOpen = distToWrist(16) > 0.35;
    const pOpen = distToWrist(20) > 0.35;

    if (now - lastGestureTime > 300) {
      // 🫰 FINGER HEART = HATI
      if (pinchDist < 0.05) {
        changeShapeTo("heart");
        lastGestureTime = now;
      }
      // 🖐️ BUKA 5 JARI = TEKS "NANDRA"
      else if (iOpen && mOpen && rOpen && pOpen && pinchDist > 0.1) {
        changeShapeTo("nandra");
        lastGestureTime = now;
      }
      // ✌️ PEACE = SIMBOL PEACE (Internal name: 'flower')
      else if (iOpen && mOpen && !rOpen && !pOpen && pinchDist > 0.05) {
        changeShapeTo("flower");
        lastGestureTime = now;
      }
      // ✊ IDLE = BOLA
      else if (!iOpen && !mOpen && !rOpen && !pOpen) {
        changeShapeTo("sphere");
        lastGestureTime = now;
      }
    }
  } else {
    targetHandX = 0;
    targetHandY = 0;
    targetPinch = 0;
  }
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});
hands.onResults(onResults);

const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
cameraUtils.start();

// --- ANIMATION LOOP ---
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function animate() {
  requestAnimationFrame(animate);
  currentHandX = lerp(currentHandX, targetHandX, 0.15);
  currentHandY = lerp(currentHandY, targetHandY, 0.15);
  currentPinch = lerp(currentPinch, targetPinch, 0.15);

  const positionsAttribute = geometry.attributes.position;

  if (!isChangingShape) {
    const hue = (currentHandX + 15) / 30;
    particles.material.color.lerp(
      new THREE.Color().setHSL(Math.abs(hue % 1), 1.0, 0.6),
      0.08
    );
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const ix = i * 3;
    const iy = i * 3 + 1;
    const iz = i * 3 + 2;
    // Efek detak hanya signifikan saat mode Hati
    const explosionFactor =
      currentShapeName === "heart"
        ? 1 + currentPinch * 1.5
        : 1 + currentPinch * 0.2;

    positionsAttribute.array[ix] +=
      (targetPositions[ix] * explosionFactor - positionsAttribute.array[ix]) *
      MORPH_SPEED;
    positionsAttribute.array[iy] +=
      (targetPositions[iy] * explosionFactor - positionsAttribute.array[iy]) *
      MORPH_SPEED;
    positionsAttribute.array[iz] +=
      (targetPositions[iz] * explosionFactor - positionsAttribute.array[iz]) *
      MORPH_SPEED;
  }

  particles.rotation.y += 0.002;
  particles.rotation.x = currentHandY * 0.05;
  particles.rotation.y += currentHandX * 0.01;

  positionsAttribute.needsUpdate = true;
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
