'use strict';

(() => {
  const data = globalThis.STUDY_GUIDE;
  const ui = globalThis.STUDY_UI;
  const byId = new Map(data.map(item => [item.id, item]));
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('.guide-panel')];
  const cards = [...document.querySelectorAll('.study-card')];
  const folds = [...document.querySelectorAll('.study-fold')];
  const search = document.querySelector('#study-search');
  const group = document.querySelector('#study-group');
  const section = document.querySelector('#study-section');
  const language = document.querySelector('#study-language');
  const tested = document.querySelector('#study-tested');
  const partyOverview = document.querySelector('#politiske-partier');
  const diagrams = [...document.querySelectorAll('.institution-diagram')];

  const viewFromHash = () => {
    const hash = location.hash.slice(1);
    if (hash === 'people') return 'timeline';
    return tabs.some(tab => tab.dataset.view === hash) ? hash : 'points';
  };
  let lang = 'da';
  let view = viewFromHash();
  const localized = item => lang === 'da' ? item.da : item;
  const normalize = value => value.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae');
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function cardContent(item) {
    const t = localized(item);
    const u = ui[lang];
    let heading = '';
    if (t.title) {
      const title = escape(t.title);
      const dates = escape(t.dates);
      const label = item.kind === 'event'
        ? `${dates} · ${title}`
        : `${title} (${item.kind === 'ruler' ? u.reign + ' ' : ''}${dates})`;
      heading = `<strong>${label}</strong>${t.body ? ' — ' : ''}`;
    }
    let marker = '';
    if (item.view === 'recurring') {
      marker = `<strong class="repeat-count" aria-label="${item.count} ${u.papersCount}">×${item.count}</strong> `;
    } else if (item.tested) {
      marker = `<span class="exam-star" title="${u.tested}" aria-label="${u.tested}">★</span> `;
    }
    if (item.view === 'points') return marker + heading + t.html;
    const links = item.refs.map(ref =>
      `<a href="${escape(ref.url)}">${escape(ref.label)}</a>`
    );
    if (item.source) links.push(`<a href="${escape(item.source)}">${u.reading}</a>`);
    const summary = u[{ recurring: 'examRefs', news: 'newsSources' }[item.view] || 'sources'];
    const details = links.length
      ? `<details class="entry-sources"><summary>${summary}</summary><div class="card-sources">${links.join('')}</div></details>`
      : '';
    return marker + heading + t.html + details;
  }

  function selectOptions(select, emptyLabel, options) {
    const selected = select.value;
    select.replaceChildren(new Option(emptyLabel, ''), ...Array.from(options, ([id, title]) => new Option(title, id)));
    select.value = options.has(selected) ? selected : '';
  }

  function updateSections() {
    const choices = data.filter(item => item.view === 'points' && (!group.value || item.group_id === group.value));
    selectOptions(section, ui[lang].allSections, new Map(choices.map(item => [item.section_id, localized(item).section])));
  }

  function visibleFolds() {
    return folds.filter(fold => !fold.hidden);
  }

  function setFolds(open) {
    visibleFolds().forEach(fold => { fold.open = open; });
  }

  function render(revealMatches = false) {
    const term = normalize(search.value.trim());
    const filterTested = tested.checked && !['recurring', 'news'].includes(view);
    let count = 0;
    let total = 0;
    for (const card of cards) {
      const item = byId.get(card.dataset.id);
      const t = localized(item);
      const inView = item.view === view;
      if (inView) total++;
      const visible = inView
        && (!group.value || item.group_id === group.value)
        && (view !== 'points' || !section.value || item.section_id === section.value)
        && (!filterTested || item.tested)
        && (!term || normalize([t.title, t.body, t.dates, t.group, t.section, t.subsection].join(' ')).includes(term));
      card.hidden = !visible;
      if (visible) count++;
    }
    const partyText = partyOverview.querySelectorAll('h6, th, td, li');
    partyOverview.hidden = view !== 'points' || !!(group.value && group.value !== '2')
      || !!(section.value && section.value !== '2.2') || tested.checked
      || (term && ![...partyText].some(cell => normalize(cell.textContent).includes(term)));
    for (const diagram of diagrams) {
      diagram.hidden = view !== 'points' || !!(group.value && group.value !== diagram.dataset.chapter)
        || !!(section.value && section.value !== diagram.dataset.section) || tested.checked || !!term;
    }
    const hasResults = count !== 0 || !partyOverview.hidden;
    for (const fold of folds) {
      fold.hidden = !fold.querySelector('.study-card:not([hidden]), .party-overview:not([hidden])');
    }
    if (revealMatches && (term || group.value || section.value || filterTested)) setFolds(true);
    document.querySelector('#fold-controls').hidden = !hasResults;
    const resultCount = ui[lang].count.replace('{n}', count).replace('{total}', total);
    document.querySelector('#result-count').textContent = term && !partyOverview.hidden
      ? resultCount + ui[lang].partyMatch
      : resultCount;
    document.querySelector('#empty-state').hidden = hasResults;
  }

  function updateView() {
    const u = ui[lang];
    tabs.forEach(tab => {
      const active = tab.dataset.view === view;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== 'panel-' + view; });
    document.querySelector('#view-heading').textContent = u[view];
    document.querySelector('#view-note').textContent = u[view + 'Note'];
    document.querySelector('#group-label').textContent = u[{ points: 'chapter', timeline: 'era' }[view] || 'topic'];
    search.placeholder = view === 'news' ? u.newsPlaceholder : u.placeholder;
    document.querySelector('#section-filter').hidden = view !== 'points';
    document.querySelector('#exam-options').hidden = ['recurring', 'news'].includes(view);
    selectOptions(group, u.allGroups, new Map(data.filter(item => item.view === view)
      .map(item => [item.group_id, localized(item).group])));
    if (view === 'points') updateSections();
    render(true);
  }

  function changeLanguage() {
    lang = language.value;
    document.querySelector('main').lang = lang;
    const u = ui[lang];
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = u[element.dataset.i18n]; });
    document.querySelectorAll('[data-da][data-en]').forEach(element => { element.textContent = element.dataset[lang]; });
    document.querySelector('[role="tablist"]').setAttribute('aria-label', u.views);
    for (const fold of folds) {
      const t = localized(byId.get(fold.dataset.first));
      const label = fold.querySelector(':scope > summary > .fold-heading');
      label.textContent = t[label.dataset.label];
    }
    cards.forEach(card => { card.innerHTML = cardContent(byId.get(card.dataset.id)); });
    updateView();
  }

  function selectView(next) {
    if (next !== view) {
      view = next;
      group.value = '';
      section.value = '';
      tested.checked = false;
      updateView();
    }
  }

  function clearFilters() {
    search.value = '';
    group.value = '';
    section.value = '';
    tested.checked = false;
    updateView();
  }

  function revealGuideAnchor() {
    const target = [partyOverview, ...diagrams].find(element => location.hash === '#' + element.id);
    if (!target) return;
    clearFilters();
    folds.filter(fold => fold.contains(target)).forEach(fold => { fold.open = true; });
    target.scrollIntoView();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectView(tab.dataset.view);
      history.replaceState(null, '', '#' + view);
    });
    tab.addEventListener('keydown', event => {
      const key = event.key;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
      const next = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1
        : (index + (key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  });
  window.addEventListener('hashchange', () => {
    selectView(viewFromHash());
    revealGuideAnchor();
  });
  search.addEventListener('input', () => render(true));
  group.addEventListener('change', () => {
    if (view === 'points') updateSections();
    render(true);
  });
  section.addEventListener('change', () => render(true));
  tested.addEventListener('change', () => render(true));
  language.addEventListener('change', changeLanguage);
  document.querySelector('#clear-filters').addEventListener('click', clearFilters);
  document.querySelector('#expand-sections').addEventListener('click', () => setFolds(true));
  document.querySelector('#collapse-sections').addEventListener('click', () => setFolds(false));

  let openedForPrint = [];
  window.addEventListener('beforeprint', () => {
    openedForPrint = visibleFolds().filter(fold => !fold.open);
    openedForPrint.forEach(fold => { fold.open = true; });
  });
  window.addEventListener('afterprint', () => {
    openedForPrint.forEach(fold => { fold.open = false; });
    openedForPrint = [];
  });
  document.querySelector('#print-guide').addEventListener('click', () => window.print());

  language.value = 'da';
  changeLanguage();
  const linkedSection = new URLSearchParams(location.search).get('section');
  if (view === 'points' && [...section.options].some(option => option.value === linkedSection)) {
    section.value = linkedSection;
    render(true);
  }
  revealGuideAnchor();
})();
