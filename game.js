const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const WORLD_HEIGHT = 540;
const START_X = 80;
const START_Y = 300;
const GRAVITY = 0.65;
const MOVE_ACCEL = 0.75;
const MAX_SPEED_X = 7;
const GROUND_FRICTION = 0.78;
const AIR_FRICTION = 0.94;
const BASE_JUMP_VELOCITY = -14;
const MAX_STAGE = 6;

const keys = new Set();

const player = {
  x: START_X,
  y: START_Y,
  width: 34,
  height: 52,
  vx: 0,
  vy: 0,
  grounded: false,
};

let currentStage = 1;
let worldWidth = 3200;
let jumpVelocity = BASE_JUMP_VELOCITY;
let goal = { x: 3020, y: 220, width: 36, height: 100 };
let platforms = [];
let hazards = [];

function getStageConfig(stage) {
  const effectiveStage = Math.max(1, Math.min(MAX_STAGE, stage));
  const stageScale = effectiveStage - 1;

  worldWidth = 3200 + stageScale * 320;
  jumpVelocity = BASE_JUMP_VELOCITY + stageScale * 0.35;

  const stagePlatforms = [
    { x: 0, y: 500, width: 460, height: 40 },
    { x: 540, y: 450 - stageScale * 5, width: 150, height: 30 },
    { x: 770, y: 390 - stageScale * 8, width: 170, height: 30 },
    { x: 1040, y: 335 - stageScale * 8, width: 145, height: 30 },
    { x: 1270, y: 440 - stageScale * 10, width: 190, height: 30 },
    { x: 1550, y: 370 - stageScale * 9, width: 220, height: 30 },
    { x: 1850, y: 305 - stageScale * 7, width: 120, height: 30 },
    { x: 2030, y: 370 - stageScale * 9, width: 190, height: 30 },
    { x: 2290, y: 295 - stageScale * 10, width: 130, height: 30 },
    { x: 2500, y: 250 - stageScale * 8, width: 125, height: 30 },
    { x: 2715, y: 320 - stageScale * 8, width: 220, height: 30 },
    { x: worldWidth - 280, y: 320, width: 280, height: 220 },
  ];

  const hazardList = [
    { x: 620, y: 492, width: 70, height: 8 },
    { x: 1430, y: 492, width: 100, height: 8 },
  ];

  for (let i = 0; i < stageScale; i += 1) {
    hazardList.push({
      x: 900 + i * 330,
      y: 492,
      width: 80 + i * 8,
      height: 8,
    });
  }

  if (effectiveStage >= 3) {
    hazardList.push({ x: 2100, y: 352 - stageScale * 9, width: 70, height: 8 });
  }

  goal = { x: worldWidth - 160, y: 220, width: 36, height: 100 };
  return { stagePlatforms, hazardList };
}

function resetPlayer() {
  player.x = START_X;
  player.y = START_Y;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
}

function setStage(stage, message) {
  currentStage = Math.max(1, Math.min(MAX_STAGE, stage));
  const config = getStageConfig(currentStage);
  platforms = config.stagePlatforms;
  hazards = config.hazardList;
  resetPlayer();
  statusEl.textContent = message ?? `스테이지 ${currentStage}: 깃발까지 도착하세요!`;
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
    player.vy = jumpVelocity;
    player.grounded = false;
  }

  player.vy += GRAVITY;

  player.x += player.vx;
  player.y += player.vy;

  player.x = Math.max(0, Math.min(worldWidth - player.width, player.x));

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
    resetPlayer();
    statusEl.textContent = `스테이지 ${currentStage}: 떨어졌어요! 다시 도전!`;
  }

  for (const hazard of hazards) {
    if (intersects(player, hazard)) {
      resetPlayer();
      statusEl.textContent = `스테이지 ${currentStage}: 장애물에 닿았어요!`;
      return;
    }
  }

  if (intersects(player, goal)) {
    if (currentStage < MAX_STAGE) {
      setStage(currentStage + 1, `🎉 스테이지 ${currentStage - 1} 클리어! 스테이지 ${currentStage} 시작!`);
    } else {
      statusEl.textContent = "🏆 모든 스테이지 클리어! R 키로 처음부터 다시 시작";
    }
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

function drawHazards() {
  ctx.fillStyle = "#9e1f2e";
  for (const hazard of hazards) {
    const spikeCount = Math.max(3, Math.floor(hazard.width / 14));
    const spikeWidth = hazard.width / spikeCount;
    for (let i = 0; i < spikeCount; i += 1) {
      const spikeX = hazard.x + i * spikeWidth;
      ctx.beginPath();
      ctx.moveTo(spikeX, hazard.y + hazard.height);
      ctx.lineTo(spikeX + spikeWidth / 2, hazard.y - 14);
      ctx.lineTo(spikeX + spikeWidth, hazard.y + hazard.height);
      ctx.closePath();
      ctx.fill();
    }
  }
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

  drawHazards();

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
  ctx.fillRect(12, 12, 300, 88);
  ctx.fillStyle = "#fff";
  ctx.font = "16px Pretendard, sans-serif";
  ctx.fillText(`현재 스테이지: ${currentStage}/${MAX_STAGE}`, 22, 36);
  ctx.fillText("끝 지점(깃발)에 닿으면 다음 스테이지", 22, 60);
  ctx.fillText("가시 장애물은 닿으면 시작점 리셋", 22, 84);
}

function gameLoop() {
  updatePlayer();

  const cameraX = Math.max(
    0,
    Math.min(worldWidth - canvas.width, player.x - canvas.width * 0.4),
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
    setStage(1, "스테이지 1부터 다시 시작합니다!");
    return;
  }

  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

setStage(1);
requestAnimationFrame(gameLoop);
