import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, particles, composer, controls;
let time = 0;
let isAnimationEnabled = true;
let currentTheme = 'pastelRose';
let morphTarget = 1;
let morphProgress = 0;
const mPhaseSpeed = 0.002;
const heartPhaseSpeed = 0.04;

const particleCount = 10000;

const themes = {
pastelRose: {
name: 'Pastel Rose',
colors: [
new THREE.Color(0xffb6c1),
new THREE.Color(0xff69b4),
new THREE.Color(0xff1493),
new THREE.Color(0xdb7093),
new THREE.Color(0xffc0cb)
],
bloom: { strength: 0.4, radius: 0.5, threshold: 0.7 }
},
dreamyPink: {
name: 'Dreamy Pink',
colors: [
new THREE.Color(0xff9ecd),
new THREE.Color(0xff77a9),
new THREE.Color(0xff4da6),
new THREE.Color(0xfda4b8),
new THREE.Color(0xffcde6)
],
bloom: { strength: 0.45, radius: 0.55, threshold: 0.65 }
},
neonRose: {
name: 'Neon Rose',
colors: [
new THREE.Color(0xff007f),
new THREE.Color(0xff3399),
new THREE.Color(0xff66cc),
new THREE.Color(0xff99cc),
new THREE.Color(0xff1a8c)
],
bloom: { strength: 0.5, radius: 0.45, threshold: 0.6 }
}
};

document.addEventListener('DOMContentLoaded', init);

function createHeartPath(particleIndex, totalParticles) {
const t = (particleIndex / totalParticles) * Math.PI * 2;
const scale = 2.2;
let x = 16 * Math.pow(Math.sin(t), 3);
let y =
13 * Math.cos(t) -
5 * Math.cos(2 * t) -
2 * Math.cos(3 * t) -
Math.cos(4 * t);
const finalX = x * scale;
const finalY = y * scale;
const z = Math.sin(t * 4) * 2;
const jitterStrength = 0.2;
return new THREE.Vector3(
finalX + (Math.random() - 0.5) * jitterStrength,
finalY + (Math.random() - 0.5) * jitterStrength,
z + (Math.random() - 0.5) * jitterStrength * 0.5
);
}

function createMPath(particleIndex, totalParticles) {
// quantas partículas por traço (garantindo inteiro)
const particlesPerStroke = Math.floor(totalParticles / 4);
// qual posição dentro do traço atual (0 .. particlesPerStroke-1)
const strokeIndex = Math.min(3, Math.floor(particleIndex / particlesPerStroke));
const i = particleIndex - strokeIndex * particlesPerStroke;
const t = i / Math.max(1, particlesPerStroke - 1); // 0..1
const scale = 6;
const width = 12;
const height = 16;

let x = 0, y = 0;

if (strokeIndex === 0) {
// bottom-left -> top-left
x = -width / 2;
y = -height / 2 + t * height;
} else if (strokeIndex === 1) {

x = -width / 2 + t * (width / 2);  
y = height / 2 - t * height;

} else if (strokeIndex === 2) {

x = 0 + t * (width / 2);  
y = -height / 2 + t * height;

} else {

x = width / 2;  
y = height / 2 - t * height;

}

const jitter = 0.3;
return new THREE.Vector3(
x * scale + (Math.random() - 0.5) * jitter,
y * scale + (Math.random() - 0.5) * jitter,
(Math.random() - 0.5) * jitter
);
}

function init() {
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1500);
camera.position.z = 90;

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('container').appendChild(renderer.domElement);

controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.rotateSpeed = 0.3;
controls.minDistance = 30;
controls.maxDistance = 300;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.15;

composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());
scene.userData.bloomPass = bloomPass;

createParticleSystem();
window.addEventListener('resize', onWindowResize);

setTheme(currentTheme);
startThemeCycle();
animate();
}

function createParticleSystem() {
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);
const heartPositions = new Float32Array(particleCount * 3);
const mPositions = new Float32Array(particleCount * 3);
const disintegrationOffsets = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
const i3 = i * 3;
const heartPos = createHeartPath(i, particleCount);
const mPos = createMPath(i, particleCount);

positions[i3] = (Math.random() - 0.5) * 300;  
positions[i3 + 1] = (Math.random() - 0.5) * 300;  
positions[i3 + 2] = (Math.random() - 0.5) * 300;  

heartPositions[i3] = heartPos.x;  
heartPositions[i3 + 1] = heartPos.y;  
heartPositions[i3 + 2] = heartPos.z;  

mPositions[i3] = mPos.x;  
mPositions[i3 + 1] = mPos.y;  
mPositions[i3 + 2] = mPos.z;  

const { color, size } = getAttributesForParticle(i);  
colors[i3] = color.r;  
colors[i3 + 1] = color.g;  
colors[i3 + 2] = color.b;  
sizes[i] = size;  

const offsetStrength = 40 + Math.random() * 50;  
const phi = Math.random() * Math.PI * 2;  
const theta = Math.acos(2 * Math.random() - 1);  
disintegrationOffsets[i3] = Math.sin(theta) * Math.cos(phi) * offsetStrength;  
disintegrationOffsets[i3 + 1] = Math.sin(theta) * Math.sin(phi) * offsetStrength;  
disintegrationOffsets[i3 + 2] = Math.cos(theta) * offsetStrength;

}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute('heartPosition', new THREE.BufferAttribute(heartPositions, 3));
geometry.setAttribute('mPosition', new THREE.BufferAttribute(mPositions, 3));
geometry.setAttribute('disintegrationOffset', new THREE.BufferAttribute(disintegrationOffsets, 3));

const texture = createParticleTexture();
const material = new THREE.PointsMaterial({
size: 2.8,
map: texture,
vertexColors: true,
transparent: true,
blending: THREE.AdditiveBlending,
depthWrite: false,
sizeAttenuation: true,
alphaTest: 0.01
});

particles = new THREE.Points(geometry, material);
scene.add(particles);
}

function getAttributesForParticle(i) {
const t = i / particleCount;
const colorPalette = themes[currentTheme].colors;
const colorProgress = (t * colorPalette.length * 1.5 + time * 0.05) % colorPalette.length;
const colorIndex1 = Math.floor(colorProgress);
const colorIndex2 = (colorIndex1 + 1) % colorPalette.length;
const blendFactor = colorProgress - colorIndex1;
const color1 = colorPalette[colorIndex1];
const color2 = colorPalette[colorIndex2];
const baseColor = new THREE.Color().lerpColors(color1, color2, blendFactor);
const color = baseColor.clone().multiplyScalar(0.65 + Math.random() * 0.55);
const size = 0.65 + Math.random() * 0.6;
return { color, size };
}

function createParticleTexture() {
const canvas = document.createElement('canvas');
const size = 64;
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d');
const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
gradient.addColorStop(0, 'rgba(255,255,255,1)');
gradient.addColorStop(0.2, 'rgba(255,220,240,0.9)');
gradient.addColorStop(0.6, 'rgba(255,150,200,0.4)');
gradient.addColorStop(1, 'rgba(255,100,180,0)');
ctx.fillStyle = gradient;
ctx.beginPath();
ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
ctx.fill();
const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;
return texture;
}

function animateParticles() {
if (!particles || !isAnimationEnabled) return;

const positions = particles.geometry.attributes.position.array;
const heartPositions = particles.geometry.attributes.heartPosition.array;
const mPositions = particles.geometry.attributes.mPosition.array;
const disintegrationOffsets = particles.geometry.attributes.disintegrationOffset.array;
const particleColors = particles.geometry.attributes.color.array;
const particleSizes = particles.geometry.attributes.size.array;

if (morphProgress < 0.3) {
// fase do M: devagar
morphProgress += (0.7 - morphProgress) * 0.005; // M dura mais
} else {
// fase do coração: rápido
morphProgress += (1 - morphProgress) * 0.04; // coração se forma rápido
}
for (let i = 0; i < particleCount; i++) {
const i3 = i * 3;
const iSize = i;

const homeX = heartPositions[i3];  
const homeY = heartPositions[i3 + 1];  
const homeZ = heartPositions[i3 + 2];  

const mX = mPositions[i3];  
const mY = mPositions[i3 + 1];  
const mZ = mPositions[i3 + 2];  

const disintegrationAmount = 1 - morphProgress;  
const blend = Math.pow(morphProgress, 1.5);  

const currentTargetX = THREE.MathUtils.lerp(mX, homeX, blend);  
const currentTargetY = THREE.MathUtils.lerp(mY, homeY, blend);  
const currentTargetZ = THREE.MathUtils.lerp(mZ, homeZ, blend);  

let currentLerpFactor = 0.04 + (1 - blend) * 0.01;  

positions[i3] += (currentTargetX - positions[i3]) * currentLerpFactor;  
positions[i3 + 1] += (currentTargetY - positions[i3 + 1]) * currentLerpFactor;  
positions[i3 + 2] += (currentTargetZ - positions[i3 + 2]) * currentLerpFactor;  

const { color: baseColor, size: baseSize } = getAttributesForParticle(i);  

let brightness = (0.65 + Math.sin((i / particleCount) * Math.PI * 7 + time * 1.3) * 0.35) * (1 - disintegrationAmount * 0.75);  
brightness *= 0.85 + Math.sin(time * 7 + i * 0.5) * 0.15;  

particleColors[i3] = baseColor.r * brightness;  
particleColors[i3 + 1] = baseColor.g * brightness;  
particleColors[i3 + 2] = baseColor.b * brightness;  

let size = baseSize * (1 - disintegrationAmount * 0.9);  
size *= 0.8 + Math.sin(time * 5 + i * 0.3) * 0.2;  
particleSizes[iSize] = Math.max(0.05, size);

}

particles.geometry.attributes.position.needsUpdate = true;
particles.geometry.attributes.color.needsUpdate = true;
particles.geometry.attributes.size.needsUpdate = true;
}

function startThemeCycle() {
const themeKeys = Object.keys(themes);
let index = 0;
setInterval(() => {
index = (index + 1) % themeKeys.length;
setTheme(themeKeys[index]);
}, 5000);
}

function setTheme(themeName) {
if (!themes[themeName]) return;
currentTheme = themeName;
const theme = themes[currentTheme];
const bloomPass = scene.userData.bloomPass;
if (bloomPass) {
bloomPass.strength = theme.bloom.strength;
bloomPass.radius = theme.bloom.radius;
bloomPass.threshold = theme.bloom.threshold;
}
}

function onWindowResize() {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
requestAnimationFrame(animate);
time += 0.02;
controls.update();
if (isAnimationEnabled) animateParticles();
composer.render();
}

setTimeout(() => {
  window.location.href = "Heart.html"; 
}, 12000); 