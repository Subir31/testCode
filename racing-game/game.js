const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const w = canvas.width;
const h = canvas.height;

// Game constants
const roadWidth = 2000;
const segmentLength = 200;
const cameraDepth = 1 / Math.tan((90 / 2) * Math.PI / 180); // field of view
const drawDistance = 3000;
const rumbleLength = 3;
const lanes = 3;

let segments = [];
let position = 0;
let speed = 0;
let playerX = 0; // player's lateral position
let running = false;
let score = 0;

function addSegment(curve) {
  const n = segments.length;
  segments.push({
    index: n,
    p1: { world: { z: n * segmentLength, y: 0, x: 0 }, screen: {}, scale: 0 },
    p2: { world: { z: (n + 1) * segmentLength, y: 0, x: 0 }, screen: {}, scale: 0 },
    curve: curve || 0,
    color: Math.floor(n / rumbleLength) % 2 ? '#888' : '#fff'
  });
}

function buildRoad() {
  for (let i = 0; i < 500; i++) {
    const curve = Math.sin(i / 30) * 2; // gentle curves
    addSegment(curve);
  }
}

function project(p, cameraX, cameraY, cameraZ) {
  const dz = p.world.z - cameraZ;
  p.scale = cameraDepth / dz;
  p.screen.x = Math.round((1 + p.scale * (p.world.x - cameraX)) * w / 2);
  p.screen.y = Math.round((1 - p.scale * (p.world.y - cameraY)) * h / 2);
  p.screen.w = Math.round(p.scale * roadWidth * w / 2);
}

function render() {
  ctx.clearRect(0, 0, w, h);

  const baseSegment = findSegment(position);
  const baseIndex = baseSegment.index;
  const maxy = h;

  let x = 0;
  let dx = 0;

  for (let n = 0; n < 300; n++) {
    const segment = segments[(baseIndex + n) % segments.length];
    segment.looped = segment.index < baseIndex;
    segment.p1.world.z = segment.index * segmentLength - position;
    segment.p2.world.z = (segment.index + 1) * segmentLength - position;

    segment.p1.world.x = x;
    x += dx;
    dx += segment.curve;

    project(segment.p1, playerX * roadWidth, 1500, 0);
    project(segment.p2, playerX * roadWidth, 1500, 0);

    if (segment.p1.screen.y >= segment.p2.screen.y || segment.p2.screen.y >= maxy) {
      continue;
    }
    ctx.fillStyle = segment.color;
    ctx.beginPath();
    ctx.moveTo(segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y);
    ctx.lineTo(segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y);
    ctx.lineTo(segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y);
    ctx.lineTo(segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y);
    ctx.closePath();
    ctx.fill();
  }

  // draw player car
  ctx.fillStyle = 'red';
  ctx.fillRect(w / 2 - 25 + playerX * 50, h - 80, 50, 80);
}

function findSegment(z) {
  return segments[Math.floor(z / segmentLength) % segments.length];
}

function update(dt) {
  if (running) {
    position += dt * speed;
    score += dt * speed * 0.01;
    if (position >= segments.length * segmentLength) {
      position -= segments.length * segmentLength;
    }
  }
}

let lastTime = null;
function frame(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  render();
  document.getElementById('score').textContent = 'Score: ' + Math.floor(score);

  requestAnimationFrame(frame);
}

function onKeyDown(e) {
  if (e.key === 'ArrowLeft') playerX -= 0.1;
  else if (e.key === 'ArrowRight') playerX += 0.1;
  else if (e.code === 'Space') running = !running;
}

function init() {
  buildRoad();
  speed = 200;
  window.addEventListener('keydown', onKeyDown);
  requestAnimationFrame(frame);
}

init();
