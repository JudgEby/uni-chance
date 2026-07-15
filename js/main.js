"use strict";

import { state, profile, load, incrementIdCounter, addProfile, removeProfile, renameProfile, setActiveProfile } from "./state.js";
import { render } from "./render.js";
import { exportData, importData } from "./io.js";

function startRename(tab, nameSpan, p) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "tab-rename-input";
  input.value = p.name;
  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  const finish = () => {
    const newName = input.value.trim() || p.name;
    renameProfile(p.id, newName);
    renderTabs();
  };

  input.addEventListener("blur", finish, { once: true });
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") input.blur();
    if (ev.key === "Escape") {
      input.value = p.name;
      input.blur();
    }
  });
}

function renderTabs() {
  const bar = document.getElementById("tabsBar");
  bar.innerHTML = "";

  for (const p of state.profiles) {
    const tab = document.createElement("div");
    tab.className = "tab" + (p.id === state.activeProfileId ? " active" : "");
    tab.dataset.profileId = p.id;

    const nameSpan = document.createElement("span");
    nameSpan.className = "tab-name";
    nameSpan.textContent = p.name;
    tab.appendChild(nameSpan);

    if (state.profiles.length > 1) {
      const editBtn = document.createElement("button");
      editBtn.className = "tab-edit";
      editBtn.title = "Переименовать";
      editBtn.textContent = "\u270E";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startRename(tab, nameSpan, p);
      });
      tab.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.className = "tab-delete";
      delBtn.title = "Удалить";
      delBtn.textContent = "\u00d7";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const dialog = document.getElementById("confirmDeleteDialog");
        dialog.dataset.deleteType = "profile";
        dialog.dataset.targetId = p.id;
        document.getElementById("dialogText").textContent =
          `Удалить профиль «${p.name}»?`;
        dialog.showModal();
      });
      tab.appendChild(delBtn);
    }

    tab.addEventListener("click", () => {
      if (p.id === state.activeProfileId) return;
      setActiveProfile(p);
      syncUIFromProfile();
      renderTabs();
      render();
    });

    bar.appendChild(tab);
  }

  const addBtn = document.createElement("button");
  addBtn.className = "tab-add";
  addBtn.title = "Добавить человека";
  addBtn.textContent = "+";
  addBtn.addEventListener("click", () => {
    addProfile();
    syncUIFromProfile();
    renderTabs();
    render();
  });
  bar.appendChild(addBtn);
}

function syncUIFromProfile() {
  const scoreInput = document.getElementById("userScore");
  scoreInput.value = profile ? (profile.userScore || "") : "";

  const slider = document.getElementById("migrationSlider");
  const sliderVal = document.getElementById("migrationValue");
  if (profile) {
    slider.value = profile.migrationPercent;
    sliderVal.textContent = profile.migrationPercent + "%";
  }

  document.querySelectorAll(".scenario-btn").forEach(btn => {
    if (profile && btn.dataset.scenario === profile.scenario) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function init() {
  load();

  renderTabs();
  syncUIFromProfile();

  const scoreInput = document.getElementById("userScore");
  scoreInput.addEventListener("input", () => {
    if (!profile) return;
    profile.userScore = parseInt(scoreInput.value) || 0;
    render();
  });

  const slider = document.getElementById("migrationSlider");
  const sliderVal = document.getElementById("migrationValue");
  slider.addEventListener("input", () => {
    if (!profile) return;
    profile.migrationPercent = parseInt(slider.value);
    sliderVal.textContent = profile.migrationPercent + "%";
    render();
  });

  document.querySelectorAll(".scenario-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!profile) return;
      profile.scenario = btn.dataset.scenario;
      document.querySelectorAll(".scenario-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  document.getElementById("addFaculty").addEventListener("click", () => {
    if (!profile) return;
    const fId = incrementIdCounter();
    profile.faculties.push({ id: fId, name: "", collapsed: false, specialties: [] });
    render();
  });

  const dialog = document.getElementById("confirmDeleteDialog");
  document.getElementById("dialogConfirm").addEventListener("click", () => {
    const type = dialog.dataset.deleteType;

    if (type === "faculty") {
      const id = Number(dialog.dataset.targetId);
      profile.faculties = profile.faculties.filter(f => f.id !== id);
    } else if (type === "specialty") {
      const id = Number(dialog.dataset.targetId);
      for (const f of profile.faculties) {
        const idx = f.specialties.findIndex(s => s.id === id);
        if (idx !== -1) {
          f.specialties.splice(idx, 1);
          break;
        }
      }
    } else if (type === "profile") {
      const id = Number(dialog.dataset.targetId);
      removeProfile(id);
      syncUIFromProfile();
      renderTabs();
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
        syncUIFromProfile();
        renderTabs();
        render();
      });
      fileInput.value = "";
    }
  });

  render();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const container = document.getElementById("appContainer");
      const skeleton = document.getElementById("skeletonOverlay");
      container.style.display = "";
      skeleton.classList.add("hidden");
      skeleton.addEventListener("transitionend", () => skeleton.remove(), { once: true });
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
