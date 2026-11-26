/* WAJD v120 extras: home page topics + author card, quote sharing in articles, and "install as an app".
   No Firebase reads here. Styles are injected below so the theme only needs the one import line. */

const WAJD_EXTRAS_CSS = `
.wajd-home-topics{display:none;gap:8px;overflow-x:auto;padding:2px 2px 14px;margin:0 0 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.wajd-home-topics::-webkit-scrollbar{display:none}
.wajd-home-topics a{flex:0 0 auto;padding:8px 14px;border:1px solid var(--wajd-line);border-radius:999px;background:#fffaf5;color:var(--wajd-ink)!important;font:600 13.5px/1.3 Tajawal,sans-serif;text-decoration:none;white-space:nowrap}
.wajd-home-topics a:active{background:var(--wajd-accent);color:#fff!important}
@media(max-width:1023px){.wajd-home-topics{display:flex}}
/* v122: a quiet end of article — path box (if any), one action row, one next reading, comments. */
body.post .hideensa .post-tags,body.post .hideensa .pSh,body.post .hideensa .page-navigation,body.post .wajd-next-reading-note,body.post .wajd-next-secondary{display:none!important}
body.post .wajd-article-path[data-has-next] ~ .wajd-next-reading{display:none!important}
body.post .commentsection ~ .wajd-article-path{margin-top:20px}
body.post .wajd-next-reading-grid{grid-template-columns:minmax(0,1fr)!important}
body.post .wajd-like-panel{display:flex!important;flex-direction:row!important;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px!important;padding:14px!important}
body.post .wajd-like-panel .wajd-reader-action{display:contents}
body.post .wajd-like-panel .wajd-like-copy{display:none!important}
body.post .wajd-like-panel .wajd-like-button{width:auto!important;min-width:84px!important;margin:0!important;padding-inline:14px!important}
@media(max-width:420px){body.post .wajd-like-panel{flex-wrap:nowrap!important;gap:8px!important;padding:12px 8px!important}body.post .wajd-like-panel .wajd-like-button{min-width:0!important;padding-inline:12px!important}}
body.post .wajd-like-panel .wajd-like-status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
body.post .wajd-next-path-visual{display:none!important}
body.post .wajd-next-primary{grid-template-columns:minmax(0,1fr)!important;min-height:0!important}
body.post .wajd-share-button svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.wajd-footer-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 40px;margin:18px 0 6px}
.wajd-footer-links h4{margin:0 0 8px;color:#f3e6da;font:700 14px Tajawal,sans-serif;opacity:.75}
.wajd-footer-links a,.wajd-footer-links button{display:block;padding:4px 0;border:0;background:none;color:#f7f3ec!important;font:500 14.5px/1.6 Tajawal,sans-serif;text-align:start;text-decoration:none;cursor:pointer;opacity:.9}
.wajd-footer-links a:hover,.wajd-footer-links button:hover{opacity:1;text-decoration:underline}
.wajd-404{max-width:560px;margin:10px auto 30px;text-align:center}
.wajd-404 .wajd-404-mark{font:700 64px/1 'Noto Naskh Arabic',serif;color:var(--wajd-accent);opacity:.9}
.wajd-404 h1{margin:14px 0 8px!important;color:var(--wajd-ink);font:700 26px/1.5 'Noto Naskh Arabic',serif!important}
.wajd-404 p{margin:0 0 18px;color:var(--wajd-muted);font:400 16px/1.9 Tajawal,sans-serif}
.wajd-404 form{display:flex;gap:8px;margin:0 auto 14px;max-width:420px}
.wajd-404 input{flex:1;min-width:0;padding:11px 14px;border:1px solid var(--wajd-line);border-radius:12px;background:#fffaf5;color:var(--wajd-ink);font:500 15px Tajawal,sans-serif}
.wajd-404 button,.wajd-404 .wajd-404-home{padding:11px 18px;border:0;border-radius:12px;background:var(--wajd-accent);color:#fff!important;font:700 15px Tajawal,sans-serif;text-decoration:none;cursor:pointer}
.wajd-404 .wajd-404-home{display:inline-block;background:none;color:var(--wajd-accent)!important;border:1px solid var(--wajd-accent)}
body.dark-mode .wajd-404 input{background:var(--MinBgColor)}
.wajd-card-rt{white-space:nowrap;unicode-bidi:isolate}
.wajd-card-rt::before{content:'';display:inline-block;width:4px;height:4px;margin:0 8px 3px;border-radius:50%;background:currentColor;opacity:.55;vertical-align:middle}
.wajd-home-author{display:flex;align-items:center;gap:16px;margin:26px 0 8px;padding:18px;border:1px solid var(--wajd-line);border-radius:16px;background:#fffaf5}
.wajd-home-author img{flex:0 0 auto;width:68px;height:68px;border-radius:50%;object-fit:cover;border:2px solid var(--wajd-line)}
.wajd-home-author small{display:block;color:var(--wajd-muted);font:600 12px Tajawal,sans-serif;margin-bottom:2px}
.wajd-home-author h2{margin:0 0 4px;color:var(--wajd-ink);font:700 19px/1.4 'Noto Naskh Arabic',serif}
.wajd-home-author p{margin:0 0 8px;color:var(--wajd-muted);font:400 14px/1.85 Tajawal,sans-serif}
.wajd-home-author a{color:var(--wajd-accent)!important;font:700 13.5px Tajawal,sans-serif;text-decoration:none}
.wajd-quote-share{position:absolute;z-index:9999;display:none;align-items:center;gap:2px;padding:4px;border-radius:999px;background:var(--wajd-ink,#29231f);box-shadow:0 8px 24px rgba(0,0,0,.22);transform:translate(-50%,-100%)}
.wajd-quote-share.is-visible{display:flex}
.wajd-quote-share button{display:flex;align-items:center;gap:6px;padding:8px 12px;border:0;border-radius:999px;background:none;color:#fff;font:600 13px Tajawal,sans-serif;cursor:pointer;white-space:nowrap}
.wajd-quote-share button:hover{background:rgba(255,255,255,.12)}
.wajd-quote-share svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.wajd-quote-share.is-touch{position:fixed;left:50%;bottom:76px;top:auto!important;transform:translateX(-50%)}
.wajd-quote-toast{position:fixed;z-index:10000;left:50%;bottom:130px;transform:translateX(-50%);padding:9px 16px;border-radius:999px;background:var(--wajd-ink,#29231f);color:#fff;font:600 13px Tajawal,sans-serif}
.wajd-install-sheet{position:fixed;inset:0;z-index:10001;display:flex;align-items:flex-end;justify-content:center;background:rgba(20,16,14,.45)}
.wajd-install-card{width:min(440px,100%);margin:0 0 0;padding:22px 20px 26px;border-radius:20px 20px 0 0;background:#fffaf5;color:var(--wajd-ink);text-align:center;font-family:Tajawal,sans-serif}
.wajd-install-card img{width:72px;height:72px;border-radius:18px}
.wajd-install-card h3{margin:10px 0 6px;font:700 20px/1.4 'Noto Naskh Arabic',serif}
.wajd-install-card p{margin:0 0 14px;color:var(--wajd-muted);font-size:14.5px;line-height:1.9}
.wajd-install-card ol{margin:0 0 16px;padding:0 20px 0 0;text-align:start;font-size:14.5px;line-height:2}
.wajd-install-card button{width:100%;padding:12px;border:0;border-radius:12px;font:700 15px Tajawal,sans-serif;cursor:pointer}
.wajd-install-card .is-primary{background:var(--wajd-accent);color:#fff;margin-bottom:8px}
.wajd-install-card .is-quiet{background:none;color:var(--wajd-muted)}
body.dark-mode .wajd-home-topics a,body.dark-mode .wajd-home-author,body.dark-mode .wajd-install-card{background:var(--MinBgColor)}
`;

function wajdExtrasStyles() {
  if (document.getElementById('wajd-extras-styles')) return;
  const style = document.createElement('style');
  style.id = 'wajd-extras-styles';
  style.textContent = WAJD_EXTRAS_CSS;
  document.head.appendChild(style);
}

function wajdExtrasEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* ---------- Home: topic chips (phones) and a short author card ---------- */
const WAJD_HOME_TOPICS = [
  ['تأملات', 'تأملات نفسية وإنسانية'],
  ['دين وروح', 'دين وروح'],
  ['سخرية ومفارقات', 'سخرية ومفارقات'],
  ['سلوك ومجتمع', 'سلوك ومجتمع'],
  ['نصوص وقصص', 'نصوص وقصص'],
  ['كتب وأدب', 'كتب وأدب'],
  ['سؤال وجواب', 'إجابات تللينوم']
];
const WAJD_AUTHOR = {
  name: 'أيمن المهدي',
  photo: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi9gHfJ1m2tvYi5DbwVDw3f6LQ9RGK67Sr_oPZqHmdu82lZgpSZmIUc4WLxTm1j4AgdcNC7NZG_U0asUSWcEp5gGPsPWlm9gXJYG3zuowVwo6AqohNTH_rvht7WG4rFnYPvocwcC0tNmyXrM9H6UY86cWyoc7r3toEvGohzOdbQQ9UYEg/s160/unnamed.jpg',
  bio: 'وَجْد مساحة شخصية للكتابة عن الإنسان؛ أفكاره، ومشاعره، وتناقضاته، وعلاقته بنفسه وبالناس وبالله.',
  about: '/p/about-us.html'
};

function wajdExtrasHome() {
  if (!document.body.classList.contains('home') || /reading-path=/.test(location.search)) return;
  const blog = document.getElementById('Blog1');
  if (!blog) return;
  const headline = blog.querySelector('.headline');
  if (headline && !blog.querySelector('.wajd-home-topics')) {
    const nav = document.createElement('nav');
    nav.className = 'wajd-home-topics';
    nav.setAttribute('aria-label', 'تصفح حسب الموضوع');
    nav.innerHTML = WAJD_HOME_TOPICS.map(([label, tag]) => '<a href="/search/label/' + encodeURIComponent(tag) + '">' + wajdExtrasEscape(label) + '</a>').join('');
    headline.parentNode.insertBefore(nav, headline);
  }
  if (!blog.querySelector('.wajd-home-author')) {
    const card = document.createElement('section');
    card.className = 'wajd-home-author';
    card.setAttribute('aria-label', 'عن الكاتب');
    card.innerHTML = '<img alt="' + wajdExtrasEscape(WAJD_AUTHOR.name) + '" decoding="async" loading="lazy" src="' + WAJD_AUTHOR.photo + '">'
      + '<div><small>يكتب في وَجْد</small><h2>' + wajdExtrasEscape(WAJD_AUTHOR.name) + '</h2><p>' + wajdExtrasEscape(WAJD_AUTHOR.bio) + '</p>'
      + '<a href="' + WAJD_AUTHOR.about + '">عن وَجْد ←</a></div>';
    blog.appendChild(card);
  }
}

/* ---------- Articles: share a selected quote ---------- */
function wajdExtrasToast(text) {
  const toast = document.createElement('div');
  toast.className = 'wajd-quote-toast'; toast.setAttribute('role', 'status'); toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function wajdExtrasQuotes() {
  const body = document.querySelector('.post-body');
  if (!body || !document.body.classList.contains('post')) return;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const bar = document.createElement('div');
  bar.className = 'wajd-quote-share' + (touch ? ' is-touch' : '');
  bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'مشاركة الاقتباس');
  const icon = path => '<svg aria-hidden="true" viewBox="0 0 24 24">' + path + '</svg>';
  const actions = navigator.share
    ? [['share', 'شارك الاقتباس', icon('<path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5"/>')], ['copy', 'نسخ', icon('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>')]]
    : [['telegram', 'تليجرام', icon('<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/>')], ['whatsapp', 'واتساب', icon('<path d="M4 20l1.4-4A8 8 0 1 1 8 18.6z"/>')], ['copy', 'نسخ الاقتباس', icon('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>')]];
  bar.innerHTML = actions.map(([id, label, svg]) => '<button data-quote-action="' + id + '" type="button">' + svg + '<span>' + label + '</span></button>').join('');
  document.body.appendChild(bar);

  let quote = '';
  const title = () => (document.querySelector('.post-title, .entry-title') || {}).textContent || document.title;
  const url = () => (document.querySelector('link[rel=canonical]') || {}).href || location.href.split('#')[0];
  const message = () => '«' + quote + '»\n— ' + WAJD_AUTHOR.name + '، من «' + String(title()).trim() + '»\n' + url();
  const hide = () => bar.classList.remove('is-visible');

  const update = () => {
    const selection = window.getSelection();
    const text = selection && selection.rangeCount ? String(selection).replace(/\s+/g, ' ').trim() : '';
    if (text.length < 12 || text.length > 600 || !body.contains(selection.anchorNode) || !body.contains(selection.focusNode)) { hide(); return; }
    quote = text;
    if (!touch) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      bar.style.left = Math.min(window.innerWidth - 120, Math.max(120, rect.left + rect.width / 2)) + window.scrollX + 'px';
      bar.style.top = rect.top + window.scrollY - 10 + 'px';
    }
    bar.classList.add('is-visible');
  };
  let timer = 0;
  document.addEventListener('selectionchange', () => { clearTimeout(timer); timer = setTimeout(update, touch ? 450 : 150); });
  bar.addEventListener('mousedown', event => event.preventDefault()); // keep the selection while clicking
  bar.addEventListener('click', async event => {
    const button = event.target.closest('[data-quote-action]'); if (!button) return;
    const action = button.dataset.quoteAction, text = message();
    if (action === 'share') { try { await navigator.share({ text }); } catch (error) {} }
    else if (action === 'telegram') window.open('https://t.me/share/url?url=' + encodeURIComponent(url()) + '&text=' + encodeURIComponent(text.replace('\n' + url(), '')), '_blank', 'noopener');
    else if (action === 'whatsapp') window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    else if (action === 'copy') { try { await navigator.clipboard.writeText(text); wajdExtrasToast('نُسخ الاقتباس مع رابط المقال'); } catch (error) { wajdExtrasToast('تعذّر النسخ'); } }
    hide();
  });
}

/* ---------- Install as an app (Android prompt, iPhone instructions) ---------- */
let wajdInstallPrompt = null;
const WAJD_APP_ICON = 'https://aymanmahdy1998.github.io/wajd-admin/icons/wajd-icon-192.png';

function wajdExtrasStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}
function wajdExtrasIsIos() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return false;
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function wajdExtrasInstallSheet() {
  const old = document.querySelector('.wajd-install-sheet'); if (old) old.remove();
  const sheet = document.createElement('div');
  sheet.className = 'wajd-install-sheet';
  const ios = wajdExtrasIsIos();
  const steps = ios
    ? '<ol><li>افتح الموقع في <b>Safari</b>.</li><li>اضغط زر المشاركة <b>⬆︎</b> أسفل الشاشة.</li><li>اختر <b>«إضافة إلى الشاشة الرئيسية»</b>.</li></ol>'
    : wajdInstallPrompt ? '' : '<ol><li>افتح الموقع في <b>Chrome</b>.</li><li>اضغط قائمة النقاط الثلاث <b>⋮</b>.</li><li>اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.</li></ol>';
  sheet.innerHTML = '<div class="wajd-install-card" role="dialog" aria-modal="true" aria-label="تثبيت وَجْد">'
    + '<img alt="" src="' + WAJD_APP_ICON + '"><h3>وَجْد على هاتفك</h3>'
    + '<p>أيقونة على الشاشة الرئيسية تفتح المدونة كتطبيق، بلا شريط المتصفح.</p>' + steps
    + (wajdInstallPrompt && !ios ? '<button class="is-primary" data-install="go" type="button">تثبيت الآن</button>' : '')
    + '<button class="is-quiet" data-install="close" type="button">' + (wajdInstallPrompt && !ios ? 'لاحقًا' : 'حسنًا') + '</button></div>';
  sheet.addEventListener('click', async event => {
    const action = event.target.closest('[data-install]');
    if (event.target === sheet || (action && action.dataset.install === 'close')) { sheet.remove(); return; }
    if (action && action.dataset.install === 'go' && wajdInstallPrompt) {
      wajdInstallPrompt.prompt();
      try { await wajdInstallPrompt.userChoice; } catch (error) {}
      wajdInstallPrompt = null; sheet.remove(); wajdExtrasInstallEntry();
    }
  });
  document.body.appendChild(sheet);
}

// A «تثبيت وَجْد كتطبيق» row in the side menu's «قراءتي» section, hidden once the app is installed.
function wajdExtrasInstallEntry() {
  const section = document.querySelector('.wajd-drawer-reader');
  let row = document.querySelector('[data-wajd-install-entry]');
  if (wajdExtrasStandalone()) { if (row) row.remove(); return; }
  if (!section || row) return;
  row = document.createElement('button');
  row.className = 'wajd-drawer-reader-item'; row.type = 'button'; row.setAttribute('data-wajd-install-entry', '');
  row.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M12 8v6M9.5 11.5 12 14l2.5-2.5"/></svg><span>تثبيت وَجْد كتطبيق</span>';
  row.addEventListener('click', () => { const drawer = document.getElementById('NavM'); if (drawer) drawer.checked = false; wajdExtrasInstallSheet(); });
  section.appendChild(row);
}

function wajdExtrasInstall() {
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); wajdInstallPrompt = event; });
  window.addEventListener('appinstalled', () => { wajdInstallPrompt = null; wajdExtrasInstallEntry(); });
  wajdExtrasInstallEntry();
  // A shareable link: https://www.wajd.blog/?app opens the install card directly.
  if (/[?&]app(=|&|$)/.test(location.search) && !wajdExtrasStandalone()) setTimeout(wajdExtrasInstallSheet, 1200);
}

/* ---------- Reading time on post cards (home, categories, older posts) ----------
   Blogger list pages only carry a snippet, so each card's post is read once from the public Blogger feed
   (no Firebase) and the minutes are kept on this device. Same estimate as the article page (account.js). */
const WAJD_RT_KEY = 'wajd-reading-time-v1';
const wajdRtNumber = new Intl.NumberFormat('ar-EG');
function wajdRtLabel(minutes) {
  const unit = minutes === 1 ? 'دقيقة' : minutes === 2 ? 'دقيقتان' : minutes <= 10 ? 'دقائق' : 'دقيقة';
  return minutes === 2 ? unit : wajdRtNumber.format(minutes) + ' ' + unit;
}
function wajdRtMinutes(html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const text = (doc.body.textContent || '').trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const seconds = words / 180 * 60 + doc.querySelectorAll('img').length * 11 + doc.querySelectorAll('h2,h3,h4').length * 3;
  return Math.max(1, Math.ceil(seconds / 60));
}
async function wajdExtrasReadingTimes() {
  if (document.body.classList.contains('post')) return;
  const cards = [...document.querySelectorAll('.Posts-byCategory > article.posts[data-post-id]')];
  if (!cards.length) return;
  let store = {};
  try { store = JSON.parse(localStorage.getItem(WAJD_RT_KEY) || '{}') || {}; } catch (error) {}
  const month = 30 * 86400000;
  const show = (card, minutes) => {
    const date = card.querySelector('.Date');
    if (!date || date.querySelector('.wajd-card-rt')) return;
    const span = document.createElement('span');
    span.className = 'wajd-card-rt';
    span.textContent = wajdRtLabel(minutes);
    date.appendChild(span);
  };
  await Promise.all(cards.map(async card => {
    const id = card.dataset.postId, cached = store[id];
    if (cached && Date.now() - cached.t < month) { show(card, cached.m); return; }
    try {
      const response = await fetch('/feeds/posts/default/' + encodeURIComponent(id) + '?alt=json');
      if (!response.ok) return;
      const entry = (await response.json()).entry;
      const minutes = wajdRtMinutes(entry && entry.content && entry.content.$t);
      store[id] = { m: minutes, t: Date.now() };
      show(card, minutes);
    } catch (error) {}
  }));
  try { localStorage.setItem(WAJD_RT_KEY, JSON.stringify(store)); } catch (error) {}
}

/* The author photo in the article header only has data-src; the theme's lazy loader skips it on desktop. */
function wajdExtrasAuthorPhoto() {
  document.querySelectorAll('.article-author img[data-src]:not([src]), img.authorPhoto[data-src]:not([src])').forEach(img => {
    const src = img.getAttribute('data-src');
    if (src) img.src = src.startsWith('//') ? 'https:' + src : src;
  });
}

/* ---------- End of article: one share button beside like and save ---------- */
function wajdExtrasShareButton() {
  const panel = document.getElementById('wajd-like-panel');
  if (!document.body.classList.contains('post') || !panel || panel.querySelector('.wajd-share-button')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'wajd-like-button wajd-share-button';
  button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5"/></svg><span>مشاركة</span>';
  button.addEventListener('click', async () => {
    const url = panel.dataset.postUrl || location.href.split('?')[0];
    const title = (panel.dataset.postTitle || document.title).trim();
    if (navigator.share) { try { await navigator.share({ title, url }); } catch (error) {} return; }
    try { await navigator.clipboard.writeText(url); wajdExtrasToast('نُسخ رابط المقال'); } catch (error) { window.prompt('انسخ رابط المقال', url); }
  });
  panel.appendChild(button);
}

/* ---------- Footer: topics and site links ---------- */
function wajdExtrasFooter() {
  const footer = document.querySelector('.wajd-footer');
  if (!footer || footer.querySelector('.wajd-footer-links')) return;
  const nav = document.createElement('nav');
  nav.className = 'wajd-footer-links';
  nav.setAttribute('aria-label', 'روابط وَجْد');
  const topics = WAJD_HOME_TOPICS.map(([label, tag]) => '<a href="/search/label/' + encodeURIComponent(tag) + '">' + wajdExtrasEscape(label) + '</a>').join('');
  const install = wajdExtrasStandalone() ? '' : '<button data-footer-install type="button">ثبّت وَجْد على هاتفك</button>';
  nav.innerHTML = '<div><h4>أقسام وَجْد</h4>' + topics + '</div>'
    + '<div><h4>وَجْد</h4><a href="/search">كل الكتابات</a><a href="/#wajd-reading-paths">مسارات القراءة</a><a href="' + WAJD_AUTHOR.about + '">عن وَجْد</a>' + install + '</div>';
  const button = nav.querySelector('[data-footer-install]');
  if (button) button.addEventListener('click', wajdExtrasInstallSheet);
  const meta = footer.querySelector('.wajd-footer-meta');
  footer.insertBefore(nav, meta || null);
}

/* ---------- Page not found: a gentle message, search and a way home ---------- */
function wajdExtrasNotFound() {
  const box = document.getElementById('error-page');
  if (!box || box.dataset.wajd) return;
  box.dataset.wajd = '1';
  box.className = 'wajd-404';
  box.innerHTML = '<div class="wajd-404-mark" aria-hidden="true">؟</div>'
    + '<h1>هذه الصفحة ليست هنا</h1>'
    + '<p>ربما تغيّر رابط الكتابة أو لم تعد موجودة. ابحث عنها بكلمة من عنوانها، أو ابدأ من أحدث الكتابات.</p>'
    + '<form action="/search" method="get" role="search"><input aria-label="ابحث في وَجْد" name="q" placeholder="ابحث في وَجْد…" type="search"><button type="submit">بحث</button></form>'
    + '<a class="wajd-404-home" href="/">الصفحة الرئيسية</a>';
}

/* ---------- After the text: like row, then comments; every suggestion comes after them ---------- */
function wajdExtrasEndOrder() {
  if (!document.body.classList.contains('post')) return;
  const comments = document.querySelector('.post .commentsection');
  const next = document.querySelector('.post .wajd-next-reading');
  if (!comments || !next) return;
  const box = document.getElementById('wajd-article-path');
  if (box && comments.nextElementSibling !== box) comments.insertAdjacentElement('afterend', box);
  (box || comments).insertAdjacentElement('afterend', next);
}

wajdExtrasStyles();
try { wajdExtrasAuthorPhoto(); } catch (error) {}
try { wajdExtrasHome(); } catch (error) { console.warn('Wajd home extras:', error); }
try { wajdExtrasQuotes(); } catch (error) { console.warn('Wajd quote sharing:', error); }
try { wajdExtrasInstall(); } catch (error) { console.warn('Wajd install:', error); }
try { wajdExtrasEndOrder(); } catch (error) { console.warn('Wajd end order:', error); }
try { wajdExtrasShareButton(); } catch (error) { console.warn('Wajd share button:', error); }
try { wajdExtrasFooter(); } catch (error) { console.warn('Wajd footer:', error); }
try { wajdExtrasNotFound(); } catch (error) { console.warn('Wajd 404:', error); }
wajdExtrasReadingTimes().catch(error => console.warn('Wajd reading times:', error));
