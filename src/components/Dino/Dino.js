import React, { useEffect, useRef, useState } from "react";
import {
  ACHIEVEMENTS,
  biomeAt,
  freshGame,
  jump,
  nightAt,
  readProgress,
  saveProgress,
  step,
} from "./game";
import "./Dino.css";

function load() {
  try {
    return readProgress(window.localStorage);
  } catch {
    return { scores: [], unlocked: [], available: false };
  }
}
function Dino() {
  const sceneRef = useRef(null);
  const [scale, setScale] = useState(1);
  const game = useRef(freshGame());
  const progress = useRef(null);
  if (!progress.current) progress.current = load();
  const [view, setView] = useState({ ...game.current });
  const [saved, setSaved] = useState(progress.current);
  const [notice, setNotice] = useState(null);
  const noticeUntil = useRef(0);

  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setScale(entries[0].contentRect.width / 900),
    );
    observer.observe(sceneRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame;
    let last;
    let alive = true;
    const persist = () => {
      let available = false;
      try {
        available = saveProgress(progress.current, window.localStorage);
      } catch {
        /* Private mode may block storage access. */
      }
      progress.current = { ...progress.current, available };
      setSaved(progress.current);
    };
    const unlock = (id) => {
      if (progress.current.unlocked.includes(id)) return;
      progress.current = {
        ...progress.current,
        unlocked: [...progress.current.unlocked, id],
      };
      persist();
      setNotice(ACHIEVEMENTS.find((a) => a.id === id).name);
      noticeUntil.current = game.current.time + 3;
    };
    const render = () => setView({ ...game.current });
    const keydown = (e) => {
      if (!["Space", "ArrowUp", "ArrowDown", "KeyS", "KeyP"].includes(e.code))
        return;
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      )
        return;
      e.preventDefault();
      if (e.repeat) return;
      const g = game.current;
      if (e.code === "KeyP") {
        if (g.status === "running") g.status = "paused";
        else if (g.status === "paused") g.status = "running";
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        if (g.status === "running") g.duck = true;
      } else jump(g, unlock);
      render();
    };
    const keyup = (e) => {
      if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        game.current.duck = false;
        render();
      }
    };
    const blur = () => {
      game.current.duck = false;
      if (game.current.status === "running") game.current.status = "paused";
      render();
    };
    const tick = (now) => {
      if (!alive) return;
      // Substeps prevent tunneling. Discard long background-tab gaps instead of teleporting.
      const elapsed =
        last === undefined ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      const g = game.current;
      const before = g.status;
      let remaining = elapsed;
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 120);
        step(g, dt, unlock);
        remaining -= dt;
      }
      if (before === "running" && g.status === "over") {
        progress.current = {
          ...progress.current,
          scores: [
            ...progress.current.scores,
            { score: g.score, date: new Date().toISOString() },
          ]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5),
        };
        persist();
      }
      if (noticeUntil.current && g.time >= noticeUntil.current) {
        setNotice(null);
        noticeUntil.current = 0;
      }
      render();
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    frame = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const restart = () => {
    game.current = { ...freshGame(), status: "running" };
    noticeUntil.current = 0;
    setNotice(null);
    setView({ ...game.current });
  };
  const togglePause = () => {
    game.current.status =
      game.current.status === "paused" ? "running" : "paused";
    game.current.duck = false;
    setView({ ...game.current });
  };
  const night = nightAt(view.time);
  const biome = biomeAt(view.score);
  return (
    <main className="expedition">
      <header className="masthead">
        <div>
          <span className="eyebrow">CSC321 / HOMEWORK 03</span>
          <h1>
            Dino expedition<span>.</span>
          </h1>
          <p>A little dinosaur. Three biomes. One more try.</p>
        </div>
        <span className="project-tag">THE ENDLESS RUNNER</span>
      </header>
      <section className="game-card" aria-label="Dinosaur runner">
        <div className="dashboard">
          <div>
            <span className="eyebrow">DISTANCE</span>
            <strong>{String(view.score).padStart(5, "0")}</strong>
          </div>
          <div>
            <span className="eyebrow">PERSONAL BEST</span>
            <strong>
              {String(saved.scores[0]?.score || 0).padStart(5, "0")}
            </strong>
          </div>
          <div className="biome-label">
            <span className="eyebrow">EXPLORING</span>
            <b>{biome}</b>
          </div>
          <span className={`shield-status ${view.shield ? "active" : ""}`}>
            {view.shield
              ? "⬡ Shield active"
              : view.immune > 0
                ? "⬡ Hit absorbed"
                : "⬡ No shield"}
          </span>
          {["running", "paused"].includes(view.status) && (
            <button onClick={togglePause}>
              {view.status === "paused" ? "Resume" : "Pause"} · P
            </button>
          )}
        </div>
        <div ref={sceneRef} className={`scene ${biome.toLowerCase()}`}>
          <div className="world" style={{ transform: `scale(${scale})` }}>
            <div className="night-sky" style={{ opacity: night }} />
            {Array.from({ length: 24 }, (_, i) => (
              <i
                key={i}
                className="star"
                style={{
                  left: ((i * 137) % 880) + 10,
                  top: ((i * 43) % 130) + 12,
                  opacity: night,
                }}
              />
            ))}
            <div
              className="sun"
              style={{ opacity: 1 - night, top: 32 + night * 35 }}
            />
            <div className="moon" style={{ opacity: night }} />
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="cloud"
                style={{
                  left:
                    ((((i * 265 - view.distance * 0.13) % 1150) + 1150) %
                      1150) -
                    130,
                  top: 30 + (i % 2) * 44,
                }}
              />
            ))}
            <div className="mountain far" />
            <div className="mountain near" />
            <div
              className="ground"
              style={{ backgroundPositionX: -view.distance }}
            />
            <div
              className={`dinosaur ${view.duck ? "duck" : ""} ${view.shield ? "shielded" : ""} ${view.immune > 0 ? "immune" : ""}`}
              style={{ bottom: 62 + view.y }}
            />
            {view.obstacles.map((o) => (
              <div
                key={o.id}
                className={`obstacle ${o.kind === "ground" ? "cactus" : "bird"} ${o.hit ? "absorbed" : ""}`}
                style={{ left: o.x, bottom: 62 + o.y, width: o.w, height: o.h }}
              >
                {o.kind !== "ground" && (
                  <>
                    <span className="wing" />
                    <span className="beak" />
                  </>
                )}
              </div>
            ))}
            {view.pickups.map((o) => (
              <div
                key={o.id}
                className="pickup"
                style={{ left: o.x, bottom: 62 + o.y }}
              >
                ⬡
              </div>
            ))}
          </div>
          {view.status !== "running" && (
            <div className="overlay">
              <span className="eyebrow">
                {view.status === "over"
                  ? "EXPEDITION COMPLETE"
                  : view.status === "paused"
                    ? "TAKE A BREATHER"
                    : "THE TRAIL IS CALLING"}
              </span>
              <h2>
                {view.status === "over"
                  ? `${view.score} points. Go again?`
                  : view.status === "paused"
                    ? "Paused"
                    : "Ready for a little adventure?"}
              </h2>
              <p>
                {view.status === "ready"
                  ? "Press Space or ↑ to start and jump"
                  : view.status === "paused"
                    ? "Press P when you’re ready to continue."
                    : "Every run is a new expedition."}
              </p>
              {view.status === "over" && (
                <button className="primary" onClick={restart}>
                  Restart expedition ↗
                </button>
              )}
              {view.status === "ready" && (
                <button className="primary" onClick={restart}>
                  Start expedition ↗
                </button>
              )}
              {view.status === "paused" && (
                <button className="primary" onClick={togglePause}>
                  Resume expedition
                </button>
              )}
            </div>
          )}
          <div className="toast" role="status">
            {notice && <>★ Achievement unlocked: {notice}</>}
          </div>
        </div>
        <div className="controls">
          <span>
            <kbd>Space</kbd> / <kbd>↑</kbd> Jump
          </span>
          <span>
            <kbd>↓</kbd> / <kbd>S</kbd> Hold to duck
          </span>
          <span>
            <kbd>P</kbd> Pause
          </span>
          <span className="hint">
            Collect ⬡ • Dodge low birds • Duck under high birds
          </span>
        </div>
      </section>
      <div className="panels">
        <section className="panel">
          <div className="panel-title">
            <h2>Trail records</h2>
            <span>TOP 5 RUNS</span>
          </div>
          {saved.scores.length ? (
            <ol className="scores">
              {saved.scores.map((s, i) => (
                <li key={`${s.date}-${i}`}>
                  <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                  <time dateTime={s.date}>
                    {new Date(s.date).toLocaleDateString()}
                  </time>
                  <strong>
                    {s.score}
                    <small> pts</small>
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty">
              Your first adventure belongs here.
              <br />
              Finish a run to set a record.
            </p>
          )}
          <p className="storage-note">
            {saved.available
              ? "Records and achievements are saved in this browser."
              : "Storage unavailable or invalid. Progress is kept for this session; the next successful save will repair stored data."}
          </p>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>Milestones</h2>
            <span>{saved.unlocked.length} / 4 UNLOCKED</span>
          </div>
          <div className="achievements">
            {ACHIEVEMENTS.map((a) => (
              <div
                key={a.id}
                className={`achievement ${saved.unlocked.includes(a.id) ? "unlocked" : ""}`}
              >
                <span className="badge">
                  {saved.unlocked.includes(a.id) ? "★" : "◇"}
                </span>
                <div>
                  <h3>
                    {a.name}{" "}
                    <small>
                      {saved.unlocked.includes(a.id) ? "Unlocked" : "Locked"}
                    </small>
                  </h3>
                  <p>{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <footer>
        BUILT WITH REACT{" "}
        <span>Desert → Snow → Volcanic · New biome every 150 points</span>
      </footer>
    </main>
  );
}
export default Dino;
