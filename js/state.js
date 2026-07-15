import { STORAGE_KEY, STORAGE_VERSION } from "./constants.js";

export const state = {
  userScore: 0,
  faculties: [],
  migrationPercent: 0,
  scenario: "current"
};

export let idCounter = 0;

export function setIdCounter(val) {
  idCounter = val;
}

export function incrementIdCounter() {
  return ++idCounter;
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      userScore: state.userScore,
      faculties: state.faculties,
      migrationPercent: state.migrationPercent,
      scenario: state.scenario,
      idCounter
    }));
  } catch (e) {}
}

export function findFaculty(specialtyId) {
  return state.faculties.find(f => f.specialties.some(s => s.id === specialtyId));
}

export function moveSpecialty(specialtyId, targetFacultyId) {
  const sourceFaculty = findFaculty(specialtyId);
  const targetFaculty = state.faculties.find(f => f.id === targetFacultyId);
  if (!sourceFaculty || !targetFaculty || sourceFaculty.id === targetFacultyId) return;

  const idx = sourceFaculty.specialties.findIndex(s => s.id === specialtyId);
  if (idx === -1) return;

  const [sp] = sourceFaculty.specialties.splice(idx, 1);
  targetFaculty.specialties.push(sp);
  save();
}

function normalizeSpecialties(specialties) {
  return (specialties || []).map(sp => ({
    ...sp,
    scoreDist: Array.isArray(sp.scoreDist) && sp.scoreDist.length === 57
      ? sp.scoreDist
      : new Array(57).fill(0)
  }));
}

const MIGRATIONS = {
  2(d) {
    const faculties = [];
    const grouped = {};
    for (const sp of (d.specialties || [])) {
      const key = sp.faculty || "Без факультета";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(sp);
    }
    for (const [name, specs] of Object.entries(grouped)) {
      faculties.push({
        id: ++d._idCounter,
        name,
        collapsed: false,
        specialties: specs.map(s => {
          const { faculty, ...rest } = s;
          return {
            ...rest,
            scoreDist: Array.isArray(rest.scoreDist) && rest.scoreDist.length === 57
              ? rest.scoreDist
              : new Array(57).fill(0)
          };
        })
      });
    }
    d.faculties = faculties;
    d.version = 2;
    return d;
  }
};

function migrate(d) {
  let version = d.version || 1;
  d._idCounter = d.idCounter || 0;
  while (MIGRATIONS[version + 1]) {
    d = MIGRATIONS[version + 1](d);
    version = d.version;
  }
  delete d._idCounter;
  return d;
}

export function loadFromObject(d) {
  d = migrate(d);
  state.userScore = d.userScore || 0;
  state.migrationPercent = d.migrationPercent || 0;
  state.scenario = d.scenario || "current";
  idCounter = d.idCounter || 0;
  state.faculties = (d.faculties || []).map(f => ({
    ...f,
    specialties: normalizeSpecialties(f.specialties)
  }));
  if (d.version !== undefined && d.version !== STORAGE_VERSION) {
    save();
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    loadFromObject(JSON.parse(raw));
  } catch (e) {}
}
