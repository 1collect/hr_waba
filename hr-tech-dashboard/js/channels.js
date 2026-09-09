(() => {
  'use strict';
  const sidebar = document.getElementById('sidebar');
  const user = { name: document.body.dataset.userName || 'Пользователь', role: 'Сотрудник' };
  sidebar.replaceChildren(UI.sidebar({ activePage: 'numbers', user, items: [
    { page: 'candidates', label: 'Кандидаты', icon: 'users', href: '/candidates/' },
    { page: 'questions', label: 'Анкета', icon: 'file', href: '/questions/' },
    { page: 'numbers', label: 'WhatsApp-номера', icon: 'message', href: '/numbers/' }
  ] }));
  const backdrop = UI.element('div', 'sidebar-backdrop', { hidden: true, 'aria-hidden': 'true' });
  function toggleMenu(open) {
    sidebar.classList.toggle('sidebar--open', open);
    backdrop.classList.toggle('sidebar-backdrop--visible', open);
    backdrop.hidden = !open;
    document.body.classList.toggle('sidebar-open', open);
    topbar.menuButton.setAttribute('aria-expanded', String(open));
  }
  const topbar = UI.topbar({ title: 'Рекрутинг', user, showNotifications: false,
    onMenuClick: () => toggleMenu(!sidebar.classList.contains('sidebar--open')) });
  document.getElementById('topbar').replaceChildren(topbar);
  document.getElementById('app-overlays').append(backdrop);
  backdrop.addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') toggleMenu(false); });
  const thread = document.querySelector('.number-thread');
  if (thread) thread.scrollTop = thread.scrollHeight;
})();
