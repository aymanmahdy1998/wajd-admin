/* WAJD v121: the «كل الكتابات» archive (/search). Moved out of the theme so it can change without a theme upload.
   Year buttons, every month open with its count, forgiving Arabic search.
   No Firebase reads: posts come from the public Blogger feed; read marks are applied by core.js. */

const WAJD_ARCHIVE_CSS = `
.wajd-archive-year{cursor:pointer}
.wajd-archive-year-heading{display:flex;align-items:baseline;justify-content:space-between;gap:16px}
.wajd-archive-year-heading small{color:var(--wajd-muted);font:600 13.5px Tajawal,sans-serif;unicode-bidi:isolate}
.wajd-archive-section{overflow:hidden;border:1px solid var(--wajd-line);border-radius:16px;background:var(--wajd-paper)}
.wajd-archive-section>h4{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0;padding:14px 20px;border-bottom:1px solid var(--wajd-line);color:var(--wajd-ink);font-size:17px;font-weight:800}
.wajd-archive-section>h4 small{color:var(--wajd-muted);font-size:12.5px;font-weight:600}
.wajd-archive-label{font-size:12px}
.wajd-archive-item.wajd-is-read .wajd-archive-label::after{content:'✓ مقروء';margin-inline-start:10px;color:var(--wajd-accent);font-weight:700;unicode-bidi:isolate}
.wajd-archive-count{margin:0;color:var(--wajd-muted);font:600 13.5px Tajawal,sans-serif}
`;

(function wajdArchive() {
  const root = document.querySelector('.ArchivePage');
  if (!root || typeof window.wajdLoadAllFeedEntries !== 'function') return;

  const style = document.createElement('style');
  style.id = 'wajd-archive-v121';
  style.textContent = WAJD_ARCHIVE_CSS;
  document.head.appendChild(style);

  const monthFormatter = new Intl.DateTimeFormat('ar-EG', { month:'long' });
  const number = new Intl.NumberFormat('ar-EG', { useGrouping:false });
  const monthName = index => monthFormatter.format(new Date(2020, index, 1));
  const countLabel = (count, one, two, few, many) => count === 1 ? one : count === 2 ? two : number.format(count) + ' ' + (count >= 3 && count <= 10 ? few : many);
  const writings = count => countLabel(count, 'كتابة واحدة', 'كتابتان', 'كتابات', 'كتابة');
  // «أخلاق» = «اخلاق», «التربية» = «التربيه»; tashkeel and punctuation are ignored.
  const normalize = value => String(value || '').toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

  let posts = [], years = [], activeYear = '', query = '', results, input;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === 'string') element.textContent = text;
    return element;
  };

  function prepare(entries) {
    return entries.map(entry => {
      const date = new Date(entry.published.$t);
      const link = (entry.link || []).find(item => item.rel === 'alternate');
      const labels = (entry.category || []).map(label => label.term);
      const id = String(entry.id && entry.id.$t || '').match(/post-(\d+)$/);
      return {
        title:entry.title.$t.trim(), url:link ? link.href.replace(/^http:/, 'https:') : '#', id:id ? id[1] : '',
        date, year:String(date.getFullYear()), month:date.getMonth(), day:date.getDate(), labels,
        search:normalize(entry.title.$t + ' ' + labels.join(' '))
      };
    }).sort((a, b) => b.date - a.date);
  }

  function item(post) {
    const row = make('li', 'wajd-archive-item');
    if (post.id) row.dataset.postId = post.id;
    row.appendChild(make('span', 'wajd-archive-day', number.format(post.day)));
    const copy = make('div', 'wajd-archive-copy');
    const link = make('a', 'wajd-archive-title', post.title);
    link.href = post.url;
    copy.appendChild(link);
    copy.appendChild(make('span', 'wajd-archive-label', post.labels[0] || ''));
    row.appendChild(copy);
    return row;
  }

  function monthSection(month, list) {
    const section = make('section', 'wajd-archive-section');
    const heading = make('h4', '', monthName(month));
    heading.appendChild(make('small', '', writings(list.length)));
    section.appendChild(heading);
    const ul = make('ul', 'wajd-archive-list');
    list.forEach(post => ul.appendChild(item(post)));
    section.appendChild(ul);
    return section;
  }

  function render() {
    results.innerHTML = '';
    root.querySelectorAll('.wajd-archive-year').forEach(button => {
      const selected = !query && button.dataset.year === activeYear;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    const words = query.split(' ').filter(Boolean);
    const visible = posts.filter(post => words.length ? words.every(word => post.search.includes(word)) : post.year === activeYear);
    if (query) {
      const count = make('p', 'wajd-archive-count', visible.length ? countLabel(visible.length, 'نتيجة واحدة', 'نتيجتان', 'نتائج', 'نتيجة') : 'لا توجد نتائج');
      count.setAttribute('role', 'status');
      results.appendChild(count);
    }
    if (!visible.length) {
      results.appendChild(make('div', 'wajd-archive-state', 'لم أجد كتابة بهذه الكلمات.'));
      return;
    }
    years.filter(year => visible.some(post => post.year === year)).forEach(year => {
      const yearPosts = visible.filter(post => post.year === year);
      const heading = make('h3', 'wajd-archive-year-heading', number.format(Number(year)));
      heading.appendChild(make('small', '', writings(yearPosts.length)));
      results.appendChild(heading);
      [...new Set(yearPosts.map(post => post.month))].sort((a, b) => b - a)
        .forEach(month => results.appendChild(monthSection(month, yearPosts.filter(post => post.month === month))));
    });
  }

  function build() {
    root.innerHTML = '';
    const shell = make('div', 'wajd-archive-shell');
    const intro = make('div', 'wajd-archive-intro');
    intro.appendChild(make('h2', '', 'الكتابات كما مرّت في الزمن'));
    intro.appendChild(make('p', '', writings(posts.length) + ' منذ ' + number.format(Number(years[years.length - 1])) + '. اختر سنة لتتصفّح كتاباتها شهرًا بشهر.'));
    shell.appendChild(intro);

    const tools = make('div', 'wajd-archive-tools');
    const search = make('label', 'wajd-archive-search');
    search.innerHTML = '<svg aria-hidden="true" class="line"><use href="#ic-search"></use></svg>';
    input = make('input', '');
    input.type = 'search';
    input.placeholder = 'ابحث بعنوان أو موضوع…';
    input.setAttribute('aria-label', 'البحث في عناوين الأرشيف وأقسامه');
    input.addEventListener('input', () => { query = normalize(input.value); render(); });
    search.appendChild(input);
    tools.appendChild(search);

    const nav = make('div', 'wajd-archive-years');
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', 'سنوات الأرشيف');
    years.forEach(year => {
      const button = make('button', 'wajd-archive-year', number.format(Number(year)));
      button.type = 'button';
      button.dataset.year = year;
      button.addEventListener('click', () => {
        activeYear = year; query = ''; input.value = '';
        // The chosen year stays in the address, so «back» from an article returns to it.
        history.replaceState(history.state, '', location.pathname + location.search + '#y' + year);
        render();
      });
      nav.appendChild(button);
    });
    tools.appendChild(nav);
    shell.appendChild(tools);
    results = make('div', 'wajd-archive-results');
    shell.appendChild(results);
    root.appendChild(shell);
    render();
  }

  root.innerHTML = '<div class="wajd-archive-state">جارٍ ترتيب الكتابات زمنيًا…</div>';
  window.wajdLoadAllFeedEntries('/feeds/posts/summary?alt=json&orderby=published', 40)
    .then(entries => {
      posts = prepare(entries);
      years = [...new Set(posts.map(post => post.year))];
      if (!posts.length) { root.innerHTML = '<div class="wajd-archive-state">لا توجد كتابات في الأرشيف بعد.</div>'; return; }
      const wanted = (location.hash.match(/^#y(\d{4})$/) || [])[1];
      activeYear = years.includes(wanted) ? wanted : years[0];
      build();
    })
    .catch(error => {
      console.warn('Wajd archive:', error);
      root.innerHTML = '<div class="wajd-archive-state">تعذّر تحميل الأرشيف الآن. حاول تحديث الصفحة بعد قليل.</div>';
    });
})();
