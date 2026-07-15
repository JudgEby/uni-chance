import { STORAGE_KEY, STORAGE_VERSION } from "./constants.js";

export const state = {
  profiles: [],
  activeProfileId: null,
  profileIdCounter: 0
};

export let profile = null;

export function setActiveProfile(p) {
  profile = p;
  state.activeProfileId = p ? p.id : null;
}

function incrementProfileIdCounter() {
  return ++state.profileIdCounter;
}

export function incrementIdCounter() {
  if (!profile) return 0;
  return ++profile.idCounter;
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      profiles: state.profiles,
      activeProfileId: state.activeProfileId,
      profileIdCounter: state.profileIdCounter
    }));
  } catch {}
}

export function findFaculty(specialtyId) {
  if (!profile) return undefined;
  return profile.faculties.find(f => f.specialties.some(s => s.id === specialtyId));
}

export function moveSpecialty(specialtyId, targetFacultyId) {
  if (!profile) return;
  const sourceFaculty = findFaculty(specialtyId);
  const targetFaculty = profile.faculties.find(f => f.id === targetFacultyId);
  if (!sourceFaculty || !targetFaculty || sourceFaculty.id === targetFacultyId) return;

  const idx = sourceFaculty.specialties.findIndex(s => s.id === specialtyId);
  if (idx === -1) return;

  const [sp] = sourceFaculty.specialties.splice(idx, 1);
  targetFaculty.specialties.push(sp);
  save();
}

export function addProfile() {
  const id = incrementProfileIdCounter();
  const p = {
    id,
    name: "Человек " + id,
    userScore: 0,
    faculties: [],
    migrationPercent: 0,
    scenario: "current",
    idCounter: 0
  };
  state.profiles.push(p);
  setActiveProfile(p);
  save();
  return p;
}

export function removeProfile(id) {
  if (state.profiles.length <= 1) return;
  const idx = state.profiles.findIndex(p => p.id === id);
  if (idx === -1) return;

  state.profiles.splice(idx, 1);

  if (state.activeProfileId === id) {
    const newIdx = Math.min(idx, state.profiles.length - 1);
    setActiveProfile(state.profiles[newIdx]);
  }
  save();
}

export function renameProfile(id, name) {
  const p = state.profiles.find(p => p.id === id);
  if (p) {
    p.name = name;
    save();
  }
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
          const { ...rest } = s;
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
  },
  3(d) {
    for (const f of (d.faculties || [])) {
      for (const s of (f.specialties || [])) {
        if (s.isApplied === undefined) s.isApplied = false;
      }
    }
    d.version = 3;
    return d;
  },
  4(d) {
    for (const f of (d.faculties || [])) {
      for (const s of (f.specialties || [])) {
        delete s.planTarget;
        delete s.planPaid;
        delete s.appsTotal;
        delete s.appsTarget;
        delete s.appsNoExam;
        delete s.appsOutOfComp;
        delete s.appsByComp;
      }
    }
    d.version = 4;
    return d;
  },
  5(d) {
    const profileId = 1;
    d.profiles = [{
      id: profileId,
      name: "Человек 1",
      userScore: d.userScore || 0,
      faculties: (d.faculties || []).map(f => ({
        ...f,
        specialties: normalizeSpecialties(f.specialties)
      })),
      migrationPercent: d.migrationPercent || 0,
      scenario: d.scenario || "current",
      idCounter: d.idCounter || 0
    }];
    d.activeProfileId = profileId;
    d.profileIdCounter = profileId;
    delete d.userScore;
    delete d.faculties;
    delete d.migrationPercent;
    delete d.scenario;
    delete d.idCounter;
    d.version = 5;
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
  state.profiles = (d.profiles || []).map(p => ({
    id: p.id,
    name: p.name || "Человек",
    userScore: p.userScore || 0,
    faculties: (p.faculties || []).map(f => ({
      ...f,
      specialties: normalizeSpecialties(f.specialties)
    })),
    migrationPercent: p.migrationPercent || 0,
    scenario: p.scenario || "current",
    idCounter: p.idCounter || 0
  }));
  state.profileIdCounter = d.profileIdCounter || state.profiles.length || 1;

  const activeId = d.activeProfileId;
  const found = state.profiles.find(p => p.id === activeId);
  setActiveProfile(found || state.profiles[0] || null);

  if (d.version !== undefined && d.version !== STORAGE_VERSION) {
    save();
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    loadFromObject(JSON.parse(raw));
  } catch {}
}
