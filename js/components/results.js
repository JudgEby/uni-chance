import { profile } from "../state.js";
import { calcProbability, calcMigrationDist, calcWorstCaseMigrationDist } from "../calc.js";
import { probabilityColor, statusLabel } from "../utils/ui.js";
import { esc } from "../utils/dom.js";

export function renderResults() {
  const list = document.getElementById("resultsList");
  if (!profile || profile.userScore <= 0 || profile.faculties.length === 0) {
    list.innerHTML = '<div class="no-results">Добавь факультеты и специальности, введи балл</div>';
    return;
  }

  let anyApplied = false;
  for (const f of profile.faculties) {
    for (const s of f.specialties) {
      if (s.isApplied) { anyApplied = true; break; }
    }
    if (anyApplied) break;
  }

  let html = "";
  let hasAny = false;

  for (const faculty of profile.faculties) {
    if (faculty.specialties.length === 0) continue;

    let facultyHtml = "";
    let facultyHasResults = false;

    for (const sp of faculty.specialties) {
      const virtualUser = anyApplied && !sp.isApplied;

      const base = calcProbability(sp, profile.userScore, undefined, virtualUser);
      if (!base) continue;

      let extraDist = null;
      if (profile.migrationPercent > 0) {
        if (profile.scenario === "worst") {
          extraDist = calcWorstCaseMigrationDist(sp, faculty.specialties, profile.migrationPercent);
        } else if (profile.scenario === "current") {
          extraDist = calcMigrationDist(sp, faculty.specialties, profile.migrationPercent);
        }
      }

      const result = extraDist
        ? calcProbability(sp, profile.userScore, extraDist, virtualUser)
        : base;

      const color = probabilityColor(result.prob);
      const targetTag = sp.isTarget ? ' <span style="color:var(--accent);font-size:0.75rem;font-weight:600;">&#9733; МОЯ</span>' : "";
      const appliedTag = sp.isApplied ? ' <span style="color:var(--green);font-size:0.75rem;font-weight:600;">&#10003; ПОДАЛ</span>' : "";

      let comparisonLine = "";
      if (result.baseProb != null && result.baseProb !== result.prob) {
        const arrow = result.prob < result.baseProb ? "↓" : result.prob > result.baseProb ? "↑" : "→";
        const diffColor = result.prob < result.baseProb ? "#c62828" : result.prob > result.baseProb ? "#1a7f37" : "#888";
        comparisonLine = `<div class="migration-comparison" style="color:${diffColor};">Без миграции: <strong>${result.baseProb}%</strong> → ${result.prob}% ${arrow}</div>`;
      }

      facultyHtml += `<div class="result-card">
        <div class="result-percent" style="color:${color};">${result.prob}%</div>
        <div class="result-info">
          <div class="result-name">${esc(sp.name || "Без названия")}${targetTag}${appliedTag}</div>
          <div class="result-meta">Мест: ${result.competitive} · Выше тебя: ${result.peopleAbove} · ${statusLabel(result.status)}</div>
          ${comparisonLine}
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
