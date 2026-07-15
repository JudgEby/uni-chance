import { SCORE_RANGES } from "../constants.js";
import { state, save } from "../state.js";
import { calcProbability, calcMigrationDist, calcWorstCaseMigrationDist } from "../calc.js";
import { probabilityColor, statusLabel } from "../utils/ui.js";

export function syncCardToState(card, sp, faculty, allFaculties) {
  card.querySelector(".specialty-name").value = sp.name;
  card.querySelector(".is-target").checked = sp.isTarget;
  card.querySelector(".field-plan").value = sp.plan || "";
  card.querySelector(".field-planTarget").value = sp.planTarget || "";
  card.querySelector(".field-planPaid").value = sp.planPaid || "";
  card.querySelector(".field-appsTotal").value = sp.appsTotal || "";
  card.querySelector(".field-appsTarget").value = sp.appsTarget || "";
  card.querySelector(".field-appsNoExam").value = sp.appsNoExam || "";
  card.querySelector(".field-appsOutOfComp").value = sp.appsOutOfComp || "";
  card.querySelector(".field-appsByComp").value = sp.appsByComp || "";

  renderDistInputs(card, sp);
  renderCardResult(card, sp, faculty, allFaculties);
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
  const btn = card.querySelector(".btn-move");
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

function renderCardResult(card, sp, faculty, allFaculties) {
  const container = card.querySelector(".specialty-result");
  if (state.userScore <= 0) {
    container.innerHTML = '<span style="color:var(--text-secondary);font-size:0.82rem;">Введите балл для расчёта</span>';
    return;
  }

  const base = calcProbability(sp, state.userScore);
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

  let result = base;
  let migratedCount = 0;
  if (extraDist) {
    result = calcProbability(sp, state.userScore, extraDist);
    migratedCount = extraDist.reduce((a, b) => a + b, 0);
  }

  const color = probabilityColor(result.prob);
  const cls = result.status === "ok" ? "probable" : result.status === "boundary" ? "boundary" : "unlikely";

  let html = `<div class="result-badge ${cls}" style="border-left:4px solid ${color};">
    <span style="font-size:1.4rem;font-weight:800;color:${color};">${result.prob}%</span>
    <span>${statusLabel(result.status)}</span>
  </div>`;

  html += `<div class="result-details">`;
  html += `Конкурсных мест: <strong>${result.competitive}</strong>`;
  html += ` · Абитуриентов ≥ тебя: <strong>${result.peopleAbove}</strong>`;
  html += ` · В твоём диапазоне: <strong>${result.peopleInRange}</strong>`;
  if (migratedCount > 0) {
    html += ` · Мигрирует: <strong>+${migratedCount}</strong>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}
