// All positions use a fixed 900 × 320 world, scaled together by the UI.
export const WIDTH = 900;
export const ACHIEVEMENTS = [
  { id: "jump", name: "Small leap", description: "Make your first jump." },
  {
    id: "century",
    name: "Trailblazer",
    description: "Reach 100 points in one run.",
  },
  {
    id: "night",
    name: "Night owl",
    description: "Survive a full night (45 seconds into a run).",
  },
  {
    id: "shield",
    name: "Second chance",
    description: "Absorb an obstacle collision with a shield.",
  },
];
export const biomeAt = (score) =>
  ["Desert", "Snow", "Volcanic"][Math.floor(score / 150) % 3];
export const nightAt = (time) => (1 - Math.cos((2 * Math.PI * time) / 45)) / 2;
export function freshGame() {
  return {
    status: "ready",
    time: 0,
    score: 0,
    y: 0,
    velocity: 0,
    duck: false,
    shield: false,
    immune: 0,
    obstacles: [],
    pickups: [],
    nextObstacle: 2,
    nextShield: 5,
    serial: 0,
    distance: 0,
  };
}
export function dinoBox(g) {
  return { x: 92, y: g.y, w: g.duck ? 56 : 44, h: g.duck ? 28 : 54 };
}
export const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export function jump(g, unlock) {
  if (g.status === "ready") g.status = "running";
  if (g.status === "running" && g.y === 0) {
    g.velocity = 590;
    unlock("jump");
  }
}
export function step(g, dt, unlock, random = Math.random) {
  if (g.status !== "running") return;
  g.time += dt;
  g.score = Math.floor(g.time * 10);
  const speed = Math.min(390, 260 + g.time * 1.1);
  g.distance += speed * dt;
  g.immune = Math.max(0, g.immune - dt);
  g.velocity -= 1700 * dt;
  g.y = Math.max(0, g.y + g.velocity * dt);
  if (g.y === 0) g.velocity = 0;
  if (g.score >= 100) unlock("century");
  if (g.time >= 45) unlock("night");
  // At least 1.65 seconds between hazards: longer than a complete jump.
  // Both flight heights are jumpable; the higher bird also clears a crouching dino.
  g.nextObstacle -= dt;
  if (g.nextObstacle <= 0) {
    const kind = random() < 0.45 ? (random() < 0.5 ? "low" : "high") : "ground";
    g.obstacles.push({
      id: g.serial++,
      kind,
      x: WIDTH + 20,
      y: kind === "high" ? 35 : kind === "low" ? 12 : 0,
      w: kind === "ground" ? 28 : 46,
      h: kind === "ground" ? 48 : 22,
    });
    g.nextObstacle = 1.65 + random() * 0.65;
  }
  g.nextShield -= dt;
  if (g.nextShield <= 0) {
    // Place collectibles between hazards, away from the most recently spawned one.
    if (!g.obstacles.some((o) => o.x > WIDTH - 180)) {
      g.pickups.push({ id: g.serial++, x: WIDTH + 20, y: 12, w: 30, h: 34 });
      g.nextShield = 9 + random() * 5;
    } else g.nextShield = 0.2;
  }
  [...g.obstacles, ...g.pickups].forEach((o) => {
    o.x -= speed * dt;
  });
  const box = dinoBox(g);
  g.pickups = g.pickups.filter((o) => {
    if (overlaps(box, o)) {
      g.shield = true;
      return false;
    }
    return o.x + o.w > 0;
  });
  for (const o of g.obstacles) {
    if (!o.hit && g.immune === 0 && overlaps(box, o)) {
      if (g.shield) {
        g.shield = false;
        g.immune = 1.2;
        o.hit = true; // This obstacle cannot hit again, even after invulnerability ends.
        unlock("shield");
      } else {
        g.status = "over";
        break;
      }
    }
  }
  g.obstacles = g.obstacles.filter((o) => o.x + o.w > 0);
}
const KEY = "csc321-dino-v1";
export function readProgress(storage) {
  try {
    const raw = JSON.parse(storage.getItem(KEY));
    const scores = Array.isArray(raw?.scores)
      ? raw.scores.filter(
          (s) =>
            Number.isSafeInteger(s?.score) &&
            s.score >= 0 &&
            typeof s.date === "string" &&
            Number.isFinite(Date.parse(s.date)),
        )
      : [];
    return {
      scores: scores.sort((a, b) => b.score - a.score).slice(0, 5),
      unlocked: ACHIEVEMENTS.map((a) => a.id).filter(
        (id) => Array.isArray(raw?.unlocked) && raw.unlocked.includes(id),
      ),
      available: true,
    };
  } catch {
    return { scores: [], unlocked: [], available: false };
  }
}
export function saveProgress(progress, storage) {
  try {
    storage.setItem(KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
