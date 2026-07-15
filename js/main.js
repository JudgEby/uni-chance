"use strict";

import { state, load, incrementIdCounter } from "./state.js";
import { render } from "./render.js";
import { exportData, importData } from "./io.js";

function init() {
  load();

  const scoreInput = document.getElementById("userScore");
  scoreInput.value = state.userScore || "";
  scoreInput.addEventListener("input", () => {
    state.userScore = parseInt(scoreInput.value) || 0;
    render();
  });

  const slider = document.getElementById("migrationSlider");
  const sliderVal = document.getElementById("migrationValue");
  slider.value = state.migrationPercent;
  sliderVal.textContent = state.migrationPercent + "%";
  slider.addEventListener("input", () => {
    state.migrationPercent = parseInt(slider.value);
    sliderVal.textContent = state.migrationPercent + "%";
    render();
  });

  document.querySelectorAll(".scenario-btn").forEach(btn => {
    if (btn.dataset.scenario === state.scenario) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
    btn.addEventListener("click", () => {
      state.scenario = btn.dataset.scenario;
      document.querySelectorAll(".scenario-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  document.getElementById("addFaculty").addEventListener("click", () => {
    const fId = incrementIdCounter();
    state.faculties.push({ id: fId, name: "", collapsed: false, specialties: [] });
    render();
  });

  const dialog = document.getElementById("confirmDeleteDialog");
  document.getElementById("dialogConfirm").addEventListener("click", () => {
    const type = dialog.dataset.deleteType;

    if (type === "faculty") {
      const id = Number(dialog.dataset.targetId);
      state.faculties = state.faculties.filter(f => f.id !== id);
    } else if (type === "specialty") {
      const id = Number(dialog.dataset.targetId);
      for (const f of state.faculties) {
        const idx = f.specialties.findIndex(s => s.id === id);
        if (idx !== -1) {
          f.specialties.splice(idx, 1);
          break;
        }
      }
    }

    dialog.close();
    render();
  });

  document.getElementById("dialogCancel").addEventListener("click", () => {
    dialog.close();
  });
  dialog.addEventListener("click", e => {
    if (e.target === dialog) dialog.close();
  });

  document.getElementById("btnExport").addEventListener("click", exportData);

  const fileInput = document.getElementById("fileInput");
  document.getElementById("btnImport").addEventListener("click", () => {
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      importData(fileInput.files[0], () => {
        const scoreInput = document.getElementById("userScore");
        scoreInput.value = state.userScore || "";
        const slider = document.getElementById("migrationSlider");
        const sliderVal = document.getElementById("migrationValue");
        slider.value = state.migrationPercent;
        sliderVal.textContent = state.migrationPercent + "%";
        document.querySelectorAll(".scenario-btn").forEach(btn => {
          btn.classList.toggle("active", btn.dataset.scenario === state.scenario);
        });
        render();
      });
      fileInput.value = "";
    }
  });

  render();
}

document.addEventListener("DOMContentLoaded", init);
