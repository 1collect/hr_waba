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
})();
