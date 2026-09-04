# TalentFlow HR-tech Dashboard

Production-ready демонстрационный dashboard в эстетике современного российского HR-tech SaaS. Проект написан только на HTML5, CSS3 и Vanilla JavaScript, не использует UI-фреймворки и сторонние библиотеки для графиков.

## Запуск

Проект работает как обычный статический сайт.

1. Откройте `index.html` в браузере.
2. Для страницы аналитики откройте `analytics.html`.
3. Для разработки можно запустить любой локальный статический сервер, например:

```bash
python3 -m http.server 8000
```

После этого откройте `http://localhost:8000/index.html`.

## Дерево файлов

```text
hr-tech-dashboard/
├── index.html
├── analytics.html
├── README.md
├── css/
│   ├── tokens.css
│   ├── reset.css
│   ├── utilities.css
│   ├── components.css
│   ├── layout.css
│   └── dashboard.css
└── js/
    ├── components.js
    ├── charts.js
    └── dashboard.js
```

## Архитектура

- `tokens.css` — цвета, spacing, типографика, радиусы, тени и размеры shell.
- `reset.css` — базовый reset и общие focus-состояния.
- `utilities.css` — небольшой набор осмысленных utility-классов.
- `components.css` — универсальные UI-примитивы без page-specific стилей.
- `layout.css` — sidebar, topbar, page shell и адаптивный mobile drawer.
- `dashboard.css` — только композиция dashboard и analytics страниц.
- `components.js` — DOM-генераторы компонентов и объект `UI`.
- `charts.js` — адаптивные SVG line chart и donut chart.
- `dashboard.js` — единый объект данных, состояние, рендеринг страниц и интерактивность.

## Доступные UI-компоненты

```js
UI.card(options)
UI.statCard(options)
UI.button(options)
UI.badge(options)
UI.avatar(options)
UI.listItem(options)
UI.table(options)
UI.dropdown(options)
UI.tabs(options)
UI.progress(options)
UI.iconButton(options)
UI.emptyState(options)
UI.pagination(options)
UI.searchInput(options)
UI.field(options)
UI.modal(options)
UI.toast(options)
UI.pageHeader(options)
UI.sidebar(options)
UI.topbar(options)
UI.icon(name, options)
```

Также доступны глобальные алиасы:

```js
createCard(options)
createStatCard(options)
createBadge(options)
createButton(options)
createAvatar(options)
createListItem(options)
createTable(options)
createLineChart(options)
createDonutChart(options)
```

## Примеры использования

### Card

```js
const card = UI.card({
  title: 'Название карточки',
  subtitle: 'Дополнительное описание',
  body: document.createTextNode('Содержимое карточки'),
  footer: document.createTextNode('Подвал карточки')
});

document.querySelector('#target').append(card);
```

### Stat card

```js
const stat = UI.statCard({
  label: 'Отклики',
  value: '1 430',
  delta: '+12%',
  trend: 'up',
  icon: 'messages'
});
```

### Button

```js
const button = UI.button({
  label: 'Скачать отчёт',
  variant: 'secondary',
  size: 'sm',
  icon: 'download',
  onClick() {
    UI.toast({
      title: 'Готово',
      message: 'Отчёт сформирован.',
      variant: 'success'
    });
  }
});
```

### Badge

```js
const badge = UI.badge({
  label: 'Активна',
  variant: 'success'
});
```

### Avatar

```js
const avatar = UI.avatar({
  name: 'Анна Воронова',
  size: 'md',
  status: true
});
```

### List item

```js
const item = UI.listItem({
  avatar: UI.avatar({ name: 'Иван Петров', size: 'md' }),
  title: 'Иван Петров',
  subtitle: 'Менеджер по продажам',
  meta: '2 мин назад',
  onClick() {
    console.log('Открыть кандидата');
  }
});
```

### Table

```js
const table = UI.table({
  caption: 'Список вакансий',
  columns: [
    { key: 'title', label: 'Вакансия' },
    { key: 'applications', label: 'Отклики', align: 'right' },
    {
      key: 'status',
      label: 'Статус',
      sortable: false,
      render: (row) => UI.badge({
        label: row.status,
        variant: 'success'
      })
    }
  ],
  rows: [
    { title: 'Frontend-разработчик', applications: 165, status: 'Активна' }
  ]
});
```

Доступные методы экземпляра таблицы:

```js
table.updateRows(nextRows);
table.setSort('applications', 'desc');
table.clearSort();
table.getSort();
```

### Dropdown

```js
const dropdown = UI.dropdown({
  label: 'Период',
  value: 'seven',
  options: [
    { value: 'seven', label: '7 дней' },
    { value: 'thirty', label: '30 дней' }
  ],
  onChange(value) {
    console.log(value);
  }
});
```

### Tabs

```js
const tabs = UI.tabs({
  activeId: 'overview',
  items: [
    { id: 'overview', label: 'Обзор' },
    { id: 'funnel', label: 'Воронка' }
  ],
  onChange(tabId) {
    console.log(tabId);
  }
});
```

### Progress

```js
const progress = UI.progress({
  value: 72,
  max: 100,
  label: 'Заполнение вакансии: 72%'
});
```

### Pagination

```js
const pagination = UI.pagination({
  page: 1,
  totalPages: 5,
  onChange(page) {
    console.log(page);
  }
});
```

### Empty state

```js
const emptyState = UI.emptyState({
  title: 'Откликов пока нет',
  description: 'Новые кандидаты появятся здесь.',
  icon: 'inbox',
  action: UI.button({
    label: 'Открыть вакансии',
    variant: 'secondary'
  })
});
```

### Modal

```js
const modal = UI.modal({
  title: 'Новая вакансия',
  description: 'Заполните основные поля.',
  content: UI.field({
    label: 'Название',
    name: 'title',
    required: true
  })
});

document.querySelector('#app-overlays').append(modal.element);
modal.open();

// Позже:
modal.close();
```

### Toast

```js
UI.toast({
  title: 'Вакансия создана',
  message: 'Позиция добавлена в список.',
  variant: 'success',
  duration: 3600
});
```

### Line chart

```js
createLineChart({
  element: document.querySelector('#chart'),
  labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
  values: [120, 180, 160, 240, 280]
});
```

Основной цвет автоматически берётся из `--color-primary`.

### Donut chart

```js
createDonutChart({
  element: document.querySelector('#donut'),
  value: 6.2,
  max: 100,
  label: 'конверсия'
});
```

## Как создать новую dashboard-страницу

1. Скопируйте структуру shell из `analytics.html`.
2. Оставьте в HTML только layout-контейнеры с понятными `id`.
3. Подключите те же CSS-файлы без копирования стилей.
4. Подключите `components.js` и `charts.js` перед скриптом страницы.
5. Опишите данные одним объектом.
6. Рендерите содержимое через `UI.*` и `Charts.*`.
7. Добавляйте в `dashboard.css` только сетку и композицию новой страницы.

Минимальный контейнер:

```html
<main class="page" id="main-content">
  <div class="page-header" id="page-header"></div>
  <div class="page-content">
    <section id="new-page-stats"></section>
    <section id="new-page-chart"></section>
    <section id="new-page-table"></section>
  </div>
</main>
```

Пример рендера:

```js
const pageData = {
  stats: [
    { label: 'Новые кандидаты', value: '248', delta: '+9%', trend: 'up', icon: 'users' }
  ]
};

const statsTarget = document.querySelector('#new-page-stats');
statsTarget.replaceChildren(
  ...pageData.stats.map((item) => UI.statCard(item))
);
```

## Полный ребрендинг через CSS variables

Для основного ребрендинга достаточно изменить значения в `css/tokens.css`.

### Брендовые цвета

```css
:root {
  --color-primary: #e31e24;
  --color-primary-hover: #c9181e;
  --color-primary-active: #ad1419;
  --color-primary-soft: #fff0f1;
  --color-primary-soft-hover: #ffe3e5;
}
```

### Фон, поверхности и текст

```css
:root {
  --color-bg: #f7f7f8;
  --color-bg-translucent: rgba(247, 247, 248, 0.92);
  --color-surface: #ffffff;
  --color-surface-muted: #f1f2f4;
  --color-text: #171719;
  --color-text-secondary: #6f7278;
  --color-border: #e8e9ec;
}
```

### Семантические цвета

```css
:root {
  --color-success: #168a4a;
  --color-warning: #d97706;
  --color-danger: #d92d20;
  --color-info: #2563eb;
}
```

### Геометрия и плотность

```css
:root {
  --radius-sm: 0.5rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.75rem;
  --radius-xl: 0.875rem;

  --sidebar-width: 232px;
  --header-height: 72px;
  --content-max-width: 1440px;
}
```

### Типографика

```css
:root {
  --font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.375rem;
  --font-size-2xl: 1.875rem;
}
```

SVG-графики получают основной цвет через `getComputedStyle(document.documentElement).getPropertyValue('--color-primary')`, поэтому после изменения токенов автоматически обновляются вместе со всем интерфейсом.

## Реализованная интерактивность

- active state sidebar;
- адаптивный mobile drawer и backdrop;
- dropdown выбора глобального периода;
- отдельный dropdown периода line chart;
- keyboard-friendly tabs и dropdown;
- SVG tooltip для точек line chart;
- sortable table columns;
- поиск и фильтр вакансий;
- pagination;
- modal создания вакансии;
- toast notifications;
- CSV-экспорт вакансий и аналитики;
- повторное использование компонентов на `analytics.html`.
