# AGENT.md — uni-chance

## Обзор проекта

Калькулятор вероятности поступления в вуз. Пользователь вводит свой балл, добавляет факультеты со специальностями, заполняет данные о плане приёма и распределении баллов, а приложение рассчитывает процент шанса поступления. Данные сохраняются в браузере (localStorage).

Приложение полностью статичное — никаких фреймворков или сборщиков. Используются нативные ES-модули (`type="module"`). Требуется локальный HTTP-сервер для запуска (ES-модули не работают с `file://` протоколом из-за CORS):

```bash
python -m http.server 8000
```

Затем открой `http://localhost:8000/`.

## Структура файлов

```
uni-chance/
├── index.html              # Единственная страница, содержит HTML-шаблоны <template>
├── css/
│   ├── variables.css       # CSS-переменные :root
│   ├── base.css            # Сброс, body, container, dialog
│   ├── components.css      # Кнопки, инпуты, чекбоксы, слайдер, io-кнопки
│   ├── cards.css           # Карточки факультетов/специальностей, результаты, миграция
│   └── responsive.css      # Адаптивность @media (max-width: 640px)
├── js/
│   ├── main.js             # Точка входа: init(), подключение обработчиков
│   ├── state.js            # state, save(), load(), loadFromObject(), миграции, idCounter, moveSpecialty()
│   ├── constants.js        # SCORE_RANGES, STORAGE_VERSION, newFaculty(), newSpecialty()
│   ├── calc.js             # calcProbability, calcCompetitivePlaces, calcMigrationDist
│   ├── io.js               # exportData(), importData() — экспорт/импорт в JSON-файл
│   ├── render.js           # render(), renderFaculties()
│   ├── utils/
│   │   ├── dom.js          # esc() — XSS-защита
│   │   └── ui.js           # getRangeIndex(), probabilityColor(), statusLabel()
│   └── components/
│       ├── specialty.js    # syncCardToState(), renderDistInputs(), renderCardResult()
│       ├── results.js      # renderResults() — результаты по факультетам
│       └── dialog.js       # bindCardEvents(), bindFacultyEvents()
├── README.md
└── AGENT.md
```

## Архитектура и паттерны

### ES-модули

Каждый JS-файл — отдельный ES-модуль с `export`/`import`. Точка входа — `js/main.js`, подключается через `<script type="module">`. Браузер сам разрешает граф зависимостей без сборщиков.

### State-driven рендеринг

```
state (объект) → render() → DOM
     ↑                        |
     └──── save() ← localStorage
```

- `state` — единственный источник правды (userScore, faculties[], migrationPercent, scenario)
- `render()` вызывается при любом изменении state
- `save()` сериализует state в localStorage (ключ `uni-chance-data`)
- `load()` восстанавливает state из localStorage при инициализации

### Шаблонизация

Два HTML-шаблона в `index.html`:
- `<template id="facultyTemplate">` — карточка факультета (аккордеон)
- `<template id="specialtyTemplate">` — карточка специальности (вкладывается в факультет)

При добавлении факультета/специальности — `cloneNode(true)` и вставка в DOM.

### Иерархия данных

```
state
├── userScore: number
├── migrationPercent: number (общий ползунок)
├── scenario: "current" | "best" | "worst"
└── faculties: Faculty[]
    ├── id: number
    ├── name: string
    ├── collapsed: boolean
    └── specialties: Specialty[]
        ├── id: number
        ├── name: string
        ├── isTarget: boolean (Моя — по одной на факультет)
        ├── isApplied: boolean (Подал сюда — одна на все факультеты)
        ├── plan: number (конкурсные места)
        └── scoreDist: number[57]
```

### Карта модулей

| Модуль | Назначение |
|--------|-----------|
| `js/main.js` | Точка входа, init(), привязка глобальных обработчиков |
| `js/state.js` | Объект state, save(), load(), loadFromObject(), миграции, moveSpecialty(), findFaculty() |
| `js/constants.js` | SCORE_RANGES (57 диапазонов), STORAGE_VERSION, newFaculty(), newSpecialty() |
| `js/calc.js` | calcProbability(), calcCompetitivePlaces(), calcMigrationDist(), calcAppsTotal() |
| `js/io.js` | exportData() — скачивание JSON-файла, importData() — загрузка и миграция |
| `js/render.js` | render(), renderFaculties() |
| `js/utils/dom.js` | esc() — XSS-защита |
| `js/utils/ui.js` | getRangeIndex(), probabilityColor(), statusLabel() |
| `js/components/specialty.js` | syncCardToState(), renderDistInputs(), renderCardResult() |
| `js/components/results.js` | renderResults() — результаты по факультетам |
| `js/components/dialog.js` | bindCardEvents(), bindFacultyEvents() |

### CSS-модули

| Файл | Содержимое |
|------|-----------|
| `css/variables.css` | Все CSS-переменные `:root` |
| `css/base.css` | Глобальный сброс, layout, dialog |
| `css/components.css` | Повторяющиеся элементы: кнопки, инпуты, слайдер, io-кнопки |
| `css/cards.css` | Карточки факультетов/специальностей, результаты |
| `css/responsive.css` | Адаптивность при 640px |

### Диапазоны баллов

Массив `SCORE_RANGES` содержит 57 объектов `{ label, min, max }` от "396+" до "≤115". Используется для распределения баллов абитуриентов и определения позиции пользователя.

## Конвенции кода

- **Язык:** JavaScript ES6+ в строгом режиме (`"use strict"`)
- **Модульность:** ES-модули (`import`/`export`), `type="module"` в script-теге
- **CSS:** переменные в `:root`, Apple-like минималистичный стиль, разбивка по компонентам
- **Адаптивность:** медиа-запрос `@media (max-width: 640px)` в `responsive.css`
- **Ввод данных:** все числовые поля — `<input type="number">`, парсятся через `parseInt() || 0`
- **XSS:** любое пользовательское текстовое значение экранируется через `esc()`
- **Сохранение:** localStorage, ключ `uni-chance-data`, JSON-сериализация с try/catch

## Миграция данных

При изменении структуры localStorage используется реестр миграций `MIGRATIONS` в `state.js`:

- Каждая миграция — функция с ключом, равным целевой версии (например, `2` — миграция в v2)
- `migrate(d)` — цикл по миграциям от текущей версии до `STORAGE_VERSION`
- `loadFromObject(d)` — общая функция для загрузки из localStorage и из импортируемого файла
- При импорте файла со старой версией — автоматическая миграция
- При импорте файла с версией новее текущей — ошибка

История версий:
- v1: плоский массив `specialties[]` с полем `faculty`
- v2: иерархическая структура `faculties[].specialties[]`
- v3: добавлено поле `isApplied` (Подал сюда) в специальности
- v4: упрощена структура специальности — только `plan` (конкурсные места), `appsTotal` вычисляется как `sum(scoreDist)`

Версия формата хранится в поле `version` объекта localStorage.

## Запреты

1. **Не добавлять зависимости** — никакого npm, фреймворков, библиотек
2. **Не добавлять сборщики** — никакого webpack, vite, rollup и т.д.
3. **Не менять формат localStorage** — ключ `uni-chance-data`, версионирование через `version`
4. **Не ломать адаптивность** — медиа-запрос при 640px должен работать
5. **Не удалять шаблоны `<template>`** — они используются для динамического добавления
6. **Использовать только нативные ES-модули** — не вводить CommonJS, AMD или глобальные переменные

## Как вносить изменения

1. Определите, какое состояние меняется (state-свойство)
2. Если добавляется новое поле — обновите конструктор в `constants.js`, шаблон в HTML, `syncCardToState()` в `components/specialty.js`, обработчики в `components/dialog.js`, `save()`/`load()`/`loadFromObject()` в `state.js`
3. Если меняется логика расчёта — работайте с `calcProbability()` или `calcMigrationDist()` в `calc.js`
4. Если добавляется новый UI-элемент — добавьте в `index.html`, стилизуйте в соответствующем CSS-файле, привяжите обработчик в `components/`
5. Если нужна новая миграция — добавьте функцию в реестр `MIGRATIONS` в `state.js` и обновите `STORAGE_VERSION` в `constants.js`
6. **После изменений обновите README.md и AGENT.md**, чтобы документация оставалась актуальной
7. **Перед каждым коммитом** проверять изменяемые файлы командой `npx eslint <файлы>` на неиспользованные импорты, неиспользованные переменные и синтаксические ошибки. При наличии ошибок — исправить их перед коммитом
8. **Перед каждым коммитом** добавлять в индекс (`git add`) только файлы, относящиеся к изменению. Каждый файл добавлять осознанно — запрещены `git add .` и `git add -A`

## Актуальность документации

> **Правило:** после каждого изменения в кодовой базе агент обязан пересмотреть README.md и AGENT.md и внести правки, если описание, структура файлов, ключевые функции или конвенции изменились. Документация должна соответствовать текущему состоянию кода.
