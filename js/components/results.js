import { state } from "../state.js";
import { calcProbability, calcMigrationDist, calcWorstCaseMigrationDist } from "../calc.js";
import { probabilityColor, statusLabel } from "../utils/ui.js";
import { esc } from "../utils/dom.js";

export function renderResults() {
  const list = document.getElementById("resultsList");
  if (state.userScore <= 0 || state.faculties.length === 0) {
    list.innerHTML = '<div class="no-results">Добавь факультеты и специальности, введи балл</div>';
    return;
  }

  let html = "";
  let hasAny = false;

  for (const faculty of state.faculties) {
    if (faculty.specialties.length === 0) continue;

    let facultyHtml = "";
    let facultyHasResults = false;

    for (const sp of faculty.specialties) {
      const base = calcProbability(sp, state.userScore);
      if (!base) continue;

      let extraDist = null;
      if (state.migrationPercent > 0) {
        if (state.scenario === "worst") {
          extraDist = calcWorstCaseMigrationDist(sp, faculty.specialties, state.migrationPercent);
        } else if (state.scenario === "current") {
          extraDist = calcMigrationDist(sp, faculty.specialties, state.migrationPercent);
        }
      }

      let result = base;
      if (extraDist) result = calcProbability(sp, state.userScore, extraDist);

      const color = probabilityColor(result.prob);
      const targetTag = sp.isTarget ? ' <span style="color:var(--accent);font-size:0.75rem;font-weight:600;">&#9733; МОЯ</span>' : "";

      facultyHtml += `<div class="result-card">
        <div class="result-percent" style="color:${color};">${result.prob}%</div>
        <div class="result-info">
          <div class="result-name">${esc(sp.name || "Без названия")}${targetTag}</div>
          <div class="result-meta">Мест: ${result.competitive} · Выше тебя: ${result.peopleAbove} · ${statusLabel(result.status)}</div>
        </div>
      </div>`;
      facultyHasResults = true;
    }

    if (facultyHasResults) {
      hasAny = true;
      html += `<div class="results-group">
        <div class="results-group-title">${esc(faculty.name || "Без факультета")}</div>
        ${facultyHtml}
      </div>`;
    }
  }

  list.innerHTML = hasAny ? html : '<div class="no-results">Нет данных для расчёта</div>';
}
