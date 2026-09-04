(function () {
  'use strict';

  const state = {
    allCandidates: [], candidates: [], query: '', status: 'all',
    socket: null, reconnectDelay: 1000, reconnectTimer: null, openCandidate: null
  };
  const refs = {};

  function setSidebarOpen(open) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !refs.backdrop || !refs.menuButton) return;
    sidebar.classList.toggle('sidebar--open', open);
    refs.backdrop.classList.toggle('sidebar-backdrop--visible', open);
    refs.backdrop.hidden = !open;
    refs.menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('sidebar-open', open);
  }

  function renderShell() {
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('topbar');
    const overlays = document.getElementById('app-overlays');
    sidebar.replaceChildren(UI.sidebar({
      activePage: 'candidates',
      user: { name: 'HR-менеджер', role: 'Команда подбора' },
      items: [
        { page: 'dashboard', label: 'Главная', icon: 'home', href: '/' },
        { page: 'candidates', label: 'Кандидаты', icon: 'users', href: '/candidates/' },
        { page: 'analytics', label: 'Аналитика', icon: 'chart', href: '/static/hr-tech-dashboard/analytics.html' },
        { page: 'admin', label: 'Настройки', icon: 'settings', href: '/admin/' }
      ]
    }));
    const topbarContent = UI.topbar({
      title: 'TalentFlow',
      context: 'Рекрутинг',
      user: { name: 'HR-менеджер' },
      onMenuClick() {
        setSidebarOpen(!sidebar.classList.contains('sidebar--open'));
      }
    });
    refs.menuButton = topbarContent.menuButton;
    topbar.replaceChildren(topbarContent);
    refs.backdrop = UI.element('div', 'sidebar-backdrop', {
      hidden: true,
      'aria-hidden': 'true'
    });
    refs.backdrop.addEventListener('click', () => setSidebarOpen(false));
    overlays.append(refs.backdrop);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    });
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(value));
  }

  function getStatusCounts() {
    return state.allCandidates.reduce((counts, candidate) => {
      counts[candidate.status] = (counts[candidate.status] || 0) + 1;
      return counts;
    }, {});
  }

  function renderFilters() {
    const counts = getStatusCounts();
    const definitions = [
      ['all', 'Все'],
      ['new', 'Новые'],
      ['survey_in_progress', 'Заполняют'],
      ['survey_completed', 'Заполнено'],
      ['contacted', 'Связались'],
      ['hired', 'Наняты'],
      ['rejected', 'Отклонены']
    ];
    const items = definitions
      .filter(([id]) => id === 'all' || counts[id] || id === state.status)
      .map(([id, label]) => ({
        id,
        label: `${label} ${id === 'all' ? state.allCandidates.length : (counts[id] || 0)}`
      }));
    const tabs = UI.tabs({
      items,
      activeId: state.status,
      ariaLabel: 'Статус кандидата',
      onChange(status) {
        state.status = status;
        applyFilters();
      }
    });
    document.getElementById('candidate-filters').replaceChildren(tabs);
  }

  function applyFilters() {
    const query = state.query.toLocaleLowerCase('ru-RU');
    state.candidates = state.allCandidates.filter((candidate) => {
      if (state.status !== 'all' && candidate.status !== state.status) return false;
      if (!query) return true;
      const searchable = [
        candidate.name,
        candidate.display_name,
        candidate.external_id,
        ...Object.values(candidate.primary_answers)
      ].join(' ').toLocaleLowerCase('ru-RU');
      return searchable.includes(query);
    });
    renderTable();
  }

  function shortStatus(row) {
    const labels = {
      survey_in_progress: 'Заполняет',
      survey_completed: 'Заполнено',
      contacted: 'Связались',
      rejected: 'Отклонён',
      hired: 'Нанят',
      new: 'Новый'
    };
    return labels[row.status] || row.status_label;
  }

  function candidateNameCell(row) {
    const wrap = UI.element('div', 'candidate-cell');
    const text = UI.element('div');
    text.append(
      UI.element('strong', 'candidate-cell__name', { text: row.name }),
      UI.element('span', 'candidate-cell__id', { text: row.external_id })
    );
    wrap.append(UI.avatar({ name: row.name, size: 'sm' }), text);
    return wrap;
  }

  function renderTable() {
    const table = UI.table({
      caption: 'Кандидаты',
      emptyMessage: 'Кандидаты не найдены',
      rows: state.candidates,
      onRowActivate: (row) => openCandidate(row.id),
      columns: [
        { key: 'name', label: 'Кандидат', render: candidateNameCell },
        {
          key: 'status_label', label: 'Статус',
          render: (row) => UI.badge({ label: shortStatus(row), variant: row.status_variant })
        },
        {
          key: 'desired_position', label: 'Позиция',
          render: (row) => row.primary_answers.desired_position || '—'
        },
        {
          key: 'progress', label: 'Ответы', sortable: false,
          render: (row) => String(row.answers_count)
        },
        { key: 'updated_at', label: 'Активность', render: (row) => formatDate(row.updated_at) }
      ]
    });
    table.classList.add('candidates-table');
    document.getElementById('candidates-table').replaceChildren(table);
  }

  function renderAnswers(answers) {
    const labels = {
      full_name: 'Имя',
      city: 'Город',
      desired_position: 'Позиция',
      experience: 'Опыт',
      schedule: 'Формат работы',
      salary: 'Ожидания'
    };
    const section = UI.element('aside', 'candidate-detail__section candidate-detail__answers');
    section.append(UI.element('h3', 'candidate-detail__heading', { text: 'Анкета' }));
    const list = UI.element('dl', 'answers-list');
    if (!answers.length) {
      list.append(UI.element('p', 'candidate-detail__empty', { text: 'Ответов пока нет.' }));
    }
    answers.forEach((item) => {
      const pair = UI.element('div', 'answers-list__item');
      pair.append(
        UI.element('dt', 'answers-list__question', { text: labels[item.question_key] || item.question }),
        UI.element('dd', 'answers-list__answer', { text: item.answer })
      );
      list.append(pair);
    });
    section.append(list);
    return section;
  }

  function renderConversation(messages, typing = false) {
    const section = UI.element('section', 'candidate-detail__section candidate-detail__messages');
    section.append(UI.element('h3', 'candidate-detail__heading', { text: 'Диалог' }));
    const thread = UI.element('div', 'conversation');
    if (!messages.length) {
      thread.append(UI.element('p', 'candidate-detail__empty', { text: 'Сообщений нет' }));
    }
    messages.forEach((message) => {
      const bubble = UI.element('article', `message-bubble message-bubble--${message.direction}`);
      bubble.append(
        UI.element('p', 'message-bubble__text', { text: message.text }),
        UI.element('time', 'message-bubble__time', {
          text: formatDate(message.sent_at),
          datetime: message.sent_at
        })
      );
      thread.append(bubble);
    });
    if (typing) {
      const indicator = UI.element('div', 'typing-indicator', {
        role: 'status', ariaLabel: 'Кандидат печатает'
      });
      const dots = UI.element('span', 'typing-indicator__dots', { 'aria-hidden': 'true' });
      dots.append(UI.element('i'), UI.element('i'), UI.element('i'));
      indicator.append(dots, UI.element('span', '', { text: 'печатает' }));
      thread.append(indicator);
    }
    section.append(thread);
    requestAnimationFrame(() => { thread.scrollTop = thread.scrollHeight; });
    return section;
  }

  function buildCandidateContent(candidate, typing = false) {
    const content = UI.element('div', 'candidate-detail');
    content.append(
      renderConversation(candidate.messages, typing),
      renderAnswers(candidate.answers)
    );
    return content;
  }

  function sendRealtime(message) {
    if (state.socket?.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify(message));
    }
  }

  async function refreshOpenCandidate(id) {
    const opened = state.openCandidate;
    if (!opened || opened.id !== id) return;
    const response = await fetch(`/api/candidates/${id}/`, { headers: { Accept: 'application/json' } });
    if (!response.ok || state.openCandidate !== opened) return;
    opened.candidate = await response.json();
    opened.modal.setContent(buildCandidateContent(opened.candidate, opened.typing));
  }

  function connectRealtime() {
    clearTimeout(state.reconnectTimer);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/recruiting/`);
    state.socket = socket;
    socket.addEventListener('open', () => {
      state.reconnectDelay = 1000;
      if (state.openCandidate) {
        sendRealtime({ type: 'candidate.subscribe', candidate_id: state.openCandidate.id });
      }
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'candidates.changed') {
        loadCandidates();
      } else if (message.type === 'candidate.changed') {
        refreshOpenCandidate(message.candidate_id);
      } else if (message.type === 'candidate.typing') {
        const opened = state.openCandidate;
        if (opened?.id === message.candidate_id && opened.typing !== message.typing) {
          opened.typing = message.typing;
          opened.modal.setContent(buildCandidateContent(opened.candidate, opened.typing));
        }
      } else if (message.type === 'candidate.removed') {
        if (state.openCandidate?.id === message.candidate_id) state.openCandidate.modal.close();
      }
    });
    socket.addEventListener('close', () => {
      if (state.socket !== socket) return;
      state.reconnectTimer = setTimeout(connectRealtime, state.reconnectDelay);
      state.reconnectDelay = Math.min(state.reconnectDelay * 2, 10000);
    });
  }

  async function openCandidate(id) {
    try {
      const response = await fetch(`/api/candidates/${id}/`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Не удалось загрузить карточку кандидата');
      const candidate = await response.json();
      const footer = UI.element('div', 'candidate-detail__actions');
      if (candidate.wa_url) {
        const link = UI.element('a', 'btn btn--primary', {
          href: candidate.wa_url, target: '_blank', rel: 'noopener noreferrer'
        });
        link.append(UI.icon('message', { size: 18 }), document.createTextNode('Написать в WhatsApp'));
        footer.append(link);
      }
      const modal = UI.modal({
        title: candidate.name,
        description: candidate.external_id,
        content: buildCandidateContent(candidate),
        footer,
        size: 'lg',
        onClose() {
          if (state.openCandidate?.modal === modal) {
            sendRealtime({ type: 'candidate.unsubscribe' });
            state.openCandidate = null;
          }
        }
      });
      modal.dialog.classList.add('candidate-modal');
      if (state.openCandidate) state.openCandidate.modal.close();
      state.openCandidate = { id, candidate, modal, typing: false };
      document.getElementById('app-overlays').append(modal.element);
      modal.element.addEventListener('transitionend', () => {
        if (modal.element.hidden) modal.element.remove();
      });
      modal.open();
      sendRealtime({ type: 'candidate.subscribe', candidate_id: id });
    } catch (error) {
      UI.toast({ title: 'Ошибка', message: error.message, variant: 'danger' });
    }
  }

  async function loadCandidates() {
    const target = document.getElementById('candidates-table');
    target.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/candidates/', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Не удалось загрузить кандидатов');
      const data = await response.json();
      state.allCandidates = data.results;
      renderFilters();
      applyFilters();
    } catch (error) {
      const retry = UI.button({ label: 'Повторить', variant: 'secondary', size: 'sm', onClick: loadCandidates });
      target.replaceChildren(UI.emptyState({
        title: 'Не удалось загрузить', icon: 'inbox', action: retry
      }));
    } finally {
      target.removeAttribute('aria-busy');
    }
  }

  function init() {
    renderShell();
    document.getElementById('page-header').replaceChildren(UI.pageHeader({
      title: 'Кандидаты'
    }));
    const search = UI.searchInput({
      placeholder: 'Поиск',
      onInput(value) {
        state.query = value.trim();
        applyFilters();
      }
    });
    document.getElementById('candidate-search').append(search);
    loadCandidates();
    connectRealtime();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
