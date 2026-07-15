# uni-chance

Калькулятор вероятности поступления в вуз на основе данных о поданных заявлениях и распределении баллов.

## Запуск

Приложение — статический сайт с ES-модулями, поэтому нужен локальный HTTP-сервер (протокол `file://` не подходит).

**Python:**

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Node.js:**

```bash
npx serve .
npx http-server -p 8000
```

**PHP:**

```bash
php -S localhost:8000
```

**PowerShell (Windows):**

```powershell
Start-Process "http://localhost:8000/"
```

После запуска открой `http://localhost:8000/` в браузере.

## Функциональность

- **Ввод балла** — ЕГЭ-балл абитуриента (макс. 400)
- **Факультеты** —группировка специальностей по факультетам с аккордеоном
- **Специальности** — добавление направлений внутри факультета с параметрами:
  - План приёма (бюджет / целевики / платное)
  - Заявления (всего / целевики / без экзаменов / вне конкурса / по конкурсу)
  - Распределение баллов по 57 диапазонам (396+ до ≤115)
  - «Моя специальность» — по одной на факультет
  - Перенос специальности между факультетами
- **Расчёт вероятности** — процент шанса поступления, сгруппированный по факультетам
- **Миграция абитуриентов** — общий ползунок, расчёт в рамках каждого факультета
- **Три сценария**: текущий расчёт / лучший / худший
- **Персистентность** — данные сохраняются в `localStorage` с автоматической миграцией формата
- **Экспорт/Импорт** — сохранение данных в JSON-файл и загрузка с другого компьютера

## Структура файлов

```
uni-chance/
├── index.html              # Страница с HTML-шаблонами <template>
├── css/
│   ├── variables.css       # CSS-переменные :root
│   ├── base.css            # Сброс, layout, dialog
│   ├── components.css      # Кнопки, инпуты, слайдер
│   ├── cards.css           # Карточки факультетов/специальностей, результаты
│   └── responsive.css      # Адаптивность @media (max-width: 640px)
├── js/
│   ├── main.js             # Точка входа, init()
│   ├── state.js            # State, save(), load(), loadFromObject(), миграции
│   ├── constants.js        # SCORE_RANGES, newFaculty(), newSpecialty()
│   ├── calc.js             # calcProbability(), calcMigrationDist()
│   ├── io.js               # exportData(), importData()
│   ├── render.js           # render(), renderFaculties()
│   ├── utils/
│   │   ├── dom.js          # esc() — XSS-защита
│   │   └── ui.js           # getRangeIndex(), probabilityColor()
│   └── components/
│       ├── specialty.js    # syncCardToState(), renderCardResult()
│       ├── results.js      # renderResults() — по факультетам
│       └── dialog.js       # bindCardEvents(), bindFacultyEvents()
├── README.md
└── AGENT.md
```

## Технологии

- HTML5 (шаблоны `<template>`)
- CSS3 (переменные, flexbox, адаптивность до 640px)
- Vanilla JavaScript (ES6+, `"use strict"`, ES-модули)
- `localStorage` для хранения данных с версионированием формата
