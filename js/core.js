/* WAJD v114: record a tiny local page-entry envelope before quota-aware analytics starts.
   It is acknowledged by the detailed journey write, or recovered on the next visit. */
/* Blogger writes Arabic marks (shadda, ؟, ،) inside JSON-LD as HTML entities such as &#1617;, which
   are not decoded inside <script>. Rewrite the structured data with the real characters and trimmed
   names so Google (which renders the page) reads the right text. */
(function wajdFixStructuredData() {
  const decode = value => String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim();
  const walk = node => {
    if (typeof node === 'string') return decode(node);
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') { Object.keys(node).forEach(key => { node[key] = walk(node[key]); }); }
    return node;
  };
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    const text = script.textContent || '';
    if (!/&(#\d+|#x[0-9a-f]+|quot|amp|lt|gt|#39|apos);|"\s/i.test(text)) return;
    try { const fixed = JSON.stringify(walk(JSON.parse(text))); if (fixed !== text) script.textContent = fixed; } catch (error) {}
  });
})();

const WAJD_EARLY_ENTRY_QUEUE_KEY = 'wajd-early-entry-queue-v106';
const WAJD_EARLY_ENTRY_MAX_AGE = 30 * 86400000;

function wajdEarlySafeText(value, limit) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function wajdEarlyRandomId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 18);
}

function wajdEarlyDevice() {
  const agent = String(navigator.userAgent || '');
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(agent)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(agent)) return 'mobile';
  return 'desktop';
}

function wajdEarlyBrowser() {
  const agent = String(navigator.userAgent || '');
  if (/Edg\//.test(agent)) return 'edge';
  if (/OPR\//.test(agent)) return 'opera';
  if (/Firefox\//.test(agent)) return 'firefox';
  if (/CriOS\//.test(agent) || (/Chrome\//.test(agent) && !/Edg\//.test(agent))) return 'chrome';
  if (/Safari\//.test(agent) && !/Chrome\//.test(agent) && !/Chromium\//.test(agent)) return 'safari';
  return 'other';
}

function wajdEarlyOs() {
  const agent = String(navigator.userAgent || '');
  if (/iPhone|iPad|iPod/.test(agent)) return 'ios';
  if (/Android/.test(agent)) return 'android';
  if (/Windows/.test(agent)) return 'windows';
  if (/Macintosh|Mac OS X/.test(agent)) return 'macos';
  if (/Linux/.test(agent)) return 'linux';
  return 'other';
}

function wajdEarlyViewport() {
  const width = Math.max(0, Number(window.innerWidth) || 0);
  return width < 600 ? 'small' : width < 1024 ? 'medium' : width < 1440 ? 'large' : 'xlarge';
}

function wajdEarlySource(url) {
  const declared = String(url.searchParams.get('utm_source') || '').toLowerCase();
  if (['telegram','t.me'].includes(declared)) return 'telegram';
  if (['facebook','instagram','fb','ig'].includes(declared)) return 'facebook';
  if (declared === 'google') return 'google';
  if (!document.referrer) return 'direct';
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host === url.hostname.toLowerCase() || /^(www\.)?wajd\.blog$/.test(host)) return 'internal';
    if (host === 't.me' || /(^|\.)telegram\.(org|me)$/.test(host)) return 'telegram';
    if (/(^|\.)google\./.test(host)) return 'google';
    if (/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(host)) return 'facebook';
  } catch (error) {}
  return 'other';
}

function wajdEarlyPageType() {
  if (document.body.classList.contains('post')) return document.querySelector('article.wajd-qa-article') ? 'answer' : 'article';
  if (document.body.classList.contains('wajd-qa-page')) return 'qa';
  if (document.documentElement.classList.contains('wajd-reading-path-route') || document.body.classList.contains('wajd-reading-path-page')) return 'path';
  if (document.body.classList.contains('home')) return 'home';
  if (document.body.classList.contains('index')) return 'category';
  return 'other';
}

function wajdEarlyReadQueue() {
  try {
    const now = Date.now(), rows = JSON.parse(localStorage.getItem(WAJD_EARLY_ENTRY_QUEUE_KEY) || '[]');
    return Array.isArray(rows) ? rows.filter(row => row && typeof row.entryKey === 'string' && now - Number(row.startedAt) <= WAJD_EARLY_ENTRY_MAX_AGE).slice(-20) : [];
  } catch (error) { return []; }
}

function wajdEarlyWriteQueue(rows) {
  try { localStorage.setItem(WAJD_EARLY_ENTRY_QUEUE_KEY, JSON.stringify(rows.slice(-20))); } catch (error) {}
}

function wajdEarlyAcknowledge(entryKey) {
  if (!entryKey) return;
  wajdEarlyWriteQueue(wajdEarlyReadQueue().filter(row => row.entryKey !== entryKey));
}

function wajdEarlyCaptureEntry() {
  try {
    const url = new URL(window.location.href), clean = new URL(url.pathname, url.origin);
    const pathId = wajdEarlySafeText(url.searchParams.get('wajdPath') || url.searchParams.get('reading-path'), 120);
    if (url.searchParams.has('reading-path') && pathId) clean.searchParams.set('reading-path', pathId);
    const pageType = wajdEarlyPageType();
    const isArticle = pageType === 'article' || pageType === 'answer';
    const panel = document.getElementById('wajd-like-panel');
    const labelNode = document.querySelector('.wajd-post-label[data-wajd-label]');
    const articleId = isArticle && panel ? wajdEarlySafeText(panel.getAttribute('data-post-id'),100) : '';
    const category = isArticle ? wajdEarlySafeText(labelNode && labelNode.getAttribute('data-wajd-label') || (pageType === 'answer' ? 'إجابات تللينوم' : 'غير مصنف'),100) : '';
    const entry = {
      entryKey:wajdEarlyRandomId(), startedAt:Date.now(), tabId:wajdEarlyRandomId(),
      pageUrl:clean.href.slice(0,1500), pageTitle:wajdEarlySafeText(document.title || 'صفحة من وَجْد',250) || 'صفحة من وَجْد',
      pageType, articleId, category, pathId,
      source:wajdEarlySource(url), deviceClass:wajdEarlyDevice(), browserFamily:wajdEarlyBrowser(), osFamily:wajdEarlyOs(),
      locale:wajdEarlySafeText(navigator.language || '',20),
      timeZone:wajdEarlySafeText((Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '',60), viewportClass:wajdEarlyViewport(),
      campaignSource:wajdEarlySafeText(url.searchParams.get('utm_source'),80),
      campaignMedium:wajdEarlySafeText(url.searchParams.get('utm_medium'),80),
      campaignName:wajdEarlySafeText(url.searchParams.get('utm_campaign'),80)
    };
    const rows = wajdEarlyReadQueue(); rows.push(entry); wajdEarlyWriteQueue(rows);
    return entry;
  } catch (error) { return null; }
}

const wajdCurrentEarlyEntry = wajdEarlyCaptureEntry();

/* WAJD recovery: keep Firebase on the proven v102 loading path. Critical reader
   actions must never wait for an idle/interaction gate or an optional App Check import. */
import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js';
import { browserLocalPersistence, deleteUser, getAuth, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithPopup, setPersistence, signInAnonymously, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js';
import { collection, collectionGroup, deleteDoc, doc, enableNetwork, getCountFromServer, getDoc, getDocFromServer, getDocs, getFirestore, increment, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, startAfter, updateDoc, waitForPendingWrites, where, writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js';

const wajdSavedFirebaseConfig = {
  apiKey: 'AIzaSyDv7CPcGgwP5oPwy8qQubGN-ZiYaGL_sEM',
  authDomain: 'wajd-blog-likes.firebaseapp.com',
  projectId: 'wajd-blog-likes',
  storageBucket: 'wajd-blog-likes.firebasestorage.app',
  messagingSenderId: '893942775371',
  appId: '1:893942775371:web:2a78617b83ed80e70cd7ce'
};
const WAJD_ADMIN_EMAIL = 'aymanmahdy1996@gmail.com';

window.wajdFirebaseModulesPromise = Promise.resolve({
  initializeApp, getApp, getApps,
  browserLocalPersistence, deleteUser, getAuth, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithPopup, setPersistence, signInAnonymously, signInWithPopup, signOut,
  collection, collectionGroup, deleteDoc, doc, enableNetwork, getCountFromServer, getDoc, getDocFromServer, getDocs, getFirestore, increment, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, startAfter, updateDoc, waitForPendingWrites, where, writeBatch
});

function wajdEnsureFirebaseCore() {
  if (window.wajdFirebaseCorePromise) return window.wajdFirebaseCorePromise;
  const app = getApps().length ? getApp() : initializeApp(wajdSavedFirebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (!window.wajdFirebaseUserPromise) {
    window.wajdFirebaseUserPromise = (async () => {
      await setPersistence(auth, browserLocalPersistence);
      if (typeof auth.authStateReady === 'function') await auth.authStateReady();
      if (auth.currentUser) {
        const currentUser = auth.currentUser;
        const hasGoogle = !currentUser.isAnonymous && (currentUser.providerData || []).some(provider => provider && provider.providerId === 'google.com');
        if (hasGoogle) {
          const refreshKey = WAJD_AUTH_REFRESH_KEY_PREFIX + currentUser.uid;
          let refreshed = false;
          try { refreshed = sessionStorage.getItem(refreshKey) === '1'; } catch (cacheError) {}
          if (!refreshed) {
            try {
              await currentUser.getIdToken(true);
              sessionStorage.setItem(refreshKey, '1');
            } catch (refreshError) {
              console.warn('Wajd auth token refresh:', refreshError);
            }
          }
        }
        return currentUser;
      }
      return (await signInAnonymously(auth)).user;
    })();
  }
  window.wajdFirebaseCorePromise = Promise.resolve({ app, auth, db, userPromise:window.wajdFirebaseUserPromise });
  return window.wajdFirebaseCorePromise;
}
window.wajdEnsureFirebaseCore = wajdEnsureFirebaseCore;

const wajdSavedArabicNumber = new Intl.NumberFormat('ar-EG');
const wajdSavedOpen = document.getElementById('wajd-saved-open');
const wajdSavedBadge = document.getElementById('wajd-saved-badge');
const wajdSavedOverlay = document.getElementById('wajd-saved-overlay');
const wajdSavedClose = document.getElementById('wajd-saved-close');
const wajdSavedList = document.getElementById('wajd-saved-list');
const wajdArticleSaveButton = document.getElementById('wajd-save-button');
const wajdArticleSaveLabel = document.getElementById('wajd-save-label');
const wajdArticlePanel = document.getElementById('wajd-like-panel');
const wajdCurrentPostId = wajdArticlePanel && (!window.wajdContentIsTrackable || window.wajdContentIsTrackable(window.location.href)) ? wajdArticlePanel.dataset.postId : '';
const wajdHistoryOpen = document.getElementById('wajd-history-open');
const wajdHistoryOverlay = document.getElementById('wajd-history-overlay');
const wajdHistoryClose = document.getElementById('wajd-history-close');
const wajdHistoryClear = document.getElementById('wajd-history-clear');
const wajdHistoryList = document.getElementById('wajd-history-list');
const wajdAccountOpen = document.getElementById('wajd-account-open');
const wajdAccountHeaderAvatar = document.getElementById('wajd-account-header-avatar');
const wajdAccountOverlay = document.getElementById('wajd-account-overlay');
const wajdAccountClose = document.getElementById('wajd-account-close');
const wajdAccountGuest = document.getElementById('wajd-account-guest');
const wajdAccountUser = document.getElementById('wajd-account-user');
const wajdAccountLogin = document.getElementById('wajd-google-login');
const wajdAccountSkipLogin = document.getElementById('wajd-account-skip-login');
const wajdAccountLogout = document.getElementById('wajd-google-logout');
const wajdAccountAvatar = document.getElementById('wajd-account-avatar');
const wajdAccountName = document.getElementById('wajd-account-name');
const wajdAccountEmail = document.getElementById('wajd-account-email');
const wajdNotificationsOpen = document.getElementById('wajd-notifications-open');
const wajdNotificationsBadge = document.getElementById('wajd-notifications-badge');
const wajdNotificationsOverlay = document.getElementById('wajd-notifications-overlay');
const wajdNotificationsClose = document.getElementById('wajd-notifications-close');
const wajdNotificationsReadAll = document.getElementById('wajd-notifications-read-all');
const wajdNotificationsList = document.getElementById('wajd-notifications-list');
const wajdSavedSubtitle = document.getElementById('wajd-saved-subtitle');
const wajdHistorySubtitle = document.getElementById('wajd-history-subtitle');
const wajdAdminOpen = document.getElementById('wajd-admin-open');
const wajdAdminOverlay = document.getElementById('wajd-admin-overlay');
const wajdAdminClose = document.getElementById('wajd-admin-close');
const wajdAdminRefresh = document.getElementById('wajd-admin-refresh');
const wajdAdminContent = document.getElementById('wajd-admin-content');
const wajdSavedIds = new Map();
const wajdHistoryIds = new Map();
const wajdHistoryDetails = new Map();
let wajdSavedDb;
let wajdSavedAuth;
let wajdSavedUser;
const WAJD_LOGIN_INVITATION_SEEN_KEY = 'wajd-login-invitation-seen-v112';
const WAJD_AUTH_REFRESH_KEY_PREFIX = 'wajd-auth-refresh-v113:';
let wajdLoginInvitationTimer = 0;
let wajdLoginInvitationScrollHandler = null;
let wajdSavedFeed;
let wajdSavedToastTimer;
let wajdSavedLastFocus;
let wajdHistoryLastFocus;
let wajdAccountLastFocus;
let wajdAdminLastFocus;
let wajdNotificationsLastFocus;
let wajdNotificationsStarted = false;
let wajdNotificationsLastRefresh = 0;
let wajdNotificationsRefreshPromise = null;
let wajdNotificationsRefreshQueued = false;
const WAJD_NOTIFICATIONS_INBOX_CONCURRENCY = 8;
const wajdNotificationEntries = new Map();
const wajdNotificationInboxKeys = new Set();
const wajdNotificationLegacyInboxKeys = new Set();
const wajdNotificationOwnedInboxKeys = new Set();
const wajdNotificationRealtimeUnsubscribers = new Map();
const WAJD_ACCOUNT_IDENTITY_CACHE_KEY = 'wajd-account-identity-v1';
const WAJD_READER_LIST_CACHE_PREFIX = 'wajd-reader-lists-v1:';
const WAJD_READER_LIKE_CACHE_PREFIX = 'wajd-reader-likes-v110:';
const WAJD_POST_LOGIN_ACTION_KEY = 'wajd-post-login-action-v111';
const WAJD_READER_LIST_CACHE_TTL = 5 * 60 * 1000;
const WAJD_PROFILE_REFRESH_PREFIX = 'wajd-profile-refresh-v1:';
const WAJD_PROFILE_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;
const WAJD_ANONYMOUS_VISITOR_KNOWN_PREFIX = 'wajd-anonymous-visitor-known-v1:';
const WAJD_ANONYMOUS_VISITOR_REFRESH_PREFIX = 'wajd-anonymous-visitor-refresh-v1:';
const WAJD_ANONYMOUS_VISITOR_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;
const WAJD_AUDIENCE_SESSION_PREFIX = 'wajd-audience-session-v1:';
const WAJD_AUDIENCE_ACTIVE_TAB_PREFIX = 'wajd-audience-active-tab-v1:';
const WAJD_AUDIENCE_PENDING_PREFIX = 'wajd-audience-pending-v106:';
// v117: quota backoff is short and applies to background telemetry only.
// A fresh page visit and a successful explicit reader action may always try
// to establish its audience session, so an old local quota flag can never
// hide a real reader for hours after Firestore has recovered.
const WAJD_ANALYTICS_PAUSE_KEY = 'wajd-analytics-quota-pause-v117';
const WAJD_ANALYTICS_BACKOFF = 10 * 60 * 1000;
const WAJD_AUDIENCE_SESSION_TIMEOUT = 30 * 60 * 1000;
const WAJD_AUDIENCE_IDLE_TIMEOUT = 60 * 1000;
const WAJD_AUDIENCE_INITIAL_FLUSH_DELAY = 5 * 60 * 1000;
const WAJD_AUDIENCE_FLUSH_INTERVAL = 10 * 60 * 1000;
const WAJD_AUDIENCE_TICK_INTERVAL = 5000;
// v119: reading an article without touching the page for a while is normal, so
// while the article text is on screen the reader stays "active" for 3 minutes.
const WAJD_AUDIENCE_READING_IDLE_TIMEOUT = 3 * 60 * 1000;
// v119: visits are saved every minute when something changed (not every 10),
// because the save on leaving the page often never reaches Firestore.
const WAJD_JOURNEY_SAVE_INTERVAL = 60 * 1000;
const WAJD_COMPLETED_ARTICLES_PREFIX = 'wajd-completed-articles-v119:';
const WAJD_JOURNEY_UNSENT_PREFIX = 'wajd-journey-unsent-v119:';
const WAJD_COMPLETED_URLS_PREFIX = 'wajd-completed-urls-v119:';
const WAJD_NOTIFICATIONS_REFRESH_INTERVAL = 2 * 60 * 1000;
let wajdAudienceTracker = null;
let wajdAudienceStartPromise = null;
let wajdAudienceRetryTimer = 0;
let wajdAudienceRetryAttempt = 0;
let wajdAudienceLifecycleBound = false;
let wajdReaderListsFetchedAt = 0;
let wajdSavedListLoaded = false;
let wajdHistoryListLoaded = false;
let wajdSavedListLoadPromise = null;
let wajdHistoryListLoadPromise = null;
let wajdAccountTransitionActive = false;
let wajdAuthStateUnsubscribe = null;

function wajdStorePostLoginAction(action, postId) {
  try {
    sessionStorage.setItem(WAJD_POST_LOGIN_ACTION_KEY, JSON.stringify({ action:String(action || ''), postId:String(postId || ''), savedAt:Date.now() }));
  } catch (error) {}
}

function wajdReadPostLoginAction(consume) {
  try {
    const value = JSON.parse(sessionStorage.getItem(WAJD_POST_LOGIN_ACTION_KEY) || 'null');
    if (consume) sessionStorage.removeItem(WAJD_POST_LOGIN_ACTION_KEY);
    if (!value || Date.now() - Number(value.savedAt) > 10 * 60 * 1000) return null;
    return value;
  } catch (error) { return null; }
}
window.wajdReadPostLoginAction = wajdReadPostLoginAction;

window.wajdRequireGoogleSignIn = function(action, postId) {
  wajdStorePostLoginAction(action, postId);
  wajdAccountOpenModal();
  wajdSavedShowToast('سجّل الدخول بحساب Google لاستخدام هذه الميزة', false);
};

function wajdIsQuotaError(error) {
  return /resource-exhausted|quota exceeded/i.test(String(error && (error.code || error.message) || ''));
}
window.wajdIsQuotaError = wajdIsQuotaError;

function wajdAnalyticsCanWrite() {
  try { return Number(localStorage.getItem(WAJD_ANALYTICS_PAUSE_KEY) || 0) <= Date.now(); }
  catch (error) { return true; }
}

function wajdAnalyticsClearPause() {
  try {
    localStorage.removeItem(WAJD_ANALYTICS_PAUSE_KEY);
    // Retire the old six-hour v110 pause so browsers upgraded from v116 do
    // not silently suppress audience tracking after Firestore is healthy.
    localStorage.removeItem('wajd-analytics-quota-pause-v110');
  } catch (error) {}
}

function wajdAnalyticsHandleError(error) {
  if (!wajdIsQuotaError(error)) return false;
  try { localStorage.setItem(WAJD_ANALYTICS_PAUSE_KEY, String(Date.now() + WAJD_ANALYTICS_BACKOFF)); }
  catch (cacheError) {}
  return true;
}

function wajdReadLikedArticleCache(userId) {
  if (!userId) return [];
  try {
    const stored = JSON.parse(localStorage.getItem(WAJD_READER_LIKE_CACHE_PREFIX + userId) || '[]');
    return Array.isArray(stored)
      ? Array.from(new Set(stored.filter(id => /^\d{1,32}$/.test(String(id))).map(String))).slice(-500)
      : [];
  } catch (error) { return []; }
}

window.wajdRememberLikedArticle = function(userId, articleId, liked) {
  if (!userId || !/^\d{1,32}$/.test(String(articleId))) return;
  const ids = new Set(wajdReadLikedArticleCache(userId));
  if (liked) ids.add(String(articleId));
  else ids.delete(String(articleId));
  try { localStorage.setItem(WAJD_READER_LIKE_CACHE_PREFIX + userId, JSON.stringify(Array.from(ids).slice(-500))); }
  catch (error) {}
};

function wajdAccountCacheIdentity(user) {
  try {
    if (!wajdAccountIsGoogle(user)) {
      localStorage.removeItem(WAJD_ACCOUNT_IDENTITY_CACHE_KEY);
      return;
    }
    const googleProfile = wajdAccountGoogleProfile(user);
    const displayName = user.displayName || (googleProfile && googleProfile.displayName) || 'قارئ وَجْد';
    localStorage.setItem(WAJD_ACCOUNT_IDENTITY_CACHE_KEY, JSON.stringify({
      uid:user.uid,
      displayName,
      photoURL:wajdAccountTrustedPhotoURL(user) || wajdAccountFallbackAvatar(displayName),
      savedAt:Date.now()
    }));
  } catch (error) {}
}

function wajdReaderListDetails(data) {
  return {
    progress:Number(data && data.progress) || 0,
    scrollY:Number.isInteger(data && data.scrollY) ? data.scrollY : 0,
    completed:Boolean(data && data.completed),
    articleTitle:String((data && data.articleTitle) || '').slice(0, 250),
    articleUrl:String((data && data.articleUrl) || '').slice(0, 1500),
    readCount:Number.isInteger(data && data.readCount) ? data.readCount : 0
  };
}

function wajdPublishReaderListSummary(userId) {
  window.wajdReaderListSummary = {
    uid:userId,
    saved:wajdSavedIds.size,
    history:wajdHistoryIds.size,
    completed:Array.from(wajdHistoryDetails.values()).filter(item => item && item.completed === true).length,
    savedLoaded:wajdSavedListLoaded,
    historyLoaded:wajdHistoryListLoaded
  };
}

function wajdReaderJourneySnapshot(userId) {
  return {
    uid:userId || (wajdSavedUser && wajdSavedUser.uid) || '',
    saved:Array.from(wajdSavedIds.entries()).map(([id,createdAt]) => ({ id, createdAt:Number(createdAt) || 0 })),
    history:Array.from(wajdHistoryIds.entries()).map(([id,lastReadAt]) => ({
      id,
      lastReadAt:Number(lastReadAt) || 0,
      details:wajdReaderListDetails(wajdHistoryDetails.get(id))
    }))
  };
}

function wajdReaderJourneyNotify(userId) {
  const snapshot=wajdReaderJourneySnapshot(userId);
  window.dispatchEvent(new CustomEvent('wajd-reader-data-updated',{detail:snapshot}));
}

window.wajdGetReaderJourneyData = function() {
  return wajdReaderJourneySnapshot();
};

function wajdReaderListsHydrate(userId) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(WAJD_READER_LIST_CACHE_PREFIX + userId) || 'null');
    const fetchedAt = Number(cached && (cached.fetchedAt || cached.savedAt)) || 0;
    if (!cached || Date.now() - fetchedAt > WAJD_READER_LIST_CACHE_TTL) return false;
    wajdReaderListsFetchedAt = fetchedAt;
    const hasLoadFlags = Object.prototype.hasOwnProperty.call(cached, 'savedLoaded') || Object.prototype.hasOwnProperty.call(cached, 'historyLoaded');
    wajdSavedListLoaded = hasLoadFlags ? cached.savedLoaded === true : true;
    wajdHistoryListLoaded = hasLoadFlags ? cached.historyLoaded === true : true;
    wajdSavedIds.clear(); wajdHistoryIds.clear(); wajdHistoryDetails.clear();
    (cached.saved || []).forEach(item => { if (Array.isArray(item) && item[0]) wajdSavedIds.set(item[0], Number(item[1]) || 0); });
    (cached.history || []).forEach(item => {
      if (!item || !item.id) return;
      wajdHistoryIds.set(item.id, Number(item.lastReadAt) || 0);
      wajdHistoryDetails.set(item.id, wajdReaderListDetails(item.details));
    });
    wajdPublishReaderListSummary(userId);
    wajdReaderJourneyNotify(userId);
    return true;
  } catch (error) { return false; }
}

function wajdReaderListsPersist(userId, refreshed) {
  if (!userId) return;
  if (refreshed || !wajdReaderListsFetchedAt) wajdReaderListsFetchedAt = Date.now();
  try {
    sessionStorage.setItem(WAJD_READER_LIST_CACHE_PREFIX + userId, JSON.stringify({
      savedAt:Date.now(),
      fetchedAt:wajdReaderListsFetchedAt,
      savedLoaded:wajdSavedListLoaded,
      historyLoaded:wajdHistoryListLoaded,
      saved:Array.from(wajdSavedIds.entries()),
      history:Array.from(wajdHistoryIds.entries()).map(([id,lastReadAt]) => ({ id, lastReadAt, details:wajdReaderListDetails(wajdHistoryDetails.get(id)) }))
    }));
  } catch (error) {}
  wajdPublishReaderListSummary(userId);
  wajdReaderJourneyNotify(userId);
}

async function wajdReaderEnsureIdentity() {
  if (wajdSavedDb && wajdSavedUser) return wajdSavedUser;
  const core = await wajdEnsureFirebaseCore();
  wajdSavedAuth = core.auth;
  wajdSavedDb = core.db;
  wajdSavedUser = await core.userPromise;
  return wajdSavedUser;
}

async function wajdReaderLoadSavedList() {
  if (wajdSavedListLoaded) return;
  if (wajdSavedListLoadPromise) return wajdSavedListLoadPromise;
  wajdSavedListLoadPromise = (async () => {
    const user = await wajdReaderEnsureIdentity();
    if (!wajdAccountIsGoogle(user)) throw new Error('google-sign-in-required');
    const savedSnapshot = await getDocs(collection(wajdSavedDb, 'users', user.uid, 'saved'));
    savedSnapshot.forEach(item => {
      const createdAt = item.data().createdAt;
      wajdSavedIds.set(item.id, createdAt && createdAt.toMillis ? createdAt.toMillis() : 0);
    });
    wajdSavedListLoaded = true;
    wajdReaderListsPersist(user.uid, true);
    wajdSavedUpdateBadge();
  })();
  try { await wajdSavedListLoadPromise; }
  finally { wajdSavedListLoadPromise = null; }
}

async function wajdReaderLoadHistoryList() {
  if (wajdHistoryListLoaded) return;
  if (wajdHistoryListLoadPromise) return wajdHistoryListLoadPromise;
  wajdHistoryListLoadPromise = (async () => {
    const user = await wajdReaderEnsureIdentity();
    if (!wajdAccountIsGoogle(user)) throw new Error('google-sign-in-required');
    const historySnapshot = await getDocs(collection(wajdSavedDb, 'users', user.uid, 'history'));
    historySnapshot.forEach(item => {
      const historyData = item.data();
      const lastReadAt = historyData.lastReadAt;
      wajdHistoryIds.set(item.id, lastReadAt && lastReadAt.toMillis ? lastReadAt.toMillis() : 0);
      wajdHistoryDetails.set(item.id, wajdReaderListDetails(historyData));
    });
    wajdHistoryListLoaded = true;
    wajdReaderListsPersist(user.uid, true);
    wajdHistoryMarkCards(document);
    wajdHistoryUpdateClear();
  })();
  try { await wajdHistoryListLoadPromise; }
  finally { wajdHistoryListLoadPromise = null; }
}

window.wajdEnsureReaderLists = async function(options) {
  const requested = options || {};
  const jobs = [];
  if (requested.saved === true) jobs.push(wajdReaderLoadSavedList());
  if (requested.history === true) jobs.push(wajdReaderLoadHistoryList());
  await Promise.all(jobs);
  return window.wajdReaderListSummary;
};

window.wajdUpdateReaderHistoryCache = function(userId, postId, details) {
  if (!userId || !postId || !wajdSavedUser || wajdSavedUser.uid !== userId) return;
  const current = wajdHistoryDetails.get(postId) || {};
  wajdHistoryIds.set(postId, Date.now());
  wajdHistoryDetails.set(postId, wajdReaderListDetails({ ...current, ...details }));
  wajdReaderListsPersist(userId);
};

function wajdSavedPostId(entry) {
  const value = entry && entry.id && entry.id.$t ? entry.id.$t : '';
  const match = value.match(/post-(\d+)$/);
  return match ? match[1] : '';
}

function wajdSavedPostUrl(entry) {
  const link = (entry.link || []).find(item => item.rel === 'alternate');
  return link ? link.href.replace(/^http:/, 'https:') : '#';
}

function wajdReaderApplyContentPolicy() {
  const hiddenIds=window.wajdContentHiddenPostIds||new Set();
  let changed=false;
  Array.from(wajdSavedIds.keys()).forEach(postId=>{
    if(hiddenIds.has(String(postId))){wajdSavedIds.delete(postId);changed=true;}
  });
  Array.from(wajdHistoryIds.keys()).forEach(postId=>{
    const details=wajdHistoryDetails.get(postId)||{};
    const hiddenById=hiddenIds.has(String(postId));
    const hiddenByUrl=details.articleUrl&&window.wajdContentIsDiscoverable&&!window.wajdContentIsDiscoverable(details.articleUrl);
    if(hiddenById||hiddenByUrl){wajdHistoryIds.delete(postId);wajdHistoryDetails.delete(postId);changed=true;}
  });
  return changed;
}

function wajdSavedImage(entry) {
  const thumbnail = entry.media$thumbnail && entry.media$thumbnail.url;
  if (!thumbnail) return '';
  return thumbnail.replace(/\/s\d+(?:-c)?\//, '/w320-h200-p-k-no-nu/').replace(/=s\d+(?:-c)?$/, '=w320-h200-p-k-no-nu');
}

function wajdSavedUpdateBadge() {
  const count = wajdSavedIds.size;
  if (wajdSavedBadge) wajdSavedBadge.textContent = wajdSavedArabicNumber.format(count);
  if (wajdSavedOpen) {
    wajdSavedOpen.classList.toggle('has-saved', count > 0);
    wajdSavedOpen.setAttribute('aria-label', count ? 'المقالات المحفوظة، ' + wajdSavedArabicNumber.format(count) : 'المقالات المحفوظة');
  }
}

function wajdSavedRenderArticleButton(saved) {
  if (!wajdArticleSaveButton || !wajdArticleSaveLabel) return;
  wajdArticleSaveButton.classList.toggle('is-saved', saved);
  wajdArticleSaveButton.setAttribute('aria-pressed', saved ? 'true' : 'false');
  wajdArticleSaveButton.setAttribute('aria-label', saved ? 'إزالة المقال من المحفوظات' : 'حفظ المقال للقراءة لاحقًا');
  wajdArticleSaveLabel.textContent = saved ? 'محفوظ' : 'حفظ';
}

function wajdSavedShowToast(message, removed) {
  let toast = document.getElementById('wajd-like-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wajd-like-toast';
    toast.className = 'wajd-like-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span class="wajd-like-toast-icon"></span><span class="wajd-like-toast-text"></span>';
    document.body.appendChild(toast);
  }
  toast.querySelector('.wajd-like-toast-icon').textContent = '🔖';
  toast.querySelector('.wajd-like-toast-text').textContent = message;
  toast.classList.toggle('is-sad', Boolean(removed));
  toast.classList.add('is-visible');
  clearTimeout(wajdSavedToastTimer);
  wajdSavedToastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function wajdSavedEmptyState(message) {
  if (!wajdSavedList) return;
  wajdSavedList.innerHTML = '<div class="wajd-saved-state"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>' + message + '</div>';
}

async function wajdSavedGetFeed() {
  if (wajdSavedFeed) return wajdSavedFeed;
  wajdSavedFeed = await window.wajdLoadAllFeedEntries('/feeds/posts/summary?alt=json&orderby=published', 40);
  if(wajdReaderApplyContentPolicy()&&wajdSavedUser){
    wajdReaderListsPersist(wajdSavedUser.uid);
    wajdSavedUpdateBadge();
    wajdHistoryUpdateClear();
  }
  return wajdSavedFeed;
}

function wajdSavedCard(post, postId) {
  const article = document.createElement('article');
  article.className = 'wajd-saved-card';
  article.dataset.postId = postId;

  const link = document.createElement('a');
  link.className = 'wajd-saved-card-link';
  link.href = wajdSavedPostUrl(post);

  const imageUrl = wajdSavedImage(post);
  if (imageUrl) {
    const image = document.createElement('img');
    image.className = 'wajd-saved-card-image';
    image.src = imageUrl;
    image.alt = '';
    image.loading = 'lazy';
    link.appendChild(image);
  } else {
    const placeholder = document.createElement('span');
    placeholder.className = 'wajd-saved-card-placeholder';
    placeholder.textContent = 'وَجْد';
    link.appendChild(placeholder);
  }

  const title = document.createElement('h3');
  title.className = 'wajd-saved-card-title';
  title.textContent = post.title.$t;
  link.appendChild(title);

  const remove = document.createElement('button');
  remove.className = 'wajd-saved-remove';
  remove.type = 'button';
  remove.setAttribute('aria-label', 'إزالة «' + post.title.$t + '» من المحفوظات');
  remove.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>';
  remove.addEventListener('click', async () => {
    remove.disabled = true;
    try {
      await deleteDoc(doc(wajdSavedDb, 'users', wajdSavedUser.uid, 'saved', postId));
      wajdSavedIds.delete(postId);
      article.remove();
      wajdSavedUpdateBadge();
      wajdReaderListsPersist(wajdSavedUser.uid);
      if (postId === wajdCurrentPostId) wajdSavedRenderArticleButton(false);
      if (!wajdSavedIds.size) wajdSavedEmptyState('لا توجد مقالات محفوظة بعد.<br/>ستجد زر الحفظ أسفل كل مقال.');
    } catch (error) {
      console.error('Wajd remove saved article:', error);
      remove.disabled = false;
      wajdSavedShowToast('تعذّرت إزالة المقال الآن', true);
    }
  });

  article.appendChild(link);
  article.appendChild(remove);
  return article;
}

async function wajdSavedRenderList() {
  if (!wajdSavedList) return;
  if (!wajdSavedIds.size) {
    wajdSavedEmptyState('لا توجد مقالات محفوظة بعد.<br/>ستجد زر الحفظ أسفل كل مقال.');
    return;
  }
  wajdSavedList.innerHTML = '<div class="wajd-saved-state">جارٍ تحميل المقالات المحفوظة…</div>';
  try {
    const posts = await wajdSavedGetFeed();
    const postsById = new Map(posts.map(post => [wajdSavedPostId(post), post]));
    const sortedIds = Array.from(wajdSavedIds.entries()).sort((a, b) => b[1] - a[1]).map(item => item[0]);
    const fragment = document.createDocumentFragment();
    sortedIds.forEach(postId => {
      const post = postsById.get(postId);
      if (post) fragment.appendChild(wajdSavedCard(post, postId));
    });
    wajdSavedList.innerHTML = '';
    if (fragment.childNodes.length) wajdSavedList.appendChild(fragment);
    else wajdSavedEmptyState('تعذّر العثور على المقالات المحفوظة.');
  } catch (error) {
    console.error('Wajd saved feed:', error);
    wajdSavedEmptyState('تعذّر تحميل المحفوظات الآن، حاول مرة أخرى.');
  }
}

async function wajdSavedOpenModal() {
  if (!wajdSavedOverlay) return;
  if (!wajdAccountIsGoogle(wajdSavedUser)) {
    window.wajdRequireGoogleSignIn('open-saved', '');
    return;
  }
  wajdAdminCloseModal();
  wajdAccountCloseModal();
  wajdHistoryCloseModal();
  wajdSavedLastFocus = document.activeElement;
  wajdSavedOverlay.classList.add('is-open');
  wajdSavedOverlay.setAttribute('aria-hidden', 'false');
  wajdSavedOpen.setAttribute('aria-expanded', 'true');
  document.body.classList.add('wajd-modal-open');
  wajdSavedClose.focus();
  wajdSavedList.innerHTML = '<div class="wajd-saved-state">جارٍ تحميل محفوظاتك…</div>';
  try {
    await window.wajdEnsureReaderLists({ saved:true });
    await wajdSavedRenderList();
  } catch (error) {
    console.error('Wajd saved list on demand:', error);
    wajdSavedEmptyState('تعذّر تحميل المحفوظات الآن، حاول مرة أخرى.');
  }
}

function wajdSavedCloseModal() {
  if (!wajdSavedOverlay) return;
  wajdSavedOverlay.classList.remove('is-open');
  wajdSavedOverlay.setAttribute('aria-hidden', 'true');
  wajdSavedOpen.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('wajd-modal-open');
  if (wajdSavedLastFocus && wajdSavedLastFocus.focus) wajdSavedLastFocus.focus();
}

function wajdHistoryEmptyState(message) {
  if (!wajdHistoryList) return;
  wajdHistoryList.innerHTML = '<div class="wajd-history-state"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' + message + '</div>';
}

function wajdHistoryUpdateClear() {
  if (wajdHistoryClear) wajdHistoryClear.classList.toggle('is-visible', wajdHistoryIds.size > 0);
}

function wajdHistoryMarkCards(root) {
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('article.posts[data-post-id]').forEach(card => {
    card.classList.toggle('wajd-is-read', wajdHistoryIds.has(card.dataset.postId));
  });
  if (scope.matches && scope.matches('article.posts[data-post-id]')) {
    scope.classList.toggle('wajd-is-read', wajdHistoryIds.has(scope.dataset.postId));
  }
}

function wajdHistoryTime(value) {
  if (!value) return '';
  return 'آخر قراءة: ' + new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(new Date(value));
}

function wajdHistoryCard(post, postId) {
  const article = document.createElement('article');
  article.className = 'wajd-history-card';
  article.dataset.postId = postId;

  const link = document.createElement('a');
  link.className = 'wajd-history-card-link';
  link.href = wajdSavedPostUrl(post);

  const imageUrl = wajdSavedImage(post);
  if (imageUrl) {
    const image = document.createElement('img');
    image.className = 'wajd-history-card-image';
    image.src = imageUrl;
    image.alt = '';
    image.loading = 'lazy';
    link.appendChild(image);
  } else {
    const placeholder = document.createElement('span');
    placeholder.className = 'wajd-history-card-placeholder';
    placeholder.textContent = 'وَجْد';
    link.appendChild(placeholder);
  }

  const copy = document.createElement('div');
  copy.className = 'wajd-history-card-copy';
  const title = document.createElement('h3');
  title.className = 'wajd-history-card-title';
  title.textContent = post.title.$t;
  copy.appendChild(title);
  const time = document.createElement('span');
  time.className = 'wajd-history-card-time';
  time.textContent = wajdHistoryTime(wajdHistoryIds.get(postId));
  copy.appendChild(time);
  const details = wajdHistoryDetails.get(postId) || {};
  if (details.completed === true || Number(details.progress) > 0) {
    const progress = document.createElement('span');
    progress.className = 'wajd-history-card-time';
    progress.textContent = details.completed === true ? 'اكتملت القراءة ✓' : 'تقدّم القراءة: ' + wajdSavedArabicNumber.format(Math.round(Number(details.progress) * 100)) + '٪';
    copy.appendChild(progress);
  }
  link.appendChild(copy);

  const remove = document.createElement('button');
  remove.className = 'wajd-history-remove';
  remove.type = 'button';
  remove.setAttribute('aria-label', 'حذف «' + post.title.$t + '» من سجل القراءة');
  remove.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  remove.addEventListener('click', async () => {
    remove.disabled = true;
    try {
      await deleteDoc(doc(wajdSavedDb, 'users', wajdSavedUser.uid, 'history', postId));
      wajdHistoryIds.delete(postId);
      wajdHistoryDetails.delete(postId);
      article.remove();
      wajdHistoryMarkCards(document);
      wajdHistoryUpdateClear();
      wajdReaderListsPersist(wajdSavedUser.uid);
      if (!wajdHistoryIds.size) wajdHistoryEmptyState('سجل القراءة فارغ.<br/>سيظهر هنا كل مقال تفتحه.');
      wajdSavedShowToast('حُذف المقال من سجل القراءة', true);
    } catch (error) {
      console.error('Wajd remove history article:', error);
      remove.disabled = false;
      wajdSavedShowToast('تعذّر حذف المقال من السجل الآن', true);
    }
  });

  article.appendChild(link);
  article.appendChild(remove);
  return article;
}

async function wajdHistoryRenderList() {
  if (!wajdHistoryList) return;
  if (!wajdHistoryIds.size) {
    wajdHistoryEmptyState('سجل القراءة فارغ.<br/>سيظهر هنا كل مقال تفتحه.');
    return;
  }
  wajdHistoryList.innerHTML = '<div class="wajd-history-state">جارٍ تحميل سجل القراءة…</div>';
  try {
    const posts = await wajdSavedGetFeed();
    const postsById = new Map(posts.map(post => [wajdSavedPostId(post), post]));
    const sortedIds = Array.from(wajdHistoryIds.entries()).sort((a, b) => b[1] - a[1]).map(item => item[0]);
    const fragment = document.createDocumentFragment();
    sortedIds.forEach(postId => {
      const post = postsById.get(postId);
      if (post) fragment.appendChild(wajdHistoryCard(post, postId));
    });
    wajdHistoryList.innerHTML = '';
    if (fragment.childNodes.length) wajdHistoryList.appendChild(fragment);
    else wajdHistoryEmptyState('تعذّر العثور على مقالات سجل القراءة.');
  } catch (error) {
    console.error('Wajd history feed:', error);
    wajdHistoryEmptyState('تعذّر تحميل سجل القراءة الآن، حاول مرة أخرى.');
  }
}

function wajdAccountCollectionState(target, message) {
  if (target) target.innerHTML='<div class="wajd-account-state">'+message+'</div>';
}

async function wajdSavedRenderInto(target) {
  if (!target) return;
  if (!wajdSavedIds.size) {
    wajdAccountCollectionState(target,'لا توجد كتابات محفوظة بعد.<br/>ستجد زر الحفظ أسفل كل مقالة.');
    return;
  }
  wajdAccountCollectionState(target,'جارٍ تحميل محفوظاتك…');
  try {
    const posts=await wajdSavedGetFeed();
    const postsById=new Map(posts.map(post=>[wajdSavedPostId(post),post]));
    const sortedIds=Array.from(wajdSavedIds.entries()).sort((a,b)=>b[1]-a[1]).map(item=>item[0]);
    const fragment=document.createDocumentFragment();
    sortedIds.forEach(postId=>{const post=postsById.get(postId);if(post)fragment.appendChild(wajdSavedCard(post,postId));});
    target.innerHTML='';
    if(fragment.childNodes.length)target.appendChild(fragment);
    else wajdAccountCollectionState(target,'تعذّر العثور على الكتابات المحفوظة.');
  } catch(error) {
    console.error('Wajd embedded saved list:',error);
    wajdAccountCollectionState(target,'تعذّر تحميل المحفوظات الآن.');
  }
}

async function wajdHistoryRenderInto(target) {
  if (!target) return;
  if (!wajdHistoryIds.size) {
    wajdAccountCollectionState(target,'سجل القراءة فارغ.<br/>سيظهر هنا كل مقال تفتحه.');
    return;
  }
  wajdAccountCollectionState(target,'جارٍ تحميل سجل القراءة…');
  try {
    const posts=await wajdSavedGetFeed();
    const postsById=new Map(posts.map(post=>[wajdSavedPostId(post),post]));
    const sortedIds=Array.from(wajdHistoryIds.entries()).sort((a,b)=>b[1]-a[1]).map(item=>item[0]);
    const fragment=document.createDocumentFragment();
    sortedIds.forEach(postId=>{const post=postsById.get(postId);if(post)fragment.appendChild(wajdHistoryCard(post,postId));});
    target.innerHTML='';
    if(fragment.childNodes.length)target.appendChild(fragment);
    else wajdAccountCollectionState(target,'تعذّر العثور على كتابات سجل القراءة.');
  } catch(error) {
    console.error('Wajd embedded history list:',error);
    wajdAccountCollectionState(target,'تعذّر تحميل سجل القراءة الآن.');
  }
}

window.wajdRenderReaderCollection = function(kind,target) {
  if (!wajdAccountIsGoogle(wajdSavedUser)) {
    wajdAccountCollectionState(target, 'سجّل الدخول بحساب Google لعرض هذه القائمة ومزامنتها.');
    return Promise.resolve();
  }
  return window.wajdEnsureReaderLists({ saved:kind==='saved', history:kind==='history' })
    .then(() => kind==='saved'?wajdSavedRenderInto(target):wajdHistoryRenderInto(target))
    .catch(error => {
      console.error('Wajd account reader collection:', error);
      wajdAccountCollectionState(target, kind==='saved'?'تعذّر تحميل المحفوظات الآن.':'تعذّر تحميل سجل القراءة الآن.');
    });
};

async function wajdHistoryOpenModal() {
  if (!wajdHistoryOverlay) return;
  if (!wajdAccountIsGoogle(wajdSavedUser)) {
    window.wajdRequireGoogleSignIn('open-history', '');
    return;
  }
  wajdAdminCloseModal();
  wajdAccountCloseModal();
  wajdSavedCloseModal();
  wajdHistoryLastFocus = document.activeElement;
  wajdHistoryOverlay.classList.add('is-open');
  wajdHistoryOverlay.setAttribute('aria-hidden', 'false');
  wajdHistoryOpen.setAttribute('aria-expanded', 'true');
  document.body.classList.add('wajd-modal-open');
  wajdHistoryClose.focus();
  wajdHistoryList.innerHTML = '<div class="wajd-history-state">جارٍ تحميل سجل القراءة…</div>';
  try {
    await window.wajdEnsureReaderLists({ history:true });
    await wajdHistoryRenderList();
  } catch (error) {
    console.error('Wajd history on demand:', error);
    wajdHistoryEmptyState('تعذّر تحميل سجل القراءة الآن، حاول مرة أخرى.');
  }
}

function wajdHistoryCloseModal() {
  if (!wajdHistoryOverlay) return;
  wajdHistoryOverlay.classList.remove('is-open');
  wajdHistoryOverlay.setAttribute('aria-hidden', 'true');
  if (wajdHistoryOpen) wajdHistoryOpen.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('wajd-modal-open');
  if (wajdHistoryLastFocus && wajdHistoryLastFocus.focus) wajdHistoryLastFocus.focus();
}

function wajdHistoryBindInterface() {
  if (!wajdHistoryOpen || !wajdHistoryOverlay) return;
  wajdHistoryOpen.addEventListener('click', wajdHistoryOpenModal);
  wajdHistoryClose.addEventListener('click', wajdHistoryCloseModal);
  wajdHistoryOverlay.addEventListener('click', event => {
    if (event.target === wajdHistoryOverlay) wajdHistoryCloseModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && wajdHistoryOverlay.classList.contains('is-open')) wajdHistoryCloseModal();
  });
  wajdHistoryClear.addEventListener('click', async () => {
    if (!wajdHistoryIds.size || !window.confirm('هل تريد مسح سجل القراءة كاملًا؟')) return;
    wajdHistoryClear.disabled = true;
    try {
      const ids = Array.from(wajdHistoryIds.keys());
      await Promise.all(ids.map(postId => deleteDoc(doc(wajdSavedDb, 'users', wajdSavedUser.uid, 'history', postId))));
      wajdHistoryIds.clear();
      wajdHistoryDetails.clear();
      wajdHistoryMarkCards(document);
      wajdHistoryUpdateClear();
      wajdHistoryEmptyState('سجل القراءة فارغ.<br/>سيظهر هنا كل مقال تفتحه.');
      wajdReaderListsPersist(wajdSavedUser.uid);
      wajdSavedShowToast('تم مسح سجل القراءة', true);
    } catch (error) {
      console.error('Wajd clear history:', error);
      wajdSavedShowToast('تعذّر مسح السجل الآن', true);
    } finally {
      wajdHistoryClear.disabled = false;
    }
  });
}

function wajdAccountIsGoogle(user) {
  return Boolean(user && !user.isAnonymous && (user.providerData || []).some(provider => provider.providerId === 'google.com'));
}

function wajdAccountGoogleProfile(user) {
  if (!user || !Array.isArray(user.providerData)) return null;
  return user.providerData.find(provider => provider && provider.providerId === 'google.com') || null;
}

function wajdAccountTrustedPhotoURL(user) {
  const profile = wajdAccountGoogleProfile(user);
  const value = String((profile && profile.photoURL) || (user && user.photoURL) || '').trim();
  return /^https:\/\/lh\d+\.googleusercontent\.com\//i.test(value) ? value.slice(0, 1000) : '';
}

function wajdAccountFallbackAvatar(name) {
  const letter = (name || 'و').trim().charAt(0) || 'و';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#eadfce"/><text x="48" y="59" text-anchor="middle" font-size="38" font-family="Arial" fill="#955340">' + letter.replace(/[&<>"']/g, '') + '</text></svg>';
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function wajdAccountEmailValue(user) {
  const profile = wajdAccountGoogleProfile(user);
  return (user && (user.email || (profile && profile.email)) || '').trim().toLowerCase();
}

function wajdIsAdmin(user) {
  return wajdAccountIsGoogle(user) && WAJD_ADMIN_EMAIL.indexOf('__') !== 0 && wajdAccountEmailValue(user) === WAJD_ADMIN_EMAIL.toLowerCase();
}

function wajdNotificationTime(value) {
  return value && value.toMillis ? value.toMillis() : 0;
}

function wajdNotificationDate(value) {
  const time = wajdNotificationTime(value);
  if (!time) return 'الآن';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle:'medium', timeStyle:'short' }).format(new Date(time));
}

function wajdNotificationSafeUrl(value) {
  try {
    const url = new URL(String(value || '/'), window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search : '/';
  } catch (error) { return '/'; }
}

function wajdNotificationsSetEmpty(message) {
  if (!wajdNotificationsList) return;
  wajdNotificationsList.innerHTML = '<div class="wajd-notifications-state"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>' + message + '</div>';
}

function wajdNotificationsMessage(data) {
  const title = data.articleTitle || 'إحدى كتابات وَجْد';
  if (data.type === 'commentHeart') return { title:data.actorAnonymous ? 'أعجب أحد القراء بتعليقك' : ((data.actorName || 'أيمن المهدي') + ' أعجب بتعليقك'), detail:title };
  const actor = data.actorAnonymous ? 'قارئ مجهول' : (data.actorName || 'قارئ وَجْد');
  if (data.type === 'like') {
    const count = Math.max(1, Number(data.count) || 1);
    return { title: count === 1 ? 'أُعجب قارئ بمقالك' : 'أُعجب ' + wajdSavedArabicNumber.format(count) + ' قرّاء بمقالك', detail:title };
  }
  if (data.type === 'reply') return { title:actor + ' ردّ على تعليقك', detail:data.preview || title };
  return { title:actor + ' أضاف تعليقًا جديدًا', detail:data.preview || title };
}

function wajdNotificationsIcon(type) {
  return type === 'like' || type === 'commentHeart'
    ? '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.6a5.4 5.4 0 0 0 0-7.6z"/></svg>'
    : '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>';
}

async function wajdNotificationMarkRead(entry) {
  if (!entry || entry.data.read) return;
  try { await setDoc(entry.ref, { read:true }, { merge:true }); }
  catch (error) { console.error('Wajd notification read:', error); }
}

function wajdNotificationsRender() {
  if (!wajdNotificationsList) return;
  const entries = Array.from(wajdNotificationEntries.values()).sort((a, b) => wajdNotificationTime(b.data.updatedAt || b.data.createdAt) - wajdNotificationTime(a.data.updatedAt || a.data.createdAt)).slice(0, 80);
  const unread = entries.filter(entry => !entry.data.read).length;
  if (wajdNotificationsBadge) {
    wajdNotificationsBadge.textContent = wajdSavedArabicNumber.format(Math.min(unread, 99));
    wajdNotificationsBadge.classList.toggle('is-visible', unread > 0);
  }
  if (wajdNotificationsOpen) wajdNotificationsOpen.setAttribute('aria-label', unread ? 'الإشعارات، ' + wajdSavedArabicNumber.format(unread) + ' غير مقروء' : 'الإشعارات');
  if (wajdNotificationsReadAll) {
    wajdNotificationsReadAll.disabled = unread === 0;
    wajdNotificationsReadAll.setAttribute('aria-busy', 'false');
    wajdNotificationsReadAll.textContent = unread === 0 ? 'الكل مقروء ✓' : 'تعليم الكل كمقروء';
  }
  if (!entries.length) { wajdNotificationsSetEmpty('لا توجد إشعارات بعد.<br/>ستظهر هنا التعليقات والردود والإعجابات الجديدة.'); return; }
  const fragment = document.createDocumentFragment();
  entries.forEach(entry => {
    const data = entry.data;
    const message = wajdNotificationsMessage(data);
    const link = document.createElement('a');
    link.className = 'wajd-notification-card wajd-notification-' + (data.type || 'comment') + (data.read ? '' : ' is-unread');
    link.href = wajdNotificationSafeUrl(data.articleUrl) + (data.commentId ? '#wajd-comment-' + encodeURIComponent(data.commentId) : '');
    link.innerHTML = '<span class="wajd-notification-icon">' + wajdNotificationsIcon(data.type) + '</span><span class="wajd-notification-copy"><strong></strong><p></p><time class="wajd-notification-time"></time></span>' + (data.read ? '' : '<span aria-hidden="true" class="wajd-notification-dot"></span>');
    link.querySelector('strong').textContent = message.title;
    link.querySelector('p').textContent = message.detail;
    link.querySelector('time').textContent = wajdNotificationDate(data.updatedAt || data.createdAt);
    link.addEventListener('click', async event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      await wajdNotificationMarkRead(entry);
      window.location.assign(link.href);
    });
    fragment.appendChild(link);
  });
  wajdNotificationsList.innerHTML = '';
  wajdNotificationsList.appendChild(fragment);
}

function wajdNotificationsApplySnapshot(source, snapshot) {
  Array.from(wajdNotificationEntries.keys()).filter(key => key.indexOf(source + ':') === 0).forEach(key => wajdNotificationEntries.delete(key));
  snapshot.forEach(item => wajdNotificationEntries.set(source + ':' + item.id, { ref:item.ref, data:item.data() }));
  wajdNotificationsRender();
}

function wajdNotificationsReplaceInboxes(snapshots, failedInboxKeys) {
  const failed = new Set(failedInboxKeys || []);
  Array.from(wajdNotificationEntries.keys())
    .filter(key => key.indexOf('inbox-') === 0)
    .forEach(key => {
      const rest = key.slice(6);
      const separator = rest.indexOf(':');
      const inboxKey = separator >= 0 ? rest.slice(0, separator) : '';
      // Keep the last known cards for an inbox whose current read failed; one
      // transient legacy error must not make valid notifications disappear.
      if (!failed.has(inboxKey)) wajdNotificationEntries.delete(key);
    });
  snapshots.forEach(item => {
    item.snapshot.forEach(notification => {
      wajdNotificationEntries.set('inbox-' + item.inboxKey + ':' + notification.id, {
        ref:notification.ref,
        data:notification.data()
      });
    });
  });
  wajdNotificationsRender();
}

async function wajdNotificationsRefresh(force) {
  const activeUser = wajdSavedAuth && wajdSavedAuth.currentUser;
  if (!activeUser || !wajdAccountIsGoogle(activeUser) || !wajdSavedUser || activeUser.uid !== wajdSavedUser.uid) return;
  if (wajdNotificationsRefreshPromise) {
    if (force) wajdNotificationsRefreshQueued = true;
    return wajdNotificationsRefreshPromise;
  }
  if (!force && Date.now() - wajdNotificationsLastRefresh < WAJD_NOTIFICATIONS_REFRESH_INTERVAL) return;
  const inboxKeys = Array.from(wajdNotificationInboxKeys);
  if (!inboxKeys.length) {
    wajdNotificationsLastRefresh = Date.now();
    wajdNotificationsReplaceInboxes([]);
    return;
  }
  wajdNotificationsRefreshPromise = (async () => {
    const snapshots = [];
    const failedInboxKeys = [];
    let firstError = null;
    // Avoid a large Promise.all burst when a long-time reader owns many comment
    // inboxes. One broken legacy inbox is isolated instead of cancelling all
    // notification results.
    for (let index = 0; index < inboxKeys.length; index += WAJD_NOTIFICATIONS_INBOX_CONCURRENCY) {
      const chunk = inboxKeys.slice(index, index + WAJD_NOTIFICATIONS_INBOX_CONCURRENCY);
      const results = await Promise.all(chunk.map(async inboxKey => {
        try {
          const inboxQuery = query(collection(wajdSavedDb, 'notificationInboxes', inboxKey, 'items'), orderBy('createdAt', 'desc'), limit(80));
          return { inboxKey, snapshot:await getDocs(inboxQuery), error:null };
        } catch (error) {
          console.warn('Wajd notification inbox skipped:', inboxKey, error);
          return { inboxKey, snapshot:null, error };
        }
      }));
      results.forEach(result => {
        if (result.snapshot) snapshots.push({ inboxKey:result.inboxKey, snapshot:result.snapshot });
        else { failedInboxKeys.push(result.inboxKey); if (!firstError) firstError = result.error; }
      });
    }
    if (!snapshots.length && firstError) throw firstError;
    wajdNotificationsLastRefresh = Date.now();
    wajdNotificationsReplaceInboxes(snapshots, failedInboxKeys);
  })().catch(error => {
    console.error('Wajd reply notifications:', error);
    if (!wajdNotificationEntries.size) wajdNotificationsSetEmpty('تعذّر تحميل الإشعارات الآن.<br/>حدّث الصفحة وحاول مرة أخرى.');
  }).finally(() => {
    wajdNotificationsRefreshPromise = null;
    if (wajdNotificationsRefreshQueued) {
      wajdNotificationsRefreshQueued = false;
      window.setTimeout(() => wajdNotificationsRefresh(true).catch(error => console.error('Wajd queued notification refresh:', error)), 0);
    }
  });
  return wajdNotificationsRefreshPromise;
}

async function wajdNotificationsClaimInbox(user, commentScope, inboxKey) {
  if (!user || !commentScope || !inboxKey) return;
  const claimKey = 'wajd-notification-claim-v1:' + user.uid + ':' + inboxKey;
  try {
    const lastClaim = Number(localStorage.getItem(claimKey)) || 0;
    if (Date.now() - lastClaim < 6 * 60 * 60 * 1000) return;
  } catch (error) {}
  const ownerRef = doc(wajdSavedDb, 'notificationInboxes', inboxKey);
  await setDoc(ownerRef, {
    ownerId:user.uid,
    commentScope,
    updatedAt:serverTimestamp()
  }, { merge:true });
  try { localStorage.setItem(claimKey, String(Date.now())); } catch (error) {}
}

function wajdNotificationsRebuildInboxKeys() {
  wajdNotificationInboxKeys.clear();
  wajdNotificationLegacyInboxKeys.forEach(key => wajdNotificationInboxKeys.add(key));
  wajdNotificationOwnedInboxKeys.forEach(key => wajdNotificationInboxKeys.add(key));
}

function wajdNotificationsStart(user) {
  if (wajdNotificationsStarted || !wajdAccountIsGoogle(user)) return;
  wajdNotificationsStarted = true;
  if (wajdNotificationsOpen) wajdNotificationsOpen.classList.add('is-visible');

  let sourceRefreshTimer = 0;
  const refreshFromSources = () => {
    wajdNotificationsRebuildInboxKeys();
    window.clearTimeout(sourceRefreshTimer);
    sourceRefreshTimer = window.setTimeout(() => {
      wajdNotificationsRefresh(true).catch(error => console.error('Wajd notification refresh:', error));
    }, 80);
  };

  // Legacy aliases stay readable so old replies are never lost, but new
  // comments no longer depend on them for authorization or publication.
  const aliasesQuery = collection(wajdSavedDb, 'users', user.uid, 'commentAliases');
  wajdNotificationRealtimeUnsubscribers.set('aliases', onSnapshot(aliasesQuery, async snapshot => {
    wajdNotificationLegacyInboxKeys.clear();
    try {
      await Promise.all(snapshot.docs.map(async item => {
        const inboxKey = String(item.data().aliasKey || '');
        if (inboxKey.length < 20 || inboxKey.length > 64) return;
        wajdNotificationLegacyInboxKeys.add(inboxKey);
        await wajdNotificationsClaimInbox(user, item.id, inboxKey).catch(() => {});
      }));
      refreshFromSources();
    } catch (error) {
      console.error('Wajd legacy notification inbox ownership:', error);
      refreshFromSources();
    }
  }, error => {
    console.error('Wajd legacy notification inboxes:', error);
    refreshFromSources();
  }));

  // v115: every newly published comment owns a dedicated inbox key indexed
  // privately under the Google account. This avoids one stale article alias
  // blocking publication while preserving cross-device notifications.
  const ownedInboxesQuery = collection(wajdSavedDb, 'users', user.uid, 'commentInboxes');
  wajdNotificationRealtimeUnsubscribers.set('commentInboxes', onSnapshot(ownedInboxesQuery, snapshot => {
    wajdNotificationOwnedInboxKeys.clear();
    snapshot.forEach(item => {
      const inboxKey = String(item.id || '');
      if (inboxKey.length >= 20 && inboxKey.length <= 64) wajdNotificationOwnedInboxKeys.add(inboxKey);
    });
    refreshFromSources();
  }, error => {
    console.error('Wajd owned notification inboxes:', error);
    refreshFromSources();
  }));

  if (wajdIsAdmin(user)) {
    const adminQuery = query(collection(wajdSavedDb, 'adminNotifications'), orderBy('updatedAt', 'desc'), limit(80));
    wajdNotificationRealtimeUnsubscribers.set('admin', onSnapshot(adminQuery, snapshot => wajdNotificationsApplySnapshot('admin', snapshot), error => console.error('Wajd admin notifications:', error)));
  }
}

function wajdNotificationsOpenModal() {
  if (!wajdNotificationsOverlay || !wajdAccountIsGoogle(wajdSavedUser)) return;
  wajdAdminCloseModal(); wajdAccountCloseModal(); wajdSavedCloseModal(); wajdHistoryCloseModal();
  wajdNotificationsRefresh(true);
  wajdNotificationsLastFocus = document.activeElement;
  wajdNotificationsOverlay.classList.add('is-open');
  wajdNotificationsOverlay.setAttribute('aria-hidden', 'false');
  wajdNotificationsOpen.setAttribute('aria-expanded', 'true');
  document.body.classList.add('wajd-modal-open');
  wajdNotificationsClose.focus();
}

function wajdNotificationsCloseModal() {
  if (!wajdNotificationsOverlay) return;
  wajdNotificationsOverlay.classList.remove('is-open');
  wajdNotificationsOverlay.setAttribute('aria-hidden', 'true');
  if (wajdNotificationsOpen) wajdNotificationsOpen.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('wajd-modal-open');
  if (wajdNotificationsLastFocus && wajdNotificationsLastFocus.focus) wajdNotificationsLastFocus.focus();
}

async function wajdNotificationsMarkAllRead() {
  const unread = Array.from(wajdNotificationEntries.values()).filter(entry => !entry.data.read).slice(0, 400);
  if (!unread.length) return;
  wajdNotificationsReadAll.disabled = true;
  wajdNotificationsReadAll.setAttribute('aria-busy', 'true');
  wajdNotificationsReadAll.textContent = 'جارٍ التعليم…';
  try {
    // v118: rules read the owning inbox once per distinct inbox, and a batch may use
    // at most 20 rule reads. Split by inbox so readers with many comments are not blocked.
    const groups = [];
    let group = [], inboxes = new Set();
    unread.forEach(entry => {
      const inboxRef = entry.ref.parent && entry.ref.parent.parent;
      const inboxKey = inboxRef && inboxRef.parent && inboxRef.parent.id === 'notificationInboxes' ? inboxRef.id : '';
      if (inboxKey && !inboxes.has(inboxKey) && inboxes.size >= 15) { groups.push(group); group = []; inboxes = new Set(); }
      if (inboxKey) inboxes.add(inboxKey);
      group.push(entry);
    });
    if (group.length) groups.push(group);
    for (const items of groups) {
      const batch = writeBatch(wajdSavedDb);
      items.forEach(entry => batch.set(entry.ref, { read:true }, { merge:true }));
      await batch.commit();
      items.forEach(entry => { entry.data.read = true; });
    }
  } catch (error) {
    console.error('Wajd read all notifications:', error);
  } finally {
    wajdNotificationsRender();
  }
}

function wajdNotificationsBindInterface() {
  if (!wajdNotificationsOpen || !wajdNotificationsOverlay) return;
  wajdNotificationsOpen.addEventListener('click', wajdNotificationsOpenModal);
  wajdNotificationsClose.addEventListener('click', wajdNotificationsCloseModal);
  wajdNotificationsReadAll.addEventListener('click', wajdNotificationsMarkAllRead);
  wajdNotificationsOverlay.addEventListener('click', event => { if (event.target === wajdNotificationsOverlay) wajdNotificationsCloseModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && wajdNotificationsOverlay.classList.contains('is-open')) wajdNotificationsCloseModal(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wajdNotificationsRefresh(false);
  });
}

async function wajdRegisterAnonymousVisitor(user) {
  if (!user || !user.isAnonymous || wajdAccountIsGoogle(user)) return;
  const knownKey = WAJD_ANONYMOUS_VISITOR_KNOWN_PREFIX + user.uid;
  const refreshKey = WAJD_ANONYMOUS_VISITOR_REFRESH_PREFIX + user.uid;
  let known = false;
  try {
    known = localStorage.getItem(knownKey) === '1';
    const lastRefresh = Number(localStorage.getItem(refreshKey)) || 0;
    if (known && Date.now() - lastRefresh < WAJD_ANONYMOUS_VISITOR_REFRESH_INTERVAL) return;
  } catch (error) {}
  const visitorRef = doc(wajdSavedDb, 'anonymousVisitors', user.uid);
  let exists = known;
  if (!known) exists = (await getDoc(visitorRef)).exists();
  const data = { lastSeenAt:serverTimestamp() };
  if (!exists) data.firstSeenAt = serverTimestamp();
  try {
    await setDoc(visitorRef, data, { merge:true });
  } catch (error) {
    if (!known) throw error;
    const current = await getDoc(visitorRef);
    if (current.exists()) throw error;
    await setDoc(visitorRef, { firstSeenAt:serverTimestamp(), lastSeenAt:serverTimestamp() });
  }
  try {
    localStorage.setItem(knownKey, '1');
    localStorage.setItem(refreshKey, String(Date.now()));
  } catch (error) {}
}

async function wajdRegisterGoogleReader(user, force) {
  if (!wajdAccountIsGoogle(user)) return;
  const refreshKey = WAJD_PROFILE_REFRESH_PREFIX + user.uid;
  if (!force) {
    try {
      const lastRefresh = Number(localStorage.getItem(refreshKey)) || 0;
      if (Date.now() - lastRefresh < WAJD_PROFILE_REFRESH_INTERVAL) return;
    } catch (error) {}
  }
  const googleProfile = wajdAccountGoogleProfile(user);
  const profileRef = doc(wajdSavedDb, 'profiles', user.uid);
  const current = await getDoc(profileRef);
  const displayName = String(user.displayName || (googleProfile && googleProfile.displayName) || 'قارئ وَجْد').trim().slice(0, 120) || 'قارئ وَجْد';
  const data = {
    email: wajdAccountEmailValue(user),
    displayName,
    photoURL: wajdAccountTrustedPhotoURL(user),
    provider: 'google',
    lastSeenAt: serverTimestamp()
  };
  if (!current.exists()) data.createdAt = serverTimestamp();
  await setDoc(profileRef, data, { merge: true });
  try { localStorage.setItem(refreshKey, String(Date.now())); } catch (error) {}
}
window.wajdEnsureGoogleReaderProfile = function(force) {
  const current = wajdSavedAuth && wajdSavedAuth.currentUser ? wajdSavedAuth.currentUser : wajdSavedUser;
  return wajdRegisterGoogleReader(current, force === true);
};

function wajdAudienceReaderType(user) {
  // v118: never infer a registered reader from merely being non-anonymous.
  // The only registered identity in Wajd is an authenticated Google account.
  return wajdAccountIsGoogle(user) ? 'registered' : 'anonymous';
}

function wajdAudienceRandomId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 14);
}

function wajdAudienceTabId() {
  const key = 'wajd-audience-tab-v1';
  try {
    let value = sessionStorage.getItem(key);
    if (!value) { value = wajdAudienceRandomId(); sessionStorage.setItem(key, value); }
    return value;
  } catch (error) { return wajdAudienceRandomId(); }
}

function wajdAudiencePageUrl() {
  try {
    const url = new URL(window.location.href);
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid'].forEach(key => url.searchParams.delete(key));
    url.hash = '';
    return url.href.slice(0, 1500);
  } catch (error) { return String(window.location.pathname || '/').slice(0, 1500); }
}

function wajdAudiencePageTitle() {
  // Only a single article/answer page may take its title from the page heading; on the home page and
  // lists the first .entry-title is just the newest post, which made home visits look like that post.
  const single = Boolean(wajdArticlePanel) || document.body.classList.contains('post') || document.body.classList.contains('wajd-qa-page');
  if (!single && /^\/?$/.test(window.location.pathname) && !/reading-path=/.test(window.location.search)) return 'الصفحة الرئيسية';
  const heading = single ? document.querySelector('.entry-title.topic-title,.entry-title,.post-title') : null;
  const value = wajdArticlePanel && wajdArticlePanel.dataset.postTitle || heading && heading.textContent || document.title || 'صفحة من وَجْد';
  return String(value).replace(/\s*[|–—-]\s*وَ?جْد\s*$/u, '').trim().slice(0, 250) || 'صفحة من وَجْد';
}

function wajdAudiencePageType() {
  if (document.body.classList.contains('post')) return 'article';
  if (document.body.classList.contains('wajd-qa-page')) return 'qa';
  if (document.documentElement.classList.contains('wajd-reading-path-route') || document.body.classList.contains('wajd-reading-path-page')) return 'path';
  if (document.body.classList.contains('home')) return 'home';
  if (document.body.classList.contains('index')) return 'category';
  return 'other';
}

function wajdAudienceReferrer() {
  if (!document.referrer) return 'direct';
  try {
    const url = new URL(document.referrer);
    const host = url.hostname.toLowerCase();
    if (host === window.location.hostname.toLowerCase()) return 'internal';
    if (host === 't.me' || host.includes('telegram')) return 'telegram';
    if (host.includes('google.')) return 'google';
    if (host.includes('facebook.') || host.includes('fb.com') || host.includes('instagram.')) return 'facebook';
    return 'other';
  } catch (error) { return 'other'; }
}

function wajdAudienceDeviceClass() {
  const agent = String(navigator.userAgent || '');
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(agent)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(agent)) return 'mobile';
  return 'desktop';
}

function wajdAudienceProgress() {
  if (!document.body.classList.contains('post')) return 0;
  const body = document.querySelector('.post-body,.amp-contnt');
  if (!body) return 0;
  const rect = body.getBoundingClientRect();
  const start = window.scrollY + rect.top;
  const end = start + body.offsetHeight - window.innerHeight;
  return Math.max(0, Math.min(1, Math.round(((window.scrollY - start) / Math.max(1, end - start)) * 1000) / 1000));
}

function wajdAudienceIdleLimit() {
  return document.body.classList.contains('post') && wajdJourneyArticleVisible() ? WAJD_AUDIENCE_READING_IDLE_TIMEOUT : WAJD_AUDIENCE_IDLE_TIMEOUT;
}

// v119: articles this browser finished (any reader, signed in or not). Google
// readers also keep their cloud history; this makes anonymous completion count.
function wajdLocalCompletedRead(uid) {
  if (!uid) return [];
  try {
    const list = JSON.parse(localStorage.getItem(WAJD_COMPLETED_ARTICLES_PREFIX + uid) || '[]');
    return Array.isArray(list) ? list.filter(item => typeof item === 'string' && item).slice(-500) : [];
  } catch (error) { return []; }
}

function wajdLocalCompletedAdd(uid, articleId) {
  if (!uid || !articleId) return;
  const list = wajdLocalCompletedRead(uid);
  if (list.includes(articleId)) return;
  list.push(articleId);
  try { localStorage.setItem(WAJD_COMPLETED_ARTICLES_PREFIX + uid, JSON.stringify(list.slice(-500))); } catch (error) {}
}

function wajdAudienceReaderState() {
  let data = null;
  try { data = window.wajdGetReaderJourneyData ? window.wajdGetReaderJourneyData() : null; } catch (error) {}
  const history = data && Array.isArray(data.history) ? data.history : [];
  const current = wajdCurrentPostId ? history.find(item => String(item.id) === String(wajdCurrentPostId)) : null;
  const uid = wajdAudienceTracker && wajdAudienceTracker.user ? wajdAudienceTracker.user.uid : (wajdSavedUser && wajdSavedUser.uid || '');
  const local = wajdLocalCompletedRead(uid);
  return {
    completedArticles:Math.max(history.filter(item => item.details && item.details.completed === true).length, local.length),
    lastCompleted:Boolean(current && current.details && current.details.completed === true) || Boolean(wajdCurrentPostId && local.includes(String(wajdCurrentPostId))),
    lastProgress:current && current.details ? Math.max(0, Math.min(1, Number(current.details.progress) || 0)) : wajdAudienceProgress()
  };
}

function wajdAudienceMetadata() {
  const reader = wajdAudienceReaderState();
  let campaignSource = '', campaignMedium = '', campaignName = '';
  try {
    const url = new URL(window.location.href);
    campaignSource = wajdEarlySafeText(url.searchParams.get('utm_source'),80);
    campaignMedium = wajdEarlySafeText(url.searchParams.get('utm_medium'),80);
    campaignName = wajdEarlySafeText(url.searchParams.get('utm_campaign'),80);
  } catch (error) {}
  return {
    pageTitle:wajdAudiencePageTitle(),
    pageUrl:wajdAudiencePageUrl(),
    pageType:wajdAudiencePageType(),
    referrer:wajdAudienceReferrer(),
    deviceClass:wajdAudienceDeviceClass(),
    browserFamily:wajdEarlyBrowser(),
    osFamily:wajdEarlyOs(),
    locale:wajdEarlySafeText(navigator.language || '',20),
    timeZone:wajdEarlySafeText((Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '',60),
    viewportClass:wajdEarlyViewport(),
    campaignSource,
    campaignMedium,
    campaignName,
    completedArticles:Math.max(0, Math.round(Number(reader.completedArticles) || 0)),
    lastProgress:Math.max(0, Math.min(1, Math.round((Number(reader.lastProgress) || 0) * 1000) / 1000)),
    lastCompleted:Boolean(reader.lastCompleted)
  };
}

function wajdAudienceReadSession(userId) {
  const key = WAJD_AUDIENCE_SESSION_PREFIX + userId;
  const now = Date.now();
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    if (stored && typeof stored.id === 'string' && stored.id.length >= 8 && now - Number(stored.lastActivityAt) < WAJD_AUDIENCE_SESSION_TIMEOUT) {
      return { key, id:stored.id, startedAt:Number(stored.startedAt) || now, lastActivityAt:Number(stored.lastActivityAt) || now, isNew:false };
    }
  } catch (error) {}
  return { key, id:wajdAudienceRandomId(), startedAt:now, lastActivityAt:now, isNew:true };
}

function wajdAudiencePersistSession(tracker, force) {
  if (!tracker || !tracker.session) return;
  const now = Date.now();
  if (!force && now - tracker.lastSessionPersistAt < 10000) return;
  tracker.lastSessionPersistAt = now;
  try {
    localStorage.setItem(tracker.session.key, JSON.stringify({ id:tracker.session.id, startedAt:tracker.session.startedAt, lastActivityAt:tracker.session.lastActivityAt }));
  } catch (error) {}
}

function wajdAudiencePendingRead(userId) {
  try {
    const rows = JSON.parse(localStorage.getItem(WAJD_AUDIENCE_PENDING_PREFIX + userId) || '[]'), now = Date.now();
    return Array.isArray(rows) ? rows.filter(row => row && typeof row.id === 'string' && typeof row.sessionId === 'string' && Number(row.seconds) > 0 && Number(row.seconds) <= 300 && now - Number(row.updatedAt) <= 30 * 86400000).slice(-12) : [];
  } catch (error) { return []; }
}

function wajdAudiencePendingWrite(userId, rows) {
  try {
    const key = WAJD_AUDIENCE_PENDING_PREFIX + userId;
    if (rows.length) localStorage.setItem(key, JSON.stringify(rows.slice(-12)));
    else localStorage.removeItem(key);
  } catch (error) {}
}

function wajdAudiencePendingRemove(userId, id) {
  wajdAudiencePendingWrite(userId, wajdAudiencePendingRead(userId).filter(row => row.id !== id));
}

function wajdAudiencePersistPending(tracker) {
  if (!tracker || tracker.stopped || tracker.flushing || tracker.pendingActiveSeconds < 1) return;
  if (!tracker.pendingFlushId) tracker.pendingFlushId = wajdAudienceRandomId();
  const rows = wajdAudiencePendingRead(tracker.user.uid).filter(row => row.id !== tracker.pendingFlushId);
  rows.push({ id:tracker.pendingFlushId, sourceUserId:tracker.user.uid, sessionId:tracker.session.id, seconds:Math.min(300,Math.floor(tracker.pendingActiveSeconds)), updatedAt:Date.now() });
  wajdAudiencePendingWrite(tracker.user.uid, rows);
}

function wajdAudienceLoadPending(tracker) {
  const rows = wajdAudiencePendingRead(tracker.user.uid), old = [];
  rows.forEach(row => {
    if (row.sessionId !== tracker.session.id) { old.push(row); return; }
    if (tracker.lastStoredFlushId && row.id === tracker.lastStoredFlushId) {
      wajdAudiencePendingRemove(tracker.user.uid,row.id); return;
    }
    if (!tracker.pendingFlushId) {
      tracker.pendingFlushId = row.id;
      tracker.pendingActiveSeconds = Math.min(300,tracker.pendingActiveSeconds + Math.floor(Number(row.seconds) || 0));
    } else old.push(row);
  });
  return old;
}

async function wajdAudienceRecoverPending(tracker, rows) {
  if (!tracker || !rows || !rows.length || !wajdAnalyticsCanWrite()) return;
  // Recovery is deliberately capped so old telemetry can never consume the
  // quota needed by a reader's like, save or reading-list action.
  for (const row of rows.slice(0, 2)) {
    try {
      const sourceUserId = String(row.sourceUserId || tracker.user.uid).slice(0,128);
      if (sourceUserId === tracker.user.uid) {
        const oldSession = await getDoc(doc(wajdSavedDb,'audienceVisitors',sourceUserId,'audienceSessions',row.sessionId));
        if (oldSession.exists() && oldSession.data().lastClientFlushId === row.id) {
          wajdAudiencePendingRemove(tracker.user.uid,row.id); continue;
        }
      }
      const recoveryRef = doc(wajdSavedDb,'audienceRecoveryDeltas',tracker.user.uid + '_' + row.id);
      // v119: plain create instead of a transaction. The transaction read a doc that
      // does not exist yet, which the rules refuse (403) and which left the Firestore
      // SDK's write stream in a broken state (INTERNAL ASSERTION da08) for the page.
      // The rules allow create only, so a retry of an already-saved row is refused:
      // that means it is recorded, and the row is dropped below.
      try {
        await setDoc(recoveryRef, {
          schemaVersion:106, userId:tracker.user.uid, sourceUserId, deltaKey:row.id, sessionId:String(row.sessionId).slice(0,80),
          activeSeconds:Math.min(300,Math.max(1,Math.floor(Number(row.seconds)||1))), recordedAt:new Date(Number(row.updatedAt)||Date.now()), recoveredAt:serverTimestamp()
        });
      } catch (createError) {
        if (!/permission-denied/.test(String(createError && createError.code || ''))) throw createError;
      }
      wajdAudiencePendingRemove(tracker.user.uid,row.id);
    } catch (error) {
      wajdAnalyticsHandleError(error);
      console.warn('Wajd audience recovery pending:', error && error.code || 'network');
      if (!wajdAnalyticsCanWrite()) break;
    }
  }
}

function wajdAudienceClaimActiveTab(tracker) {
  if (!tracker || tracker.stopped || document.visibilityState === 'hidden') return;
  try { localStorage.setItem(tracker.leaderKey, JSON.stringify({ id:tracker.tabId, at:Date.now() })); } catch (error) {}
}

function wajdAudienceOwnsActiveTab(tracker) {
  if (!tracker || tracker.stopped) return false;
  const now = Date.now();
  try {
    const leader = JSON.parse(localStorage.getItem(tracker.leaderKey) || 'null');
    if (!leader || now - Number(leader.at) > 15000) { wajdAudienceClaimActiveTab(tracker); return true; }
    if (leader.id !== tracker.tabId) return false;
    localStorage.setItem(tracker.leaderKey, JSON.stringify({ id:tracker.tabId, at:now }));
  } catch (error) { return true; }
  return true;
}

function wajdAudienceVisitorCreateData(tracker, metadata) {
  return {
    readerType:tracker.readerType,
    firstSeenAt:serverTimestamp(),
    lastSeenAt:serverTimestamp(),
    lastActiveAt:serverTimestamp(),
    sessionCount:1,
    pageViewCount:1,
    totalActiveSeconds:0,
    completedArticles:metadata.completedArticles,
    lastSessionId:tracker.session.id,
    lastPageTitle:metadata.pageTitle,
    lastPageUrl:metadata.pageUrl,
    lastPageType:metadata.pageType,
    lastReferrer:metadata.referrer,
    deviceClass:metadata.deviceClass,
    browserFamily:metadata.browserFamily,
    osFamily:metadata.osFamily,
    locale:metadata.locale,
    timeZone:metadata.timeZone,
    viewportClass:metadata.viewportClass,
    lastCampaignSource:metadata.campaignSource,
    lastCampaignMedium:metadata.campaignMedium,
    lastCampaignName:metadata.campaignName,
    lastProgress:metadata.lastProgress,
    lastCompleted:metadata.lastCompleted
  };
}

function wajdAudienceSessionCreateData(tracker, metadata) {
  return {
    readerType:tracker.readerType,
    startedAt:serverTimestamp(),
    lastSeenAt:serverTimestamp(),
    lastActiveAt:serverTimestamp(),
    activeSeconds:0,
    pageViews:1,
    entryPageTitle:metadata.pageTitle,
    entryPageUrl:metadata.pageUrl,
    entryReferrer:metadata.referrer,
    deviceClass:metadata.deviceClass,
    browserFamily:metadata.browserFamily,
    osFamily:metadata.osFamily,
    locale:metadata.locale,
    timeZone:metadata.timeZone,
    viewportClass:metadata.viewportClass,
    campaignSource:metadata.campaignSource,
    campaignMedium:metadata.campaignMedium,
    campaignName:metadata.campaignName,
    lastClientFlushId:'',
    lastPageTitle:metadata.pageTitle,
    lastPageUrl:metadata.pageUrl,
    lastPageType:metadata.pageType,
    lastProgress:metadata.lastProgress,
    lastCompleted:metadata.lastCompleted
  };
}

async function wajdAudienceInitializeRecords(tracker) {
  const metadata = wajdAudienceMetadata();
  const visitorSnapshot = await getDoc(tracker.visitorRef);
  let sessionSnapshot = null;
  if (!tracker.session.isNew) sessionSnapshot = await getDoc(tracker.sessionRef);
  const newSession = tracker.session.isNew || !sessionSnapshot || !sessionSnapshot.exists();
  tracker.lastStoredFlushId = newSession ? '' : String(sessionSnapshot.data().lastClientFlushId || '');
  tracker.journeySource = newSession ? wajdJourneySource() : (sessionSnapshot.data().entryReferrer || 'direct');
  tracker.journeyReturning = visitorSnapshot.exists() && Number(visitorSnapshot.data().sessionCount) > (newSession ? 0 : 1);
  tracker.session.isNew = newSession;
  const batch = writeBatch(wajdSavedDb);
  if (!visitorSnapshot.exists()) batch.set(tracker.visitorRef, wajdAudienceVisitorCreateData(tracker, metadata));
  else batch.set(tracker.visitorRef, {
    readerType:tracker.readerType,
    lastSeenAt:serverTimestamp(),
    lastActiveAt:serverTimestamp(),
    sessionCount:increment(newSession ? 1 : 0),
    pageViewCount:increment(1),
    completedArticles:metadata.completedArticles,
    lastSessionId:tracker.session.id,
    lastPageTitle:metadata.pageTitle,
    lastPageUrl:metadata.pageUrl,
    lastPageType:metadata.pageType,
    lastReferrer:metadata.referrer,
    deviceClass:metadata.deviceClass,
    browserFamily:metadata.browserFamily,
    osFamily:metadata.osFamily,
    locale:metadata.locale,
    timeZone:metadata.timeZone,
    viewportClass:metadata.viewportClass,
    lastCampaignSource:metadata.campaignSource,
    lastCampaignMedium:metadata.campaignMedium,
    lastCampaignName:metadata.campaignName,
    lastProgress:metadata.lastProgress,
    lastCompleted:metadata.lastCompleted
  }, { merge:true });
  if (newSession) batch.set(tracker.sessionRef, wajdAudienceSessionCreateData(tracker, metadata));
  else batch.set(tracker.sessionRef, {
    readerType:tracker.readerType,
    lastSeenAt:serverTimestamp(),
    lastActiveAt:serverTimestamp(),
    pageViews:increment(1),
    lastPageTitle:metadata.pageTitle,
    lastPageUrl:metadata.pageUrl,
    lastPageType:metadata.pageType,
    lastProgress:metadata.lastProgress,
    lastCompleted:metadata.lastCompleted
  }, { merge:true });
  await batch.commit();
  tracker.completedArticles = metadata.completedArticles;
  tracker.lastCompleted = metadata.lastCompleted;
  tracker.lastProgress = metadata.lastProgress;
  tracker.dirtyRevision++;
  tracker.flushedRevision = tracker.dirtyRevision;
  wajdAudiencePersistSession(tracker, true);
}

async function wajdAudienceFlush(force) {
  const tracker = wajdAudienceTracker;
  if (!tracker || tracker.stopped) return;
  // Back off only periodic/background telemetry. Session creation is handled
  // separately and is never suppressed by this local flag.
  if (!wajdAnalyticsCanWrite()) {
    wajdAudiencePersistPending(tracker);
    return;
  }
  if (tracker.flushing) { tracker.flushAgain = tracker.flushAgain || Boolean(force); return tracker.flushPromise; }
  const delta = Math.min(300, Math.max(0, Math.floor(tracker.pendingActiveSeconds)));
  if (!force && delta < 1 && tracker.flushedRevision === tracker.dirtyRevision) return;
  if (delta > 0) wajdAudiencePersistPending(tracker);
  const flushId = delta > 0 ? tracker.pendingFlushId : '';
  const revision = tracker.dirtyRevision;
  const visitorRef = tracker.visitorRef;
  const sessionRef = tracker.sessionRef;
  tracker.pendingActiveSeconds -= delta;
  tracker.flushing = true;
  tracker.flushAgain = false;
  tracker.flushPromise = (async () => {
    const metadata = wajdAudienceMetadata();
    metadata.completedArticles = Math.max(tracker.completedArticles, metadata.completedArticles);
    metadata.lastProgress = Math.max(metadata.lastProgress, tracker.lastProgress || 0);
    metadata.lastCompleted = tracker.lastCompleted || metadata.lastCompleted;
    const visitorPatch = {
      readerType:tracker.readerType,
      lastSeenAt:serverTimestamp(),
      completedArticles:metadata.completedArticles,
      lastSessionId:tracker.session.id,
      lastPageTitle:metadata.pageTitle,
      lastPageUrl:metadata.pageUrl,
      lastPageType:metadata.pageType,
      lastReferrer:metadata.referrer,
      deviceClass:metadata.deviceClass,
      browserFamily:metadata.browserFamily,
      osFamily:metadata.osFamily,
      locale:metadata.locale,
      timeZone:metadata.timeZone,
      viewportClass:metadata.viewportClass,
      lastCampaignSource:metadata.campaignSource,
      lastCampaignMedium:metadata.campaignMedium,
      lastCampaignName:metadata.campaignName,
      lastProgress:metadata.lastProgress,
      lastCompleted:metadata.lastCompleted
    };
    const sessionPatch = {
      readerType:tracker.readerType,
      lastSeenAt:serverTimestamp(),
      lastPageTitle:metadata.pageTitle,
      lastPageUrl:metadata.pageUrl,
      lastPageType:metadata.pageType,
      lastProgress:metadata.lastProgress,
      lastCompleted:metadata.lastCompleted
    };
    if (delta > 0) {
      visitorPatch.lastActiveAt = serverTimestamp();
      visitorPatch.totalActiveSeconds = increment(delta);
      sessionPatch.lastActiveAt = serverTimestamp();
      sessionPatch.activeSeconds = increment(delta);
      sessionPatch.lastClientFlushId = flushId;
    }
    const batch = writeBatch(wajdSavedDb);
    batch.set(visitorRef, visitorPatch, { merge:true });
    batch.set(sessionRef, sessionPatch, { merge:true });
    await batch.commit();
    if (flushId) {
      wajdAudiencePendingRemove(tracker.user.uid,flushId);
      if (tracker.pendingFlushId === flushId) tracker.pendingFlushId = '';
      tracker.lastStoredFlushId = flushId;
    }
    tracker.lastFlushAt = Date.now();
    tracker.nextFlushAt = tracker.lastFlushAt + WAJD_AUDIENCE_FLUSH_INTERVAL;
    if (tracker.dirtyRevision === revision) tracker.flushedRevision = revision;
  })();
  try { await tracker.flushPromise; }
  catch (error) {
    tracker.pendingActiveSeconds += delta;
    if (wajdAnalyticsHandleError(error)) {
      // Keep measuring locally while quota is unavailable. Stopping the tracker
      // here created invisible readers in v116 even after likes started working.
      tracker.nextFlushAt = Date.now() + WAJD_ANALYTICS_BACKOFF;
    }
    throw error;
  }
  finally {
    tracker.flushing = false;
    tracker.flushPromise = null;
    if (tracker.pendingActiveSeconds >= 1) wajdAudiencePersistPending(tracker);
    const again = tracker.flushAgain || tracker.pendingActiveSeconds >= 300;
    tracker.flushAgain = false;
    if (again && !tracker.stopped) window.setTimeout(() => wajdAudienceFlush(false).catch(error => console.warn('Wajd audience flush:', error)), 0);
  }
}

async function wajdAudienceRestartSession(tracker) {
  if (!tracker || tracker.stopped || tracker.restartPromise) return tracker && tracker.restartPromise;
  tracker.restartPromise = (async () => {
    await wajdAudienceFlush(true);
    if (tracker.stopped) return;
    wajdJourneyEnd(tracker, 'session');
    const now = Date.now();
    tracker.session = { key:WAJD_AUDIENCE_SESSION_PREFIX + tracker.user.uid, id:wajdAudienceRandomId(), startedAt:now, lastActivityAt:now, isNew:true };
    tracker.sessionRef = doc(wajdSavedDb, 'audienceVisitors', tracker.user.uid, 'audienceSessions', tracker.session.id);
    const metadata = wajdAudienceMetadata();
    metadata.completedArticles = Math.max(tracker.completedArticles, metadata.completedArticles);
    const batch = writeBatch(wajdSavedDb);
    batch.set(tracker.visitorRef, {
      readerType:tracker.readerType,
      lastSeenAt:serverTimestamp(),
      lastActiveAt:serverTimestamp(),
      sessionCount:increment(1),
      pageViewCount:increment(1),
      completedArticles:metadata.completedArticles,
      lastSessionId:tracker.session.id,
      lastPageTitle:metadata.pageTitle,
      lastPageUrl:metadata.pageUrl,
      lastPageType:metadata.pageType,
      lastReferrer:metadata.referrer,
      deviceClass:metadata.deviceClass,
      browserFamily:metadata.browserFamily,
      osFamily:metadata.osFamily,
      locale:metadata.locale,
      timeZone:metadata.timeZone,
      viewportClass:metadata.viewportClass,
      lastCampaignSource:metadata.campaignSource,
      lastCampaignMedium:metadata.campaignMedium,
      lastCampaignName:metadata.campaignName,
      lastProgress:metadata.lastProgress,
      lastCompleted:metadata.lastCompleted
    }, { merge:true });
    batch.set(tracker.sessionRef, wajdAudienceSessionCreateData(tracker, metadata));
    await batch.commit();
    tracker.lastTickAt = now;
    tracker.lastFlushAt = now;
    tracker.nextFlushAt = now + WAJD_AUDIENCE_INITIAL_FLUSH_DELAY;
    tracker.pendingFlushId = '';
    tracker.lastStoredFlushId = '';
    tracker.dirtyRevision++;
    tracker.flushedRevision = tracker.dirtyRevision;
    wajdAudiencePersistSession(tracker, true);
    tracker.journeySource = wajdJourneySource();
    tracker.journeyReturning = true;
    wajdJourneyBegin(tracker);
  })();
  try { await tracker.restartPromise; }
  finally { tracker.restartPromise = null; }
}

function wajdAudienceMarkActivity() {
  const tracker = wajdAudienceTracker;
  if (!tracker || tracker.stopped) return;
  const now = Date.now();
  const idleFor = now - tracker.lastInteractionAt;
  wajdJourneySample(tracker);
  tracker.lastInteractionAt = now;
  tracker.session.lastActivityAt = now;
  tracker.dirtyRevision++;
  wajdAudienceClaimActiveTab(tracker);
  wajdAudiencePersistSession(tracker, false);
  if (idleFor >= WAJD_AUDIENCE_SESSION_TIMEOUT) wajdAudienceRestartSession(tracker).catch(error => console.warn('Wajd audience new session:', error));
}

function wajdAudienceApplyReaderData(event) {
  const tracker = wajdAudienceTracker;
  const data = event && event.detail;
  if (!tracker || tracker.stopped || !data || data.uid !== tracker.user.uid) return;
  const history = Array.isArray(data.history) ? data.history : [];
  const current = wajdCurrentPostId ? history.find(item => String(item.id) === String(wajdCurrentPostId)) : null;
  const local = wajdLocalCompletedRead(tracker.user.uid);
  const completedArticles = Math.max(history.filter(item => item.details && item.details.completed === true).length, local.length);
  const lastCompleted = Boolean(current && current.details && current.details.completed === true) || Boolean(wajdCurrentPostId && local.includes(String(wajdCurrentPostId)));
  const lastProgress = current && current.details ? Math.max(0, Math.min(1, Number(current.details.progress) || 0)) : tracker.lastProgress;
  const changed = completedArticles !== tracker.completedArticles || lastCompleted !== tracker.lastCompleted || Math.abs(lastProgress - tracker.lastProgress) >= .01;
  tracker.completedArticles = completedArticles;
  tracker.lastCompleted = lastCompleted;
  tracker.lastProgress = lastProgress;
  if (changed) {
    tracker.dirtyRevision++;
    if (lastCompleted) wajdAudienceFlush(false).catch(error => console.warn('Wajd audience completion:', error));
  }
}

function wajdAudienceTick() {
  const tracker = wajdAudienceTracker;
  if (!tracker || tracker.stopped || tracker.restartPromise) return;
  const now = Date.now();
  const elapsed = Math.min(10, Math.max(0, Math.round((now - tracker.lastTickAt) / 1000)));
  tracker.lastTickAt = now;
  const active = document.visibilityState !== 'hidden' && now - tracker.lastInteractionAt <= wajdAudienceIdleLimit() && wajdAudienceOwnsActiveTab(tracker);
  wajdJourneySample(tracker, active);
  const visit = tracker.journey;
  if (visit && (!visit.created || visit.sentRevision !== visit.revision) && now - visit.lastFlushAt >= WAJD_JOURNEY_SAVE_INTERVAL) wajdJourneyQueue(visit);
  if (active && elapsed > 0) {
    tracker.pendingActiveSeconds += elapsed;
    tracker.session.lastActivityAt = now;
    tracker.dirtyRevision++;
    wajdAudiencePersistSession(tracker, false);
    wajdAudiencePersistPending(tracker);
  }
  const progress = wajdAudienceProgress();
  if (progress > tracker.lastProgress + .02) { tracker.lastProgress = progress; tracker.dirtyRevision++; }
  if (now >= tracker.nextFlushAt) wajdAudienceFlush(false).catch(error => console.warn('Wajd audience heartbeat:', error));
}

function wajdAudienceBindLifecycle() {
  if (wajdAudienceLifecycleBound) return;
  wajdAudienceLifecycleBound = true;
  ['pointerdown','keydown','touchstart','scroll'].forEach(type => window.addEventListener(type, wajdAudienceMarkActivity, { passive:true }));
  // v119: moving the mouse over the text is reading activity too (throttled).
  let lastMouseActivity = 0;
  window.addEventListener('mousemove', () => {
    const now = Date.now();
    if (now - lastMouseActivity < 5000) return;
    lastMouseActivity = now;
    wajdAudienceMarkActivity();
  }, { passive:true });
  window.addEventListener('focus', wajdAudienceMarkActivity);
  window.addEventListener('wajd-reader-data-updated', wajdAudienceApplyReaderData);
  document.addEventListener('visibilitychange', () => {
    const tracker = wajdAudienceTracker;
    if (!tracker || tracker.stopped) return;
    if (document.visibilityState === 'hidden') {
      wajdAudiencePersistPending(tracker);
      wajdAudiencePersistSession(tracker, true);
      // v119: on phones, switching apps or closing the tab often never fires
      // pagehide, so this is the last reliable moment to save the session.
      if (wajdAnalyticsCanWrite()) wajdAudienceFlush(true).catch(() => {});
    } else wajdAudienceMarkActivity();
  });
  window.addEventListener('pagehide', () => {
    const tracker = wajdAudienceTracker;
    if (!tracker || tracker.stopped) return;
    wajdAudiencePersistPending(tracker);
    wajdAudiencePersistSession(tracker, true);
    if (wajdAnalyticsCanWrite()) wajdAudienceFlush(true).catch(() => {});
  });
}

function wajdAudienceScheduleRetry(user, error) {
  if (!user || wajdIsAdmin(user) || wajdAudienceRetryTimer || wajdAccountTransitionActive) return;
  const code = String(error && (error.code || error.message) || '');
  const quota = wajdIsQuotaError(error);
  // Auth/rules/schema errors need a deployment or identity fix, not a retry
  // loop. Google stale tokens already receive one forced refresh in start().
  if (/invalid-argument|failed-precondition|permission-denied|unauthenticated/i.test(code)) return;
  const delays = [3000, 10000, 30000, 60000];
  const delay = quota ? WAJD_ANALYTICS_BACKOFF : delays[Math.min(wajdAudienceRetryAttempt, delays.length - 1)];
  wajdAudienceRetryAttempt = Math.min(wajdAudienceRetryAttempt + 1, 10);
  wajdAudienceRetryTimer = window.setTimeout(() => {
    wajdAudienceRetryTimer = 0;
    const live = wajdSavedAuth && wajdSavedAuth.currentUser;
    if (!live || live.uid !== user.uid || wajdAccountTransitionActive) return;
    wajdAudienceStart(live, { force:true, reason:'retry' }).catch(retryError => {
      console.warn('Wajd audience retry:', retryError && retryError.code || 'network');
    });
  }, delay);
}

async function wajdAudienceStart(user, options) {
  options = options || {};
  if (!user) return false;
  if (wajdIsAdmin(user)) { wajdEarlyWriteQueue([]); return false; }
  const liveUser = wajdSavedAuth && wajdSavedAuth.currentUser ? wajdSavedAuth.currentUser : user;
  if (!liveUser || liveUser.uid !== user.uid) return false;
  user = liveUser;
  if (wajdAudienceTracker && !wajdAudienceTracker.stopped && wajdAudienceTracker.user.uid === user.uid) return true;
  if (wajdAudienceStartPromise) return wajdAudienceStartPromise;

  // v117 deliberately does NOT let a previous quota pause suppress creation of
  // a fresh visitor/session record. One essential attempt is made per visit;
  // the backoff still protects recovery/heartbeat traffic afterwards.
  wajdAudienceStartPromise = (async () => {
    const session = wajdAudienceReadSession(user.uid);
    const tracker = {
      user,
      readerType:wajdAudienceReaderType(user),
      session,
      visitorRef:doc(wajdSavedDb, 'audienceVisitors', user.uid),
      sessionRef:doc(wajdSavedDb, 'audienceVisitors', user.uid, 'audienceSessions', session.id),
      leaderKey:WAJD_AUDIENCE_ACTIVE_TAB_PREFIX + user.uid,
      tabId:wajdAudienceTabId(),
      lastInteractionAt:Date.now(),
      lastTickAt:Date.now(),
      lastFlushAt:Date.now(),
      nextFlushAt:Date.now() + WAJD_AUDIENCE_INITIAL_FLUSH_DELAY,
      lastSessionPersistAt:0,
      pendingActiveSeconds:0,
      pendingFlushId:'',
      lastStoredFlushId:'',
      completedArticles:0,
      lastProgress:0,
      lastCompleted:false,
      dirtyRevision:0,
      flushedRevision:0,
      flushing:false,
      flushAgain:false,
      flushPromise:null,
      restartPromise:null,
      stopped:false,
      earlyEntryUsed:false,
      interval:0
    };
    wajdAudienceTracker = tracker;
    try {
      try {
        await wajdAudienceInitializeRecords(tracker);
      } catch (firstError) {
        const authError = !user.isAnonymous && /permission-denied|unauthenticated/i.test(String(firstError && (firstError.code || firstError.message) || ''));
        if (!authError) throw firstError;
        await user.getIdToken(true);
        const retryUser = wajdSavedAuth && wajdSavedAuth.currentUser;
        if (!retryUser || retryUser.uid !== user.uid) throw firstError;
        tracker.user = retryUser;
        await wajdAudienceInitializeRecords(tracker);
      }
      wajdAnalyticsClearPause();
      wajdAudienceRetryAttempt = 0;
      if (wajdAudienceRetryTimer) { window.clearTimeout(wajdAudienceRetryTimer); wajdAudienceRetryTimer = 0; }
      const pendingRecovery = wajdAudienceLoadPending(tracker);
      if (wajdAnalyticsCanWrite()) wajdAudienceRecoverPending(tracker,pendingRecovery).catch(error => console.warn('Wajd audience recovery:', error));
      wajdAudienceClaimActiveTab(tracker);
      tracker.interval = window.setInterval(wajdAudienceTick, WAJD_AUDIENCE_TICK_INTERVAL);
      wajdAudienceBindLifecycle();
      wajdJourneyBegin(tracker);
      if (wajdAnalyticsCanWrite()) wajdRecoverEarlyEntries(tracker).catch(error => console.warn('Wajd early entries:', error));
      if (wajdAnalyticsCanWrite()) wajdJourneyRecoverUnsent(tracker).catch(error => console.warn('Wajd journey unsent:', error));
      wajdJourneyBindLifecycle();
      return true;
    } catch (error) {
      wajdAnalyticsHandleError(error);
      tracker.stopped = true;
      if (tracker.interval) window.clearInterval(tracker.interval);
      if (wajdAudienceTracker === tracker) wajdAudienceTracker = null;
      wajdAudienceScheduleRetry(user, error);
      throw error;
    }
  })();
  try { return await wajdAudienceStartPromise; }
  finally { wajdAudienceStartPromise = null; }
}

window.wajdEnsureAudienceTracking = function(user, options) {
  const target = user || (wajdSavedAuth && wajdSavedAuth.currentUser) || wajdSavedUser;
  return wajdAudienceStart(target, options || {});
};

window.wajdStopAudienceTracking = function() {
  if (wajdAudienceRetryTimer) { window.clearTimeout(wajdAudienceRetryTimer); wajdAudienceRetryTimer = 0; }
  const tracker = wajdAudienceTracker;
  if (!tracker) return Promise.resolve();
  wajdAudiencePersistPending(tracker);
  wajdAudiencePersistSession(tracker, true);
  tracker.stopped = true;
  if (tracker.interval) window.clearInterval(tracker.interval);
  return Promise.resolve();
};

/* WAJD v100 JOURNEY TRACKER: independent, append-only visits; never rewrites legacy analytics. */
const WAJD_JOURNEY_COLLECTION = 'audienceJourneyVisits';
let wajdJourneyLifecycleBound = false;

async function wajdRecoverEarlyEntries(tracker) {
  const rows = wajdEarlyReadQueue().filter(row => !wajdCurrentEarlyEntry || row.entryKey !== wajdCurrentEarlyEntry.entryKey);
  if (!tracker || tracker.stopped || wajdIsAdmin(tracker.user)) {
    rows.forEach(row => wajdEarlyAcknowledge(row.entryKey));
    return;
  }
  for (const row of rows.slice(0, 2)) {
    try {
      const ref = doc(wajdSavedDb,WAJD_JOURNEY_COLLECTION,tracker.user.uid + '_' + row.entryKey);
      if ((await getDoc(ref)).exists()) { wajdEarlyAcknowledge(row.entryKey); continue; }
      await setDoc(ref, {
        schemaVersion:106, userId:tracker.user.uid, visitKey:row.entryKey, sessionId:row.entryKey, tabId:row.tabId,
        previousVisitId:'', earlyEntryKey:row.entryKey, recovered:true,
        startedAt:new Date(Number(row.startedAt)||Date.now()), updatedAt:serverTimestamp(), readerType:tracker.readerType,
        returning:Boolean(tracker.journeyReturning), source:row.source, deviceClass:row.deviceClass,
        browserFamily:row.browserFamily || 'other', osFamily:row.osFamily || 'other', locale:row.locale || '', timeZone:row.timeZone || '', viewportClass:row.viewportClass || 'medium',
        campaignSource:row.campaignSource || '', campaignMedium:row.campaignMedium || '', campaignName:row.campaignName || '',
        pageUrl:row.pageUrl, pageTitle:row.pageTitle, pageType:row.pageType, articleId:row.articleId || '', category:row.category || '', pathId:row.pathId || '',
        activeSeconds:0, readingSeconds:0, maxProgress:0, reachedEnd:false, completed:false, saved:false, liked:false, commented:false, endReason:'recovered'
      });
      wajdEarlyAcknowledge(row.entryKey);
    } catch (error) {
      wajdAnalyticsHandleError(error);
      console.warn('Wajd early entry recovery:', error && error.code || 'network');
      if (!wajdAnalyticsCanWrite()) break;
    }
  }
}

function wajdJourneySource() {
  try {
    const current = new URL(window.location.href);
    const declared = String(current.searchParams.get('utm_source') || '').toLowerCase();
    if (['telegram','t.me'].includes(declared)) return 'telegram';
    if (['facebook','instagram','fb','ig'].includes(declared)) return 'facebook';
    if (declared === 'google') return 'google';
    if (!document.referrer) return 'direct';
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host === current.hostname.toLowerCase() || /^(www\.)?wajd\.blog$/.test(host)) return 'internal';
    if (host === 't.me' || /(^|\.)telegram\.(org|me)$/.test(host)) return 'telegram';
    if (/(^|\.)google\.(com|com\.eg|co\.uk|com\.sa)$/.test(host)) return 'google';
    if (/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(host)) return 'facebook';
    return 'other';
  } catch (error) { return 'other'; }
}

function wajdJourneyPage() {
  const url = new URL(window.location.href);
  // No search text, tracking identifiers, fragments, full referrer, name, email or IP.
  const pathId = String(url.searchParams.get('wajdPath') || url.searchParams.get('reading-path') || '').slice(0,120);
  const clean = new URL(url.pathname, url.origin);
  if (url.searchParams.has('reading-path')) clean.searchParams.set('reading-path', pathId);
  let pageType = wajdAudiencePageType();
  if (pageType === 'article' && document.querySelector('article.wajd-qa-article')) pageType = 'answer';
  const labels = document.querySelectorAll ? Array.from(document.querySelectorAll('.wajd-post-label[data-wajd-label]')).map(node => node.getAttribute('data-wajd-label') || '') : [];
  const isArticle = pageType === 'article' || pageType === 'answer';
  return {
    pageUrl:clean.href.slice(0,1500), pageTitle:pageType === 'category' ? 'قسم أو نتائج بحث في وَجْد' : wajdAudiencePageTitle(),
    pageType, articleId:isArticle ? String(wajdCurrentPostId || '').slice(0,100) : '',
    category:isArticle ? String(labels[0] || (pageType === 'answer' ? 'إجابات تللينوم' : 'غير مصنف')).slice(0,100) : '', pathId
  };
}

function wajdJourneyArticleVisible() {
  if (document.body.classList.contains('wajd-modal-open')) return false;
  const focused = document.activeElement;
  if (focused && focused.matches && focused.matches('input,textarea,[contenteditable="true"]')) return false;
  const body = document.querySelector('.post-body,.amp-contnt');
  if (!body) return false;
  const rect = body.getBoundingClientRect();
  return rect.bottom > 100 && rect.top < window.innerHeight - 60;
}

function wajdJourneyDepth() {
  // v119: no document.hasFocus() check. A visible page that is not focused
  // (side-by-side windows, in-app browsers) was measured as zero depth.
  if (document.visibilityState === 'hidden' || document.body.classList.contains('wajd-modal-open')) return 0;
  const body = document.querySelector('.post-body,.amp-contnt');
  if (!body) return 0;
  const rect = body.getBoundingClientRect();
  const height = rect.height || body.offsetHeight;
  if (!(height > 0) || rect.top >= window.innerHeight) return 0;
  // This is visible depth in THIS visit, not the reader's restored history value.
  if (rect.bottom <= window.innerHeight + 1) {
    // Only a collapsed image still on screen or below can make the end look reached
    // too early. Hidden images (offsetParent null) and images the reader already
    // scrolled past (e.g. a lead image that failed to load) must not block the end.
    const unresolved = body.querySelectorAll && Array.from(body.querySelectorAll('img')).some(img => {
      if (img.complete || img.offsetParent === null) return false;
      const box = img.getBoundingClientRect();
      return box.height < 2 && box.bottom >= 0;
    });
    return unresolved ? .999 : 1;
  }
  return Math.max(0, Math.min(.999, Math.round((window.innerHeight - rect.top) / height * 1000) / 1000));
}

function wajdJourneyMilestone(progress) {
  return progress >= 1 ? 4 : progress >= .75 ? 3 : progress >= .5 ? 2 : progress >= .25 ? 1 : 0;
}

// Minimum seconds with the text on screen before reaching the end counts as
// "completed": about a third of the estimated reading time, 15s to 2 min.
function wajdJourneyCompletionSeconds() {
  if (wajdJourneyCompletionSeconds.value !== undefined) return wajdJourneyCompletionSeconds.value;
  const body = document.querySelector('.post-body,.amp-contnt');
  const text = body ? String(body.innerText || body.textContent || '').trim() : '';
  const words = text ? text.split(/\s+/).length : 0;
  wajdJourneyCompletionSeconds.value = Math.max(15, Math.min(120, Math.round(words / 200 * 60 * .33)));
  return wajdJourneyCompletionSeconds.value;
}

function wajdJourneyBegin(tracker) {
  if (!tracker || tracker.stopped || wajdIsAdmin(tracker.user)) return;
  try {
    const page = wajdJourneyPage(), early = tracker.earlyEntryUsed ? null : wajdCurrentEarlyEntry, visitKey = early && early.entryKey || wajdAudienceRandomId();
    tracker.earlyEntryUsed = true;
    const id = tracker.user.uid + '_' + visitKey;
    const pointerKey = 'wajd-journey-previous-v100:' + tracker.user.uid;
    try {
      const sourceKey='wajd-journey-source-v100:'+tracker.user.uid;
      const cached=JSON.parse(localStorage.getItem(sourceKey)||'null');
      if(cached&&cached.sessionId===tracker.session.id&&['direct','internal','google','telegram','facebook','other'].includes(cached.source))tracker.journeySource=cached.source;
      else localStorage.setItem(sourceKey,JSON.stringify({sessionId:tracker.session.id,source:tracker.journeySource||wajdJourneySource()}));
    } catch (error) {}
    let previousVisitId = '';
    try {
      const previous = JSON.parse(sessionStorage.getItem(pointerKey) || 'null');
      if (previous && previous.sessionId === tracker.session.id && typeof previous.id === 'string') previousVisitId = previous.id.slice(0,220);
      sessionStorage.setItem(pointerKey, JSON.stringify({ id, sessionId:tracker.session.id }));
    } catch (error) {}
    const now = Date.now(), metadata = wajdAudienceMetadata();
    tracker.journey = {
      id, ref:doc(wajdSavedDb, WAJD_JOURNEY_COLLECTION, id), tracker,
      base:{ schemaVersion:106, userId:tracker.user.uid, visitKey, sessionId:tracker.session.id, tabId:tracker.tabId,
        previousVisitId, earlyEntryKey:early && early.entryKey || '', recovered:false,
        startedAt:new Date(early && Number(early.startedAt) || now), readerType:tracker.readerType, returning:Boolean(tracker.journeyReturning),
        source:tracker.journeySource || wajdJourneySource(), deviceClass:metadata.deviceClass,
        browserFamily:metadata.browserFamily, osFamily:metadata.osFamily, locale:metadata.locale, timeZone:metadata.timeZone, viewportClass:metadata.viewportClass,
        campaignSource:metadata.campaignSource, campaignMedium:metadata.campaignMedium, campaignName:metadata.campaignName, ...page },
      active:0, reading:0, maxProgress:0, completed:false, saved:false, liked:false, commented:false, endReason:'',
      lastSampleAt:now, lastFlushAt:now, revision:0, sentRevision:0, savedActive:0, savedReading:0,
      created:false, disabled:false, promise:null, again:false
    };
    // Firestore rules intentionally require a pristine zero-state create.
    // v116 sampled scroll depth before the first write, so an article already
    // visible in the viewport could make the very first journey create fail.
    // Create the base visit first, then sample and queue an immediate update.
    wajdJourneyQueue(tracker.journey);
    wajdJourneySample(tracker);
    if (tracker.journey.revision > 0) tracker.journey.again = true;
  } catch (error) { console.warn('Wajd journey initialization unavailable'); }
}

function wajdJourneySample(tracker, activeOverride) {
  const visit = tracker && tracker.journey;
  if (!visit || visit.disabled || visit.endReason || tracker.stopped) return;
  try {
  const now = Date.now(), previous = visit.lastSampleAt;
  visit.lastSampleAt = now;
  const visible = document.visibilityState !== 'hidden';
  const active = activeOverride === undefined ? visible && wajdAudienceOwnsActiveTab(tracker) : activeOverride;
  const seconds = active && visible ? Math.max(0, Math.min(10, (Math.min(now, tracker.lastInteractionAt + wajdAudienceIdleLimit()) - previous) / 1000)) : 0;
  const isArticle = visit.base.pageType === 'article' || visit.base.pageType === 'answer';
  if (seconds > 0) {
    visit.active = Math.min(86400, visit.active + seconds);
    if (isArticle && wajdJourneyArticleVisible()) visit.reading = Math.min(visit.active, visit.reading + seconds);
    visit.revision++;
  }
  let saveNow = false;
  if (isArticle && visible) {
    const depth = wajdJourneyDepth();
    if (depth > visit.maxProgress) {
      // v119: save right away when the reader passes 25/50/75/100%.
      if (wajdJourneyMilestone(depth) > wajdJourneyMilestone(visit.maxProgress)) saveNow = true;
      visit.maxProgress = depth; visit.revision++;
    }
  }
  // v119: any reader (signed in or not) who reaches the end and spent a
  // reasonable time with the text on screen has completed the article.
  if (isArticle && !visit.completed && visit.maxProgress === 1 && visit.reading >= wajdJourneyCompletionSeconds()) {
    visit.completed = true; visit.revision++; saveNow = true;
    wajdLocalCompletedAdd(tracker.user.uid, visit.base.articleId);
    // v119: reading paths track completion by article link, for every reader.
    try {
      const pathKey = WAJD_COMPLETED_URLS_PREFIX + tracker.user.uid;
      const urls = JSON.parse(localStorage.getItem(pathKey) || '[]');
      const here = decodeURIComponent(new URL(visit.base.pageUrl).pathname).replace(/\/$/, '');
      if (Array.isArray(urls) && !urls.includes(here)) { urls.push(here); localStorage.setItem(pathKey, JSON.stringify(urls.slice(-500))); }
      window.dispatchEvent(new CustomEvent('wajd-article-completed', { detail:{ articleId:visit.base.articleId, path:here } }));
    } catch (error) {}
    tracker.completedArticles = Math.max(tracker.completedArticles, wajdLocalCompletedRead(tracker.user.uid).length);
    tracker.lastCompleted = true; tracker.dirtyRevision++;
    window.setTimeout(() => wajdAudienceFlush(false).catch(error => console.warn('Wajd audience completion:', error)), 0);
  }
  if (saveNow) window.setTimeout(() => wajdJourneyQueue(visit), 0);
  } catch (error) {
    visit.disabled = true;
    console.warn('Wajd journey measurement unavailable');
  }
}

function wajdJourneyQueue(visit) {
  if (!visit || visit.disabled || visit.tracker.stopped) return Promise.resolve();
  return wajdJourneyFlush(visit).catch(error => {
    visit.lastFlushAt = Date.now();
    const code = String(error && error.code || '');
    if (/permission-denied|invalid-argument|unauthenticated/.test(code) || wajdAnalyticsHandleError(error)) visit.disabled = true;
    // A journey failure must not stop old audience, reading-history, likes or saves.
    console.warn('Wajd journey save unavailable:', code || 'network');
  });
}

async function wajdJourneyFlush(visit) {
  if (!visit || visit.disabled) return;
  if (visit.promise) { visit.again = true; return visit.promise; }
  visit.promise = (async () => {
    if (!visit.created) {
      // v119: the rules only accept a pristine zero-state create. If the first
      // attempt failed and is retried after time passed, write zeros anyway and
      // send the measured values in the follow-up update.
      const batch = writeBatch(wajdSavedDb);
      batch.set(visit.ref, { ...visit.base, updatedAt:serverTimestamp(), activeSeconds:0, readingSeconds:0,
        maxProgress:0, reachedEnd:false, completed:false,
        saved:false, liked:false, commented:false, endReason:'' }, { merge:true });
      await batch.commit();
      visit.created = true;
      visit.savedActive = 0;
      visit.savedReading = 0;
      visit.sentRevision = 0;
      visit.lastFlushAt = Date.now();
      if (visit.revision > 0) visit.again = true;
      wajdEarlyAcknowledge(visit.base.earlyEntryKey);
      return;
    }
    if (visit.sentRevision === visit.revision) return;
    const revision = visit.revision;
    const activeSeconds = Math.min(Math.floor(visit.active), visit.savedActive + 300);
    const readingSeconds = Math.min(Math.floor(visit.reading), visit.savedReading + 300, activeSeconds);
    const batch = writeBatch(wajdSavedDb);
    batch.set(visit.ref, { updatedAt:serverTimestamp(), activeSeconds, readingSeconds, maxProgress:visit.maxProgress,
      reachedEnd:visit.maxProgress === 1, completed:visit.completed, saved:visit.saved, liked:visit.liked,
      commented:visit.commented, endReason:visit.endReason }, { merge:true });
    await batch.commit();
    visit.savedActive = activeSeconds; visit.savedReading = readingSeconds;
    visit.lastFlushAt = Date.now();
    if (activeSeconds >= Math.floor(visit.active) && readingSeconds >= Math.floor(visit.reading)) visit.sentRevision = revision;
    else visit.again = true;
    if (visit.sentRevision === visit.revision) wajdJourneyClearUnsent(visit);
  })();
  try { await visit.promise; }
  finally {
    visit.promise = null;
    const again = visit.again; visit.again = false;
    if (again && !visit.disabled && !visit.tracker.stopped && visit.sentRevision !== visit.revision) window.setTimeout(() => wajdJourneyQueue(visit), 0);
  }
}

function wajdJourneyEnd(tracker, reason) {
  const visit = tracker && tracker.journey;
  if (!visit || visit.endReason) return;
  wajdJourneySample(tracker);
  visit.endReason = reason; visit.revision++;
  wajdJourneyStashUnsent(visit);
  wajdJourneyQueue(visit);
}

/* v119: a Firestore write started while the page is closing usually never
   arrives. Keep the latest numbers locally (synchronous, so it survives) and
   send them from the reader's next page view. */

function wajdJourneyUnsentRead(uid) {
  try {
    const rows = JSON.parse(localStorage.getItem(WAJD_JOURNEY_UNSENT_PREFIX + uid) || '[]');
    return Array.isArray(rows) ? rows.filter(row => row && typeof row.id === 'string' && Date.now() - Number(row.at) < 7 * 86400000).slice(-6) : [];
  } catch (error) { return []; }
}

function wajdJourneyUnsentWrite(uid, rows) {
  try {
    if (rows.length) localStorage.setItem(WAJD_JOURNEY_UNSENT_PREFIX + uid, JSON.stringify(rows.slice(-6)));
    else localStorage.removeItem(WAJD_JOURNEY_UNSENT_PREFIX + uid);
  } catch (error) {}
}

function wajdJourneyStashUnsent(visit) {
  if (!visit || visit.disabled || !visit.created || visit.sentRevision === visit.revision) return;
  const uid = visit.base.userId;
  const rows = wajdJourneyUnsentRead(uid).filter(row => row.id !== visit.id);
  rows.push({ id:visit.id, at:Date.now(), active:Math.floor(visit.active), reading:Math.floor(visit.reading), maxProgress:visit.maxProgress,
    completed:visit.completed, saved:visit.saved, liked:visit.liked, commented:visit.commented, endReason:visit.endReason || '' });
  wajdJourneyUnsentWrite(uid, rows);
}

function wajdJourneyClearUnsent(visit) {
  const uid = visit.base.userId;
  const rows = wajdJourneyUnsentRead(uid);
  if (rows.some(row => row.id === visit.id)) wajdJourneyUnsentWrite(uid, rows.filter(row => row.id !== visit.id));
}

async function wajdJourneyRecoverUnsent(tracker) {
  const uid = tracker.user.uid, current = tracker.journey && tracker.journey.id;
  const rows = wajdJourneyUnsentRead(uid).filter(row => row.id !== current);
  for (const row of rows.slice(0, 3)) {
    try {
      const ref = doc(wajdSavedDb, WAJD_JOURNEY_COLLECTION, row.id);
      const snapshot = await getDoc(ref);
      const stored = snapshot.exists() ? snapshot.data() : null;
      if (stored && stored.userId === uid && stored.recovered !== true) {
        const activeSeconds = Math.max(stored.activeSeconds, Math.min(row.active, stored.activeSeconds + 300));
        const readingSeconds = Math.min(activeSeconds, Math.max(stored.readingSeconds, Math.min(row.reading, stored.readingSeconds + 300)));
        const maxProgress = Math.max(Number(stored.maxProgress) || 0, Math.min(1, Number(row.maxProgress) || 0));
        await setDoc(ref, { updatedAt:serverTimestamp(), activeSeconds, readingSeconds, maxProgress, reachedEnd:maxProgress === 1,
          completed:stored.completed || row.completed === true, saved:stored.saved || row.saved === true,
          liked:stored.liked || row.liked === true, commented:stored.commented || row.commented === true,
          // Only close the visit if it was really closed; a merely hidden tab may still be open.
          endReason:stored.endReason || (['pagehide','session','identity'].includes(row.endReason) ? row.endReason : '') }, { merge:true });
      }
      wajdJourneyUnsentWrite(uid, wajdJourneyUnsentRead(uid).filter(item => item.id !== row.id));
    } catch (error) {
      wajdAnalyticsHandleError(error);
      const code = String(error && error.code || '');
      // Rules refused it (e.g. data too old to reconcile): drop it, don't retry forever.
      if (/permission-denied|invalid-argument/.test(code)) wajdJourneyUnsentWrite(uid, wajdJourneyUnsentRead(uid).filter(item => item.id !== row.id));
      console.warn('Wajd journey unsent recovery:', code || 'network');
      if (!wajdAnalyticsCanWrite()) break;
    }
  }
}

window.wajdJourneyRecordAction = function(action, articleId) {
  try {
  if (!['completed','saved','liked','commented'].includes(action)) return;
  const tracker = wajdAudienceTracker, visit = tracker && tracker.journey;
  if (!visit || tracker.stopped || visit.disabled || visit.endReason || String(articleId || '') !== visit.base.articleId) return;
  if (!['article','answer'].includes(visit.base.pageType) || visit[action]) return;
  wajdJourneySample(tracker); visit[action] = true; visit.revision++;
  } catch (error) { console.warn('Wajd journey action unavailable'); }
};

// v117: a successful explicit reader write is strong evidence that Firestore is
// reachable now. Use it to repair a missing audience session in the background,
// but never make the like/save/comment itself depend on analytics.
window.wajdAudienceRecordExplicitAction = function(action, articleId, explicitUser) {
  if (!['completed','saved','liked','commented'].includes(action)) return Promise.resolve(false);
  const live = (wajdSavedAuth && wajdSavedAuth.currentUser) || explicitUser || wajdSavedUser;
  if (!live || wajdIsAdmin(live)) return Promise.resolve(false);
  wajdAnalyticsClearPause();
  return wajdAudienceStart(live, { force:true, reason:action }).then(started => {
    if (!started) return false;
    window.wajdJourneyRecordAction(action, articleId);
    const tracker = wajdAudienceTracker, visit = tracker && tracker.journey;
    if (visit && !visit.disabled && !visit.endReason && String(articleId || '') === visit.base.articleId) {
      return wajdJourneyQueue(visit).then(() => true);
    }
    return true;
  }).catch(error => {
    console.warn('Wajd audience action evidence:', action, error && error.code || 'network');
    return false;
  });
};

function wajdJourneyBindLifecycle() {
  if (wajdJourneyLifecycleBound) return;
  wajdJourneyLifecycleBound = true;
  document.addEventListener('visibilitychange', () => {
    const tracker = wajdAudienceTracker;
    wajdJourneySample(tracker);
    // v119: save the visit when the page is hidden (app switch, tab close on
    // phones). The visit stays open, so returning keeps adding to it.
    if (document.visibilityState === 'hidden' && tracker && tracker.journey && !tracker.stopped) {
      wajdJourneyStashUnsent(tracker.journey);
      wajdJourneyQueue(tracker.journey);
    }
  });
  window.addEventListener('pagehide', () => wajdJourneyEnd(wajdAudienceTracker, 'pagehide'));
  window.addEventListener('pageshow', event => {
    const tracker = wajdAudienceTracker;
    if (event.persisted && tracker && !tracker.stopped) {
      if (Date.now() - tracker.lastInteractionAt >= WAJD_AUDIENCE_SESSION_TIMEOUT) wajdAudienceMarkActivity();
      else { wajdAudienceMarkActivity(); wajdJourneyBegin(tracker); }
    }
  });
}
/* END WAJD v100 JOURNEY TRACKER */

async function wajdHistoryTouch(userId, postId) {
  const activeUser = wajdSavedAuth && wajdSavedAuth.currentUser;
  if (!activeUser || !wajdAccountIsGoogle(activeUser) || activeUser.uid !== userId) return false;
  const historyRef = doc(wajdSavedDb, 'users', userId, 'history', postId);
  const touch = () => runTransaction(wajdSavedDb, async transaction => {
    const current = await transaction.get(historyRef);
    const readCount = current.exists() && Number.isInteger(current.data().readCount) ? current.data().readCount : (current.exists() ? 1 : 0);
    transaction.set(historyRef, { lastReadAt: serverTimestamp(), readCount: readCount + 1 }, { merge:true });
  });
  try {
    await touch();
  } catch (firstError) {
    const staleSession = /permission-denied|unauthenticated/i.test(String(firstError && (firstError.code || firstError.message) || ''));
    if (!staleSession) throw firstError;
    const currentUser = wajdSavedAuth && wajdSavedAuth.currentUser;
    if (!currentUser || currentUser.uid !== userId || !wajdAccountIsGoogle(currentUser)) return false;
    await currentUser.getIdToken(true);
    await touch();
  }
  return true;
}

/* WAJD v118: لوحة الإدارة في ملف مستقل (wajd-admin.js) لا يُنزَّل إلا للمدير.
   رابط الملف يوضع في الوسم wajd-admin-module-url داخل <head>. */
let wajdAdminModulePromise = null;

function wajdAdminModuleUrl() {
  const meta = document.querySelector('meta[name="wajd-admin-module-url"]');
  const value = String(meta && meta.getAttribute('content') || '').trim();
  return /^https:\/\/[^\s"'<>]+\.m?js(\?[^\s"'<>]*)?$/i.test(value) ? value : '';
}

function wajdAdminExposeBridge() {
  window.wajdAdminBridge = Object.freeze({
    db: () => wajdSavedDb,
    user: () => wajdSavedUser,
    number: wajdSavedArabicNumber,
    constants: Object.freeze({ WAJD_ADMIN_EMAIL, WAJD_AUDIENCE_SESSION_TIMEOUT, WAJD_JOURNEY_COLLECTION }),
    dom: Object.freeze({ wajdAdminOpen, wajdAdminOverlay, wajdAdminClose, wajdAdminRefresh, wajdAdminContent }),
    fn: Object.freeze({ wajdIsAdmin, wajdSavedShowToast, wajdSavedPostId, wajdSavedPostUrl, wajdSavedGetFeed, wajdNotificationSafeUrl, wajdAccountFallbackAvatar })
  });
}

function wajdAdminEnsureModule() {
  if (!wajdIsAdmin(wajdSavedUser)) return Promise.reject(new Error('admin-only'));
  if (wajdAdminModulePromise) return wajdAdminModulePromise;
  const url = wajdAdminModuleUrl();
  if (!url) return Promise.reject(new Error('admin-module-url-missing'));
  wajdAdminExposeBridge();
  const version = Math.floor(Date.now() / 600000);
  wajdAdminModulePromise = import(url + (url.indexOf('?') === -1 ? '?' : '&') + 'v=' + version)
    .then(module => {
      const api = module && module.default;
      if (!api || typeof api.load !== 'function') throw new Error('admin-module-invalid');
      return api;
    })
    .catch(error => { wajdAdminModulePromise = null; throw error; });
  return wajdAdminModulePromise;
}

async function wajdAdminLoad() {
  if (!wajdAdminContent || !wajdIsAdmin(wajdSavedUser)) return;
  let api;
  try {
    if (!wajdAdminModulePromise) {
      wajdAdminRefresh.disabled = true;
      wajdAdminContent.innerHTML = '<div class="wajd-admin-state">جارٍ تحميل أدوات الإدارة…</div>';
    }
    api = await wajdAdminEnsureModule();
  } catch (error) {
    console.error('Wajd admin module:', error);
    wajdAdminRefresh.disabled = false;
    const missing = error && error.message === 'admin-module-url-missing';
    wajdAdminContent.innerHTML = '<div class="wajd-admin-state">' + (missing
      ? 'لم يُضبط رابط ملف لوحة الإدارة بعد. ضع الرابط في الوسم wajd-admin-module-url في رأس القالب.'
      : 'تعذّر تحميل ملف لوحة الإدارة. تحقّق من الرابط واتصال الإنترنت، ثم اضغط «تحديث».') + '</div>';
    return;
  }
  return api.load();
}

function wajdAdminOpenModal() {
  if (!wajdAdminOverlay || !wajdIsAdmin(wajdSavedUser)) return;
  wajdAccountCloseModal();
  wajdAdminLastFocus = document.activeElement;
  wajdAdminOverlay.classList.add('is-open');
  wajdAdminOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('wajd-modal-open');
  wajdAdminClose.focus();
  wajdAdminLoad();
}

function wajdAdminCloseModal() {
  if (!wajdAdminOverlay) return;
  wajdAdminOverlay.classList.remove('is-open');
  wajdAdminOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('wajd-modal-open');
  if (wajdAdminLastFocus && wajdAdminLastFocus.focus) wajdAdminLastFocus.focus();
}


function wajdAdminBindInterface() {
  if (!wajdAdminOpen || !wajdAdminOverlay) return;
  wajdAdminOpen.addEventListener('click', wajdAdminOpenModal);
  wajdAdminClose.addEventListener('click', wajdAdminCloseModal);
  wajdAdminRefresh.addEventListener('click', wajdAdminLoad);
  wajdAdminOverlay.addEventListener('click', event => { if (event.target === wajdAdminOverlay) wajdAdminCloseModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && wajdAdminOverlay.classList.contains('is-open')) wajdAdminCloseModal(); });
}

function wajdAccountRender(user) {
  if (!wajdAccountOpen) return;
  const googleUser = wajdAccountIsGoogle(user);
  const googleProfile = googleUser ? wajdAccountGoogleProfile(user) : null;
  const displayName = googleUser ? (user.displayName || (googleProfile && googleProfile.displayName) || 'قارئ وَجْد') : 'قارئ وَجْد';
  const avatar = googleUser ? (wajdAccountTrustedPhotoURL(user) || wajdAccountFallbackAvatar(displayName)) : wajdAccountFallbackAvatar(displayName);
  const email = googleUser ? (user.email || (googleProfile && googleProfile.email) || '') : 'سجّل الدخول لحفظ رحلتك وقراءاتك';
  wajdAccountOpen.classList.toggle('is-google', googleUser);
  wajdAccountOpen.classList.remove('is-resolving', 'has-cached-identity');
  wajdAccountOpen.disabled = false;
  wajdAccountOpen.setAttribute('aria-busy', 'false');
  wajdAccountOpen.title = 'رحلتي في وَجْد';
  wajdAccountOpen.setAttribute('aria-label', googleUser ? 'رحلة ' + displayName + ' في وَجْد' : 'رحلتي في وَجْد');
  if (wajdAccountHeaderAvatar) {
    wajdAccountHeaderAvatar.src = avatar;
    wajdAccountHeaderAvatar.alt = googleUser ? 'صورة ' + displayName : '';
  }
  if (wajdAccountGuest) wajdAccountGuest.classList.add('is-hidden');
  if (wajdAccountUser) {
    wajdAccountUser.classList.add('is-visible');
    wajdAccountUser.classList.toggle('is-google',googleUser);
    wajdAccountUser.classList.toggle('is-anonymous',!googleUser);
  }
  if (wajdAccountAvatar) {
    wajdAccountAvatar.src = avatar;
    wajdAccountAvatar.alt = googleUser ? 'صورة ' + displayName : '';
  }
  if (wajdAccountName) wajdAccountName.textContent = displayName;
  if (wajdAccountEmail) wajdAccountEmail.textContent = email;
  const syncCopy=document.getElementById('wajd-account-sync-copy');
  if(syncCopy)syncCopy.textContent=googleUser?'بيانات القراءة والخصوصية متزامنة مع حسابك.':'يمكنك القراءة والإعجاب دون حساب؛ الحفظ والسجل بعد تسجيل الدخول.';
  if (wajdSavedSubtitle) wajdSavedSubtitle.textContent = googleUser ? 'تتزامن هذه القائمة مع حسابك على جميع أجهزتك' : 'تتطلب تسجيل الدخول بحساب Google';
  if (wajdHistorySubtitle) wajdHistorySubtitle.textContent = googleUser ? 'آخر المقالات التي قرأتها على جميع أجهزتك' : 'يتطلب تسجيل الدخول بحساب Google';
  if (wajdAccountLogin) wajdAccountLogin.disabled = false;
  if (wajdAccountLogout) wajdAccountLogout.disabled = false;
  if (wajdAdminOpen) wajdAdminOpen.classList.toggle('is-visible', wajdIsAdmin(user));
  if (wajdNotificationsOpen) {
    wajdNotificationsOpen.classList.toggle('is-visible', googleUser);
    if (wajdNotificationsOpen.parentElement) wajdNotificationsOpen.parentElement.classList.remove('has-cached-google');
  }
  wajdAccountCacheIdentity(user);
}

function wajdAccountHasSeenLoginInvitation() {
  try { return localStorage.getItem(WAJD_LOGIN_INVITATION_SEEN_KEY) === '1'; }
  catch (error) { return false; }
}

function wajdAccountRememberLoginInvitation() {
  try { localStorage.setItem(WAJD_LOGIN_INVITATION_SEEN_KEY, '1'); }
  catch (error) {}
}

function wajdAccountHideInvitation() {
  window.clearTimeout(wajdLoginInvitationTimer);
  if (wajdLoginInvitationScrollHandler) {
    window.removeEventListener('scroll', wajdLoginInvitationScrollHandler);
    wajdLoginInvitationScrollHandler = null;
  }
  const invitation = document.getElementById('wajd-login-invitation');
  if (!invitation) return;
  invitation.classList.remove('is-visible');
  window.setTimeout(() => invitation.remove(), 220);
}

function wajdAccountShowInvitation() {
  const currentUser = wajdSavedAuth && wajdSavedAuth.currentUser;
  if (wajdAccountHasSeenLoginInvitation() || wajdAccountIsGoogle(currentUser)) return;
  if (document.hidden || document.body.classList.contains('wajd-modal-open')) {
    wajdLoginInvitationTimer = window.setTimeout(wajdAccountShowInvitation, 3000);
    return;
  }
  // Restore the original first-visit account panel: it explains Google sync
  // and still lets the reader explicitly continue as a guest.
  wajdAccountOpenModal();
}

function wajdAccountScheduleFirstVisitInvitation(user) {
  window.clearTimeout(wajdLoginInvitationTimer);
  if (wajdLoginInvitationScrollHandler) window.removeEventListener('scroll', wajdLoginInvitationScrollHandler);
  wajdLoginInvitationScrollHandler = null;
  if (wajdAccountIsGoogle(user)) {
    wajdAccountRememberLoginInvitation();
    wajdAccountHideInvitation();
    return;
  }
  if (wajdAccountHasSeenLoginInvitation()) return;
  wajdLoginInvitationTimer = window.setTimeout(wajdAccountShowInvitation, 900);
}

function wajdAccountOpenModal() {
  if (!wajdAccountOverlay) return;
  wajdAccountHideInvitation();
  wajdAdminCloseModal();
  wajdSavedCloseModal();
  wajdHistoryCloseModal();
  wajdAccountLastFocus = document.activeElement;
  wajdAccountOverlay.classList.add('is-open');
  wajdAccountOverlay.setAttribute('aria-hidden', 'false');
  wajdAccountOpen.setAttribute('aria-expanded', 'true');
  document.body.classList.add('wajd-modal-open');
  wajdAccountClose.focus();
}

function wajdAccountCloseModal() {
  if (!wajdAccountOverlay) return;
  const wasOpen = wajdAccountOverlay.classList.contains('is-open');
  const currentUser = wajdSavedAuth && wajdSavedAuth.currentUser;
  if (wasOpen && !wajdAccountIsGoogle(currentUser)) wajdAccountRememberLoginInvitation();
  wajdAccountOverlay.classList.remove('is-open');
  wajdAccountOverlay.setAttribute('aria-hidden', 'true');
  if (wajdAccountOpen) wajdAccountOpen.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('wajd-modal-open');
  if (wajdAccountLastFocus && wajdAccountLastFocus.focus) wajdAccountLastFocus.focus();
}

async function wajdAccountStartGoogleLogin() {
  if (!wajdAccountLogin || wajdAccountLogin.disabled) return;
  wajdAccountLogin.disabled = true;
  try {
    const currentUser = wajdSavedAuth.currentUser || await window.wajdFirebaseUserPromise;
    if (wajdAccountIsGoogle(currentUser)) { wajdAccountLogin.disabled = false; return; }
    wajdAccountTransitionActive = true;
    if (window.wajdStopAudienceTracking) window.wajdStopAudienceTracking();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(wajdSavedAuth, provider);
    wajdAccountCacheIdentity(result.user);
    wajdAccountRememberLoginInvitation();
    wajdSavedShowToast('تم تسجيل الدخول. أصبحت المحفوظات وسجل القراءة متاحة.', false);
    window.setTimeout(() => window.location.reload(), 400);
  } catch (error) {
    wajdAccountTransitionActive = false;
    if (!error || (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request')) {
      console.error('Wajd Google sign-in:', error);
      wajdSavedShowToast(error && error.code === 'auth/operation-not-allowed' ? 'فعّل تسجيل Google أولًا من Firebase' : 'تعذّر تسجيل الدخول الآن، حاول مرة أخرى', true);
    }
    wajdAccountLogin.disabled = false;
  }
}

async function wajdAccountSignOut() {
  if (!wajdAccountLogout || wajdAccountLogout.disabled) return;
  wajdAccountLogout.disabled = true;
  wajdAccountTransitionActive = true;
  try {
    if (window.wajdStopAudienceTracking) window.wajdStopAudienceTracking();
    try {
      localStorage.removeItem(WAJD_ACCOUNT_IDENTITY_CACHE_KEY);
      if (wajdSavedAuth && wajdSavedAuth.currentUser) sessionStorage.removeItem(WAJD_READER_LIST_CACHE_PREFIX + wajdSavedAuth.currentUser.uid);
    } catch (cacheError) {}
    await signOut(wajdSavedAuth);
    await signInAnonymously(wajdSavedAuth);
    window.location.reload();
  } catch (error) {
    wajdAccountTransitionActive = false;
    console.error('Wajd sign out:', error);
    wajdSavedShowToast('تعذّر تسجيل الخروج الآن', true);
    wajdAccountLogout.disabled = false;
  }
}

function wajdAccountBindInterface() {
  if (!wajdAccountOpen || !wajdAccountOverlay) return;
  wajdAccountOpen.addEventListener('click', wajdAccountOpenModal);
  wajdAccountClose.addEventListener('click', wajdAccountCloseModal);
  wajdAccountOverlay.addEventListener('click', event => {
    if (event.target === wajdAccountOverlay) wajdAccountCloseModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && wajdAccountOverlay.classList.contains('is-open')) wajdAccountCloseModal();
  });
  wajdAccountLogin.addEventListener('click', wajdAccountStartGoogleLogin);
  if (wajdAccountSkipLogin) wajdAccountSkipLogin.addEventListener('click', wajdAccountCloseModal);
  wajdAccountLogout.addEventListener('click', wajdAccountSignOut);
}

function wajdBindModalFocusTrap() {
  const overlays = [wajdNotificationsOverlay, wajdAccountOverlay, wajdAdminOverlay, wajdSavedOverlay, wajdHistoryOverlay].filter(Boolean);
  const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const overlay = overlays.find(item => item.classList.contains('is-open'));
    if (!overlay) return;
    const focusable = Array.from(overlay.querySelectorAll(focusableSelector)).filter(item => item.getClientRects().length > 0);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });
}

let wajdArticleSaveBound = false;
let wajdArticleSaveRevision = 0;

async function wajdInitializeCurrentArticleSave() {
  if (!wajdCurrentPostId || !wajdArticleSaveButton || !wajdSavedDb || !wajdSavedUser) return;
  if (!wajdAccountIsGoogle(wajdSavedUser)) {
    wajdSavedRenderArticleButton(false);
    if (wajdArticleSaveLabel) wajdArticleSaveLabel.textContent = 'تسجيل الدخول للحفظ';
    wajdArticleSaveButton.disabled = false;
    wajdArticleSaveButton.setAttribute('aria-busy', 'false');
    if (!wajdArticleSaveBound) {
      wajdArticleSaveBound = true;
      wajdArticleSaveButton.addEventListener('click', () => window.wajdRequireGoogleSignIn('save', wajdCurrentPostId));
    }
    return;
  }
  const savedRef = doc(wajdSavedDb, 'users', wajdSavedUser.uid, 'saved', wajdCurrentPostId);

  // Keep the proven v102 behavior: the single-document transaction is the
  // authority, while background reconciliation must never lock the save button.
  wajdSavedRenderArticleButton(wajdSavedIds.has(wajdCurrentPostId));
  wajdArticleSaveButton.disabled = false;
  wajdArticleSaveButton.setAttribute('aria-busy', 'false');

  if (!wajdArticleSaveBound) {
    wajdArticleSaveBound = true;
    wajdArticleSaveButton.addEventListener('click', async () => {
      if (wajdArticleSaveButton.disabled) return;
      wajdArticleSaveRevision += 1;
      wajdArticleSaveButton.disabled = true;
      wajdArticleSaveButton.setAttribute('aria-busy', 'true');
      try {
        const activeUser = wajdSavedAuth && wajdSavedAuth.currentUser;
        if (!activeUser || !wajdAccountIsGoogle(activeUser) || activeUser.uid !== wajdSavedUser.uid) {
          window.location.reload();
          return;
        }
        wajdSavedUser = activeUser;
        const toggleSaved = () => runTransaction(wajdSavedDb, async transaction => {
          const currentSaved = await transaction.get(savedRef);
          if (currentSaved.exists()) {
            transaction.delete(savedRef);
            return { saved:false };
          }
          transaction.set(savedRef, { createdAt:serverTimestamp() });
          return { saved:true };
        });
        let result;
        try {
          result = await toggleSaved();
        } catch (firstError) {
          const staleRegisteredSession = /permission-denied|unauthenticated/i.test(String(firstError && (firstError.code || firstError.message) || ''));
          if (!staleRegisteredSession) throw firstError;
          await wajdSavedUser.getIdToken(true);
          result = await toggleSaved();
        }
        if (result.saved) {
          if (window.wajdAudienceRecordExplicitAction) window.wajdAudienceRecordExplicitAction('saved', wajdCurrentPostId); else if (window.wajdJourneyRecordAction) window.wajdJourneyRecordAction('saved', wajdCurrentPostId);
          wajdSavedIds.set(wajdCurrentPostId, Date.now());
          wajdSavedRenderArticleButton(true);
          wajdSavedShowToast('حُفظ المقال للقراءة لاحقًا', false);
        } else {
          wajdSavedIds.delete(wajdCurrentPostId);
          wajdSavedRenderArticleButton(false);
          wajdSavedShowToast('أُزيل المقال من محفوظاتك', true);
        }
        wajdSavedUpdateBadge();
        wajdReaderListsPersist(wajdSavedUser.uid);
      } catch (error) {
        console.error('Wajd save article:', error);
        try {
          const currentSaved = await getDoc(savedRef);
          if (currentSaved.exists()) wajdSavedIds.set(wajdCurrentPostId, Date.now());
          else wajdSavedIds.delete(wajdCurrentPostId);
          wajdSavedRenderArticleButton(currentSaved.exists());
          wajdSavedUpdateBadge();
        } catch (syncError) {}
        wajdSavedShowToast(wajdIsQuotaError(error) ? 'خدمة الحفظ متوقفة مؤقتًا بسبب امتلاء حصة قاعدة البيانات' : 'تعذّر تحديث المحفوظات الآن', true);
      } finally {
        wajdArticleSaveButton.setAttribute('aria-busy', 'false');
        wajdArticleSaveButton.disabled = false;
      }
    });
  }

  // Reconcile the single current document in the background. A slow account
  // collection or a transient server read can no longer leave the button faded.
  const revisionAtStart = wajdArticleSaveRevision;
  try {
    let currentSaved;
    try { currentSaved = await getDocFromServer(savedRef); }
    catch (serverError) { currentSaved = await getDoc(savedRef); }
    if (revisionAtStart !== wajdArticleSaveRevision) return;
    if (currentSaved.exists()) {
      const createdAt = currentSaved.data().createdAt;
      wajdSavedIds.set(wajdCurrentPostId, createdAt && createdAt.toMillis ? createdAt.toMillis() : Date.now());
    } else {
      wajdSavedIds.delete(wajdCurrentPostId);
    }
    wajdSavedRenderArticleButton(wajdSavedIds.has(wajdCurrentPostId));
    wajdSavedUpdateBadge();
    wajdArticleSaveButton.removeAttribute('title');
    wajdArticleSaveButton.setAttribute('aria-busy', 'false');
    wajdArticleSaveButton.disabled = false;
    const pending = wajdReadPostLoginAction(false);
    if (pending && pending.action === 'save' && pending.postId === wajdCurrentPostId) {
      wajdReadPostLoginAction(true);
      if (!wajdSavedIds.has(wajdCurrentPostId)) wajdArticleSaveButton.click();
    }
  } catch (savedStateError) {
    console.warn('Wajd current saved state:', savedStateError);
    wajdArticleSaveButton.setAttribute('aria-busy', 'false');
    wajdArticleSaveButton.setAttribute('title', 'تعذّر التحقق من حالة الحفظ. أعد تحميل الصفحة للمحاولة مجددًا.');
    // A failed background verification must not strand the save control in a
    // loading state. The click transaction will still re-check the server.
    wajdArticleSaveButton.disabled = false;
  }
}

async function wajdInitializeSavedWritings() {
  if (!wajdSavedOpen || !wajdSavedOverlay) return;
  wajdBindModalFocusTrap();
  wajdAdminBindInterface();
  wajdNotificationsBindInterface();
  wajdAccountBindInterface();
  wajdHistoryBindInterface();
  wajdSavedOpen.addEventListener('click', wajdSavedOpenModal);
  wajdSavedClose.addEventListener('click', wajdSavedCloseModal);
  wajdSavedOverlay.addEventListener('click', event => {
    if (event.target === wajdSavedOverlay) wajdSavedCloseModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && wajdSavedOverlay.classList.contains('is-open')) wajdSavedCloseModal();
  });

  try {
    const core = await wajdEnsureFirebaseCore();
    wajdSavedAuth = core.auth;
    wajdSavedDb = core.db;
    wajdSavedUser = await core.userPromise;
    if (!wajdAuthStateUnsubscribe) {
      const initialAuthSignature = [wajdSavedUser.uid, wajdSavedUser.isAnonymous ? 'anonymous' : 'registered', (wajdSavedUser.providerData || []).map(item => item && item.providerId || '').sort().join(',')].join('|');
      wajdAuthStateUnsubscribe = onAuthStateChanged(wajdSavedAuth, nextUser => {
        if (wajdAccountTransitionActive) return;
        const nextAuthSignature = nextUser ? [nextUser.uid, nextUser.isAnonymous ? 'anonymous' : 'registered', (nextUser.providerData || []).map(item => item && item.providerId || '').sort().join(',')].join('|') : '';
        if (nextUser && nextAuthSignature !== initialAuthSignature) {
          window.location.reload();
          return;
        }
        if (!nextUser) window.setTimeout(() => {
          if (!wajdAccountTransitionActive && !wajdSavedAuth.currentUser) window.location.reload();
        }, 800);
      });
    }
    wajdAccountRender(wajdSavedUser);
    wajdAccountScheduleFirstVisitInvitation(wajdSavedUser);
    if (wajdAccountIsGoogle(wajdSavedUser)) {
      wajdRegisterGoogleReader(wajdSavedUser, false).catch(profileError => console.error('Wajd reader profile:', profileError));
    }
    const startBackgroundAccountWork = () => {
      wajdNotificationsStart(wajdSavedUser);
    };
    const startAudienceAnalytics = () => {
      // v117: audience identity is essential telemetry, not a 15-second optional
      // background task. Start it as soon as the browser is idle (or within
      // ~1.5s) while keeping all reader actions independent from analytics.
      wajdAudienceStart(wajdSavedUser, { reason:'page' }).then(() => {
        if (wajdAnalyticsCanWrite() && wajdSavedUser && wajdSavedUser.isAnonymous) {
          wajdRegisterAnonymousVisitor(wajdSavedUser).catch(visitorError => { wajdAnalyticsHandleError(visitorError); console.warn('Wajd anonymous visitor:', visitorError && visitorError.code || visitorError); });
        }
      }).catch(audienceError => { console.warn('Wajd audience session:', audienceError && audienceError.code || audienceError); });
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(startBackgroundAccountWork, { timeout:1500 });
    else window.setTimeout(startBackgroundAccountWork, 250);
    if ('requestIdleCallback' in window) window.requestIdleCallback(startAudienceAnalytics, { timeout:1500 });
    else window.setTimeout(startAudienceAnalytics, 900);

    const registeredReader = wajdAccountIsGoogle(wajdSavedUser);
    if (registeredReader) wajdReaderListsHydrate(wajdSavedUser.uid);
    if (wajdCurrentPostId && wajdArticleSaveButton) {
      wajdInitializeCurrentArticleSave().catch(error => console.warn('Wajd current save bootstrap:', error));
    }
    let route = null;
    try { route = new URL(window.location.href); } catch (routeError) {}
    const needsHistoryOnStart = Boolean(
      wajdCurrentPostId ||
      document.getElementById('wajd-reading-paths') ||
      (route && (route.searchParams.has('reading-path') || route.searchParams.has('wajdPath')))
    );
    if (registeredReader) try {
      await window.wajdEnsureReaderLists({ history:needsHistoryOnStart, saved:Boolean(wajdCurrentPostId) });
    } catch (listsError) {
      console.error('Wajd reader lists initialization:', listsError);
      if (needsHistoryOnStart) wajdHistoryEmptyState('تعذّر تحميل سجل القراءة الآن، حاول مرة أخرى.');
      if (wajdCurrentPostId) wajdSavedEmptyState('تعذّر تحميل المحفوظات الآن، حاول مرة أخرى.');
    }
    if (registeredReader && wajdCurrentPostId) {
      try {
        if (await wajdHistoryTouch(wajdSavedUser.uid, wajdCurrentPostId)) wajdHistoryIds.set(wajdCurrentPostId, Date.now());
      } catch (historyError) { console.error('Wajd reading history touch:', historyError); }
    }
    if (registeredReader) {
      wajdReaderListsPersist(wajdSavedUser.uid);
      wajdHistoryMarkCards(document);
      wajdHistoryUpdateClear();
    } else {
      wajdSavedIds.clear(); wajdHistoryIds.clear(); wajdHistoryDetails.clear();
      wajdSavedListLoaded = false; wajdHistoryListLoaded = false;
    }
    const wajdPostGrid = document.querySelector('#Blog1 .Posts-byCategory');
    if (wajdPostGrid) {
      new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) wajdHistoryMarkCards(node);
      }))).observe(wajdPostGrid, { childList: true });
    }
    wajdSavedUpdateBadge();
    if (registeredReader) {
      const pending = wajdReadPostLoginAction(false);
      if (pending && pending.action === 'open-saved') { wajdReadPostLoginAction(true); window.setTimeout(wajdSavedOpenModal, 0); }
      if (pending && pending.action === 'open-history') { wajdReadPostLoginAction(true); window.setTimeout(wajdHistoryOpenModal, 0); }
    }

  } catch (error) {
    console.error('Wajd saved writings initialization:', error);
    wajdSavedEmptyState('تعذّر تحميل المحفوظات الآن، حاول مرة أخرى.');
    if (wajdArticleSaveButton && !wajdArticleSaveBound) wajdArticleSaveButton.disabled = true;
  }
}

wajdInitializeSavedWritings();
