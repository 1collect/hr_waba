(() => {
  'use strict';

  const dashboardData = {
    stats: [
      {
        label: 'Отклики',
        icon: 'messages',
        periods: {
          today: { value: '1 430', delta: '+12%', trend: 'up' },
          seven: { value: '8 940', delta: '+10%', trend: 'up' },
          thirty: { value: '36 410', delta: '+14%', trend: 'up' }
        }
      },
      {
        label: 'Просмотры вакансий',
        icon: 'eye',
        periods: {
          today: { value: '24 580', delta: '+8%', trend: 'up' },
          seven: { value: '156 240', delta: '+6%', trend: 'up' },
          thirty: { value: '642 900', delta: '+11%', trend: 'up' }
        }
      },
      {
        label: 'Приглашения',
        icon: 'send',
        periods: {
          today: { value: '320', delta: '+15%', trend: 'up' },
          seven: { value: '1 985', delta: '+13%', trend: 'up' },
          thirty: { value: '7 840', delta: '+9%', trend: 'up' }
        }
      },
      {
        label: 'Закрытые вакансии',
        icon: 'checkCircle',
        periods: {
          today: { value: '28', delta: '+7%', trend: 'up' },
          seven: { value: '74', delta: '+5%', trend: 'up' },
          thirty: { value: '286', delta: '+12%', trend: 'up' }
        }
      }
    ],
    applicationsTrend: {
      seven: {
        label: '7 дней',
        labels: ['13 авг', '14 авг', '15 авг', '16 авг', '17 авг', '18 авг', '19 авг'],
        values: [920, 1080, 1010, 1190, 1260, 1340, 1430]
      },
      thirty: {
        label: '30 дней',
        labels: [
          '21 июл', '22 июл', '23 июл', '24 июл', '25 июл', '26 июл', '27 июл', '28 июл',
          '29 июл', '30 июл', '31 июл', '1 авг', '2 авг', '3 авг', '4 авг', '5 авг',
          '6 авг', '7 авг', '8 авг', '9 авг', '10 авг', '11 авг', '12 авг', '13 авг',
          '14 авг', '15 авг', '16 авг', '17 авг', '18 авг', '19 авг'
        ],
        values: [
          860, 920, 890, 940, 980, 1020, 970, 1010, 1070, 1110,
          1040, 1080, 1120, 1090, 1160, 1210, 1180, 1230, 1270, 1250,
          1290, 1320, 1280, 920, 1080, 1010, 1190, 1260, 1340, 1430
        ]
      },
      ninety: {
        label: '90 дней',
        labels: [
          '22 мая', '28 мая', '3 июн', '9 июн', '15 июн', '21 июн', '27 июн', '3 июл',
          '9 июл', '15 июл', '21 июл', '27 июл', '2 авг', '8 авг', '14 авг', '19 авг'
        ],
        values: [620, 710, 680, 760, 810, 790, 860, 900, 940, 980, 860, 970, 1090, 1270, 1080, 1430]
      }
    },
    conversion: {
      value: 6.2,
      max: 100,
      label: 'из отклика в приглашение',
      delta: '+0,8 п.п.'
    },
    vacancyRanking: [
      { id: 1, title: 'Менеджер по продажам', applications: 342 },
      { id: 2, title: 'Продуктовый дизайнер', applications: 278 },
      { id: 3, title: 'Frontend-разработчик', applications: 165 },
      { id: 4, title: 'HR-специалист', applications: 124 },
      { id: 5, title: 'Бухгалтер', applications: 98 }
    ],
    recentApplications: [
      { id: 1, name: 'Иван Петров', vacancy: 'Менеджер по продажам', time: '2 мин назад' },
      { id: 2, name: 'Мария Смирнова', vacancy: 'Продуктовый дизайнер', time: '15 мин назад' },
      { id: 3, name: 'Алексей Кузнецов', vacancy: 'Frontend-разработчик', time: '1 ч назад' },
      { id: 4, name: 'Елена Волкова', vacancy: 'HR-специалист', time: '2 ч назад' }
    ],
    vacancies: [
      {
        id: 1,
        title: 'Менеджер по продажам',
        department: 'Продажи',
        applications: 342,
        views: 5320,
        invitations: 80,
        conversion: 6.1,
        status: 'active'
      },
      {
        id: 2,
        title: 'Продуктовый дизайнер',
        department: 'Продукт',
        applications: 278,
        views: 4860,
        invitations: 64,
        conversion: 5.8,
        status: 'active'
      },
      {
        id: 3,
        title: 'Frontend-разработчик',
        department: 'Разработка',
        applications: 165,
        views: 3740,
        invitations: 45,
        conversion: 5.2,
        status: 'paused'
      },
      {
        id: 4,
        title: 'HR-специалист',
        department: 'HR',
        applications: 124,
        views: 2640,
        invitations: 34,
        conversion: 4.9,
        status: 'active'
      },
      {
        id: 5,
        title: 'Бухгалтер',
        department: 'Финансы',
        applications: 98,
        views: 2180,
        invitations: 26,
        conversion: 4.6,
        status: 'active'
      },
      {
        id: 6,
        title: 'Системный аналитик',
        department: 'Разработка',
        applications: 87,
        views: 1920,
        invitations: 22,
        conversion: 4.3,
        status: 'draft'
      },
      {
        id: 7,
        title: 'Офис-менеджер',
        department: 'Операции',
        applications: 76,
        views: 1750,
        invitations: 20,
        conversion: 4.1,
        status: 'active'
      },
      {
        id: 8,
        title: 'Специалист поддержки',
        department: 'Поддержка',
        applications: 69,
        views: 1610,
        invitations: 18,
        conversion: 3.9,
        status: 'paused'
      }
    ],
    analytics: {
      stats: [
        {
          label: 'Средняя конверсия',
          icon: 'target',
          periods: {
            seven: { value: '6,0%', delta: '+0,4 п.п.', trend: 'up' },
            thirty: { value: '6,2%', delta: '+0,8 п.п.', trend: 'up' },
            ninety: { value: '5,8%', delta: '+0,5 п.п.', trend: 'up' }
          }
        },
        {
          label: 'Время до найма',
          icon: 'clock',
          periods: {
            seven: { value: '22 дня', delta: '−2 дня', trend: 'up' },
            thirty: { value: '24 дня', delta: '−3 дня', trend: 'up' },
            ninety: { value: '26 дней', delta: '−1 день', trend: 'up' }
          }
        },
        {
          label: 'Принятые офферы',
          icon: 'checkCircle',
          periods: {
            seven: { value: '86%', delta: '+7%', trend: 'up' },
            thirty: { value: '84%', delta: '+6%', trend: 'up' },
            ninety: { value: '81%', delta: '+4%', trend: 'up' }
          }
        },
        {
          label: 'Стоимость найма',
          icon: 'money',
          periods: {
            seven: { value: '46 900 ₽', delta: '−5%', trend: 'up' },
            thirty: { value: '48 600 ₽', delta: '−4%', trend: 'up' },
            ninety: { value: '51 200 ₽', delta: '−2%', trend: 'up' }
          }
        }
      ],
      tabs: {
        overview: {
          chartTitle: 'Отклики по неделям',
          chartSubtitle: 'Динамика входящего потока кандидатов',
          chartLabels: ['1–7 июл', '8–14 июл', '15–21 июл', '22–28 июл', '29 июл–4 авг', '5–11 авг', '12–19 авг'],
          chartValues: [6840, 7210, 7680, 7420, 8030, 8410, 8940],
          sideTitle: 'Конверсия в найм',
          sideSubtitle: 'От первого отклика до выхода',
          donut: { value: 1.8, max: 10, label: 'общая конверсия' },
          note: 'Наибольший рост откликов дали прямой поиск и карьерный сайт.',
          tableTitle: 'Эффективность источников',
          tableSubtitle: 'Сравнение каналов привлечения кандидатов',
          tableType: 'sources',
          rows: [
            { id: 1, source: 'Карьерный сайт', applications: 3540, invitations: 264, hires: 48, conversion: 7.5, status: 'effective' },
            { id: 2, source: 'Работные сайты', applications: 2860, invitations: 186, hires: 31, conversion: 6.5, status: 'stable' },
            { id: 3, source: 'Рекомендации', applications: 980, invitations: 92, hires: 22, conversion: 9.4, status: 'effective' },
            { id: 4, source: 'Прямой поиск', applications: 740, invitations: 58, hires: 11, conversion: 7.8, status: 'stable' },
            { id: 5, source: 'Социальные сети', applications: 520, invitations: 24, hires: 3, conversion: 4.6, status: 'attention' }
          ]
        },
        funnel: {
          chartTitle: 'Конверсия по этапам',
          chartSubtitle: 'Доля кандидатов, переходящих на следующий этап',
          chartLabels: ['Отклик', 'Скрининг', 'Интервью', 'Оффер', 'Выход'],
          chartValues: [100, 38, 18, 7.2, 5.9],
          sideTitle: 'Воронка найма',
          sideSubtitle: 'Абсолютные значения за период',
          funnel: [
            { label: 'Отклики', value: 36410, progress: 100 },
            { label: 'Скрининг', value: 13836, progress: 38 },
            { label: 'Интервью', value: 6554, progress: 18 },
            { label: 'Офферы', value: 2622, progress: 7.2 },
            { label: 'Выходы', value: 2148, progress: 5.9 }
          ],
          note: 'Основная точка потерь — переход от скрининга к интервью.',
          tableTitle: 'Этапы подбора',
          tableSubtitle: 'Скорость прохождения и конверсия',
          tableType: 'funnel',
          rows: [
            { id: 1, stage: 'Новый отклик', candidates: 36410, averageTime: '0,4 дня', conversion: 100, status: 'stable' },
            { id: 2, stage: 'Скрининг', candidates: 13836, averageTime: '1,8 дня', conversion: 38, status: 'effective' },
            { id: 3, stage: 'Интервью', candidates: 6554, averageTime: '5,2 дня', conversion: 18, status: 'attention' },
            { id: 4, stage: 'Оффер', candidates: 2622, averageTime: '2,1 дня', conversion: 7.2, status: 'stable' },
            { id: 5, stage: 'Выход', candidates: 2148, averageTime: '9,4 дня', conversion: 5.9, status: 'effective' }
          ]
        },
        sources: {
          chartTitle: 'Стоимость отклика',
          chartSubtitle: 'Средняя стоимость привлечения по неделям, ₽',
          chartLabels: ['1–7 июл', '8–14 июл', '15–21 июл', '22–28 июл', '29 июл–4 авг', '5–11 авг', '12–19 авг'],
          chartValues: [196, 188, 181, 176, 169, 164, 158],
          sideTitle: 'Доля органики',
          sideSubtitle: 'Отклики без платного продвижения',
          donut: { value: 68, max: 100, label: 'органический трафик' },
          note: 'Стоимость отклика снизилась на 19% благодаря росту органического трафика.',
          tableTitle: 'Каналы привлечения',
          tableSubtitle: 'Бюджет и результативность источников',
          tableType: 'channels',
          rows: [
            { id: 1, source: 'Карьерный сайт', budget: 186000, applications: 3540, cost: 53, status: 'effective' },
            { id: 2, source: 'Работные сайты', budget: 492000, applications: 2860, cost: 172, status: 'stable' },
            { id: 3, source: 'Рекомендации', budget: 84000, applications: 980, cost: 86, status: 'effective' },
            { id: 4, source: 'Прямой поиск', budget: 208000, applications: 740, cost: 281, status: 'attention' },
            { id: 5, source: 'Социальные сети', budget: 156000, applications: 520, cost: 300, status: 'attention' }
          ]
        }
      }
    }
  };

  const page = document.body.dataset.page || 'dashboard';
  const isAnalyticsPage = page === 'analytics';
  const state = {
    period: isAnalyticsPage ? 'thirty' : 'today',
    chartPeriod: 'seven',
    vacancyPage: 1,
    vacancyPageSize: 4,
    vacancyQuery: '',
    vacancyStatus: 'all',
    analyticsTab: 'overview'
  };
  const refs = {};

  const periodCopy = {
    today: 'Ключевые показатели за сегодня',
    seven: 'Ключевые показатели за последние 7 дней',
    thirty: 'Ключевые показатели за последние 30 дней',
    ninety: 'Ключевые показатели за последние 90 дней'
  };

  const statusMeta = {
    active: { label: 'Активна', variant: 'success' },
    paused: { label: 'На паузе', variant: 'warning' },
    draft: { label: 'Черновик', variant: 'neutral' },
    effective: { label: 'Эффективный', variant: 'success' },
    stable: { label: 'Стабильный', variant: 'info' },
    attention: { label: 'Требует внимания', variant: 'warning' }
  };

  const user = {
    name: 'Анна Воронова',
    role: 'Руководитель подбора'
  };

  function formatNumber(value) {
    return new Intl.NumberFormat('ru-RU').format(Number(value) || 0);
  }

  function formatPercent(value) {
    return `${Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
  }

  function formatCurrency(value) {
    return `${formatNumber(value)} ₽`;
  }

  function createStatusBadge(status) {
    const meta = statusMeta[status] || { label: status, variant: 'neutral' };
    return UI.badge({ label: meta.label, variant: meta.variant });
  }

  function createPrimaryCell(primary, secondary = '') {
    const wrapper = UI.element('div');
    wrapper.append(UI.element('p', 'table__primary', { text: primary }));
    if (secondary) {
      wrapper.append(UI.element('p', 'table__secondary', { text: secondary }));
    }
    return wrapper;
  }

  function setSidebarOpen(open) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !refs.sidebarBackdrop || !refs.menuButton) return;
    sidebar.classList.toggle('sidebar--open', open);
    refs.sidebarBackdrop.classList.toggle('sidebar-backdrop--visible', open);
    refs.sidebarBackdrop.hidden = !open;
    refs.menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('sidebar-open', open);
    if (open) {
      sidebar.querySelector('a, button')?.focus();
    }
  }

  function renderShell() {
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('topbar');
    const overlays = document.getElementById('app-overlays') || document.body;

    const sidebarContent = UI.sidebar({
      activePage: page,
      user,
      onNavigate(item, event, link) {
        if (item.href.startsWith('#')) {
          event.preventDefault();
          sidebar.querySelectorAll('.sidebar__item').forEach((navItem) => {
            const isCurrent = navItem === link;
            navItem.classList.toggle('sidebar__item--active', isCurrent);
            if (isCurrent) navItem.setAttribute('aria-current', 'page');
            else navItem.removeAttribute('aria-current');
          });

          if (item.page === 'vacancies' && !isAnalyticsPage) {
            document.getElementById('vacancies-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            UI.toast({
              title: item.label,
              message: 'Раздел подготовлен как точка расширения дизайн-системы.',
              variant: 'info'
            });
          }
        }
        setSidebarOpen(false);
      },
      onProfile() {
        UI.toast({ title: 'Профиль', message: 'Настройки профиля доступны в полной версии.', variant: 'neutral' });
      }
    });
    sidebar.replaceChildren(sidebarContent);

    const topbarPeriods = isAnalyticsPage
      ? [
          { value: 'seven', label: '7 дней' },
          { value: 'thirty', label: '30 дней' },
          { value: 'ninety', label: '90 дней' }
        ]
      : [
          { value: 'today', label: 'Сегодня' },
          { value: 'seven', label: '7 дней' },
          { value: 'thirty', label: '30 дней' }
        ];

    const topbarContent = UI.topbar({
      title: isAnalyticsPage ? 'Аналитика' : 'Главная',
      context: 'TalentFlow · команда подбора',
      user,
      periodOptions: topbarPeriods,
      periodValue: state.period,
      onPeriodChange(value) {
        state.period = value;
        if (isAnalyticsPage) {
          updateAnalyticsPeriod();
        } else {
          updateDashboardPeriod();
        }
      },
      onMenuClick() {
        const isOpen = document.getElementById('sidebar')?.classList.contains('sidebar--open');
        setSidebarOpen(!isOpen);
      },
      onNotifications() {
        UI.toast({
          title: 'Уведомления',
          message: '3 вакансии требуют внимания рекрутера.',
          variant: 'info'
        });
      },
      onProfile() {
        UI.toast({ title: user.name, message: user.role, variant: 'neutral' });
      }
    });
    refs.menuButton = topbarContent.menuButton;
    refs.globalPeriodDropdown = topbarContent.periodDropdown;
    topbar.replaceChildren(topbarContent);

    refs.sidebarBackdrop = UI.element('div', 'sidebar-backdrop', {
      hidden: true,
      'aria-hidden': 'true'
    });
    refs.sidebarBackdrop.addEventListener('click', () => setSidebarOpen(false));
    overlays.append(refs.sidebarBackdrop);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    });
  }

  function renderDashboardPageHeader() {
    const target = document.getElementById('page-header');
    const downloadButton = UI.button({
      label: 'Скачать отчёт',
      variant: 'secondary',
      icon: 'download',
      onClick: downloadVacancyReport
    });
    const createButton = UI.button({
      label: 'Создать вакансию',
      variant: 'primary',
      icon: 'plus',
      onClick: openVacancyModal
    });
    const header = UI.pageHeader({
      title: 'Главная',
      subtitle: periodCopy[state.period],
      actions: [downloadButton, createButton]
    });
    refs.pageSubtitle = header.subtitleElement;
    target.replaceChildren(header);
  }

  function renderDashboardStats() {
    const target = document.getElementById('stats');
    const cards = dashboardData.stats.map((stat) => {
      const snapshot = stat.periods[state.period] || stat.periods.today;
      return UI.statCard({
        label: stat.label,
        value: snapshot.value,
        delta: snapshot.delta,
        trend: snapshot.trend,
        icon: stat.icon
      });
    });
    target.replaceChildren(...cards);
  }

  function renderApplicationsChart() {
    const target = document.getElementById('applications-chart');
    const chartElement = UI.element('div', 'chart-canvas dashboard-chart-slot');
    const periodDropdown = UI.dropdown({
      options: [
        { value: 'seven', label: '7 дней' },
        { value: 'thirty', label: '30 дней' },
        { value: 'ninety', label: '90 дней' }
      ],
      value: state.chartPeriod,
      ariaLabel: 'Период графика откликов',
      onChange(value) {
        state.chartPeriod = value;
        updateApplicationsChart(chartElement);
      }
    });
    const card = UI.card({
      title: 'Динамика откликов',
      subtitle: 'Количество откликов по дням',
      headerActions: periodDropdown,
      body: chartElement,
      className: 'chart-card'
    });
    target.replaceChildren(card);
    updateApplicationsChart(chartElement);
  }

  function updateApplicationsChart(chartElement) {
    const trend = dashboardData.applicationsTrend[state.chartPeriod];
    Charts.line({
      element: chartElement,
      labels: trend.labels,
      values: trend.values,
      valueFormatter: (value) => `${formatNumber(value)} откликов`,
      ariaLabel: `Динамика откликов за период ${trend.label}`
    });
  }

  function renderConversionCard() {
    const target = document.getElementById('conversion');
    const panel = UI.element('div', 'conversion-panel');
    const chart = UI.element('div', 'conversion-panel__chart');
    const caption = UI.element('p', 'conversion-panel__caption', { text: dashboardData.conversion.label });
    const trend = UI.element('span', 'conversion-panel__trend');
    trend.append(UI.icon('trendUp', { size: 14 }), document.createTextNode(`${dashboardData.conversion.delta} к прошлому периоду`));
    panel.append(chart, caption, trend);
    const card = UI.card({
      title: 'Конверсия откликов',
      subtitle: 'Текущий показатель',
      body: panel,
      className: 'chart-card'
    });
    target.replaceChildren(card);
    Charts.donut({
      element: chart,
      value: dashboardData.conversion.value,
      max: dashboardData.conversion.max,
      label: 'конверсия',
      ariaLabel: `Конверсия откликов ${formatPercent(dashboardData.conversion.value)}`
    });
  }

  function renderTopVacancies() {
    const target = document.getElementById('top-vacancies');
    const list = UI.element('div', 'list list--divided ranking-list');
    const maxApplications = Math.max(...dashboardData.vacancyRanking.map((item) => item.applications));
    dashboardData.vacancyRanking.forEach((item) => {
      list.append(UI.listItem({
        title: item.title,
        subtitle: 'Отклики за текущий период',
        trailing: formatNumber(item.applications),
        progress: {
          value: item.applications,
          max: maxApplications,
          label: `${item.title}: ${item.applications} откликов`
        }
      }));
    });
    target.replaceChildren(UI.card({
      title: 'Топ вакансий по откликам',
      subtitle: 'Самые востребованные позиции',
      body: list
    }));
  }

  function renderRecentApplications() {
    const target = document.getElementById('recent-applications');
    const list = UI.element('div', 'list list--divided activity-list');
    dashboardData.recentApplications.forEach((application) => {
      list.append(UI.listItem({
        avatar: UI.avatar({ name: application.name, size: 'md' }),
        title: application.name,
        subtitle: application.vacancy,
        meta: application.time,
        onClick() {
          UI.toast({
            title: application.name,
            message: `Отклик на вакансию «${application.vacancy}»`,
            variant: 'neutral'
          });
        }
      }));
    });
    target.replaceChildren(UI.card({
      title: 'Последние отклики',
      subtitle: 'Новые кандидаты в очереди',
      body: list
    }));
  }

  function getFilteredVacancies() {
    const normalizedQuery = state.vacancyQuery.trim().toLocaleLowerCase('ru');
    return dashboardData.vacancies.filter((vacancy) => {
      const matchesQuery = !normalizedQuery || [vacancy.title, vacancy.department]
        .some((value) => value.toLocaleLowerCase('ru').includes(normalizedQuery));
      const matchesStatus = state.vacancyStatus === 'all' || vacancy.status === state.vacancyStatus;
      return matchesQuery && matchesStatus;
    });
  }

  function createVacanciesTable() {
    const target = document.getElementById('vacancies-table');
    target.classList.add('dashboard-table-section');
    const search = UI.searchInput({
      placeholder: 'Найти вакансию',
      ariaLabel: 'Поиск по вакансиям',
      value: state.vacancyQuery,
      onInput(value) {
        state.vacancyQuery = value;
        state.vacancyPage = 1;
        updateVacanciesTable();
      }
    });
    refs.vacancySearch = search;
    const statusFilter = UI.dropdown({
      label: 'Статус',
      options: [
        { value: 'all', label: 'Все' },
        { value: 'active', label: 'Активные' },
        { value: 'paused', label: 'На паузе' },
        { value: 'draft', label: 'Черновики' }
      ],
      value: state.vacancyStatus,
      ariaLabel: 'Фильтр по статусу вакансии',
      onChange(value) {
        state.vacancyStatus = value;
        state.vacancyPage = 1;
        updateVacanciesTable();
      }
    });
    refs.vacancyStatusFilter = statusFilter;
    const toolbar = UI.element('div', 'toolbar vacancies-toolbar');
    const leftGroup = UI.element('div', 'toolbar__group');
    leftGroup.append(search);
    const rightGroup = UI.element('div', 'toolbar__group');
    rightGroup.append(statusFilter);
    toolbar.append(leftGroup, rightGroup);

    refs.vacancyTable = UI.table({
      caption: 'Активные вакансии и показатели эффективности',
      columns: [
        {
          key: 'title',
          label: 'Вакансия',
          render: (row) => createPrimaryCell(row.title, row.department)
        },
        { key: 'applications', label: 'Отклики', align: 'right', render: (row) => formatNumber(row.applications) },
        { key: 'views', label: 'Просмотры', align: 'right', render: (row) => formatNumber(row.views) },
        { key: 'invitations', label: 'Приглашения', align: 'right', render: (row) => formatNumber(row.invitations) },
        { key: 'conversion', label: 'Конверсия', align: 'right', render: (row) => formatPercent(row.conversion) },
        { key: 'status', label: 'Статус', sortable: false, render: (row) => createStatusBadge(row.status) }
      ],
      rows: []
    });

    const body = UI.element('div');
    body.append(toolbar, refs.vacancyTable);
    refs.vacancySummary = UI.element('span', 'vacancies-summary');
    refs.vacancyPagination = UI.element('div');
    const card = UI.card({
      title: 'Активные вакансии',
      subtitle: 'Сводка по текущим позициям',
      body,
      footer: [refs.vacancySummary, refs.vacancyPagination]
    });
    target.replaceChildren(card);
    updateVacanciesTable();
  }

  function updateVacanciesTable() {
    if (!refs.vacancyTable) return;
    const filtered = getFilteredVacancies();
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.vacancyPageSize));
    state.vacancyPage = Math.min(state.vacancyPage, totalPages);
    const start = (state.vacancyPage - 1) * state.vacancyPageSize;
    const pageRows = filtered.slice(start, start + state.vacancyPageSize);
    refs.vacancyTable.updateRows(pageRows);

    const from = filtered.length ? start + 1 : 0;
    const to = Math.min(start + state.vacancyPageSize, filtered.length);
    refs.vacancySummary.textContent = `Показано ${from}–${to} из ${filtered.length}`;
    const pagination = UI.pagination({
      page: state.vacancyPage,
      totalPages,
      onChange(nextPage) {
        state.vacancyPage = nextPage;
        updateVacanciesTable();
        document.getElementById('vacancies-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    refs.vacancyPagination.replaceChildren(pagination);
  }

  function updateDashboardPeriod() {
    renderDashboardStats();
    if (refs.pageSubtitle) {
      refs.pageSubtitle.textContent = periodCopy[state.period];
    }
  }

  function escapeCsv(value) {
    const stringValue = String(value ?? '');
    if (/[;"\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  function downloadCsv(filename, headers, rows) {
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function downloadVacancyReport() {
    const rows = getFilteredVacancies().map((vacancy) => [
      vacancy.title,
      vacancy.department,
      vacancy.applications,
      vacancy.views,
      vacancy.invitations,
      formatPercent(vacancy.conversion),
      statusMeta[vacancy.status]?.label || vacancy.status
    ]);
    downloadCsv(
      'talentflow-vacancies.csv',
      ['Вакансия', 'Подразделение', 'Отклики', 'Просмотры', 'Приглашения', 'Конверсия', 'Статус'],
      rows
    );
    UI.toast({
      title: 'Отчёт сформирован',
      message: 'CSV-файл с вакансиями готов к скачиванию.',
      variant: 'success'
    });
  }

  function openVacancyModal() {
    const form = UI.element('form', 'form-grid');
    const titleField = UI.field({
      label: 'Название вакансии',
      name: 'title',
      placeholder: 'Например, Backend-разработчик',
      required: true,
      full: true
    });
    const departmentField = UI.field({
      label: 'Подразделение',
      name: 'department',
      type: 'select',
      value: 'Разработка',
      options: [
        { value: 'Разработка', label: 'Разработка' },
        { value: 'Продукт', label: 'Продукт' },
        { value: 'Продажи', label: 'Продажи' },
        { value: 'HR', label: 'HR' },
        { value: 'Финансы', label: 'Финансы' },
        { value: 'Операции', label: 'Операции' }
      ]
    });
    const statusField = UI.field({
      label: 'Статус',
      name: 'status',
      type: 'select',
      value: 'active',
      options: [
        { value: 'active', label: 'Активна' },
        { value: 'paused', label: 'На паузе' },
        { value: 'draft', label: 'Черновик' }
      ]
    });
    const ownerField = UI.field({
      label: 'Ответственный',
      name: 'owner',
      value: user.name,
      full: true
    });
    const noteField = UI.field({
      label: 'Комментарий',
      name: 'note',
      type: 'textarea',
      placeholder: 'Кратко опишите приоритет и требования',
      full: true
    });
    const actions = UI.element('div', 'form-actions form-grid__full');
    let modal;
    const cancelButton = UI.button({
      label: 'Отмена',
      variant: 'secondary',
      onClick: () => modal.close()
    });
    const submitButton = UI.button({
      label: 'Создать вакансию',
      variant: 'primary',
      type: 'submit',
      icon: 'plus'
    });
    actions.append(cancelButton, submitButton);
    form.append(titleField, departmentField, statusField, ownerField, noteField, actions);

    modal = UI.modal({
      title: 'Новая вакансия',
      description: 'Создайте позицию, используя универсальные поля UI Kit.',
      content: form,
      size: 'md',
      onClose() {
        modal.element.remove();
      }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const formData = new FormData(form);
      dashboardData.vacancies.unshift({
        id: Date.now(),
        title: formData.get('title').trim(),
        department: formData.get('department'),
        applications: 0,
        views: 0,
        invitations: 0,
        conversion: 0,
        status: formData.get('status')
      });
      state.vacancyQuery = '';
      state.vacancyStatus = 'all';
      state.vacancyPage = 1;
      refs.vacancySearch?.input && (refs.vacancySearch.input.value = '');
      refs.vacancyStatusFilter?.setValue('all', false);
      refs.vacancyTable?.clearSort();
      modal.close();
      updateVacanciesTable();
      UI.toast({
        title: 'Вакансия создана',
        message: `«${formData.get('title')}» добавлена в список.`,
        variant: 'success'
      });
    });
    (document.getElementById('app-overlays') || document.body).append(modal.element);
    modal.open();
  }

  function renderAnalyticsPageHeader() {
    const target = document.getElementById('page-header');
    const downloadButton = UI.button({
      label: 'Скачать отчёт',
      variant: 'secondary',
      icon: 'download',
      onClick: downloadAnalyticsReport
    });
    const header = UI.pageHeader({
      title: 'Аналитика',
      subtitle: `Воронка найма и эффективность каналов · ${periodCopy[state.period].toLocaleLowerCase('ru')}`,
      actions: downloadButton
    });
    refs.pageSubtitle = header.subtitleElement;
    target.replaceChildren(header);
  }

  function renderAnalyticsTabs() {
    const target = document.getElementById('analytics-tabs');
    target.classList.add('analytics-tabs-row');
    const tabs = UI.tabs({
      items: [
        { id: 'overview', label: 'Обзор' },
        { id: 'funnel', label: 'Воронка' },
        { id: 'sources', label: 'Источники' }
      ],
      activeId: state.analyticsTab,
      ariaLabel: 'Разделы аналитики',
      onChange(tabId) {
        state.analyticsTab = tabId;
        renderAnalyticsView();
      }
    });
    const badge = UI.badge({ label: 'Данные обновлены сегодня', variant: 'neutral', icon: 'clock' });
    target.replaceChildren(tabs, badge);
  }

  function renderAnalyticsStats() {
    const target = document.getElementById('analytics-stats');
    const cards = dashboardData.analytics.stats.map((stat) => {
      const snapshot = stat.periods[state.period] || stat.periods.thirty;
      return UI.statCard({
        label: stat.label,
        value: snapshot.value,
        delta: snapshot.delta,
        trend: snapshot.trend,
        icon: stat.icon,
        compact: true
      });
    });
    target.replaceChildren(...cards);
  }

  function renderAnalyticsView() {
    const view = dashboardData.analytics.tabs[state.analyticsTab];
    const chartTarget = document.getElementById('analytics-chart');
    const sideTarget = document.getElementById('analytics-side');
    const tableTarget = document.getElementById('analytics-table');

    const chartElement = UI.element('div', 'chart-canvas dashboard-chart-slot');
    chartTarget.replaceChildren(UI.card({
      title: view.chartTitle,
      subtitle: view.chartSubtitle,
      body: chartElement,
      className: 'chart-card'
    }));
    Charts.line({
      element: chartElement,
      labels: view.chartLabels,
      values: view.chartValues,
      valueFormatter: state.analyticsTab === 'sources'
        ? (value) => `${formatNumber(value)} ₽`
        : state.analyticsTab === 'funnel'
          ? (value) => formatPercent(value)
          : (value) => `${formatNumber(value)} откликов`,
      ariaLabel: view.chartTitle
    });

    const sideBody = UI.element('div', 'analytics-side-panel');
    if (view.donut) {
      const donut = UI.element('div', 'analytics-side-panel__chart');
      sideBody.append(donut);
      Charts.donut({
        element: donut,
        value: view.donut.value,
        max: view.donut.max,
        label: view.donut.label,
        valueFormatter: (value) => formatPercent(value),
        ariaLabel: `${view.sideTitle}: ${formatPercent(view.donut.value)}`
      });
    } else if (view.funnel) {
      const funnelList = UI.element('div', 'funnel-list');
      view.funnel.forEach((step) => {
        const item = UI.element('div', 'funnel-step');
        item.append(
          UI.element('span', 'funnel-step__label', { text: step.label }),
          UI.element('span', 'funnel-step__value', { text: formatNumber(step.value) })
        );
        const progress = UI.element('div', 'funnel-step__progress');
        progress.append(UI.progress({ value: step.progress, max: 100, label: `${step.label}: ${step.progress}%` }));
        item.append(progress);
        funnelList.append(item);
      });
      sideBody.append(funnelList);
    }
    const note = UI.element('div', 'analytics-note');
    const noteIcon = UI.element('span', 'analytics-note__icon', { 'aria-hidden': 'true' });
    noteIcon.append(UI.icon('info', { size: 18 }));
    note.append(noteIcon, UI.element('p', '', { text: view.note }));
    sideBody.append(note);
    sideTarget.replaceChildren(UI.card({
      title: view.sideTitle,
      subtitle: view.sideSubtitle,
      body: sideBody
    }));

    tableTarget.classList.add('analytics-table-section');
    tableTarget.replaceChildren(UI.card({
      title: view.tableTitle,
      subtitle: view.tableSubtitle,
      body: createAnalyticsTable(view)
    }));
  }

  function createAnalyticsTable(view) {
    if (view.tableType === 'funnel') {
      return UI.table({
        caption: view.tableTitle,
        columns: [
          { key: 'stage', label: 'Этап', render: (row) => createPrimaryCell(row.stage, 'Этап воронки') },
          { key: 'candidates', label: 'Кандидаты', align: 'right', render: (row) => formatNumber(row.candidates) },
          { key: 'averageTime', label: 'Среднее время', align: 'right' },
          { key: 'conversion', label: 'Конверсия', align: 'right', render: (row) => formatPercent(row.conversion) },
          { key: 'status', label: 'Оценка', sortable: false, render: (row) => createStatusBadge(row.status) }
        ],
        rows: view.rows
      });
    }

    if (view.tableType === 'channels') {
      return UI.table({
        caption: view.tableTitle,
        columns: [
          { key: 'source', label: 'Источник', render: (row) => createPrimaryCell(row.source, 'Канал привлечения') },
          { key: 'budget', label: 'Бюджет', align: 'right', render: (row) => formatCurrency(row.budget) },
          { key: 'applications', label: 'Отклики', align: 'right', render: (row) => formatNumber(row.applications) },
          { key: 'cost', label: 'Цена отклика', align: 'right', render: (row) => formatCurrency(row.cost) },
          { key: 'status', label: 'Оценка', sortable: false, render: (row) => createStatusBadge(row.status) }
        ],
        rows: view.rows
      });
    }

    return UI.table({
      caption: view.tableTitle,
      columns: [
        { key: 'source', label: 'Источник', render: (row) => createPrimaryCell(row.source, 'Канал привлечения') },
        { key: 'applications', label: 'Отклики', align: 'right', render: (row) => formatNumber(row.applications) },
        { key: 'invitations', label: 'Приглашения', align: 'right', render: (row) => formatNumber(row.invitations) },
        { key: 'hires', label: 'Наймы', align: 'right', render: (row) => formatNumber(row.hires) },
        { key: 'conversion', label: 'Конверсия', align: 'right', render: (row) => formatPercent(row.conversion) },
        { key: 'status', label: 'Оценка', sortable: false, render: (row) => createStatusBadge(row.status) }
      ],
      rows: view.rows
    });
  }

  function updateAnalyticsPeriod() {
    renderAnalyticsStats();
    if (refs.pageSubtitle) {
      refs.pageSubtitle.textContent = `Воронка найма и эффективность каналов · ${periodCopy[state.period].toLocaleLowerCase('ru')}`;
    }
  }

  function downloadAnalyticsReport() {
    const view = dashboardData.analytics.tabs[state.analyticsTab];
    let headers;
    let rows;
    if (view.tableType === 'funnel') {
      headers = ['Этап', 'Кандидаты', 'Среднее время', 'Конверсия', 'Оценка'];
      rows = view.rows.map((row) => [row.stage, row.candidates, row.averageTime, formatPercent(row.conversion), statusMeta[row.status].label]);
    } else if (view.tableType === 'channels') {
      headers = ['Источник', 'Бюджет', 'Отклики', 'Цена отклика', 'Оценка'];
      rows = view.rows.map((row) => [row.source, formatCurrency(row.budget), row.applications, formatCurrency(row.cost), statusMeta[row.status].label]);
    } else {
      headers = ['Источник', 'Отклики', 'Приглашения', 'Наймы', 'Конверсия', 'Оценка'];
      rows = view.rows.map((row) => [row.source, row.applications, row.invitations, row.hires, formatPercent(row.conversion), statusMeta[row.status].label]);
    }
    downloadCsv(`talentflow-analytics-${state.analyticsTab}.csv`, headers, rows);
    UI.toast({
      title: 'Аналитика экспортирована',
      message: 'CSV-файл сформирован для текущей вкладки.',
      variant: 'success'
    });
  }

  function initDashboard() {
    renderDashboardPageHeader();
    renderDashboardStats();
    renderApplicationsChart();
    renderConversionCard();
    renderTopVacancies();
    renderRecentApplications();
    createVacanciesTable();
  }

  function initAnalytics() {
    renderAnalyticsPageHeader();
    renderAnalyticsTabs();
    renderAnalyticsStats();
    renderAnalyticsView();
  }

  function init() {
    if (!window.UI || !window.Charts) {
      throw new Error('UI-компоненты или модуль графиков не загружены.');
    }
    renderShell();
    if (isAnalyticsPage) {
      initAnalytics();
    } else {
      initDashboard();
    }
  }

  window.dashboardData = dashboardData;
  document.addEventListener('DOMContentLoaded', init);
})();
