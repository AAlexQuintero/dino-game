import {
  freshGame,
  step,
  jump,
  dinoBox,
  overlaps,
  biomeAt,
  nightAt,
  readProgress,
  saveProgress,
} from "./game";
const advance = (g, seconds, unlock = jest.fn()) => {
  for (let t = 0; t < seconds; t += 1 / 120)
    step(g, 1 / 120, unlock, () => 0.9);
};
test("jump lands, duck changes collision bounds, and high birds clear crouching dinosaur", () => {
  const g = freshGame();
  const unlock = jest.fn();
  jump(g, unlock);
  advance(g, 0.2);
  expect(g.y).toBeGreaterThan(50);
  advance(g, 0.7);
  expect(g.y).toBe(0);
  expect(unlock).toHaveBeenCalledWith("jump");
  const bird = { x: 100, y: 35, w: 46, h: 22 };
  expect(overlaps(dinoBox(g), bird)).toBe(true);
  g.duck = true;
  expect(overlaps(dinoBox(g), bird)).toBe(false);
  expect(overlaps(dinoBox(g), { ...bird, y: 12 })).toBe(true);
});
test("shield absorbs once, grants immunity, and unshielded collision ends run", () => {
  const g = { ...freshGame(), status: "running", shield: true };
  const unlock = jest.fn();
  g.obstacles = [{ id: 1, x: 100, y: 0, w: 28, h: 48 }];
  step(g, 0.001, unlock);
  expect(g.shield).toBe(false);
  expect(g.immune).toBeGreaterThan(1);
  expect(g.obstacles[0].hit).toBe(true);
  expect(unlock).toHaveBeenCalledWith("shield");
  step(g, 0.01, unlock);
  expect(g.status).toBe("running");
  g.immune = 0;
  g.obstacles.push({ id: 2, x: 100, y: 0, w: 28, h: 48 });
  step(g, 0.001, unlock);
  expect(g.status).toBe("over");
});
test("collectibles activate shield and pause freezes all simulation state", () => {
  const g = {
    ...freshGame(),
    status: "running",
    pickups: [{ x: 100, y: 12, w: 30, h: 34 }],
  };
  step(g, 0.001, jest.fn());
  expect(g.shield).toBe(true);
  g.status = "paused";
  const snapshot = JSON.stringify(g);
  advance(g, 5);
  expect(JSON.stringify(g)).toBe(snapshot);
  expect(freshGame()).toMatchObject({
    shield: false,
    immune: 0,
    score: 0,
    duck: false,
    obstacles: [],
    pickups: [],
  });
});
test("elapsed time is refresh independent; biomes and night cycle reach milestones", () => {
  const a = { ...freshGame(), status: "running", nextObstacle: 100 };
  const b = { ...a };
  for (let i = 0; i < 60; i++) step(a, 1 / 60, jest.fn());
  for (let i = 0; i < 144; i++) step(b, 1 / 144, jest.fn());
  expect(a.distance).toBeCloseTo(b.distance, 0);
  expect(biomeAt(0)).toBe("Desert");
  expect(biomeAt(150)).toBe("Snow");
  expect(biomeAt(300)).toBe("Volcanic");
  expect(nightAt(22.5)).toBe(1);
  expect(nightAt(45)).toBe(0);
  const unlock = jest.fn();
  step({ ...freshGame(), status: "running", time: 45 }, 0.01, unlock);
  expect(unlock).toHaveBeenCalledWith("night");
  expect(unlock).toHaveBeenCalledWith("century");
});
test("storage validates data, keeps five highest scores, and tolerates failures", () => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        scores: [1, 2, 3, 4, 5, 6]
          .map((score) => ({ score, date: "2026-10-16" }))
          .concat([{ score: -1, date: "invalid" }]),
        unlocked: ["jump", "bogus"],
      }),
  };
  const progress = readProgress(storage);
  expect(progress.scores.map((s) => s.score)).toEqual([6, 5, 4, 3, 2]);
  expect(progress.unlocked).toEqual(["jump"]);
  expect(readProgress({ getItem: () => "{bad" }).scores).toEqual([]);
  expect(
    saveProgress(progress, {
      setItem: () => {
        throw Error("blocked");
      },
    }),
  ).toBe(false);
  expect(
    readProgress({
      getItem: () => {
        throw Error("blocked");
      },
    }).available,
  ).toBe(false);
});
