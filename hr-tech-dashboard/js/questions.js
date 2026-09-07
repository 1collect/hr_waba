(() => {
  'use strict';
  const sidebar = document.getElementById('sidebar');
  const user = { name: document.body.dataset.userName || 'Пользователь', role: 'Сотрудник' };
  sidebar.replaceChildren(UI.sidebar({ activePage: 'questions', user, items: [
    { page: 'candidates', label: 'Кандидаты', icon: 'users', href: '/candidates/' },
    { page: 'questions', label: 'Вопросы', icon: 'file', href: '/questions/' }
  ] }));
  const backdrop = UI.element('div', 'sidebar-backdrop', { hidden: true, 'aria-hidden': 'true' });
  function toggleMenu(open) {
    sidebar.classList.toggle('sidebar--open', open);
    backdrop.classList.toggle('sidebar-backdrop--visible', open);
    backdrop.hidden = !open;
    document.body.classList.toggle('sidebar-open', open);
    topbar.menuButton.setAttribute('aria-expanded', String(open));
    if (!open) topbar.menuButton.focus();
  }
  const topbar = UI.topbar({ title: 'Рекрутинг', context: '', user, showNotifications: false,
    onMenuClick: () => toggleMenu(!sidebar.classList.contains('sidebar--open')) });
  document.getElementById('topbar').replaceChildren(topbar);
  document.getElementById('app-overlays').append(backdrop);
  backdrop.addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar.classList.contains('sidebar--open')) toggleMenu(false);
  });
  document.getElementById('add-question').addEventListener('click', () => {
    const section = document.getElementById('new-question');
    section.open = true;
    section.querySelector('textarea').focus();
  });
  const questions = JSON.parse(document.getElementById('preview-questions').textContent);
  const preview = document.getElementById('question-preview');
  const answers = new Map();
  let editing = null;
  function renderPreview() {
    const eligibleIds = new Set();
    const eligible = questions.filter(question => {
      const show = !question.show_if_question || (
        eligibleIds.has(question.show_if_question) && answers.get(question.show_if_question) === question.show_if_answer
      );
      if (show) eligibleIds.add(question.id);
      else answers.delete(question.id);
      return show;
    });
    preview.replaceChildren();
    eligible.filter(q => answers.has(q.id)).forEach(question => {
      const row = UI.element('div', 'preview-answer');
      row.append(UI.element('p', '', { text: question.text }),
        UI.element('strong', '', { text: answers.get(question.id) }),
        UI.button({ label: 'Изменить', variant: 'secondary', size: 'sm', onClick() {
          editing = question.id;
          renderPreview();
        } }));
      preview.append(row);
    });
    const current = eligible.find(q => q.id === editing) || eligible.find(q => !answers.has(q.id));
    if (current) {
      const form = UI.element('form', 'preview-current');
      form.append(UI.element('h3', '', { text: current.text }));
      const submit = value => {
        answers.set(current.id, value.trim());
        editing = null;
        renderPreview();
      };
      if (current.answer_type === 'yes_no') {
        const buttons = UI.element('div', 'preview-buttons');
        ['Да', 'Нет'].forEach(value => buttons.append(UI.button({
          label: value, variant: 'primary', onClick: () => submit(value)
        })));
        form.append(buttons);
      } else {
        const input = UI.element('input', 'input', {
          type: current.answer_type === 'number' ? 'number' : 'text',
          required: true, 'aria-label': current.text
        });
        if (current.answer_type === 'number') {
          input.min = '0'; input.max = '999999999'; input.step = '1';
        }
        input.value = answers.get(current.id) || '';
        form.append(input, UI.element('button', 'btn btn--primary', { type: 'submit', text: 'Ответить' }));
        form.addEventListener('submit', event => {
          event.preventDefault();
          if (input.value.trim()) submit(current.answer_type === 'number' ? String(Number(input.value)) : input.value);
        });
      }
      preview.append(form);
    } else {
      preview.append(UI.element('p', 'question-notice', { text: 'Спасибо! Ожидайте, с вами свяжутся наши сотрудники.' }));
    }
    preview.append(UI.button({ label: 'Начать заново', variant: 'secondary', size: 'sm', onClick() {
      answers.clear(); editing = null; renderPreview();
    } }));
  }
  renderPreview();
})();
