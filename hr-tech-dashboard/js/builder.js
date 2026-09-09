(() => {
  'use strict';
  const $ = id => document.getElementById(id), el = UI.element;
  const copy = value => JSON.parse(JSON.stringify(value));
  const types = {
    text: { name: 'Текстовый ответ', icon: 'T', description: 'ФИО, опыт и открытые вопросы', color: 'blue' },
    number: { name: 'Число', icon: '#', description: 'Возраст и числовые значения', color: 'amber' },
    yes_no: { name: 'Да / Нет', icon: '⑂', description: 'Две кнопки и ветки по ответам', color: 'violet' }
  };
  const initial = JSON.parse($('builder-data').textContent);
  const greeting = JSON.parse($('builder-greeting').textContent);
  const storageKey = `recruiting.flow.v1.${document.body.dataset.userName}`;
  const state = {
    rows: copy(initial.questions), revision: initial.revision, baseline: JSON.stringify(initial.questions),
    selected: initial.questions.find(q => q.is_active)?.id, undo: [], redo: [],
    showArchived: false, search: '', zoom: 1, saving: false, tab: 'settings', drag: null,
    answers: new Map(), editingAnswer: null, draft: null
  };
  const sidebar = $('sidebar');
  const user = { name: document.body.dataset.userName || 'Пользователь', role: 'Сотрудник' };
  sidebar.replaceChildren(UI.sidebar({ activePage: 'questions', user, items: [
    { page: 'candidates', label: 'Кандидаты', icon: 'users', href: '/candidates/' },
    { page: 'questions', label: 'Конструктор', icon: 'file', href: '/questions/' },
    { page: 'numbers', label: 'WhatsApp-номера', icon: 'message', href: '/numbers/' }
  ] }));
  const backdrop = el('div', 'sidebar-backdrop', { hidden: true });
  function toggleMenu(open) {
    sidebar.classList.toggle('sidebar--open', open); backdrop.classList.toggle('sidebar-backdrop--visible', open);
    backdrop.hidden = !open; document.body.classList.toggle('sidebar-open', open);
    topbar.menuButton.setAttribute('aria-expanded', String(open));
  }
  const topbar = UI.topbar({ title: 'Рекрутинг', user, showNotifications: false,
    onMenuClick: () => toggleMenu(!sidebar.classList.contains('sidebar--open')) });
  $('topbar').replaceChildren(topbar); $('app-overlays').append(backdrop);
  backdrop.addEventListener('click', () => toggleMenu(false));
  function button(label, action, className = 'builder-button', title = '') {
    const node = el('button', className, { type: 'button', text: label, title });
    node.addEventListener('click', action); return node;
  }
  function alert(message = '') { $('builder-alert').textContent = message; $('builder-alert').hidden = !message; }
  function dirty() { return JSON.stringify(state.rows) !== state.baseline; }
  function persist() {
    try {
      if (dirty()) localStorage.setItem(storageKey, JSON.stringify({ revision: state.revision, rows: state.rows }));
      else if ($('draft-banner').hidden) localStorage.removeItem(storageKey);
    } catch { /* The editor also works when browser storage is unavailable. */ }
  }
  function validate(rows) {
    const seen = new Map();
    for (const [index, q] of rows.entries()) {
      const prefix = `Блок ${index + 1}: `;
      if (!q.text.trim() || q.text.trim().length > 650) return prefix + 'введите текст от 1 до 650 символов.';
      if (q.show_if_question) {
        const parent = seen.get(q.show_if_question);
        if (!parent) return prefix + 'сначала должен идти вопрос, от которого зависит этот блок.';
        if (parent.answer_type !== 'yes_no') return prefix + 'условие требует вопроса «Да / Нет».';
        if (q.is_active && !parent.is_active) return prefix + 'включите вопрос, от которого зависит этот блок.';
        if (!['Да', 'Нет'].includes(q.show_if_answer)) return prefix + 'выберите ответ для условия.';
      }
      seen.set(q.id, q);
    }
    return '';
  }
  function checkpoint() { state.undo.push(copy(state.rows)); if (state.undo.length > 50) state.undo.shift(); state.redo = []; }
  function updateStatus() {
    const error = validate(state.rows);
    $('save-status').textContent = state.saving ? 'Сохраняем…' : dirty() ? 'Есть изменения в черновике' : 'Все изменения сохранены';
    $('save-status').classList.toggle('is-dirty', dirty());
    $('save-flow').disabled = state.saving || !dirty();
    $('save-flow').title = error || 'Сохранить и использовать в боте (Ctrl+S)';
    $('undo-flow').disabled = state.saving || !state.undo.length; $('redo-flow').disabled = state.saving || !state.redo.length;
    $('block-count').textContent = state.rows.filter(q => q.is_active).length;
    $('archive-toggle').textContent = `${state.showArchived ? 'Скрыть' : 'Показать'} выключенные (${state.rows.filter(q => !q.is_active).length})`;
    $('flow-builder').classList.toggle('is-saving', state.saving);
    document.querySelectorAll('#question-text, #answer-type, #condition-parent, #question-enabled').forEach(input => { input.disabled = state.saving; });
  }
  function changed(inspector = true) {
    persist(); updateStatus(); renderOutline();
    if (inspector) { renderCanvas(); renderInspector(); }
    else {
      const heading = document.querySelector(`[data-node-id="${state.selected}"] .simple-question-title`);
      if (heading) heading.textContent = state.rows.find(q => q.id === state.selected)?.text || 'Новый вопрос';
    }
    if (state.tab === 'preview') renderPreview();
  }
  function editRow(id, fields) {
    if (state.saving) return;
    const q = state.rows.find(row => row.id === id);
    if (!q || Object.keys(fields).every(key => q[key] === fields[key])) return;
    checkpoint(); Object.assign(q, fields); alert(); changed();
  }
  function select(id, scroll = false) {
    state.selected = id; renderOutline(); renderCanvas(); renderInspector();
    setLibrary(false);
    if (scroll) requestAnimationFrame(() => document.querySelector(`[data-node-id="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }));
  }
  function add(answerType, parent = null, answer = '') {
    if (state.saving) return;
    if (state.rows.length >= 200) { alert('В одном сценарии может быть до 200 блоков.'); return; }
    checkpoint();
    const id = `new-${crypto.randomUUID()}`;
    const q = { id, text: answerType === 'yes_no' ? 'Ваш вопрос с ответом «Да / Нет»?' : 'Ваш вопрос кандидату?',
      answer_type: answerType, is_active: true, show_if_question: parent, show_if_answer: answer };
    const index = state.rows.findIndex(row => row.id === (parent || state.selected));
    state.rows.splice(index < 0 ? state.rows.length : index + 1, 0, q);
    state.selected = id; alert(); changed(); setLibrary(false);
    requestAnimationFrame(() => { $('question-text')?.focus(); $('question-text')?.select(); });
  }
  function move(id, targetId) {
    if (state.saving || id === targetId) return;
    const next = copy(state.rows), from = next.findIndex(q => q.id === id), to = next.findIndex(q => q.id === targetId);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    const error = validate(next); if (error) { alert(error); return; }
    checkpoint(); state.rows = next; alert(); changed();
  }
  function enableDrag(node, id) {
    node.draggable = true;
    node.addEventListener('dragstart', event => {
      if (state.saving) { event.preventDefault(); return; }
      state.drag = id; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); node.classList.add('is-dragging');
    });
    node.addEventListener('dragend', () => { state.drag = null; node.classList.remove('is-dragging'); document.querySelectorAll('.is-drop-target').forEach(n => n.classList.remove('is-drop-target')); });
    node.addEventListener('dragover', event => { if (state.drag && state.drag !== id) { event.preventDefault(); node.classList.add('is-drop-target'); } });
    node.addEventListener('dragleave', () => node.classList.remove('is-drop-target'));
    node.addEventListener('drop', event => { event.preventDefault(); node.classList.remove('is-drop-target'); if (state.drag) move(state.drag, id); state.drag = null; });
  }
  function renderOutline() {
    const list = $('flow-outline'); list.replaceChildren();
    state.rows.forEach((q, index) => {
      if ((!q.is_active && !state.showArchived) || !q.text.toLocaleLowerCase('ru').includes(state.search)) return;
      const item = button('', () => select(q.id, true), `outline-item${state.selected === q.id ? ' is-selected' : ''}${q.is_active ? '' : ' is-disabled'}`);
      item.append(el('span', 'outline-number', { text: String(index + 1).padStart(2, '0') }), el('span', 'outline-text', { text: q.text || 'Без названия' }), el('span', 'outline-grip', { text: '⠿', 'aria-hidden': 'true' }));
      if (q.show_if_question) item.classList.add('has-condition'); enableDrag(item, q.id); list.append(item);
    });
    if (!list.children.length) list.append(el('p', 'panel-description', { text: 'Ничего не найдено' }));
  }
  function renderCanvas() {
    const list = $('flow-nodes'); list.replaceChildren();
    state.rows.forEach((q, index) => {
      const card = el('article', `simple-question${q.is_active ? '' : ' simple-question--off'}`, { dataset: { nodeId: q.id } });
      const heading = button('', () => select(q.id), 'simple-question-heading');
      heading.setAttribute('aria-expanded', String(q.id === state.selected));
      heading.append(el('span', 'simple-question-number', { text: index + 1 }),
        el('span', 'simple-question-title', { text: q.text || 'Новый вопрос' }),
        el('span', 'simple-question-type', { text: q.is_active ? types[q.answer_type].name : 'Выключен' }));
      card.append(heading);
      if (q.id === state.selected) card.append(el('div', '', { id: 'inline-inspector' }));
      else if (q.show_if_question) card.append(el('p', 'simple-condition', { text: `Если в вопросе ${state.rows.findIndex(row => row.id === q.show_if_question) + 1} ответ «${q.show_if_answer}»` }));
      list.append(card);
    });
    list.append(button('+ Добавить вопрос', () => { state.selected = state.rows.at(-1)?.id; add('text'); }, 'canvas-add'));
  }
  function drawConnections() {}
  function field(label, input, help = '') {
    const wrap = el('div', 'inspector-field'); wrap.append(el('label', '', { text: label, htmlFor: input.id }), input);
    if (help) wrap.append(el('p', '', { text: help })); return wrap;
  }
  function renderInspector() {
    const panel = $('inline-inspector') || $('node-inspector'); panel.replaceChildren();
    const q = state.rows.find(row => row.id === state.selected);
    if (!q) { panel.append(el('p', 'panel-description', { text: 'Выберите блок на схеме или добавьте новый вопрос.' })); return; }
    const index = state.rows.indexOf(q), type = types[q.answer_type], head = el('div', 'inspector-heading');
    head.append(el('div', '', { text: `Вопрос ${index + 1}` }));
    const text = el('textarea', 'input', { id: 'question-text', value: q.text, rows: 5, maxLength: 650 });
    const count = el('span', 'text-counter', { text: `${q.text.length} / 650` }); let textSnapshot = copy(state.rows);
    text.addEventListener('focus', () => { textSnapshot = copy(state.rows); });
    text.addEventListener('input', () => {
      if (state.saving) return;
      if (textSnapshot) { state.undo.push(textSnapshot); if (state.undo.length > 50) state.undo.shift(); state.redo = []; textSnapshot = null; }
      q.text = text.value; count.textContent = `${text.value.length} / 650`; changed(false);
    });
    const textField = field('Текст вопроса', text); textField.append(count); panel.append(textField);
    const typeSelect = el('select', 'input', { id: 'answer-type' });
    Object.entries(types).forEach(([key, value]) => typeSelect.append(el('option', '', { value: key, text: value.name }))); typeSelect.value = q.answer_type;
    typeSelect.addEventListener('change', () => {
      if (typeSelect.value !== 'yes_no' && state.rows.some(row => row.show_if_question === q.id)) { alert('Сначала уберите условия у зависимых блоков.'); typeSelect.value = q.answer_type; return; }
      editRow(q.id, { answer_type: typeSelect.value });
    }); panel.append(field('Тип ответа', typeSelect));
    const conditionSection = el('details', 'inspector-section', { open: Boolean(q.show_if_question) }); conditionSection.append(el('summary', '', { text: 'Условие показа' }));
    const parent = el('select', 'input', { id: 'condition-parent' }); parent.append(el('option', '', { value: '', text: 'Всегда — следующий по очереди' }));
    state.rows.slice(0, index).filter(row => row.answer_type === 'yes_no' && (row.is_active || !q.is_active)).forEach(row => parent.append(el('option', '', { value: row.id, text: `${state.rows.indexOf(row) + 1}. ${row.text}` })));
    parent.value = q.show_if_question || '';
    parent.addEventListener('change', () => editRow(q.id, { show_if_question: parent.value || null, show_if_answer: parent.value ? 'Да' : '' })); conditionSection.append(field('Показывать этот вопрос', parent));
    if (q.show_if_question) {
      const choices = el('div', 'condition-choices');
      ['Да', 'Нет'].forEach(value => choices.append(button(`Ответ «${value}»`, () => editRow(q.id, { show_if_answer: value }), `condition-choice${q.show_if_answer === value ? ' is-active' : ''}`)));
      conditionSection.append(choices);
    } panel.append(conditionSection);
    if (q.answer_type === 'yes_no' && q.is_active) {
      const branch = el('div', 'inspector-section'), actions = el('div', 'branch-actions'); branch.append(el('h3', '', { text: 'Добавить уточнение' }));
      actions.append(button('+ Если «Да»', () => add('text', q.id, 'Да'), 'branch-add branch-add--yes'), button('+ Если «Нет»', () => add('text', q.id, 'Нет'), 'branch-add branch-add--no')); branch.append(actions); panel.append(branch);
    }
    const enabled = el('input', '', { id: 'question-enabled', type: 'checkbox', checked: q.is_active });
    enabled.addEventListener('change', () => {
      if (!enabled.checked && state.rows.some(row => row.is_active && row.show_if_question === q.id)) { enabled.checked = true; alert('Сначала выключите зависимые блоки или уберите их условия.'); return; }
      if (enabled.checked && q.show_if_question && !state.rows.find(row => row.id === q.show_if_question)?.is_active) { enabled.checked = false; alert('Сначала включите родительский вопрос.'); return; }
      editRow(q.id, { is_active: enabled.checked });
    });
    const toggle = el('label', 'inspector-toggle', { htmlFor: enabled.id }); toggle.append(enabled, el('span', '', { text: 'Вопрос включён' }));
    panel.append(toggle);
    const actions = el('div', 'inspector-actions');
    const up = button('↑ Выше', () => move(q.id, state.rows[index - 1]?.id)); up.disabled = index === 0;
    const down = button('↓ Ниже', () => move(q.id, state.rows[index + 1]?.id)); down.disabled = index === state.rows.length - 1;
    actions.append(up, down, button('⧉ Дублировать', () => {
      if (state.saving || state.rows.length >= 200) return;
      checkpoint(); const duplicate = { ...copy(q), id: `new-${crypto.randomUUID()}` }; delete duplicate.key;
      state.rows.splice(index + 1, 0, duplicate); state.selected = duplicate.id; changed();
    }));
    if (q.id.startsWith('new-')) actions.append(button('Удалить блок', () => {
      if (state.saving) return;
      if (state.rows.some(row => row.show_if_question === q.id)) { alert('Сначала удалите зависимые блоки или уберите условия.'); return; }
      checkpoint(); state.rows.splice(index, 1); state.selected = state.rows[Math.max(0, index - 1)]?.id; changed();
    }, 'builder-button button-danger'));
    panel.append(actions); const error = validate(state.rows); if (error) panel.append(el('p', 'inspector-error', { text: error }));
  }
  function switchTab(tab) {
    setInspector(true);
    state.tab = tab;
    ['settings', 'preview'].forEach(name => { $(`${name}-tab`).setAttribute('aria-selected', String(name === tab)); $(`${name}-tab`).tabIndex = name === tab ? 0 : -1; $(`${name}-panel`).hidden = name !== tab; });
    if (tab === 'preview') renderPreview();
  }
  function renderPreview() {
    const chat = $('phone-chat'), compose = $('phone-compose'); chat.replaceChildren(); compose.replaceChildren(); const seen = new Set();
    const eligible = state.rows.filter(q => {
      const show = q.is_active && (!q.show_if_question || (seen.has(q.show_if_question) && state.answers.get(q.show_if_question) === q.show_if_answer));
      if (show) seen.add(q.id); else state.answers.delete(q.id); return show;
    });
    const questionText = q => q.id === eligible[0]?.id ? `${greeting}\n\n${q.text}` : q.text;
    chat.append(el('span', 'chat-date', { text: 'СЕГОДНЯ' }));
    eligible.filter(q => state.answers.has(q.id)).forEach(q => {
      chat.append(el('div', 'chat-bubble chat-bubble--bot', { text: questionText(q) }), button(state.answers.get(q.id), () => { state.editingAnswer = q.id; renderPreview(); }, 'chat-bubble chat-bubble--answer', 'Изменить ответ'));
    });
    const current = eligible.find(q => q.id === state.editingAnswer) || eligible.find(q => !state.answers.has(q.id));
    const configError = validate(state.rows); if (configError) { compose.append(el('p', 'inspector-error', { text: configError })); return; }
    if (!current) {
      chat.append(el('div', 'chat-bubble chat-bubble--bot', { text: 'Спасибо! Ожидайте, с вами свяжутся наши сотрудники.' })); compose.append(el('div', 'preview-complete', { text: '✓ Анкета пройдена' }));
    } else {
      if (state.editingAnswer) chat.append(el('span', 'chat-date', { text: 'ИСПРАВЛЕНИЕ ОТВЕТА' })); chat.append(el('div', 'chat-bubble chat-bubble--bot', { text: state.editingAnswer ? current.text : questionText(current) }));
      const submit = value => { state.answers.set(current.id, value); state.editingAnswer = null; renderPreview(); };
      if (current.answer_type === 'yes_no') {
        const buttons = el('div', 'chat-answer-buttons'); ['Да', 'Нет'].forEach(value => buttons.append(button(value, () => submit(value), 'chat-answer-button'))); compose.append(buttons);
      } else {
        const form = el('form', 'chat-input-form'), input = el('input', '', { type: current.answer_type === 'number' ? 'number' : 'text', required: true, 'aria-label': current.text, placeholder: 'Ваш ответ…', value: state.answers.get(current.id) || '' });
        if (current.answer_type === 'number') { input.min = 0; input.max = 999999999; input.step = 1; }
        form.append(input, el('button', 'chat-send', { type: 'submit', text: '↑', 'aria-label': 'Ответить' }));
        form.addEventListener('submit', event => { event.preventDefault(); if (input.value.trim()) submit(current.answer_type === 'number' ? String(Number(input.value)) : input.value.trim()); }); compose.append(form);
      }
    }
    requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; });
  }
  async function save() {
    if (state.saving || !dirty()) return;
    const error = validate(state.rows); if (error) { alert(error); return; }
    state.saving = true; updateStatus(); alert();
    try {
      const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value;
      const response = await fetch('/api/questions/builder/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf }, body: JSON.stringify({ questions: state.rows, revision: state.revision }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Не удалось сохранить. Проверьте соединение и повторите.');
      state.selected = data.id_map[state.selected] || data.questions.find(q => q.is_active)?.id;
      state.rows = data.questions; state.revision = data.revision; state.baseline = JSON.stringify(data.questions);
      state.undo = []; state.redo = []; state.answers.clear(); state.editingAnswer = null; $('draft-banner').hidden = true;
    } catch (error) { alert(error.message); }
    finally { state.saving = false; changed(); }
  }
  function history(direction) {
    if (state.saving) return;
    const source = state[direction], target = state[direction === 'undo' ? 'redo' : 'undo']; if (!source.length) return;
    target.push(copy(state.rows)); state.rows = source.pop(); if (!state.rows.some(q => q.id === state.selected)) state.selected = state.rows.find(q => q.is_active)?.id;
    alert(); changed();
  }
  function zoom(value) { state.zoom = Math.max(0.6, Math.min(1.4, value)); $('flow-stage').style.zoom = state.zoom; $('zoom-reset').textContent = `${Math.round(state.zoom * 100)}%`; requestAnimationFrame(drawConnections); }
  Object.entries(types).forEach(([key, type]) => {
    const item = button('', () => add(key), `library-block node--${type.color}`), text = el('span');
    text.append(el('strong', '', { text: type.name }), el('small', '', { text: type.description }));
    item.append(el('span', 'library-icon', { text: type.icon }), text, el('span', 'library-plus', { text: '+' })); $('block-types').append(item);
  });
  $('save-flow').addEventListener('click', save); $('undo-flow').addEventListener('click', () => history('undo')); $('redo-flow').addEventListener('click', () => history('redo'));
  $('zoom-out').addEventListener('click', () => zoom(state.zoom - 0.1)); $('zoom-in').addEventListener('click', () => zoom(state.zoom + 0.1)); $('zoom-reset').addEventListener('click', () => zoom(1));
  $('test-flow').addEventListener('click', () => { switchTab('preview'); $('preview-panel').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
  ['settings', 'preview'].forEach(tab => {
    $(`${tab}-tab`).addEventListener('click', () => switchTab(tab));
    $(`${tab}-tab`).addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); const next = tab === 'settings' ? 'preview' : 'settings'; switchTab(next); $(`${next}-tab`).focus(); } });
  });
  $('restart-preview').addEventListener('click', () => { state.answers.clear(); state.editingAnswer = null; renderPreview(); });
  $('archive-toggle').addEventListener('click', () => { state.showArchived = !state.showArchived; updateStatus(); renderOutline(); renderCanvas(); });
  $('block-search').addEventListener('input', event => { state.search = event.target.value.toLocaleLowerCase('ru'); renderOutline(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') toggleMenu(false); if (!(event.ctrlKey || event.metaKey)) return;
    if (event.code === 'KeyS') { event.preventDefault(); save(); }
    if (event.code === 'KeyZ' && !event.target.closest('input, textarea, select, [contenteditable]')) { event.preventDefault(); history(event.shiftKey ? 'redo' : 'undo'); }
  });
  window.addEventListener('beforeunload', event => { if (dirty()) { event.preventDefault(); event.returnValue = ''; } });
  new ResizeObserver(() => requestAnimationFrame(drawConnections)).observe($('canvas-viewport'));
  try {
    const draft = JSON.parse(localStorage.getItem(storageKey));
    if (draft && Array.isArray(draft.rows) && draft.revision === state.revision && JSON.stringify(draft.rows) !== state.baseline) { state.draft = draft.rows; $('draft-banner').hidden = false; }
  } catch { /* A malformed draft must not prevent opening the editor. */ }
  $('restore-draft').addEventListener('click', () => { checkpoint(); state.rows = copy(state.draft); state.selected = state.rows.find(q => q.is_active)?.id; $('draft-banner').hidden = true; changed(); });
  $('discard-draft').addEventListener('click', () => { try { localStorage.removeItem(storageKey); } catch {} $('draft-banner').hidden = true; });
  function setLibrary(open) {
    $('block-library').hidden = !open;
    $('toggle-library').setAttribute('aria-expanded', String(open));
  }
  function setInspector(open) {
    $('flow-inspector').hidden = !open;
    $('flow-builder').classList.toggle('inspector-closed', !open);
    $('toggle-inspector').setAttribute('aria-expanded', String(open));
    requestAnimationFrame(drawConnections);
  }
  $('toggle-library').addEventListener('click', () => setLibrary($('block-library').hidden));
  $('quick-add-question').addEventListener('click', () => add('text'));
  $('toggle-inspector').addEventListener('click', () => setInspector($('flow-inspector').hidden));
  $('close-inspector').addEventListener('click', () => { setInspector(false); $('test-flow').focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { setLibrary(false); if (window.innerWidth <= 800) setInspector(false); }
  });
  $('legacy-editor').hidden = true; $('flow-builder').hidden = false;
  document.body.classList.add('builder-ready');
  $('undo-flow').textContent = '↶ Отменить';
  $('redo-flow').textContent = '↷ Повторить';
  setInspector(false);
  updateStatus(); renderOutline(); renderCanvas(); renderInspector();
})();
