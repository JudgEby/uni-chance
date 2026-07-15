import { state, save, incrementIdCounter } from "./state.js";
import { syncCardToState } from "./components/specialty.js";
import { bindCardEvents, bindFacultyEvents } from "./components/dialog.js";
import { renderResults } from "./components/results.js";

export function render() {
  renderFaculties();
  renderResults();
  save();
}

function renderFaculties() {
  const list = document.getElementById("facultiesList");
  const fTemplate = document.getElementById("facultyTemplate");
  const sTemplate = document.getElementById("specialtyTemplate");

  const existingFacultyIds = new Set();
  list.querySelectorAll(".faculty-card").forEach(el => existingFacultyIds.add(Number(el.dataset.facultyId)));
  const stateFacultyIds = new Set(state.faculties.map(f => f.id));

  list.querySelectorAll(".faculty-card").forEach(el => {
    if (!stateFacultyIds.has(Number(el.dataset.facultyId))) el.remove();
  });

  for (const faculty of state.faculties) {
    let fCard = list.querySelector(`.faculty-card[data-faculty-id="${faculty.id}"]`);
    if (!fCard) {
      fCard = fTemplate.content.firstElementChild.cloneNode(true);
      fCard.dataset.facultyId = faculty.id;
      list.appendChild(fCard);
      bindFacultyEvents(fCard, faculty, render);
    }

    fCard.querySelector(".faculty-name").value = faculty.name;

    const body = fCard.querySelector(".faculty-body");
    body.style.display = faculty.collapsed ? "none" : "";
    const icon = fCard.querySelector(".collapse-icon");
    icon.textContent = faculty.collapsed ? "\u25B6" : "\u25BC";

    const specContainer = fCard.querySelector(".faculty-specialties");

    const existingSpecIds = new Set();
    specContainer.querySelectorAll(".specialty-card").forEach(el => existingSpecIds.add(Number(el.dataset.id)));
    const stateSpecIds = new Set(faculty.specialties.map(s => s.id));

    specContainer.querySelectorAll(".specialty-card").forEach(el => {
      if (!stateSpecIds.has(Number(el.dataset.id))) el.remove();
    });

    for (const sp of faculty.specialties) {
      let sCard = specContainer.querySelector(`.specialty-card[data-id="${sp.id}"]`);
      if (!sCard) {
        sCard = sTemplate.content.firstElementChild.cloneNode(true);
        sCard.dataset.id = sp.id;
        specContainer.appendChild(sCard);
        bindCardEvents(sCard, sp, faculty, render);
      }
      syncCardToState(sCard, sp, faculty, state.faculties);
    }

    const addBtn = fCard.querySelector(".btn-add-specialty");
    if (!addBtn.dataset.bound) {
      addBtn.dataset.bound = "1";
      addBtn.addEventListener("click", () => {
        const spId = incrementIdCounter();
        const sp = { id: spId, name: "", isTarget: false, plan: 0, planTarget: 0, planPaid: 0, appsTotal: 0, appsTarget: 0, appsNoExam: 0, appsOutOfComp: 0, appsByComp: 0, scoreDist: new Array(57).fill(0) };
        faculty.specialties.push(sp);
        render();
      });
    }
  }
}
