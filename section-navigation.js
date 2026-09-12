/* Menu destinations are separate screens; the original content stays in readable views. */
function initializeSectionPages() {
  const main = document.querySelector('#main');
  const source = Object.fromEntries(['hero', 'about', 'simulator', 'solutions', 'technology', 'contact'].map(id => [id, document.getElementById(id)]));
  if (!main || Object.values(source).some(element => !element) || document.documentElement.classList.contains('section-pages')) return;

  const language = () => document.documentElement.lang === 'en' ? 'en' : 'ko';
  const labels = {
    ko: {
      hero: 'ZiewCore 소개', about: '회사 소개', solutions: '솔루션', technology: '기술력', contact: '문의하기',
      overview: '소개', credentials: '인증 · 성과', story: '가치 · 연혁', live: '3D 둘러보기', details: '솔루션 상세',
      applications: '산업별 활용', cases: '도입 사례', architecture: '3D 아키텍처', engineering: '핵심 기술', performance: '성능 지표',
      views: '상세 화면', chooseSolution: '솔루션 상세 선택', end: '화면 끝', navigation: '상단 메뉴에서 다른 페이지를 선택하세요.'
    },
    en: {
      hero: 'ZiewCore', about: 'About', solutions: 'Solutions', technology: 'Technology', contact: 'Contact',
      overview: 'Overview', credentials: 'Credentials & results', story: 'Values & milestones', live: 'Explore in 3D', details: 'Solution details',
      applications: 'Applications', cases: 'Industry scenarios', architecture: '3D architecture', engineering: 'Core technology', performance: 'Performance',
      views: 'Page views', chooseSolution: 'Choose a solution to read', end: 'End of view', navigation: 'Choose another page from the navigation.'
    }
  };
  const text = key => labels[language()][key] || key;
  const pages = new Map();
  const allViews = [];
  const allLabels = [];
  let current = null;
  let selectedCard = null;
  let applyingRoute = false;

  function localized(element, key) {
    element.textContent = text(key);
    allLabels.push({ element, key });
    return element;
  }

  function makePage(key, views) {
    const element = document.createElement('div');
    element.className = 'section-page';
    element.dataset.page = key;
    element.hidden = true;
    element.setAttribute('aria-label', text(key));
    const bar = document.createElement('div');
    bar.className = 'page-view-bar';
    const name = localized(document.createElement('span'), key);
    name.className = 'page-view-name';
    const tablist = document.createElement('div');
    tablist.className = 'page-view-tabs';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', `${text(key)} · ${text('views')}`);
    bar.append(name, tablist);
    if (views.length > 1) element.append(bar);
    const page = { key, element, bar, tablist, views: [] };
    views.forEach(({ key: viewKey, hash, content }) => {
      const panel = document.createElement('div');
      panel.id = `page-${key}-${viewKey}`;
      panel.className = 'page-pane';
      panel.dataset.view = viewKey;
      panel.hidden = true;
      panel.tabIndex = 0;
      panel.setAttribute('role', views.length > 1 ? 'tabpanel' : 'region');
      const tab = localized(document.createElement('button'), viewKey);
      tab.id = `page-tab-${key}-${viewKey}`;
      tab.type = 'button';
      tab.className = 'page-view-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      tab.setAttribute('aria-selected', 'false');
      tab.tabIndex = -1;
      if (views.length > 1) panel.setAttribute('aria-labelledby', tab.id);
      else panel.setAttribute('aria-label', text(key));
      tab.addEventListener('click', () => navigate(hash));
      tablist.append(tab);
      content.classList.add('page-source');
      panel.append(content);
      element.append(panel);
      const view = { key: viewKey, page, panel, tab, hash, content };
      page.views.push(view);
      allViews.push(view);
    });
    tablist.addEventListener('keydown', event => {
      const index = page.views.findIndex(view => view.tab === event.target);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % page.views.length;
      if (event.key === 'ArrowLeft') next = (index + page.views.length - 1) % page.views.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = page.views.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      navigate(page.views[next].hash);
      page.views[next].tab.focus({ preventScroll: true });
      page.views[next].tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    });
    pages.set(key, page);
    main.append(element);
    return page;
  }

  function contentGroup(className, nodes) {
    const element = document.createElement('div');
    element.className = className;
    nodes.filter(Boolean).forEach(node => element.append(node));
    return element;
  }

  makePage('hero', [{ key: 'overview', hash: '#hero', content: source.hero }]);

  const credentials = contentGroup('about-page-content', [source.about.querySelector('.about-stats'), source.about.querySelector('.certification-badges')]);
  const story = contentGroup('about-page-content', [source.about.querySelector('.value-grid'), source.about.querySelector('.timeline-wrap')]);
  makePage('about', [
    { key: 'overview', hash: '#about', content: source.about },
    { key: 'credentials', hash: '#about-certifications', content: credentials },
    { key: 'story', hash: '#about-milestones', content: story }
  ]);

  const applications = contentGroup('solutions-page-content', [source.simulator.querySelector('.usecase-section')]);
  const cases = contentGroup('solutions-page-content', [source.solutions.querySelector('.industry-section'), source.simulator.querySelector('.experience-cta')]);
  makePage('solutions', [
    { key: 'live', hash: '#solutions', content: source.simulator },
    { key: 'details', hash: '#solution-details', content: source.solutions },
    { key: 'applications', hash: '#industry-applications', content: applications },
    { key: 'cases', hash: '#industry-scenarios', content: cases }
  ]);

  const engineering = contentGroup('technology-page-content', [source.technology.querySelector('.section-intro'), source.technology.querySelector('.tech-grid')]);
  const performance = contentGroup('technology-page-content', [...source.technology.querySelectorAll('.perf-dashboard')]);
  makePage('technology', [
    { key: 'architecture', hash: '#technology', content: source.technology },
    { key: 'engineering', hash: '#technology-details', content: engineering },
    { key: 'performance', hash: '#technology-performance', content: performance }
  ]);
  makePage('contact', [{ key: 'overview', hash: '#contact', content: source.contact }]);

  const cards = [...source.solutions.querySelectorAll('.solution-card')];
  const cardTabs = document.createElement('div');
  cardTabs.className = 'solution-detail-tabs';
  cardTabs.setAttribute('role', 'tablist');
  cardTabs.setAttribute('aria-label', text('chooseSolution'));
  cards[0]?.parentElement.before(cardTabs);
  cards.forEach((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `detail-tab-${card.id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', card.id);
    button.textContent = `${String(index + 1).padStart(2, '0')}  ${card.querySelector('h3').textContent.trim()}`;
    button.addEventListener('click', () => navigate(`#${card.id}`));
    cardTabs.append(button);
    card.setAttribute('role', 'tabpanel');
    card.setAttribute('aria-labelledby', button.id);
    card.tabIndex = 0;
  });
  cardTabs.addEventListener('keydown', event => {
    const buttons = [...cardTabs.children];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    navigate(`#${cards[next].id}`);
    buttons[next].focus({ preventScroll: true });
    buttons[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  });

  function selectCard(id) {
    selectedCard = cards.find(card => card.id === id) || cards[0];
    cards.forEach((card, index) => {
      const active = card === selectedCard;
      card.hidden = !active;
      cardTabs.children[index].setAttribute('aria-selected', String(active));
      cardTabs.children[index].tabIndex = active ? 0 : -1;
    });
  }
  selectCard(cards[0]?.id);

  const routes = new Map([
    ['', ['hero', 'overview']], ['#main', ['hero', 'overview']], ['#hero', ['hero', 'overview']], ['#hero-webgl', ['hero', 'overview']],
    ['#about', ['about', 'overview']], ['#about-certifications', ['about', 'credentials']], ['#about-milestones', ['about', 'story']],
    ['#solutions', ['solutions', 'live']], ['#simulator', ['solutions', 'live']], ['#solution-webgl', ['solutions', 'live']],
    ['#solution-details', ['solutions', 'details']], ['#industry-applications', ['solutions', 'applications']], ['#industry-scenarios', ['solutions', 'cases']],
    ['#technology', ['technology', 'architecture']], ['#technology-webgl', ['technology', 'architecture']],
    ['#technology-details', ['technology', 'engineering']], ['#technology-performance', ['technology', 'performance']], ['#contact', ['contact', 'overview']]
  ]);
  const sceneKeys = ['vision', 'energy', 'commerce', 'office', 'print', 'observer'];
  function resolve(hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return null; }
    if (id.startsWith('card-') && cards.some(card => card.id === id)) return { page: 'solutions', view: 'details', card: id };
    const scene = sceneKeys.find(key => id === `panel-${key}` || id === `tab-${key}`);
    if (scene) return { page: 'solutions', view: 'live', scene };
    const known = routes.get(hash);
    if (known) return { page: known[0], view: known[1] };
    const target = id ? document.getElementById(id) : null;
    const matching = allViews.find(view => view.panel.contains(target));
    return matching ? { page: matching.page.key, view: matching.key, target } : null;
  }

  function activate(route, { focus = false, reset = true } = {}) {
    const page = pages.get(route.page);
    if (!page) return;
    const activeView = page.views.find(view => view.key === route.view) || page.views[0];
    const changingView = current?.page !== page.key || current?.view !== activeView.key;
    for (const candidate of pages.values()) {
      const active = candidate === page;
      candidate.element.hidden = !active;
      candidate.element.inert = !active;
      candidate.views.forEach(view => {
        const chosen = active && view === activeView;
        view.panel.hidden = !chosen;
        view.panel.classList.remove('page-arriving');
        view.tab.setAttribute('aria-selected', String(chosen));
        view.tab.tabIndex = chosen ? 0 : -1;
      });
    }
    if (route.view === 'details') selectCard(route.card || cards[0]?.id);
    if (route.page === 'solutions' && route.view === 'live') {
      const sceneTab = document.querySelector(`.sim-tab[data-sim="${route.scene || 'vision'}"]`);
      if (sceneTab?.getAttribute('aria-selected') !== 'true') {
        applyingRoute = true;
        sceneTab?.click();
        applyingRoute = false;
      }
    }
    current = { page: page.key, view: activeView.key };
    if (changingView) activeView.panel.classList.add('page-arriving');
    document.documentElement.dataset.activePage = page.key;
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
      const destination = resolve(link.getAttribute('href'));
      const active = destination?.page === page.key;
      link.classList.toggle('active-nav', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (reset) activeView.panel.scrollTop = 0;
    // A new visible pane wakes IntersectionObserver-based renderers automatically.
    // Resize also updates camera framing after the menu has changed the available space.
    requestAnimationFrame(() => {
      if (current?.page !== page.key || current?.view !== activeView.key) return;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (route.target) route.target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      if (focus) activeView.panel.focus({ preventScroll: true });
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new CustomEvent('ziewise:pagechange', { detail: { ...current } }));
    });
  }

  function navigate(hash, { historyMode = 'push', focus = false } = {}) {
    const route = resolve(hash);
    if (!route) return false;
    if (historyMode !== 'none' && location.hash !== hash) {
      history[historyMode === 'replace' ? 'replaceState' : 'pushState'](history.state, '', hash || location.pathname + location.search);
    }
    activate(route, { focus });
    return true;
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const href = link.getAttribute('href');
    if (!href?.startsWith('#') || href === '#') return;
    if (href === '#main') {
      event.preventDefault();
      const view = pages.get(current?.page)?.views.find(candidate => candidate.key === current?.view);
      view?.panel.focus({ preventScroll: true });
      return;
    }
    if (resolve(href)) {
      event.preventDefault();
      const destination = sceneKeys.includes(link.dataset.openScene) ? `#panel-${link.dataset.openScene}` : href;
      navigate(destination, { focus: Boolean(link.closest('.navbar')) });
    }
  }, true);
  const followHistory = () => activate(resolve(location.hash) || { page: 'hero', view: 'overview' });
  addEventListener('popstate', followHistory);
  addEventListener('hashchange', followHistory);
  main.addEventListener('animationend', event => {
    if (event.animationName === 'page-clarify') event.target.classList.remove('page-arriving');
  });
  document.querySelectorAll('.sim-tab').forEach(tab => tab.addEventListener('click', () => {
    if (!applyingRoute && current?.page === 'solutions' && current?.view === 'live') navigate(`#panel-${tab.dataset.sim}`);
  }));

  function translateControls() {
    allLabels.forEach(({ element, key }) => { element.textContent = text(key); });
    pages.forEach(page => {
      page.element.setAttribute('aria-label', text(page.key));
      page.tablist.setAttribute('aria-label', `${text(page.key)} · ${text('views')}`);
      if (page.views.length === 1) page.views[0].panel.setAttribute('aria-label', text(page.key));
    });
    cardTabs.setAttribute('aria-label', text('chooseSolution'));
  }
  addEventListener('ziewise:language', translateControls);
  const navbar = document.querySelector('.navbar');
  const updateHeight = () => document.documentElement.style.setProperty('--page-nav-height', `${navbar.getBoundingClientRect().height}px`);
  new ResizeObserver(updateHeight).observe(navbar);
  updateHeight();
  document.documentElement.classList.add('section-pages');
  main.tabIndex = -1;
  main.querySelectorAll('.enter-pending').forEach(element => element.classList.remove('enter-pending'));
  window.ZiewisePages = { navigate, getCurrent: () => current ? { ...current } : null };
  followHistory();
}

// App translations first snapshot the existing document. Build views afterwards.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => queueMicrotask(initializeSectionPages), { once: true });
else queueMicrotask(initializeSectionPages);
