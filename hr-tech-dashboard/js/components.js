(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

  const ICON_PATHS = {
    home: ['M3.5 10.5 12 3l8.5 7.5', 'M5.5 9.5V21h13V9.5', 'M9.5 21v-6h5v6'],
    briefcase: ['M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7', 'M3 8.5h18v10A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5z', 'M3 12.5c5.8 2.7 12.2 2.7 18 0', 'M10 14h4'],
    users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    inbox: ['M4 4h16l2 12v4H2v-4z', 'M2 16h5l2 2h6l2-2h5'],
    chart: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20V8', 'M2 20h22'],
    calendar: ['M5 3v4', 'M19 3v4', 'M3 9h18', 'M4 5h16a1 1 0 0 1 1 1v15H3V6a1 1 0 0 1 1-1z', 'M7 13h3', 'M14 13h3', 'M7 17h3'],
    message: ['M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z', 'M8 9h8', 'M8 13h5'],
    settings: ['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7', 'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 3.67-.08-.02a1.7 1.7 0 0 0-1.8.17 1.7 1.7 0 0 0-.8 1.56V22h-4v-.08a1.7 1.7 0 0 0-.8-1.56 1.7 1.7 0 0 0-1.8-.17l-.08.02-2.12-3.67.06-.06A1.7 1.7 0 0 0 6.6 15a1.7 1.7 0 0 0-1.54-.88H5V9.88h.06A1.7 1.7 0 0 0 6.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-3.67.08.02a1.7 1.7 0 0 0 1.8-.17A1.7 1.7 0 0 0 11 1.68V1.6h4v.08a1.7 1.7 0 0 0 .8 1.56 1.7 1.7 0 0 0 1.8.17l.08-.02 2.12 3.67-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.54.88H21v4.24h-.06a1.7 1.7 0 0 0-1.54.88z'],
    bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4'],
    chevronDown: ['m6 9 6 6 6-6'],
    chevronRight: ['m9 18 6-6-6-6'],
    chevronLeft: ['m15 18-6-6 6-6'],
    menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
    download: ['M12 3v12', 'm7 10 5 5 5-5', 'M4 21h16'],
    plus: ['M12 5v14', 'M5 12h14'],
    messages: ['M20 11a7 7 0 0 1-7 7H7l-4 3V11a7 7 0 0 1 7-7h3a7 7 0 0 1 7 7z', 'M8 10h8', 'M8 14h5'],
    eye: ['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6'],
    send: ['m22 2-7 20-4-9-9-4z', 'M22 2 11 13'],
    checkCircle: ['M22 11.1V12a10 10 0 1 1-5.93-9.14', 'm22 4-10 10-3-3'],
    more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
    search: ['m21 21-4.35-4.35', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14'],
    arrowUp: ['m18 15-6-6-6 6'],
    arrowDown: ['m6 9 6 6 6-6'],
    trendUp: ['M3 17 9 11l4 4 8-8', 'M15 7h6v6'],
    trendDown: ['M3 7l6 6 4-4 8 8', 'M15 17h6v-6'],
    file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'm14 2 6 6h-6z', 'M8 13h8', 'M8 17h6'],
    target: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4'],
    close: ['M6 6l12 12', 'M18 6 6 18'],
    check: ['m5 12 4 4L19 6'],
    clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'M12 6v6l4 2'],
    filter: ['M4 5h16', 'M7 12h10', 'M10 19h4'],
    user: ['M20 21a8 8 0 0 0-16 0', 'M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10'],
    pause: ['M9 5v14', 'M15 5v14'],
    play: ['m8 5 11 7-11 7z'],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'M12 11v6', 'M12 7h.01'],
    spark: ['m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z', 'm5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8z', 'm19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z'],
    logout: ['M10 17l5-5-5-5', 'M15 12H3', 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4'],
    sort: ['M8 7h8', 'm12 3 4 4-4 4'],
    building: ['M4 21V5l8-3 8 3v16', 'M9 9h.01', 'M15 9h.01', 'M9 13h.01', 'M15 13h.01', 'M9 17h.01', 'M15 17h.01'],
    money: ['M12 2v20', 'M17 6H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6'],
    bolt: ['m13 2-9 12h8l-1 8 9-12h-8z']
  };

  function createElement(tagName, className, attributes = {}) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    Object.entries(attributes).forEach(([name, value]) => {
      if (value === undefined || value === null || value === false) {
        return;
      }
      if (name === 'text') {
        element.textContent = String(value);
      } else if (name === 'dataset' && typeof value === 'object') {
        Object.assign(element.dataset, value);
      } else if (name in element && name !== 'role' && name !== 'ariaLabel') {
        try {
          element[name] = value;
        } catch (error) {
          element.setAttribute(name, String(value));
        }
      } else {
        element.setAttribute(name === 'ariaLabel' ? 'aria-label' : name, String(value));
      }
    });
    return element;
  }

  function createSvgElement(tagName, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tagName);
    Object.entries(attributes).forEach(([name, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(name, String(value));
      }
    });
    return element;
  }

  function appendContent(parent, content) {
    if (content === undefined || content === null || content === false) {
      return parent;
    }
    if (Array.isArray(content)) {
      content.forEach((item) => appendContent(parent, item));
      return parent;
    }
    if (content instanceof Node) {
      parent.append(content);
      return parent;
    }
    parent.append(document.createTextNode(String(content)));
    return parent;
  }

  function createIcon(name, options = {}) {
    const { size = 20, title = '' } = options;
    const svg = createSvgElement('svg', {
      class: 'icon',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': title ? 'false' : 'true',
      focusable: 'false'
    });

    if (title) {
      const titleElement = createSvgElement('title');
      titleElement.textContent = title;
      svg.append(titleElement);
    }

    const paths = ICON_PATHS[name] || ICON_PATHS.spark;
    paths.forEach((pathData) => {
      const path = createSvgElement('path', { d: pathData });
      if (pathData.endsWith('.01')) {
        path.setAttribute('stroke-width', '3');
      }
      svg.append(path);
    });
    return svg;
  }

  function getInitials(name = '') {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('') || '—';
  }

  function createButton(options = {}) {
    const {
      label = '',
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'start',
      type = 'button',
      ariaLabel,
      disabled = false,
      className = '',
      onClick
    } = options;

    const classes = ['btn', `btn--${variant}`];
    if (size && size !== 'md') {
      classes.push(`btn--${size}`);
    }
    if (!label) {
      classes.push('btn--icon');
    }
    if (className) {
      classes.push(className);
    }

    const button = createElement('button', classes.join(' '), { type, disabled });
    if (ariaLabel || !label) {
      button.setAttribute('aria-label', ariaLabel || label || 'Действие');
    }

    const iconElement = icon ? createIcon(icon, { size: size === 'lg' ? 22 : 18 }) : null;
    const labelElement = label ? createElement('span', 'btn__label', { text: label }) : null;

    if (iconPosition === 'end') {
      appendContent(button, [labelElement, iconElement]);
    } else {
      appendContent(button, [iconElement, labelElement]);
    }

    if (typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    return button;
  }

  function createIconButton(options = {}) {
    const {
      icon = 'more',
      label = 'Действие',
      bordered = false,
      indicator = false,
      className = '',
      onClick
    } = options;
    const classes = ['icon-button'];
    if (bordered) {
      classes.push('icon-button--bordered');
    }
    if (className) {
      classes.push(className);
    }
    const button = createElement('button', classes.join(' '), {
      type: 'button',
      ariaLabel: label,
      title: label
    });
    button.append(createIcon(icon));
    if (indicator) {
      button.append(createElement('span', 'icon-button__indicator', { 'aria-hidden': 'true' }));
    }
    if (typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    return button;
  }

  function createBadge(options = {}) {
    const { label = '', variant = 'neutral', icon, className = '' } = options;
    const classes = ['badge', `badge--${variant}`];
    if (className) {
      classes.push(className);
    }
    const badge = createElement('span', classes.join(' '));
    if (icon) {
      badge.append(createIcon(icon, { size: 14 }));
    }
    badge.append(document.createTextNode(label));
    return badge;
  }

  function createAvatar(options = {}) {
    const {
      name = '',
      size = 'md',
      src = '',
      alt = '',
      status = false,
      className = ''
    } = options;
    const classes = ['avatar', `avatar--${size}`];
    if (className) {
      classes.push(className);
    }
    const avatar = createElement('span', classes.join(' '), {
      title: name,
      ariaLabel: alt || name || 'Пользователь',
      role: 'img'
    });
    if (src) {
      const image = createElement('img', '', { src, alt: alt || name, loading: 'lazy' });
      avatar.append(image);
    } else {
      avatar.append(document.createTextNode(getInitials(name)));
    }
    if (status) {
      avatar.append(createElement('span', 'avatar__status', { 'aria-hidden': 'true' }));
    }
    return avatar;
  }

  function createCard(options = {}) {
    const {
      title,
      subtitle,
      body,
      footer,
      headerActions,
      variant,
      className = '',
      bodyClassName = '',
      ariaLabel,
      headingLevel = 2
    } = options;
    const classes = ['card'];
    if (variant) {
      classes.push(`card--${variant}`);
    }
    if (className) {
      classes.push(className);
    }
    const card = createElement('article', classes.join(' '));
    if (ariaLabel) {
      card.setAttribute('aria-label', ariaLabel);
    }

    if (title || subtitle || headerActions) {
      const header = createElement('header', 'card__header');
      const heading = createElement('div', 'card__heading');
      if (title) {
        const safeLevel = Math.min(6, Math.max(2, Number(headingLevel) || 2));
        heading.append(createElement(`h${safeLevel}`, 'card__title', { text: title }));
      }
      if (subtitle) {
        heading.append(createElement('p', 'card__subtitle', { text: subtitle }));
      }
      header.append(heading);
      if (headerActions) {
        const actions = createElement('div', 'card__actions');
        appendContent(actions, headerActions);
        header.append(actions);
      }
      card.append(header);
    }

    if (body !== undefined) {
      const bodyElement = createElement('div', ['card__body', bodyClassName].filter(Boolean).join(' '));
      appendContent(bodyElement, body);
      card.append(bodyElement);
    }

    if (footer !== undefined) {
      const footerElement = createElement('footer', 'card__footer');
      appendContent(footerElement, footer);
      card.append(footerElement);
    }
    return card;
  }

  function createStatCard(options = {}) {
    const {
      label = '',
      value = '0',
      delta = '',
      trend = 'neutral',
      icon = 'chart',
      hint = 'к прошлому периоду',
      compact = false,
      className = ''
    } = options;
    const classes = ['stat-card'];
    if (compact) {
      classes.push('stat-card--compact');
    }
    if (className) {
      classes.push(className);
    }

    const card = createElement('article', classes.join(' '));
    const content = createElement('div', 'stat-card__content');
    content.append(createElement('p', 'stat-card__label', { text: label }));
    content.append(createElement('p', 'stat-card__value', { text: value }));

    const meta = createElement('div', 'stat-card__meta');
    if (delta) {
      const deltaElement = createElement('span', `stat-card__delta stat-card__delta--${trend}`);
      if (trend === 'up') {
        deltaElement.append(createIcon('trendUp', { size: 14 }));
      } else if (trend === 'down') {
        deltaElement.append(createIcon('trendDown', { size: 14 }));
      }
      deltaElement.append(document.createTextNode(delta));
      meta.append(deltaElement);
    }
    if (hint) {
      meta.append(createElement('span', 'stat-card__hint', { text: hint }));
    }
    content.append(meta);

    const iconWrap = createElement('div', 'stat-card__icon', { 'aria-hidden': 'true' });
    iconWrap.append(createIcon(icon, { size: 22 }));
    card.append(content, iconWrap);
    return card;
  }

  function createProgress(options = {}) {
    const { value = 0, max = 100, label = 'Прогресс', variant = 'primary' } = options;
    const safeMax = Number(max) > 0 ? Number(max) : 100;
    const safeValue = Math.min(safeMax, Math.max(0, Number(value) || 0));
    const percentage = (safeValue / safeMax) * 100;
    const classes = ['progress'];
    if (variant && variant !== 'primary') {
      classes.push(`progress--${variant}`);
    }
    const root = createElement('div', classes.join(' '), {
      role: 'progressbar',
      ariaLabel: label,
      'aria-valuemin': '0',
      'aria-valuemax': String(safeMax),
      'aria-valuenow': String(safeValue)
    });
    const svg = createSvgElement('svg', {
      viewBox: '0 0 100 6',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
      focusable: 'false'
    });
    const bar = createSvgElement('rect', {
      class: 'progress__bar',
      x: 0,
      y: 0,
      width: percentage,
      height: 6,
      rx: 3
    });
    svg.append(bar);
    root.append(svg);
    return root;
  }

  function createListItem(options = {}) {
    const {
      avatar,
      leading,
      title = '',
      subtitle = '',
      meta = '',
      trailing,
      progress,
      onClick,
      ariaLabel,
      className = ''
    } = options;
    const interactive = typeof onClick === 'function';
    const item = createElement(interactive ? 'button' : 'div', [
      'list-item',
      interactive ? 'list-item--interactive' : '',
      className
    ].filter(Boolean).join(' '), interactive ? { type: 'button', ariaLabel: ariaLabel || title } : {});

    if (avatar || leading) {
      const leadingElement = createElement('div', 'list-item__leading');
      appendContent(leadingElement, avatar || leading);
      item.append(leadingElement);
    }

    const content = createElement('div', 'list-item__content');
    const titleRow = createElement('div', 'list-item__title-row');
    titleRow.append(createElement('p', 'list-item__title', { text: title }));
    if (meta) {
      titleRow.append(createElement('span', 'list-item__meta', { text: meta }));
    }
    content.append(titleRow);
    if (subtitle) {
      content.append(createElement('p', 'list-item__subtitle', { text: subtitle }));
    }
    if (progress) {
      const progressWrap = createElement('div', 'list-item__progress');
      progressWrap.append(createProgress(progress));
      content.append(progressWrap);
    }
    item.append(content);

    if (trailing) {
      const trailingElement = createElement('div', 'list-item__trailing');
      appendContent(trailingElement, trailing);
      item.append(trailingElement);
    }

    if (interactive) {
      item.addEventListener('click', onClick);
    }
    return item;
  }

  function createSearchInput(options = {}) {
    const {
      placeholder = 'Поиск',
      value = '',
      ariaLabel = placeholder,
      onInput,
      name = 'search'
    } = options;
    const wrapper = createElement('label', 'search-input-wrap');
    const hiddenLabel = createElement('span', 'visually-hidden', { text: ariaLabel });
    const icon = createElement('span', 'search-input-wrap__icon', { 'aria-hidden': 'true' });
    icon.append(createIcon('search', { size: 18 }));
    const input = createElement('input', 'search-input', {
      type: 'search',
      name,
      placeholder,
      value,
      ariaLabel
    });
    wrapper.append(hiddenLabel, icon, input);
    if (typeof onInput === 'function') {
      input.addEventListener('input', (event) => onInput(event.target.value, event));
    }
    wrapper.input = input;
    return wrapper;
  }

  function createField(options = {}) {
    const {
      label,
      name,
      type = 'text',
      value = '',
      placeholder = '',
      required = false,
      hint = '',
      options: selectOptions = [],
      full = false
    } = options;
    const wrapper = createElement('label', `field${full ? ' form-grid__full' : ''}`);
    if (label) {
      wrapper.append(createElement('span', 'field__label', { text: label }));
    }
    let control;
    if (type === 'select') {
      control = createElement('select', 'select', { name, required });
      selectOptions.forEach((option) => {
        const optionElement = createElement('option', '', {
          value: option.value,
          text: option.label,
          selected: option.value === value
        });
        control.append(optionElement);
      });
    } else if (type === 'textarea') {
      control = createElement('textarea', 'input', { name, placeholder, required });
      control.value = value;
    } else {
      control = createElement('input', 'input', { name, type, value, placeholder, required });
    }
    wrapper.append(control);
    if (hint) {
      wrapper.append(createElement('span', 'field__hint', { text: hint }));
    }
    wrapper.inputControl = control;
    return wrapper;
  }

  function createTabs(options = {}) {
    const {
      items = [],
      activeId = items[0]?.id,
      onChange,
      ariaLabel = 'Разделы'
    } = options;
    const root = createElement('div', 'tabs', { role: 'tablist', ariaLabel });
    let currentId = activeId;

    function update(nextId, emit = true) {
      currentId = nextId;
      root.querySelectorAll('.tabs__item').forEach((button) => {
        const isActive = button.dataset.tabId === currentId;
        button.classList.toggle('tabs__item--active', isActive);
        button.setAttribute('aria-selected', String(isActive));
        button.tabIndex = isActive ? 0 : -1;
      });
      if (emit && typeof onChange === 'function') {
        onChange(currentId);
      }
    }

    items.forEach((item) => {
      const button = createElement('button', 'tabs__item', {
        type: 'button',
        role: 'tab',
        dataset: { tabId: item.id },
        'aria-selected': String(item.id === currentId),
        tabIndex: item.id === currentId ? 0 : -1,
        text: item.label
      });
      if (item.id === currentId) {
        button.classList.add('tabs__item--active');
      }
      button.addEventListener('click', () => update(item.id));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          return;
        }
        event.preventDefault();
        const buttons = [...root.querySelectorAll('.tabs__item')];
        const currentIndex = buttons.indexOf(event.currentTarget);
        let nextIndex = currentIndex;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % buttons.length;
        if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = buttons.length - 1;
        buttons[nextIndex].focus();
        update(buttons[nextIndex].dataset.tabId);
      });
      root.append(button);
    });

    root.setActive = (id, emit = false) => update(id, emit);
    root.getActive = () => currentId;
    return root;
  }

  function normalizeSortValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    const stringValue = String(value).trim();
    const numericCandidate = stringValue
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[%₽$€]/g, '');
    if (/^-?\d+(\.\d+)?$/.test(numericCandidate)) {
      return Number(numericCandidate);
    }
    return stringValue;
  }

  function createTable(options = {}) {
    const {
      columns = [],
      rows = [],
      caption = '',
      sortable = true,
      emptyMessage = 'Нет данных',
      rowKey = 'id',
      onRowActivate
    } = options;

    const wrapper = createElement('div', 'table-wrap');
    const table = createElement('table', 'table');
    if (caption) {
      table.append(createElement('caption', 'table__caption visually-hidden', { text: caption }));
    }
    const thead = createElement('thead');
    const headerRow = createElement('tr', 'table__row');
    const tbody = createElement('tbody');
    let currentRows = [...rows];
    let sortState = { key: null, direction: 'asc' };

    function getCellValue(row, column) {
      if (typeof column.sortValue === 'function') {
        return column.sortValue(row);
      }
      return row[column.key];
    }

    function updateHeaderState() {
      headerRow.querySelectorAll('th').forEach((th) => {
        const key = th.dataset.columnKey;
        const isSorted = sortState.key === key;
        th.setAttribute('aria-sort', isSorted ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none');
        const button = th.querySelector('.table__sort-button');
        if (button) {
          button.setAttribute('aria-pressed', String(isSorted));
          button.dataset.direction = isSorted ? sortState.direction : 'asc';
        }
      });
    }

    function sortRows() {
      if (!sortState.key) {
        return [...currentRows];
      }
      const column = columns.find((item) => item.key === sortState.key);
      if (!column) {
        return [...currentRows];
      }
      const direction = sortState.direction === 'asc' ? 1 : -1;
      return [...currentRows].sort((first, second) => {
        const a = normalizeSortValue(getCellValue(first, column));
        const b = normalizeSortValue(getCellValue(second, column));
        if (typeof a === 'number' && typeof b === 'number') {
          return (a - b) * direction;
        }
        return collator.compare(String(a), String(b)) * direction;
      });
    }

    function renderRows() {
      tbody.replaceChildren();
      const renderedRows = sortRows();
      if (!renderedRows.length) {
        const row = createElement('tr', 'table__row');
        const cell = createElement('td', 'table__empty', {
          colspan: String(Math.max(1, columns.length)),
          text: emptyMessage
        });
        row.append(cell);
        tbody.append(row);
        return;
      }

      renderedRows.forEach((rowData, index) => {
        const row = createElement('tr', 'table__row', {
          dataset: { rowKey: rowData[rowKey] ?? index }
        });
        if (typeof onRowActivate === 'function') {
          row.tabIndex = 0;
          row.setAttribute('role', 'button');
          row.addEventListener('click', () => onRowActivate(rowData, index));
          row.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onRowActivate(rowData, index);
            }
          });
        }
        columns.forEach((column) => {
          const classes = ['table__cell'];
          if (column.align === 'right') classes.push('table__cell--right');
          const cell = createElement('td', classes.join(' '));
          const content = typeof column.render === 'function'
            ? column.render(rowData, index)
            : rowData[column.key];
          appendContent(cell, content ?? '—');
          row.append(cell);
        });
        tbody.append(row);
      });
    }

    columns.forEach((column) => {
      const classes = ['table__cell', 'table__head'];
      if (column.align === 'right') classes.push('table__head--right');
      const th = createElement('th', classes.join(' '), {
        scope: 'col',
        dataset: { columnKey: column.key },
        'aria-sort': 'none'
      });
      const isSortable = sortable && column.sortable !== false;
      if (isSortable) {
        const sortButton = createElement('button', 'table__sort-button', {
          type: 'button',
          'aria-pressed': 'false',
          dataset: { direction: 'asc' }
        });
        sortButton.append(document.createTextNode(column.label));
        const sortIcon = createElement('span', 'table__sort-icon', { 'aria-hidden': 'true' });
        sortIcon.append(createIcon('arrowUp', { size: 14 }));
        sortButton.append(sortIcon);
        sortButton.addEventListener('click', () => {
          if (sortState.key === column.key) {
            sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
          } else {
            sortState = { key: column.key, direction: 'asc' };
          }
          updateHeaderState();
          renderRows();
        });
        th.append(sortButton);
      } else {
        th.textContent = column.label;
      }
      headerRow.append(th);
    });

    thead.append(headerRow);
    table.append(thead, tbody);
    wrapper.append(table);
    renderRows();

    wrapper.updateRows = (nextRows) => {
      currentRows = [...nextRows];
      renderRows();
    };
    wrapper.setSort = (key, direction = 'asc') => {
      sortState = { key, direction };
      updateHeaderState();
      renderRows();
    };
    wrapper.clearSort = () => {
      sortState = { key: null, direction: 'asc' };
      updateHeaderState();
      renderRows();
    };
    wrapper.getSort = () => ({ ...sortState });
    wrapper.table = table;
    return wrapper;
  }

  function createDropdown(options = {}) {
    const {
      label = '',
      options: dropdownOptions = [],
      value = dropdownOptions[0]?.value,
      ariaLabel = label || 'Выберите значение',
      align = 'right',
      onChange,
      size = 'sm'
    } = options;
    const root = createElement('div', `dropdown${align === 'left' ? ' dropdown--left' : ''}`);
    const trigger = createElement('button', `btn btn--secondary${size !== 'md' ? ` btn--${size}` : ''} dropdown__trigger`, {
      type: 'button',
      ariaLabel,
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false'
    });
    const triggerLabel = createElement('span', 'btn__label');
    const chevron = createIcon('chevronDown', { size: 16 });
    trigger.append(triggerLabel, chevron);

    const menu = createElement('div', 'dropdown__menu', {
      role: 'listbox',
      tabIndex: -1,
      ariaLabel
    });
    let currentValue = value;
    let isOpen = false;

    function optionLabel(option) {
      return option?.label ?? '';
    }

    function updateSelection(nextValue, emit = true) {
      currentValue = nextValue;
      const selected = dropdownOptions.find((option) => option.value === currentValue) || dropdownOptions[0];
      triggerLabel.textContent = label ? `${label}: ${optionLabel(selected)}` : optionLabel(selected);
      menu.querySelectorAll('.dropdown__item').forEach((item) => {
        const active = item.dataset.value === String(currentValue);
        item.classList.toggle('dropdown__item--active', active);
        item.setAttribute('aria-selected', String(active));
        const checkIcon = item.querySelector('[data-dropdown-check]');
        if (checkIcon) {
          checkIcon.hidden = !active;
        }
      });
      if (emit && typeof onChange === 'function') {
        onChange(currentValue, selected);
      }
    }

    function setOpen(nextOpen, focusSelected = false) {
      isOpen = nextOpen;
      root.classList.toggle('dropdown--open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      if (isOpen && focusSelected) {
        const selectedItem = menu.querySelector('.dropdown__item--active') || menu.querySelector('.dropdown__item');
        selectedItem?.focus();
      }
    }

    dropdownOptions.forEach((option) => {
      const item = createElement('button', 'dropdown__item', {
        type: 'button',
        role: 'option',
        dataset: { value: option.value },
        'aria-selected': String(option.value === currentValue)
      });
      const text = createElement('span', '', { text: option.label });
      const check = createElement('span', '', {
        dataset: { dropdownCheck: 'true' },
        hidden: option.value !== currentValue,
        'aria-hidden': 'true'
      });
      check.append(createIcon('check', { size: 16 }));
      item.append(text, check);
      item.addEventListener('click', () => {
        updateSelection(option.value);
        setOpen(false);
        trigger.focus();
      });
      menu.append(item);
    });

    trigger.addEventListener('click', () => setOpen(!isOpen, !isOpen));
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'Enter', ' '].includes(event.key) && !isOpen) {
        event.preventDefault();
        setOpen(true, true);
      }
      if (event.key === 'Escape') {
        setOpen(false);
      }
    });

    menu.addEventListener('keydown', (event) => {
      const items = [...menu.querySelectorAll('.dropdown__item')];
      const index = items.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        items[(index + 1) % items.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        items.at(-1)?.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.focus();
      }
    });

    document.addEventListener('pointerdown', (event) => {
      if (isOpen && !root.contains(event.target)) {
        setOpen(false);
      }
    });

    root.append(trigger, menu);
    updateSelection(currentValue, false);
    root.setValue = (nextValue, emit = false) => updateSelection(nextValue, emit);
    root.getValue = () => currentValue;
    root.open = () => setOpen(true, true);
    root.close = () => setOpen(false);
    return root;
  }

  function createEmptyState(options = {}) {
    const {
      title = 'Пока ничего нет',
      description = '',
      icon = 'inbox',
      action
    } = options;
    const root = createElement('div', 'empty-state');
    const iconWrap = createElement('div', 'empty-state__icon');
    iconWrap.append(createIcon(icon, { size: 24 }));
    root.append(iconWrap, createElement('h3', 'empty-state__title', { text: title }));
    if (description) {
      root.append(createElement('p', 'empty-state__description', { text: description }));
    }
    if (action) {
      const actionWrap = createElement('div', 'empty-state__action');
      appendContent(actionWrap, action);
      root.append(actionWrap);
    }
    return root;
  }

  function createModal(options = {}) {
    const {
      title = '',
      description = '',
      content,
      footer,
      size = 'md',
      closeOnOverlay = true,
      onClose
    } = options;
    const root = createElement('div', 'modal', {
      hidden: true,
      'aria-hidden': 'true'
    });
    const overlay = createElement('div', 'modal__overlay', { 'aria-hidden': 'true' });
    const dialogClasses = ['modal__content'];
    if (size !== 'md') {
      dialogClasses.push(`modal__content--${size}`);
    }
    const dialog = createElement('section', dialogClasses.join(' '), {
      role: 'dialog',
      'aria-modal': 'true',
      tabIndex: -1
    });
    const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;
    dialog.setAttribute('aria-labelledby', titleId);

    const header = createElement('header', 'modal__header');
    const heading = createElement('div');
    const titleElement = createElement('h2', 'modal__title', { id: titleId, text: title });
    heading.append(titleElement);
    if (description) {
      heading.append(createElement('p', 'modal__description', { text: description }));
    }
    const closeButton = createIconButton({ icon: 'close', label: 'Закрыть окно' });
    header.append(heading, closeButton);

    const body = createElement('div', 'modal__body');
    appendContent(body, content);
    dialog.append(header, body);
    if (footer !== undefined) {
      const footerElement = createElement('footer', 'modal__footer');
      appendContent(footerElement, footer);
      dialog.append(footerElement);
    }
    root.append(overlay, dialog);

    let previousActiveElement = null;
    let closingTimer = null;

    function getFocusableElements() {
      return [...dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter((element) => !element.hidden && element.offsetParent !== null);
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function open() {
      clearTimeout(closingTimer);
      previousActiveElement = document.activeElement;
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => {
        root.classList.add('modal--open');
        const focusable = getFocusableElements();
        (focusable[0] || dialog).focus();
      });
      document.addEventListener('keydown', handleKeydown);
    }

    function close() {
      root.classList.remove('modal--open');
      root.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', handleKeydown);
      document.body.classList.remove('modal-open');
      closingTimer = window.setTimeout(() => {
        root.hidden = true;
        if (previousActiveElement instanceof HTMLElement) {
          previousActiveElement.focus();
        }
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 230);
    }

    closeButton.addEventListener('click', close);
    if (closeOnOverlay) {
      overlay.addEventListener('click', close);
    }

    return {
      element: root,
      dialog,
      body,
      open,
      close,
      setContent(nextContent) {
        body.replaceChildren();
        appendContent(body, nextContent);
      }
    };
  }

  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = createElement('div', 'toast-container', {
        id: 'toast-container',
        'aria-live': 'polite',
        'aria-atomic': 'false'
      });
      document.body.append(container);
    }
    return container;
  }

  function createToast(options = {}) {
    const {
      title = 'Готово',
      message = '',
      variant = 'neutral',
      duration = 3600
    } = options;
    const iconMap = {
      success: 'checkCircle',
      warning: 'clock',
      danger: 'close',
      info: 'info',
      neutral: 'bell'
    };
    const toast = createElement('div', `toast toast--${variant}`, {
      role: variant === 'danger' ? 'alert' : 'status'
    });
    const iconWrap = createElement('div', 'toast__icon', { 'aria-hidden': 'true' });
    iconWrap.append(createIcon(iconMap[variant] || 'bell', { size: 18 }));
    const content = createElement('div', 'toast__content');
    content.append(createElement('p', 'toast__title', { text: title }));
    if (message) {
      content.append(createElement('p', 'toast__message', { text: message }));
    }
    const closeButton = createIconButton({
      icon: 'close',
      label: 'Закрыть уведомление',
      className: 'toast__close'
    });
    toast.append(iconWrap, content, closeButton);

    let timer = null;
    function remove() {
      window.clearTimeout(timer);
      toast.classList.add('toast--leaving');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      window.setTimeout(() => toast.remove(), 260);
    }
    closeButton.addEventListener('click', remove);
    ensureToastContainer().append(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    if (duration > 0) {
      timer = window.setTimeout(remove, duration);
    }
    toast.close = remove;
    return toast;
  }

  function createPagination(options = {}) {
    const {
      page = 1,
      totalPages = 1,
      onChange,
      ariaLabel = 'Пагинация'
    } = options;
    const root = createElement('nav', 'pagination', { ariaLabel });
    const safeTotal = Math.max(1, Number(totalPages) || 1);
    let currentPage = Math.min(safeTotal, Math.max(1, Number(page) || 1));

    function getVisiblePages() {
      if (safeTotal <= 5) {
        return Array.from({ length: safeTotal }, (_, index) => index + 1);
      }
      const pages = new Set([1, safeTotal, currentPage - 1, currentPage, currentPage + 1]);
      return [...pages].filter((item) => item >= 1 && item <= safeTotal).sort((a, b) => a - b);
    }

    function goTo(nextPage, emit = true) {
      const normalized = Math.min(safeTotal, Math.max(1, nextPage));
      if (normalized === currentPage && emit) {
        return;
      }
      currentPage = normalized;
      render();
      if (emit && typeof onChange === 'function') {
        onChange(currentPage);
      }
    }

    function createPageButton(label, targetPage, options = {}) {
      const button = createElement('button', [
        'pagination__button',
        options.active ? 'pagination__button--active' : ''
      ].filter(Boolean).join(' '), {
        type: 'button',
        disabled: options.disabled,
        ariaLabel: options.ariaLabel || `Страница ${label}`,
        'aria-current': options.active ? 'page' : null
      });
      if (options.icon) {
        button.append(createIcon(options.icon, { size: 16 }));
      } else {
        button.textContent = label;
      }
      button.addEventListener('click', () => goTo(targetPage));
      return button;
    }

    function render() {
      root.replaceChildren();
      root.append(createPageButton('', currentPage - 1, {
        icon: 'chevronLeft',
        disabled: currentPage === 1,
        ariaLabel: 'Предыдущая страница'
      }));
      const pages = getVisiblePages();
      pages.forEach((pageNumber, index) => {
        if (index > 0 && pageNumber - pages[index - 1] > 1) {
          root.append(createElement('span', 'pagination__button', { text: '…', 'aria-hidden': 'true' }));
        }
        root.append(createPageButton(String(pageNumber), pageNumber, {
          active: pageNumber === currentPage,
          ariaLabel: `Страница ${pageNumber}`
        }));
      });

      root.append(createPageButton('', currentPage + 1, {
        icon: 'chevronRight',
        disabled: currentPage === safeTotal,
        ariaLabel: 'Следующая страница'
      }));
    }

    render();
    root.setPage = (nextPage, emit = false) => goTo(nextPage, emit);
    root.getPage = () => currentPage;
    return root;
  }

  function createPageHeader(options = {}) {
    const { title = '', subtitle = '', actions } = options;
    const content = createElement('div', 'page-header__content');
    content.append(createElement('h1', 'page-header__title', { text: title }));
    if (subtitle) {
      content.append(createElement('p', 'page-header__subtitle', { text: subtitle }));
    }
    const fragment = document.createDocumentFragment();
    fragment.append(content);
    if (actions) {
      const actionsElement = createElement('div', 'page-header__actions');
      appendContent(actionsElement, actions);
      fragment.append(actionsElement);
    }
    fragment.subtitleElement = content.querySelector('.page-header__subtitle');
    return fragment;
  }

  function createSidebar(options = {}) {
    const {
      activePage = 'candidates',
      user = { name: 'Пользователь', role: 'Сотрудник' },
      items: customItems,
      onNavigate,
      onProfile
    } = options;
    const items = customItems || [
      { page: 'candidates', label: 'Кандидаты', icon: 'users', href: '/candidates/' }
    ];
    const inner = createElement('div', 'sidebar__inner');
    const nav = createElement('nav', 'sidebar__nav', { ariaLabel: 'Основные разделы' });
    items.forEach((item) => {
      const isActive = item.page === activePage;
      const link = createElement('a', `sidebar__item${isActive ? ' sidebar__item--active' : ''}`, {
        href: item.href,
        dataset: { page: item.page },
        'aria-current': isActive ? 'page' : null,
        title: item.label
      });
      link.append(createIcon(item.icon, { size: 19 }), createElement('span', 'sidebar__label', { text: item.label }));
      if (item.counter) {
        link.append(createElement('span', 'sidebar__counter', { text: item.counter }));
      }
      link.addEventListener('click', (event) => {
        if (typeof onNavigate === 'function') {
          onNavigate(item, event, link);
        }
      });
      nav.append(link);
    });

    const footer = createElement('div', 'sidebar__footer');
    const profile = createElement(typeof onProfile === 'function' ? 'button' : 'div', 'sidebar__profile', {
      type: typeof onProfile === 'function' ? 'button' : null,
      ariaLabel: typeof onProfile === 'function' ? 'Открыть профиль пользователя' : null
    });
    profile.append(createAvatar({ name: user.name, size: 'md', status: true }));
    const meta = createElement('span', 'sidebar__profile-meta');
    meta.append(
      createElement('span', 'sidebar__profile-name', { text: user.name }),
      createElement('span', 'sidebar__profile-role', { text: user.role })
    );
    profile.append(meta);
    if (typeof onProfile === 'function') {
      profile.append(createIcon('chevronRight', { size: 16 }));
      profile.addEventListener('click', onProfile);
    }
    footer.append(profile);
    inner.append(nav, footer);
    return inner;
  }

  function createTopbar(options = {}) {
    const {
      title = 'Рабочая панель',
      context = '',
      user = { name: 'Пользователь' },
      periodOptions = [],
      periodValue,
      onPeriodChange,
      showNotifications = true,
      onMenuClick,
      onNotifications,
      onProfile
    } = options;
    const fragment = document.createDocumentFragment();
    const left = createElement('div', 'topbar__left');
    const menuButton = createIconButton({
      icon: 'menu',
      label: 'Открыть меню',
      className: 'topbar__mobile-toggle',
      onClick: onMenuClick
    });
    menuButton.setAttribute('aria-controls', 'sidebar');
    menuButton.setAttribute('aria-expanded', 'false');
    const titleWrap = createElement('div', 'topbar__title-wrap');
    titleWrap.append(createElement('p', 'topbar__title', { text: title }));
    if (context) {
      titleWrap.append(createElement('p', 'topbar__context', { text: context }));
    }
    left.append(menuButton, titleWrap);

    const right = createElement('div', 'topbar__right');
    let periodDropdown = null;
    if (periodOptions.length) {
      periodDropdown = createDropdown({
        label: 'Период',
        options: periodOptions,
        value: periodValue,
        ariaLabel: 'Выберите период отчёта',
        onChange: onPeriodChange
      });
      right.append(periodDropdown);
    }
    if (showNotifications) {
      right.append(createIconButton({
        icon: 'bell',
        label: 'Уведомления',
        indicator: true,
        onClick: onNotifications
      }));
      right.append(createElement('span', 'topbar__divider', { 'aria-hidden': 'true' }));
    }
    const profile = createElement(typeof onProfile === 'function' ? 'button' : 'div', 'topbar__profile', {
      type: typeof onProfile === 'function' ? 'button' : null,
      ariaLabel: typeof onProfile === 'function' ? 'Открыть меню профиля' : null
    });
    profile.append(
      createAvatar({ name: user.name, size: 'sm', status: true }),
      createElement('span', 'topbar__profile-name', { text: user.name })
    );
    if (typeof onProfile === 'function') {
      profile.append(createIcon('chevronDown', { size: 15 }));
      profile.addEventListener('click', onProfile);
    }
    right.append(profile);

    fragment.append(left, right);
    fragment.menuButton = menuButton;
    fragment.periodDropdown = periodDropdown;
    return fragment;
  }

  const UI = {
    icon: createIcon,
    card: createCard,
    statCard: createStatCard,
    button: createButton,
    badge: createBadge,
    avatar: createAvatar,
    listItem: createListItem,
    table: createTable,
    dropdown: createDropdown,
    modal: createModal,
    toast: createToast,
    tabs: createTabs,
    progress: createProgress,
    iconButton: createIconButton,
    emptyState: createEmptyState,
    pagination: createPagination,
    searchInput: createSearchInput,
    field: createField,
    pageHeader: createPageHeader,
    sidebar: createSidebar,
    topbar: createTopbar,
    element: createElement
  };

  window.UI = UI;
  window.createCard = createCard;
  window.createStatCard = createStatCard;
  window.createBadge = createBadge;
  window.createButton = createButton;
  window.createAvatar = createAvatar;
  window.createListItem = createListItem;
  window.createTable = createTable;
})();
