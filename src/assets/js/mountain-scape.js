/*
 * Wonder Practices
 * Copyright (c) 2026 Kenyon Acton. All rights reserved.
 * Licensed under CC BY-NC-ND 4.0.
 * https://creativecommons.org/licenses/by-nc-nd/4.0/
 */

// Mountain-scape category navigation.
//
// Pure exports drive the state and are unit-tested under tests/.
// The DOM attacher below is impure and runs in the browser only.

export const CATEGORIES = ["quiet", "active", "body-intense", "tender"];

export const initialState = { selected: null };

export function reduce(state, action) {
  switch (action.type) {
    case "SELECT": {
      if (!CATEGORIES.includes(action.category)) return state;
      if (state.selected === action.category) {
        return { ...state, selected: null };
      }
      return { ...state, selected: action.category };
    }
    default:
      return state;
  }
}

export function panelToShow(state) {
  return state.selected ?? "all";
}

// DOM attacher. Runs only in the browser.
export function attachScape(rootEl) {
  let state = { ...initialState };
  const svg = rootEl.querySelector(".scape-svg");
  const peaks = rootEl.querySelectorAll(".peak-group");
  const labels = rootEl.querySelectorAll(".cat-label");
  const mobileBtns = rootEl.querySelectorAll(".scape-mobile-btn");
  const panels = rootEl.querySelectorAll(".scape-panel");
  const firstForeignObject = svg ? svg.querySelector("foreignObject") : null;

  function applyState(next) {
    state = next;

    rootEl.classList.toggle("has-selection", state.selected !== null);

    peaks.forEach((peak) => {
      peak.classList.toggle("selected", peak.dataset.category === state.selected);
    });
    labels.forEach((label) => {
      label.classList.toggle("selected", label.dataset.label === state.selected);
    });
    mobileBtns.forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.category === state.selected);
    });

    if (state.selected && svg && firstForeignObject) {
      const selectedPeak = rootEl.querySelector(
        `.peak-group[data-category="${state.selected}"]`,
      );
      if (selectedPeak) {
        svg.insertBefore(selectedPeak, firstForeignObject);
      }
    }

    const visible = panelToShow(state);
    panels.forEach((p) => {
      p.hidden = p.dataset.panel !== visible;
    });
  }

  function select(category) {
    applyState(reduce(state, { type: "SELECT", category }));
  }

  peaks.forEach((peak) => {
    peak.addEventListener("click", () => select(peak.dataset.category));
    peak.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(peak.dataset.category);
      }
    });
  });

  labels.forEach((label) => {
    label.addEventListener("click", () => select(label.dataset.label));
  });

  mobileBtns.forEach((btn) => {
    btn.addEventListener("click", () => select(btn.dataset.category));
  });

  return { select };
}

if (typeof document !== "undefined") {
  document.querySelectorAll(".scape-wrap").forEach((root) => {
    const api = attachScape(root);
    const hash = (window.location.hash || "").slice(1);
    if (CATEGORIES.includes(hash)) api.select(hash);
  });
}
