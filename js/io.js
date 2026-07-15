import { STORAGE_KEY, STORAGE_VERSION } from "./constants.js";
import { loadFromObject } from "./state.js";

export function exportData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const blob = new Blob([raw], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "uni-chance-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file, onReady) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Файл не содержит корректных данных");
      }
      if (data.version !== undefined && data.version > STORAGE_VERSION) {
        throw new Error(
          `Файл создан в более новой версии (${data.version}), ` +
          `а текущая версия приложения — ${STORAGE_VERSION}. ` +
          `Обновите приложение.`
        );
      }
      loadFromObject(data);
      onReady();
    } catch (err) {
      alert("Ошибка при загрузке файла: " + err.message);
    }
  };
  reader.readAsText(file);
}
