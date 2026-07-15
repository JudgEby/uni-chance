import { SCORE_RANGES } from "./constants.js";
import { getRangeIndex } from "./utils/ui.js";

export function calcCompetitivePlaces(sp) {
  return Math.max(0, sp.plan);
}

export function calcAppsTotal(sp) {
  return sp.scoreDist.reduce((a, b) => a + b, 0);
}

export function calcProbability(sp, userScore, extraDist, virtualUser) {
  if (!userScore || userScore <= 0) return null;

  let dist = [...sp.scoreDist];
  if (virtualUser) {
    dist[getRangeIndex(userScore)] += 1;
  }
  if (extraDist) {
    dist = dist.map((v, i) => v + (extraDist[i] || 0));
  }
  const competitive = calcCompetitivePlaces(sp);
  const userRangeIdx = getRangeIndex(userScore);

  let peopleAbove = 0;
  for (let i = 0; i < userRangeIdx; i++) peopleAbove += dist[i];
  const peopleInRange = dist[userRangeIdx];

  if (competitive <= 0) return { prob: 0, competitive, peopleAbove, peopleInRange, status: "none" };

  if (peopleAbove >= competitive) {
    return { prob: 0, competitive, peopleAbove, peopleInRange, status: "fail" };
  }

  if (peopleAbove + peopleInRange <= competitive) {
    return { prob: 100, competitive, peopleAbove, peopleInRange, status: "ok" };
  }

  const remaining = competitive - peopleAbove;
  const range = SCORE_RANGES[userRangeIdx];
  let positionFactor = 0.5;
  if (range.max === Infinity) {
    positionFactor = 1;
  } else if (range.min === -Infinity) {
    positionFactor = 0;
  } else {
    positionFactor = (userScore - range.min) / (range.max - range.min);
  }

  const baseProb = remaining / peopleInRange;
  const adjustedProb = baseProb * (1 - positionFactor * 0.4);
  const prob = Math.max(0, Math.min(100, Math.round(adjustedProb * 100)));

  return { prob, competitive, peopleAbove, peopleInRange, status: "boundary" };
}

export function calcMigrationDist(targetSp, facultySpecialties, migrationPercent) {
  if (migrationPercent <= 0) return null;

  const totalDist = new Array(57).fill(0);
  let hasMigration = false;

  for (const sp of facultySpecialties) {
    if (sp.id === targetSp.id) continue;

    const competitive = calcCompetitivePlaces(sp);
    const dist = [...sp.scoreDist];

    let cumul = 0;
    let cutoffIdx = -1;
    for (let i = 0; i < 57; i++) {
      cumul += dist[i];
      if (cumul > competitive) { cutoffIdx = i; break; }
    }

    if (cutoffIdx === -1) continue;

    let excessTotal = 0;
    const excessByRange = new Array(57).fill(0);

    const cumulAtCutoff = dist.slice(0, cutoffIdx + 1).reduce((a, b) => a + b, 0);
    const excessInCutoff = cumulAtCutoff - competitive;
    if (excessInCutoff > 0) {
      excessByRange[cutoffIdx] = excessInCutoff;
      excessTotal += excessInCutoff;
    }

    for (let i = cutoffIdx + 1; i < 57; i++) {
      if (dist[i] > 0) {
        excessByRange[i] = dist[i];
        excessTotal += dist[i];
      }
    }

    if (excessTotal <= 0) continue;

    for (let i = 0; i < 57; i++) {
      const migrated = Math.round(excessByRange[i] * migrationPercent / 100);
      if (migrated > 0) {
        totalDist[i] += migrated;
        hasMigration = true;
      }
    }
  }

  return hasMigration ? totalDist : null;
}

export function calcWorstCaseMigrationDist(targetSp, facultySpecialties, migrationPercent) {
  if (migrationPercent <= 0) return null;
  return calcMigrationDist(targetSp, facultySpecialties, migrationPercent);
}
