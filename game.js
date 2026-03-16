const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 540;
const GRAVITY = 0.65;
const MOVE_ACCEL = 0.75;
const MAX_SPEED_X = 7;
const GROUND_FRICTION = 0.78;
const AIR_FRICTION = 0.94;
const JUMP_VELOCITY = -14;

const keys = new Set();

const player = {
  x: 80,
  y: 0,
  width: 34,
  height: 52,
  vx: 0,
  vy: 0,
  grounded: false,
};

const goal = { x: 3020, y: 220, width: 36, height: 100 };

const platforms = [
  { x: 0, y: 500, width: 460, height: 40 },
  { x: 540, y: 450, width: 160, height: 30 },
  { x: 770, y: 390, width: 180, height: 30 },
  { x: 1060, y: 330, width: 160, height: 30 },
  { x: 1300, y: 430, width: 200, height: 30 },
  { x: 1590, y: 370, width: 230, height: 30 },
  { x: 1900, y: 300, width: 120, height: 30 },
  { x: 2070, y: 360, width: 210, height: 30 },
  { x: 2360, y: 290, width: 140, height: 30 },
  { x: 2580, y: 240, width: 130, height: 30 },
  { x: 2790, y: 300, width: 260, height: 30 },
  { x: 3000, y: 320, width: 200, height: 220 },
];

function resetGame(message = "도착 지점까지 이동해 보세요!") {
  player.x = 80;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  statusEl.textContent = message;
}

function isPressed(...codes) {
  return codes.some((code) => keys.has(code));
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updatePlayer() {
  const left = isPressed("ArrowLeft", "KeyA");
  const right = isPressed("ArrowRight", "KeyD");

  if (left && !right) player.vx -= MOVE_ACCEL;
  if (right && !left) player.vx += MOVE_ACCEL;

  player.vx = Math.max(-MAX_SPEED_X, Math.min(MAX_SPEED_X, player.vx));
  player.vx *= player.grounded ? GROUND_FRICTION : AIR_FRICTION;

  if (isPressed("Space", "ArrowUp", "KeyW") && player.grounded) {
    player.vy = JUMP_VELOCITY;
    player.grounded = false;
  }

  player.vy += GRAVITY;

  player.x += player.vx;
  player.y += player.vy;

  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));

  player.grounded = false;

  for (const platform of platforms) {
    if (!intersects(player, platform)) continue;

    const prevBottom = player.y + player.height - player.vy;
    const prevTop = player.y - player.vy;
    const prevRight = player.x + player.width - player.vx;
    const prevLeft = player.x - player.vx;

    if (prevBottom <= platform.y) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
    } else if (prevTop >= platform.y + platform.height) {
      player.y = platform.y + platform.height;
      player.vy = 0;
    } else if (prevRight <= platform.x) {
      player.x = platform.x - player.width;
      player.vx = 0;
    } else if (prevLeft >= platform.x + platform.width) {
      player.x = platform.x + platform.width;
      player.vx = 0;
    }
  }

  if (player.y > WORLD_HEIGHT + 250) {
    resetGame("아래로 떨어졌어요! 다시 도전하세요.");
  }

  if (intersects(player, goal)) {
    statusEl.textContent = "🏁 클리어! R 키로 다시 시작하세요.";
  }
}

function drawBackground(cameraX) {
  ctx.fillStyle = "#d1efff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#8ed0ff";
  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 300 - cameraX * 0.25) % (canvas.width + 350)) - 120;
    const y = 65 + (i % 3) * 35;
    ctx.beginPath();
    ctx.arc(x, y, 28, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(x + 35, y - 18, 32, Math.PI, Math.PI * 1.85);
    ctx.arc(x + 75, y, 30, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#90b072";
  ctx.fillRect(0, 508, canvas.width, 32);
}

function drawWorld(cameraX) {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const platform of platforms) {
    ctx.fillStyle = "#354b5e";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#4e6d86";
    ctx.fillRect(platform.x + 4, platform.y + 4, platform.width - 8, 8);
  }

  ctx.fillStyle = "#ffcf4d";
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
  ctx.fillStyle = "#1f2a44";
  ctx.fillRect(goal.x + 10, goal.y + 14, 16, 10);

  ctx.fillStyle = "#ff5f6d";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#25304b";
  ctx.fillRect(player.x + 7, player.y + 10, 20, 8);

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(12, 12, 230, 66);
  ctx.fillStyle = "#fff";
  ctx.font = "16px Pretendard, sans-serif";
  ctx.fillText("끝 지점(깃발)에 닿으면 클리어", 22, 38);
  ctx.fillText("떨어지면 시작점으로 리셋", 22, 62);
}

function gameLoop() {
  updatePlayer();

  const cameraX = Math.max(
    0,
    Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width * 0.4),
  );

  drawBackground(cameraX);
  drawWorld(cameraX);
  drawHud();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === "KeyR") {
    resetGame("다시 시작합니다. 화이팅!");
    return;
  }
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

resetGame();
requestAnimationFrame(gameLoop);
