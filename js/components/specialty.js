import { SCORE_RANGES } from "../constants.js";
import { state } from "../state.js";
import { calcProbability, calcMigrationDist, calcWorstCaseMigrationDist, calcAppsTotal } from "../calc.js";
import { probabilityColor, statusLabel } from "../utils/ui.js";

export function syncCardToState(card, sp, faculty, allFaculties) {
  card.querySelector(".specialty-name").value = sp.name;
  card.querySelector(".is-target").checked = sp.isTarget;
  card.querySelector(".is-applied").checked = sp.isApplied;

  const appliedLabel = card.querySelector(".applied-checkbox");
  if (sp.isTarget) {
    appliedLabel.classList.add("visible");
  } else {
    appliedLabel.classList.remove("visible");
  }

  card.querySelector(".field-plan").value = sp.plan || "";

  const appsTotalEl = card.querySelector(".apps-total-value");
  if (appsTotalEl) appsTotalEl.textContent = calcAppsTotal(sp);

  renderDistInputs(card, sp);
  renderCardResult(card, sp, faculty);
  renderMoveDropdown(card, sp, faculty, allFaculties);
}

export function renderDistInputs(card, sp) {
  const container = card.querySelector(".score-distribution");
  if (container.children.length > 0) {
    const inputs = container.querySelectorAll(".dist-item input");
    inputs.forEach((inp, i) => { inp.value = sp.scoreDist[i] || ""; });
    return;
  }

  const table = document.createElement("div");
  table.className = "dist-table";

  SCORE_RANGES.forEach((r, i) => {
    const item = document.createElement("div");
    item.className = "dist-item";

    const s = document.createElement("span");
    s.textContent = r.label;
    item.appendChild(s);

    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = "0";
    inp.value = sp.scoreDist[i] || "";
    inp.dataset.idx = i;
    inp.addEventListener("input", () => {
      sp.scoreDist[i] = parseInt(inp.value) || 0;
      import("../render.js").then(m => m.render());
    });
    item.appendChild(inp);

    table.appendChild(item);
  });

  container.appendChild(table);
}

function renderMoveDropdown(card, sp, faculty, allFaculties) {
  const wrapper = card.querySelector(".move-wrapper");
  const dropdown = card.querySelector(".move-dropdown");

  const otherFaculties = allFaculties.filter(f => f.id !== faculty.id);

  if (otherFaculties.length === 0) {
    wrapper.style.display = "none";
    return;
  }

  wrapper.style.display = "";
  dropdown.innerHTML = otherFaculties.map(f =>
    `<div class="move-option" data-faculty-id="${f.id}">${f.name || "Без названия"}</div>`
  ).join("");
}

function hasAnyApplied() {
  for (const f of state.faculties) {
    for (const s of f.specialties) {
      if (s.isApplied) return true;
    }
  }
  return false;
}

function renderCardResult(card, sp, faculty) {
  const container = card.querySelector(".specialty-result");
  if (state.userScore <= 0) {
    container.innerHTML = '<span style="color:var(--text-secondary);font-size:0.82rem;">Введите балл для расчёта</span>';
    return;
  }

  const anyApplied = hasAnyApplied();
  const virtualUser = anyApplied && !sp.isApplied;

  const base = calcProbability(sp, state.userScore, undefined, virtualUser);
  if (!base) {
    container.innerHTML = '';
    return;
  }

  let extraDist = null;
  if (state.migrationPercent > 0) {
    if (state.scenario === "worst") {
      extraDist = calcWorstCaseMigrationDist(sp, faculty.specialties, state.migrationPercent);
    } else if (state.scenario === "current") {
      extraDist = calcMigrationDist(sp, faculty.specialties, state.migrationPercent);
    }
  }

  const result = extraDist
    ? calcProbability(sp, state.userScore, extraDist, virtualUser)
    : base;
  const migratedCount = extraDist ? extraDist.reduce((a, b) => a + b, 0) : 0;

  const color = probabilityColor(result.prob);
  const cls = result.status === "ok" ? "probable" : result.status === "boundary" ? "boundary" : "unlikely";

  let html = `<div class="result-badge ${cls}" style="border-left:4px solid ${color};">
    <span style="font-size:1.4rem;font-weight:800;color:${color};">${result.prob}%</span>
    <span>${statusLabel(result.status)}</span>
  </div>`;

  if (result.baseProb != null && result.baseProb !== result.prob) {
    const arrow = result.prob < result.baseProb ? "↓" : result.prob > result.baseProb ? "↑" : "→";
    const diffColor = result.prob < result.baseProb ? "#c62828" : result.prob > result.baseProb ? "#1a7f37" : "#888";
    html += `<div class="migration-comparison" style="color:${diffColor};">Без миграции: <strong>${result.baseProb}%</strong> → ${result.prob}% ${arrow}</div>`;
  }

  html += `<div class="result-details">`;
  html += `Конкурсных мест: <strong>${result.competitive}</strong>`;
  html += ` · Абитуриентов ≥ тебя: <strong>${result.peopleAbove}</strong>`;
  html += ` · В твоём диапазоне: <strong>${result.peopleInRange}</strong>`;
  if (migratedCount > 0) {
    html += ` · Мигрирует: <strong>+${migratedCount}</strong>`;
  }
  if (virtualUser) {
    html += ` · <em style="color:var(--green);">+1 виртуально ты</em>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}
