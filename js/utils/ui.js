import { SCORE_RANGES } from "../constants.js";

export function getRangeIndex(score) {
  for (let i = 0; i < SCORE_RANGES.length; i++) {
    if (score >= SCORE_RANGES[i].min && score <= SCORE_RANGES[i].max) return i;
  }
  return SCORE_RANGES.length - 1;
}

export function probabilityColor(prob) {
  if (prob >= 80) return "#34c759";
  if (prob >= 50) return "#8ac148";
  if (prob >= 30) return "#ffcc00";
  if (prob >= 10) return "#ff9500";
  return "#ff3b30";
}

export function statusLabel(status) {
  if (status === "ok") return "Поступаешь";
  if (status === "boundary") return "Пограничная зона";
  if (status === "fail") return "Не поступаешь";
  return "Нет данных";
}
