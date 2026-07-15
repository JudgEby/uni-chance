import { save, profile, moveSpecialty } from "../state.js";

export function bindFacultyEvents(fCard, faculty, onRender) {
  fCard.querySelector(".faculty-name").addEventListener("input", e => {
    faculty.name = e.target.value;
    save();
    onRender();
  });

  fCard.querySelector(".btn-collapse").addEventListener("click", () => {
    faculty.collapsed = !faculty.collapsed;
    onRender();
  });

  fCard.querySelector(".btn-remove").addEventListener("click", () => {
    const dialog = document.getElementById("confirmDeleteDialog");
    dialog.dataset.deleteType = "faculty";
    dialog.dataset.targetId = faculty.id;
    document.getElementById("dialogText").textContent =
      `Удалить факультет «${faculty.name || "Без названия"}» со всеми специальностями?`;
    dialog.showModal();
  });
}

export function bindCardEvents(card, sp, faculty, onRender) {
  card.querySelector(".specialty-name").addEventListener("input", e => {
    sp.name = e.target.value;
    save();
  });

  card.querySelector(".is-target").addEventListener("change", e => {
    sp.isTarget = e.target.checked;
    if (sp.isTarget) {
      faculty.specialties.forEach(s => { if (s.id !== sp.id) s.isTarget = false; });
    } else {
      if (sp.isApplied) {
        sp.isApplied = false;
      }
    }
    onRender();
  });

  card.querySelector(".is-applied").addEventListener("change", e => {
    sp.isApplied = e.target.checked;
    if (sp.isApplied) {
      for (const f of profile.faculties) {
        for (const s of f.specialties) {
          if (s.id !== sp.id) s.isApplied = false;
        }
      }
    }
    onRender();
  });

  card.querySelector(".btn-remove").addEventListener("click", () => {
    const dialog = document.getElementById("confirmDeleteDialog");
    dialog.dataset.deleteType = "specialty";
    dialog.dataset.targetId = sp.id;
    document.getElementById("dialogText").textContent = "Удалить специальность?";
    dialog.showModal();
  });

  const fieldMap = {
    ".field-plan": "plan"
  };
  Object.entries(fieldMap).forEach(([sel, key]) => {
    card.querySelector(sel).addEventListener("input", e => {
      sp[key] = parseInt(e.target.value) || 0;
      onRender();
    });
  });

  card.querySelector(".btn-toggle-dist").addEventListener("click", () => {
    const dist = card.querySelector(".score-distribution");
    const btn = card.querySelector(".btn-toggle-dist");
    if (dist.style.display === "none") {
      dist.style.display = "";
      btn.textContent = "Скрыть таблицу";
    } else {
      dist.style.display = "none";
      btn.textContent = "Показать таблицу";
    }
  });

  const moveBtn = card.querySelector(".btn-move");
  const moveDropdown = card.querySelector(".move-dropdown");

  moveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = moveDropdown.style.display !== "none";
    document.querySelectorAll(".move-dropdown").forEach(d => d.style.display = "none");
    if (!isVisible) {
      moveDropdown.style.display = "";
    }
  });

  moveDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
    const option = e.target.closest(".move-option");
    if (!option) return;
    const targetId = Number(option.dataset.facultyId);
    moveSpecialty(sp.id, targetId);
    onRender();
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".move-dropdown").forEach(d => d.style.display = "none");
  });
}
