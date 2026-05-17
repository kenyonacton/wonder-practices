// Breathing timer.
//
// Pure exports drive state. The DOM attacher below runs only in the browser
// and reads phases + cycles from the breathing-figure element's data
// attributes.

export const STATUS = Object.freeze({
  idle: "idle",
  running: "running",
  paused: "paused",
  complete: "complete",
});

export const initialState = Object.freeze({
  status: STATUS.idle,
  phaseIndex: 0,
  cycleNumber: 1,
  timeRemaining: 0,
  elapsedTotal: 0,
});

export function reduce(state, action, config) {
  switch (action.type) {
    case "START":
      if (state.status !== STATUS.idle && state.status !== STATUS.complete) return state;
      return {
        status: STATUS.running,
        phaseIndex: 0,
        cycleNumber: 1,
        timeRemaining: config.phases[0].seconds,
        elapsedTotal: 0,
      };
    case "PAUSE":
      return state.status === STATUS.running ? { ...state, status: STATUS.paused } : state;
    case "RESUME":
      return state.status === STATUS.paused ? { ...state, status: STATUS.running } : state;
    case "TICK":
      return tick(state, config);
    case "SKIP":
      if (state.status !== STATUS.running && state.status !== STATUS.paused) return state;
      return advancePhase(state, config);
    case "BACK":
      if (state.status !== STATUS.running && state.status !== STATUS.paused) return state;
      return rewindPhase(state, config);
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

function tick(state, config) {
  if (state.status !== STATUS.running) return state;
  const elapsedTotal = state.elapsedTotal + 1;
  if (state.timeRemaining > 1) {
    return { ...state, timeRemaining: state.timeRemaining - 1, elapsedTotal };
  }
  return { ...advancePhase(state, config), elapsedTotal };
}

function advancePhase(state, config) {
  const nextPhaseIndex = state.phaseIndex + 1;
  if (nextPhaseIndex < config.phases.length) {
    return {
      ...state,
      phaseIndex: nextPhaseIndex,
      timeRemaining: config.phases[nextPhaseIndex].seconds,
    };
  }
  const nextCycle = state.cycleNumber + 1;
  if (nextCycle <= config.cycles) {
    return {
      ...state,
      phaseIndex: 0,
      cycleNumber: nextCycle,
      timeRemaining: config.phases[0].seconds,
    };
  }
  return { ...state, status: STATUS.complete, timeRemaining: 0 };
}

function rewindPhase(state, config) {
  if (state.phaseIndex > 0) {
    const prev = state.phaseIndex - 1;
    return {
      ...state,
      phaseIndex: prev,
      timeRemaining: config.phases[prev].seconds,
    };
  }
  if (state.cycleNumber > 1) {
    const last = config.phases.length - 1;
    return {
      ...state,
      phaseIndex: last,
      cycleNumber: state.cycleNumber - 1,
      timeRemaining: config.phases[last].seconds,
    };
  }
  return { ...state, timeRemaining: config.phases[0].seconds };
}

export function getCurrentPhase(state, config) {
  return config.phases[state.phaseIndex];
}

export function getTotalSecondsRemaining(state, config) {
  if (state.status === STATUS.complete) return 0;
  const phaseRemaining = state.timeRemaining;
  const remainingInCycle = config.phases
    .slice(state.phaseIndex + 1)
    .reduce((sum, p) => sum + p.seconds, 0);
  const cycleSeconds = config.phases.reduce((sum, p) => sum + p.seconds, 0);
  const remainingCycles = config.cycles - state.cycleNumber;
  return phaseRemaining + remainingInCycle + remainingCycles * cycleSeconds;
}

// DOM attacher. Browser-only.
export function attachBreathing(figureEl) {
  const phases = JSON.parse(figureEl.dataset.phases || "[]");
  const cycles = parseInt(figureEl.dataset.cycles || "0", 10);
  if (!phases.length || !cycles) return;
  const config = { phases, cycles };
  let state = { ...initialState };
  let interval = null;

  const section = figureEl.closest(".breathing");
  const phaseEl = figureEl.querySelector("[data-breathing-phase]");
  const remainingEl = figureEl.querySelector("[data-breathing-remaining]");
  const progressEl = figureEl.querySelector("[data-breathing-progress]");
  const liveEl = section.querySelector("[data-breathing-live]");
  const startBtn = section.querySelector("[data-breathing-start]");
  const pauseBtn = section.querySelector("[data-breathing-pause]");
  const backBtn = section.querySelector("[data-breathing-back]");
  const skipBtn = section.querySelector("[data-breathing-skip]");

  function announce(text) {
    if (liveEl) liveEl.textContent = text;
  }

  function render() {
    const current = getCurrentPhase(state, config);
    if (state.status === STATUS.idle) {
      phaseEl.textContent = "Ready";
      if (remainingEl) remainingEl.textContent = "";
      if (progressEl) progressEl.textContent = "";
      figureEl.removeAttribute("data-phase");
      figureEl.style.removeProperty("--breathing-duration");
      startBtn.hidden = false;
      startBtn.textContent = "Start";
      pauseBtn.hidden = true;
      backBtn.hidden = true;
      skipBtn.hidden = true;
    } else if (state.status === STATUS.complete) {
      phaseEl.textContent = "Complete";
      if (remainingEl) remainingEl.textContent = "";
      if (progressEl) progressEl.textContent = "";
      figureEl.removeAttribute("data-phase");
      figureEl.style.removeProperty("--breathing-duration");
      startBtn.hidden = false;
      startBtn.textContent = "Start again";
      pauseBtn.hidden = true;
      backBtn.hidden = true;
      skipBtn.hidden = true;
    } else {
      phaseEl.textContent = current.name;
      if (remainingEl) remainingEl.textContent = `${state.timeRemaining}s`;
      if (progressEl) progressEl.textContent = `Cycle ${state.cycleNumber} of ${config.cycles}`;
      figureEl.style.setProperty("--breathing-duration", `${current.seconds}s`);
      figureEl.dataset.phase = current.type || current.name.toLowerCase().replace(/\s+/g, "-");
      startBtn.hidden = true;
      pauseBtn.hidden = false;
      pauseBtn.textContent = state.status === STATUS.paused ? "Resume" : "Pause";
      backBtn.hidden = false;
      skipBtn.hidden = false;
    }
  }

  function dispatch(action) {
    const prev = state;
    state = reduce(state, action, config);

    if (state.status === STATUS.running && !interval) {
      interval = setInterval(() => dispatch({ type: "TICK" }), 1000);
    } else if (state.status !== STATUS.running && interval) {
      clearInterval(interval);
      interval = null;
    }

    const phaseChanged =
      state.phaseIndex !== prev.phaseIndex ||
      state.cycleNumber !== prev.cycleNumber;
    const statusChanged = state.status !== prev.status;

    if (state.status === STATUS.complete && prev.status !== STATUS.complete) {
      announce("Practice complete.");
    } else if (state.status === STATUS.paused && prev.status === STATUS.running) {
      announce("Paused.");
    } else if (
      state.status === STATUS.running &&
      (statusChanged || phaseChanged)
    ) {
      const cur = getCurrentPhase(state, config);
      const sec = cur.seconds === 1 ? "second" : "seconds";
      announce(`${cur.name}, ${cur.seconds} ${sec}.`);
    }

    render();
  }

  startBtn.addEventListener("click", () => {
    if (state.status === STATUS.complete) {
      dispatch({ type: "RESET" });
    }
    dispatch({ type: "START" });
  });
  pauseBtn.addEventListener("click", () => {
    dispatch({ type: state.status === STATUS.paused ? "RESUME" : "PAUSE" });
  });
  backBtn.addEventListener("click", () => dispatch({ type: "BACK" }));
  skipBtn.addEventListener("click", () => dispatch({ type: "SKIP" }));

  render();
}

if (typeof document !== "undefined") {
  document.querySelectorAll("[data-breathing-figure]").forEach(attachBreathing);
}
