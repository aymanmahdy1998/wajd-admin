const { collection, deleteDoc, doc, enableNetwork, getDoc, getDocFromServer, getDocs, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc, waitForPendingWrites, where, writeBatch } = await window.wajdFirebaseModulesPromise;
const WAJD_COMMENTS_ADMIN_EMAIL = 'aymanmahdy1996@gmail.com';
const wajdCommentsArabicNumber = new Intl.NumberFormat('ar-EG');
const wajdCommentsRoot = document.getElementById('wajd-comments');
const wajdCommentsLegacyPostId = wajdCommentsRoot ? wajdCommentsRoot.dataset.postId : '';
const wajdCommentsPostUrlRaw = wajdCommentsRoot ? wajdCommentsRoot.dataset.postUrl : '';
const wajdCommentsPostUrl = (() => {
  try {
    const current = new URL(window.location.href);
    const candidate = new URL(wajdCommentsPostUrlRaw || current.href, current.href);
    candidate.hash = '';
    // Firestore rules intentionally accept only wajd.blog absolute URLs or a
    // relative path. Blogger can occasionally expose an older http/blogspot
    // post URL, so normalize before any comment write.
    if (/^(?:www\.)?wajd\.blog$/i.test(candidate.hostname)) {
      return 'https://wajd.blog' + candidate.pathname + candidate.search;
    }
    return candidate.pathname + candidate.search;
  } catch (error) {
    return String(window.location.pathname || '/') + String(window.location.search || '');
  }
})();
const wajdCommentsPostTitle = wajdCommentsRoot ? wajdCommentsRoot.dataset.postTitle : '';
let wajdCommentsPostId = '';
let wajdCommentsScopes = [];
const wajdCommentsCount = document.getElementById('wajd-comments-count');
const wajdCommentsSort = document.getElementById('wajd-comments-sort');
const wajdCommentsStatus = document.getElementById('wajd-comments-status');
const wajdCommentsList = document.getElementById('wajd-comment-list');
const wajdCommentLogin = document.getElementById('wajd-comment-login');
const wajdCommentLoginButton = document.getElementById('wajd-comment-login-button');
const wajdCommentFormHome = document.getElementById('wajd-comment-form-home');
const wajdCommentForm = document.getElementById('wajd-comment-form');
const wajdCommentComposer = document.getElementById('wajd-comment-composer');
const wajdCommentUserAvatar = document.getElementById('wajd-comment-user-avatar');
const wajdCommentUserName = document.getElementById('wajd-comment-user-name');
const wajdCommentText = document.getElementById('wajd-comment-text');
const wajdCommentCounter = document.getElementById('wajd-comment-counter');
const wajdCommentSubmit = document.getElementById('wajd-comment-submit');
const wajdCommentReplying = document.getElementById('wajd-comment-replying');
const wajdCommentReplyingText = document.getElementById('wajd-comment-replying-text');
const wajdCommentReplyCancel = document.getElementById('wajd-comment-reply-cancel');
let wajdCommentsDb;
let wajdCommentsAuth;
let wajdCommentsUser;
let wajdCommentsData = [];
let wajdCommentsOwned = new Set();
let wajdCommentsReplyTo = '';
let wajdCommentsReplyScope = '';
let wajdCommentsEditingId = '';
let wajdCommentsEditingDraft = '';
const wajdCommentsAnonymousKeys = new Map();
let wajdCommentsAnonymousNames = new Map();
const wajdCommentsScopeData = new Map();
const wajdCommentsHeartStates = new Map();
const WAJD_COMMENT_HEART_CACHE_PREFIX = 'wajd-comment-hearts-v1:';
const WAJD_COMMENT_HEART_CACHE_TTL = 5 * 60 * 1000;
let wajdCommentsHeartStatesPromise = null;

async function wajdCommentsCanonicalScope() {
  let pathname = '';
  try {
    const canonical = document.querySelector('link[rel="canonical"]');
    const source = wajdCommentsPostUrl || (canonical && canonical.href) || window.location.href;
    pathname = new URL(source, window.location.href).pathname.replace(/\/+$/, '') || '/';
  } catch (error) {
    pathname = String(wajdCommentsLegacyPostId || window.location.pathname || 'post');
  }
  const bytes = new TextEncoder().encode(pathname);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return 'url_' + Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

function wajdCommentsIsGoogle(user) {
  return Boolean(user && !user.isAnonymous && (user.providerData || []).some(provider => provider.providerId === 'google.com'));
}

function wajdCommentsActiveGoogleUser() {
  const active = wajdCommentsAuth && wajdCommentsAuth.currentUser;
  return active && wajdCommentsIsGoogle(active) && wajdCommentsUser && active.uid === wajdCommentsUser.uid ? active : null;
}

async function wajdCommentsWithAuthRetry(operation) {
  let active = wajdCommentsActiveGoogleUser();
  if (!active) throw new Error('comment-auth-changed');
  try {
    return await operation();
  } catch (firstError) {
    const staleSession = /permission-denied|unauthenticated/i.test(String(firstError && (firstError.code || firstError.message) || ''));
    if (!staleSession) throw firstError;
    active = wajdCommentsActiveGoogleUser();
    if (!active) throw new Error('comment-auth-changed');
    await active.getIdToken(true);
    if (!wajdCommentsActiveGoogleUser()) throw new Error('comment-auth-changed');
    return operation();
  }
}

function wajdCommentsProfile(user) {
  return (user && user.providerData || []).find(provider => provider && provider.providerId === 'google.com') || null;
}

function wajdCommentsTrustedPhotoURL(user) {
  const profile = wajdCommentsProfile(user);
  const value = String((profile && profile.photoURL) || (user && user.photoURL) || '').trim();
  return /^https:\/\/lh\d+\.googleusercontent\.com\//i.test(value) ? value.slice(0, 1000) : '';
}

function wajdCommentsEmail(user) {
  const profile = wajdCommentsProfile(user);
  return String((user && user.email) || (profile && profile.email) || '').trim().toLowerCase();
}

function wajdCommentsIsAdmin(user) {
  return wajdCommentsIsGoogle(user) && wajdCommentsEmail(user) === WAJD_COMMENTS_ADMIN_EMAIL;
}

function wajdCommentsFallbackAvatar(name) {
  const letter = String(name || 'و').trim().charAt(0) || 'و';
  const safeLetter = letter.replace(/[&<>"']/g, '');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#eadfce"/><text x="48" y="59" text-anchor="middle" font-size="38" font-family="Arial" fill="#955340">' + safeLetter + '</text></svg>';
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function wajdCommentsDate(value) {
  if (!value || !value.toDate) return 'الآن';
  return new Intl.DateTimeFormat('ar-EG', { day:'numeric', month:'long', year:'numeric', hour:'numeric', minute:'2-digit' }).format(value.toDate());
}

function wajdCommentsTime(item) {
  return item.data.createdAt && item.data.createdAt.toMillis ? item.data.createdAt.toMillis() : Date.now();
}

function wajdCommentsAnonymousIdentity(item) {
  return String(item && item.data && item.data.anonymousKey || ('legacy:' + item.id));
}

function wajdCommentsBuildAnonymousNames() {
  const firstAppearance = new Map();
  wajdCommentsData.filter(item => item.data.isAnonymous).forEach(item => {
    const key = wajdCommentsAnonymousIdentity(item);
    const time = wajdCommentsTime(item);
    const current = firstAppearance.get(key);
    if (!current || time < current.time || (time === current.time && item.id < current.id)) {
      firstAppearance.set(key, { time, id:item.id });
    }
  });
  const ordered = Array.from(firstAppearance.entries()).sort((a, b) => a[1].time - b[1].time || a[1].id.localeCompare(b[1].id));
  wajdCommentsAnonymousNames = new Map(ordered.map((entry, index) => [entry[0], 'قارئ مجهول ' + wajdCommentsArabicNumber.format(index + 1)]));
}

function wajdCommentsAnonymousName(item) {
  return wajdCommentsAnonymousNames.get(wajdCommentsAnonymousIdentity(item)) || 'قارئ مجهول';
}

function wajdCommentsSetStatus(message, error) {
  if (!wajdCommentsStatus) return;
  wajdCommentsStatus.textContent = message;
  wajdCommentsStatus.classList.toggle('is-error', Boolean(error));
  wajdCommentsStatus.style.display = message ? 'block' : 'none';
}

function wajdCommentsPlaceComposer() {
  if (!wajdCommentForm || !wajdCommentFormHome) return;
  const target = wajdCommentsReplyTo ? document.getElementById('wajd-comment-' + wajdCommentsReplyTo) : null;
  if (wajdCommentsReplyTo && !target) {
    wajdCommentsReplyTo = '';
    wajdCommentsReplyScope = '';
    if (wajdCommentReplying) wajdCommentReplying.classList.remove('is-visible');
    if (wajdCommentReplyingText) wajdCommentReplyingText.textContent = '';
  }
  if (target) {
    target.appendChild(wajdCommentForm);
    wajdCommentForm.classList.add('is-inline');
  } else {
    wajdCommentFormHome.appendChild(wajdCommentForm);
    wajdCommentForm.classList.remove('is-inline');
  }
}

function wajdCommentsCancelReply() {
  wajdCommentsReplyTo = '';
  wajdCommentsReplyScope = '';
  if (wajdCommentReplying) wajdCommentReplying.classList.remove('is-visible');
  if (wajdCommentReplyingText) wajdCommentReplyingText.textContent = '';
  wajdCommentsPlaceComposer();
}

function wajdCommentsStartReply(item) {
  if (!wajdCommentsIsGoogle(wajdCommentsUser)) {
    const accountButton = document.getElementById('wajd-account-open');
    if (accountButton) accountButton.click();
    return;
  }
  wajdCommentsEditingId = '';
  wajdCommentsEditingDraft = '';
  wajdCommentsReplyTo = item.id;
  wajdCommentsReplyScope = item.scopeId;
  const name = item.data.isAnonymous ? wajdCommentsAnonymousName(item) : (item.data.displayName || 'قارئ وَجْد');
  wajdCommentReplyingText.textContent = 'ردّ على ' + name;
  wajdCommentReplying.classList.add('is-visible');
  wajdCommentsRender();
  wajdCommentText.focus();
  wajdCommentForm.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function wajdCommentsStartEdit(item) {
  wajdCommentsCancelReply();
  wajdCommentsEditingId = item.id;
  wajdCommentsEditingDraft = item.data.body || '';
  wajdCommentsRender();
  const editor = document.querySelector('[data-comment-edit-id="' + item.id + '"]');
  if (editor) {
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  }
}

async function wajdCommentsSaveEdit(item, textarea, button) {
  const body = String(textarea.value || '').trim();
  if (!body || body.length > 1000) return;
  button.disabled = true;
  try {
    if (!wajdCommentsActiveGoogleUser()) { window.location.reload(); return; }
    await wajdCommentsWithAuthRetry(() => updateDoc(doc(wajdCommentsDb, 'articles', item.scopeId, 'comments', item.id), { body, editedAt:serverTimestamp() }));
    wajdCommentsEditingId = '';
    wajdCommentsEditingDraft = '';
    wajdCommentsRender();
  } catch (error) {
    console.error('Wajd edit comment:', error);
    wajdCommentsSetStatus('تعذّر تعديل التعليق الآن. تأكد من نشر قواعد v73 ثم حاول مرة أخرى.', true);
    button.disabled = false;
  }
}

function wajdCommentsHeartKey(item) {
  return item.scopeId + '_' + item.id;
}

function wajdCommentsUpdateHeartButtons(key, active, count) {
  const adminHeart = wajdCommentsIsAdmin(wajdCommentsUser);
  document.querySelectorAll('.wajd-comment-heart').forEach(button => {
    if (button.dataset.heartKey !== key) return;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.setAttribute('aria-label', adminHeart ? (active ? 'إزالة قلب أيمن المميز' : 'وضع قلب أيمن المميز') : (active ? 'إزالة القلب من التعليق' : 'وضع قلب على التعليق'));
    const counter = button.querySelector('.wajd-comment-heart-count');
    if (counter) counter.textContent = wajdCommentsArabicNumber.format(Math.max(0, count));
  });
}

function wajdCommentsHydrateHeartStates(userId) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(WAJD_COMMENT_HEART_CACHE_PREFIX + userId) || 'null');
    if (!cached || Date.now() - Number(cached.savedAt || 0) > WAJD_COMMENT_HEART_CACHE_TTL) return false;
    wajdCommentsHeartStates.clear();
    (cached.keys || []).forEach(key => wajdCommentsHeartStates.set(String(key), true));
    return true;
  } catch (error) {
    return false;
  }
}

function wajdCommentsPersistHeartStates(userId) {
  try {
    const keys = Array.from(wajdCommentsHeartStates.entries()).filter(entry => entry[1] === true).map(entry => entry[0]);
    sessionStorage.setItem(WAJD_COMMENT_HEART_CACHE_PREFIX + userId, JSON.stringify({ savedAt:Date.now(), keys }));
  } catch (error) {}
}

function wajdCommentsRefreshHeartButtons() {
  wajdCommentsData.forEach(item => {
    const key = wajdCommentsHeartKey(item);
    wajdCommentsUpdateHeartButtons(key, wajdCommentsHeartStates.get(key) === true, Number(item.data.heartCount || 0));
  });
}

async function wajdCommentsLoadHeartStates() {
  if (!wajdCommentsUser || !wajdCommentsUser.uid || !wajdCommentsIsGoogle(wajdCommentsUser)) return;
  if (wajdCommentsHeartStatesPromise) return wajdCommentsHeartStatesPromise;
  wajdCommentsHeartStatesPromise = (async () => {
    if (!wajdCommentsHydrateHeartStates(wajdCommentsUser.uid)) {
      const snapshot = await getDocs(collection(wajdCommentsDb, 'users', wajdCommentsUser.uid, 'commentHearts'));
      wajdCommentsHeartStates.clear();
      snapshot.forEach(heart => wajdCommentsHeartStates.set(heart.id, true));
      wajdCommentsPersistHeartStates(wajdCommentsUser.uid);
    }
    wajdCommentsRefreshHeartButtons();
  })().catch(error => {
    wajdCommentsHeartStatesPromise = null;
    console.warn('Wajd comment heart states:', error);
  });
  return wajdCommentsHeartStatesPromise;
}

async function wajdCommentsToggleHeart(item, button) {
  if (!wajdCommentsUser || !wajdCommentsUser.uid || button.disabled) return;
  if (!wajdCommentsIsGoogle(wajdCommentsUser)) {
    const accountButton = document.getElementById('wajd-account-open');
    if (accountButton) accountButton.click();
    wajdCommentsSetStatus('سجّل الدخول بحساب Google للتفاعل مع التعليقات.', false);
    return;
  }
  const activeUser = wajdCommentsActiveGoogleUser();
  if (!activeUser) { window.location.reload(); return; }
  wajdCommentsUser = activeUser;
  const key = wajdCommentsHeartKey(item);
  const commentRef = doc(wajdCommentsDb, 'articles', item.scopeId, 'comments', item.id);
  const heartRef = doc(wajdCommentsDb, 'users', wajdCommentsUser.uid, 'commentHearts', key);
  const targetInboxKey = String(item.data.notificationKey || '');
  const shouldNotify = Boolean(targetInboxKey && !wajdCommentsOwned.has(item.id));
  const notificationRef = shouldNotify ? doc(collection(wajdCommentsDb, 'notificationInboxes', targetInboxKey, 'items')) : null;
  const isAdminHeart = wajdCommentsIsAdmin(wajdCommentsUser);
  const adminProfile = wajdCommentsProfile(wajdCommentsUser);
  const adminName = String((adminProfile && adminProfile.displayName) || wajdCommentsUser.displayName || 'أيمن المهدي').trim().slice(0, 120) || 'أيمن المهدي';
  const adminPhotoURL = wajdCommentsTrustedPhotoURL(wajdCommentsUser);
  button.disabled = true;
  try {
    const result = await wajdCommentsWithAuthRetry(() => runTransaction(wajdCommentsDb, async transaction => {
      const [commentSnapshot, heartSnapshot] = await Promise.all([transaction.get(commentRef), transaction.get(heartRef)]);
      if (!commentSnapshot.exists()) throw new Error('comment-missing');
      const currentCount = Number(commentSnapshot.data().heartCount || 0);
      if (heartSnapshot.exists()) {
        const heartData = heartSnapshot.data();
        if (heartData.notificationId && heartData.targetInboxKey) {
          transaction.delete(doc(wajdCommentsDb, 'notificationInboxes', heartData.targetInboxKey, 'items', heartData.notificationId));
        }
        transaction.delete(heartRef);
        if (heartData.isAdminHeart === true) {
          transaction.update(commentRef, { adminHearted:false, adminHeartPhotoURL:'' });
          return { active:false, count:currentCount };
        }
        transaction.update(commentRef, { heartCount:Math.max(0, currentCount - 1) });
        return { active:false, count:Math.max(0, currentCount - 1) };
      }
      transaction.set(heartRef, {
        articleId:item.scopeId,
        commentId:item.id,
        isAdminHeart:isAdminHeart,
        notificationId:notificationRef ? notificationRef.id : '',
        targetInboxKey:notificationRef ? targetInboxKey : '',
        createdAt:serverTimestamp()
      });
      if (isAdminHeart) transaction.update(commentRef, { adminHearted:true, adminHeartPhotoURL:adminPhotoURL });
      else transaction.update(commentRef, { heartCount:currentCount + 1 });
      if (notificationRef) {
        transaction.set(notificationRef, {
          type:'commentHeart',
          articleId:wajdCommentsLegacyPostId,
          commentScope:item.scopeId,
          articleUrl:wajdCommentsPostUrl,
          articleTitle:wajdCommentsPostTitle,
          commentId:item.id,
          actorAnonymous:!isAdminHeart,
          actorName:isAdminHeart ? adminName : '',
          preview:'',
          count:1,
          createdAt:serverTimestamp(),
          updatedAt:serverTimestamp(),
          read:false
        });
      }
      return { active:true, count:isAdminHeart ? currentCount : currentCount + 1 };
    }));
    wajdCommentsHeartStates.set(key, result.active);
    wajdCommentsPersistHeartStates(wajdCommentsUser.uid);
    wajdCommentsUpdateHeartButtons(key, result.active, result.count);
  } catch (error) {
    console.error('Wajd comment heart:', error);
    wajdCommentsSetStatus('تعذّر حفظ التفاعل الآن. تأكد من نشر قواعد v73 ثم حاول مرة أخرى.', true);
  } finally {
    button.disabled = false;
  }
}

async function wajdCommentsDelete(item) {
  if (!window.confirm('هل تريد حذف هذا التعليق؟')) return;
  if (!wajdCommentsActiveGoogleUser()) { window.location.reload(); return; }
  try {
    await wajdCommentsWithAuthRetry(async () => {
      const batch = writeBatch(wajdCommentsDb);
      batch.delete(doc(wajdCommentsDb, 'articles', item.scopeId, 'comments', item.id));
      if (wajdCommentsOwned.has(item.id)) batch.delete(doc(wajdCommentsDb, 'users', wajdCommentsUser.uid, 'comments', item.id));
      await batch.commit();
    });
  } catch (error) {
    console.error('Wajd delete comment:', error);
    wajdCommentsSetStatus('تعذّر حذف التعليق الآن، حاول مرة أخرى.', true);
  }
}

function wajdCommentsAvatar(item) {
  if (item.data.isAnonymous) {
    const avatar = document.createElement('span');
    avatar.className = 'wajd-comment-avatar is-anonymous';
    avatar.textContent = '؟';
    avatar.setAttribute('aria-hidden', 'true');
    return avatar;
  }
  const avatar = document.createElement('img');
  avatar.className = 'wajd-comment-avatar';
  avatar.src = item.data.photoURL || wajdCommentsFallbackAvatar(item.data.displayName);
  avatar.alt = '';
  avatar.loading = 'lazy';
  return avatar;
}

function wajdCommentsCard(item, reply) {
  const article = document.createElement('article');
  article.className = 'wajd-comment' + (reply ? ' is-reply' : '');
  article.dataset.commentId = item.id;
  article.id = 'wajd-comment-' + item.id;
  const head = document.createElement('div');
  head.className = 'wajd-comment-head';
  head.appendChild(wajdCommentsAvatar(item));
  const meta = document.createElement('div');
  meta.className = 'wajd-comment-meta';
  const authorLine = document.createElement('div');
  authorLine.className = 'wajd-comment-author-line';
  const author = document.createElement('strong');
  author.className = 'wajd-comment-author';
  author.textContent = item.data.isAnonymous ? wajdCommentsAnonymousName(item) : (item.data.displayName || 'قارئ وَجْد');
  authorLine.appendChild(author);
  if (!item.data.isAnonymous && item.data.authorRole === 'author') {
    const badge = document.createElement('span');
    badge.className = 'wajd-comment-author-badge';
    badge.textContent = 'الكاتب';
    authorLine.appendChild(badge);
  }
  const date = document.createElement('time');
  date.className = 'wajd-comment-date';
  date.textContent = wajdCommentsDate(item.data.createdAt);
  if (item.data.editedAt) date.textContent += ' · تم التعديل';
  meta.appendChild(authorLine);
  meta.appendChild(date);
  head.appendChild(meta);
  article.appendChild(head);
  if (wajdCommentsEditingId === item.id && wajdCommentsOwned.has(item.id)) {
    const editForm = document.createElement('form');
    editForm.className = 'wajd-comment-edit-form';
    const editText = document.createElement('textarea');
    editText.className = 'wajd-comment-edit-text';
    editText.dataset.commentEditId = item.id;
    editText.maxLength = 1000;
    editText.required = true;
    editText.value = wajdCommentsEditingDraft;
    editText.addEventListener('input', () => { wajdCommentsEditingDraft = editText.value; });
    editForm.appendChild(editText);
    const editActions = document.createElement('div');
    editActions.className = 'wajd-comment-edit-actions';
    const saveEdit = document.createElement('button');
    saveEdit.className = 'wajd-comment-edit-save';
    saveEdit.type = 'submit';
    saveEdit.textContent = 'حفظ التعديل';
    const cancelEdit = document.createElement('button');
    cancelEdit.className = 'wajd-comment-edit-cancel';
    cancelEdit.type = 'button';
    cancelEdit.textContent = 'إلغاء';
    cancelEdit.addEventListener('click', () => { wajdCommentsEditingId = ''; wajdCommentsEditingDraft = ''; wajdCommentsRender(); });
    editActions.appendChild(saveEdit);
    editActions.appendChild(cancelEdit);
    editForm.appendChild(editActions);
    editForm.addEventListener('submit', event => { event.preventDefault(); wajdCommentsSaveEdit(item, editText, saveEdit); });
    article.appendChild(editForm);
  } else {
    const body = document.createElement('p');
    body.className = 'wajd-comment-body';
    body.textContent = item.data.body || '';
    article.appendChild(body);
  }
  const actions = document.createElement('div');
  actions.className = 'wajd-comment-actions';
  const heartButton = document.createElement('button');
  const heartKey = wajdCommentsHeartKey(item);
  const heartActive = wajdCommentsHeartStates.get(heartKey) === true;
  const adminHeartControl = wajdCommentsIsAdmin(wajdCommentsUser);
  heartButton.className = 'wajd-comment-heart' + (heartActive ? ' is-active' : '') + (adminHeartControl ? ' is-admin-control' : '');
  heartButton.type = 'button';
  heartButton.dataset.heartKey = heartKey;
  heartButton.setAttribute('aria-label', adminHeartControl ? (heartActive ? 'إزالة قلب أيمن المميز' : 'وضع قلب أيمن المميز') : (heartActive ? 'إزالة القلب من التعليق' : 'وضع قلب على التعليق'));
  heartButton.setAttribute('aria-pressed', heartActive ? 'true' : 'false');
  heartButton.innerHTML = '<span aria-hidden="true" class="wajd-comment-heart-symbol">♥</span><span class="wajd-comment-heart-count">' + wajdCommentsArabicNumber.format(Number(item.data.heartCount || 0)) + '</span>';
  heartButton.addEventListener('click', () => wajdCommentsToggleHeart(item, heartButton));
  actions.appendChild(heartButton);
  if (item.data.adminHearted === true) {
    const adminHeartBadge = document.createElement('span');
    adminHeartBadge.className = 'wajd-comment-admin-heart';
    adminHeartBadge.title = 'أعجب أيمن المهدي بهذا التعليق';
    adminHeartBadge.setAttribute('aria-label', 'أعجب أيمن المهدي بهذا التعليق');
    if (item.data.adminHeartPhotoURL) {
      const adminHeartAvatar = document.createElement('img');
      adminHeartAvatar.className = 'wajd-comment-admin-heart-avatar';
      adminHeartAvatar.src = item.data.adminHeartPhotoURL;
      adminHeartAvatar.alt = 'أيمن المهدي';
      adminHeartAvatar.loading = 'lazy';
      adminHeartAvatar.decoding = 'async';
      adminHeartAvatar.referrerPolicy = 'no-referrer';
      adminHeartBadge.appendChild(adminHeartAvatar);
    } else {
      const adminHeartFallback = document.createElement('span');
      adminHeartFallback.className = 'wajd-comment-admin-heart-avatar wajd-comment-admin-heart-fallback';
      adminHeartFallback.textContent = 'أ';
      adminHeartBadge.appendChild(adminHeartFallback);
    }
    const adminHeartSymbol = document.createElement('span');
    adminHeartSymbol.className = 'wajd-comment-admin-heart-symbol';
    adminHeartSymbol.setAttribute('aria-hidden', 'true');
    adminHeartSymbol.textContent = '♥';
    adminHeartBadge.appendChild(adminHeartSymbol);
    actions.appendChild(adminHeartBadge);
  }
  if (!reply) {
    const replyButton = document.createElement('button');
    replyButton.className = 'wajd-comment-reply';
    replyButton.type = 'button';
    replyButton.textContent = 'رد';
    replyButton.addEventListener('click', () => wajdCommentsStartReply(item));
    actions.appendChild(replyButton);
  }
  if (wajdCommentsOwned.has(item.id)) {
    const editButton = document.createElement('button');
    editButton.className = 'wajd-comment-edit';
    editButton.type = 'button';
    editButton.textContent = 'تعديل';
    editButton.addEventListener('click', () => wajdCommentsStartEdit(item));
    actions.appendChild(editButton);
  }
  if (wajdCommentsOwned.has(item.id) || wajdCommentsIsAdmin(wajdCommentsUser)) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'wajd-comment-delete';
    deleteButton.type = 'button';
    deleteButton.textContent = 'حذف';
    deleteButton.addEventListener('click', () => wajdCommentsDelete(item));
    actions.appendChild(deleteButton);
  }
  article.appendChild(actions);
  return article;
}

function wajdCommentsRender() {
  if (!wajdCommentsList) return;
  if (wajdCommentForm && wajdCommentsList.contains(wajdCommentForm)) wajdCommentFormHome.appendChild(wajdCommentForm);
  wajdCommentsBuildAnonymousNames();
  const newest = !wajdCommentsSort || wajdCommentsSort.value === 'newest';
  const visibleComments = wajdCommentsData.filter(item => item.data.moderationStatus !== 'hidden');
  const roots = visibleComments.filter(item => !item.data.parentId);
  const rootIds = new Set(roots.map(item => item.scopeId + ':' + item.id));
  visibleComments.filter(item => item.data.parentId && !rootIds.has(item.scopeId + ':' + item.data.parentId)).forEach(item => roots.push(item));
  roots.sort((a, b) => newest ? wajdCommentsTime(b) - wajdCommentsTime(a) : wajdCommentsTime(a) - wajdCommentsTime(b));
  wajdCommentsList.innerHTML = '';
  roots.forEach(root => {
    wajdCommentsList.appendChild(wajdCommentsCard(root, Boolean(root.data.parentId)));
    const replies = visibleComments.filter(item => item.scopeId === root.scopeId && item.data.parentId === root.id).sort((a, b) => wajdCommentsTime(a) - wajdCommentsTime(b));
    replies.forEach(reply => wajdCommentsList.appendChild(wajdCommentsCard(reply, true)));
  });
  wajdCommentsPlaceComposer();
  if (wajdCommentsCount) wajdCommentsCount.textContent = wajdCommentsArabicNumber.format(visibleComments.length);
  wajdCommentsSetStatus(visibleComments.length ? '' : 'لا توجد تعليقات بعد؛ يمكنك أن تكون أول من يعلّق.', false);
  if (window.location.hash.indexOf('#wajd-comment-') === 0) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && !target.dataset.notificationFocused) {
      target.dataset.notificationFocused = 'true';
      window.setTimeout(() => target.scrollIntoView({ behavior:'smooth', block:'center' }), 120);
    }
  }
}

async function wajdCommentsRenderComposer() {
  const googleUser = wajdCommentsIsGoogle(wajdCommentsUser);
  wajdCommentLogin.classList.toggle('is-visible', !googleUser);
  wajdCommentComposer.classList.toggle('is-visible', googleUser);
  if (!googleUser) return;
  const profile = wajdCommentsProfile(wajdCommentsUser);
  const displayName = wajdCommentsUser.displayName || (profile && profile.displayName) || 'قارئ وَجْد';
  const photoURL = wajdCommentsTrustedPhotoURL(wajdCommentsUser) || wajdCommentsFallbackAvatar(displayName);
  wajdCommentUserName.textContent = displayName;
  wajdCommentUserAvatar.src = photoURL;
  wajdCommentUserAvatar.alt = 'صورة ' + displayName;
  try {
    const privacy = await getDoc(doc(wajdCommentsDb, 'users', wajdCommentsUser.uid, 'settings', 'privacy'));
    if (privacy.exists() && privacy.data().anonymousByDefault === true) {
      const anonymousChoice = document.querySelector('input[name="wajd-comment-identity"][value="anonymous"]');
      if (anonymousChoice) anonymousChoice.checked = true;
    }
  } catch (error) { console.warn('Wajd comment privacy preference:', error); }
}

async function wajdCommentsLoadOwnership() {
  // Ownership is a private Google feature. Anonymous readers must never query
  // this collection because v73 correctly denies it to anonymous auth.
  wajdCommentsOwned = new Set();
  if (!wajdCommentsUser || !wajdCommentsIsGoogle(wajdCommentsUser)) return;
  const snapshot = await getDocs(collection(wajdCommentsDb, 'users', wajdCommentsUser.uid, 'comments'));
  const allowedScopes = new Set(wajdCommentsScopes);
  snapshot.forEach(item => { if (allowedScopes.has(item.data().articleId)) wajdCommentsOwned.add(item.id); });
}

async function wajdCommentsPublicProfile() {
  const activeUser = wajdCommentsActiveGoogleUser();
  if (!activeUser) throw new Error('comment-auth-changed');
  wajdCommentsUser = activeUser;
  const profileRef = doc(wajdCommentsDb, 'profiles', activeUser.uid);
  let profileSnapshot = await getDoc(profileRef);
  if (!profileSnapshot.exists() && window.wajdEnsureGoogleReaderProfile) {
    try { await window.wajdEnsureGoogleReaderProfile(true); } catch (profileError) { console.warn('Wajd comment profile provision:', profileError); }
    profileSnapshot = await getDoc(profileRef);
  }
  if (!profileSnapshot.exists()) throw new Error('reader-profile-not-ready');
  const profile = profileSnapshot.data();
  const displayName = String(profile.displayName || '').trim();
  let photoURL = String(profile.photoURL || '');
  try {
    const privacy = await getDoc(doc(wajdCommentsDb, 'users', wajdCommentsUser.uid, 'settings', 'privacy'));
    if (privacy.exists() && privacy.data().hidePhoto === true) photoURL = '';
  } catch (error) { console.warn('Wajd hidden comment photo:', error); }
  if (!displayName) throw new Error('reader-profile-name-missing');
  return { displayName, photoURL };
}

function wajdCommentsCreateAnonymousKey() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}

function wajdCommentsCreateInboxIdentity(scopeId) {
  const key = wajdCommentsCreateAnonymousKey();
  return {
    key,
    ownerRef:doc(wajdCommentsDb, 'notificationInboxes', key),
    indexRef:doc(wajdCommentsDb, 'users', wajdCommentsUser.uid, 'commentInboxes', key),
    scopeId
  };
}

async function wajdCommentsPublish(event) {
  event.preventDefault();
  if (!wajdCommentsIsGoogle(wajdCommentsUser)) return;
  const body = String(wajdCommentText.value || '').trim();
  if (!body || body.length > 1000) return;
  wajdCommentSubmit.disabled = true;
  try {
    let activeUser = wajdCommentsActiveGoogleUser();
    if (!activeUser) { window.location.reload(); return; }
    wajdCommentsUser = activeUser;
    const identityChoice = document.querySelector('input[name="wajd-comment-identity"]:checked');
    const anonymous = Boolean(identityChoice && identityChoice.value === 'anonymous');
    const publicProfile = anonymous ? { displayName:'', photoURL:'' } : await wajdCommentsPublicProfile();
    const publishScope = wajdCommentsReplyScope || wajdCommentsPostId;
    const notificationIdentity = wajdCommentsCreateInboxIdentity(publishScope);
    const anonymousIdentity = anonymous ? { key:notificationIdentity.key } : { key:'' };
    const commentRef = doc(collection(wajdCommentsDb, 'articles', publishScope, 'comments'));
    const ownerRef = doc(wajdCommentsDb, 'users', activeUser.uid, 'comments', commentRef.id);
    let parentData = null;
    if (wajdCommentsReplyTo) {
      const parentSnapshot = await getDoc(doc(wajdCommentsDb, 'articles', publishScope, 'comments', wajdCommentsReplyTo));
      if (parentSnapshot.exists()) parentData = parentSnapshot.data();
    }
    // Account may have changed while profile/parent data was being fetched.
    activeUser = wajdCommentsActiveGoogleUser();
    if (!activeUser) { window.location.reload(); return; }
    const buildAndCommit = async () => {
      const batch = writeBatch(wajdCommentsDb);
      batch.set(commentRef, {
        body,
        createdAt: serverTimestamp(),
        isAnonymous: anonymous,
        displayName: publicProfile.displayName,
        photoURL: publicProfile.photoURL,
        anonymousKey: anonymousIdentity.key,
        notificationKey: notificationIdentity.key,
        parentId: wajdCommentsReplyTo || '',
        authorRole: wajdCommentsIsAdmin(activeUser) && !anonymous ? 'author' : 'reader',
        moderationStatus: 'visible'
      });
      batch.set(ownerRef, { articleId:publishScope, articleUrl:wajdCommentsPostUrl, articleTitle:wajdCommentsPostTitle, createdAt:serverTimestamp() });
      batch.set(notificationIdentity.ownerRef, {
        ownerId:activeUser.uid,
        commentScope:publishScope,
        updatedAt:serverTimestamp()
      });
      batch.set(notificationIdentity.indexRef, {
        commentScope:publishScope,
        createdAt:serverTimestamp()
      });
      const notificationData = {
        type:wajdCommentsReplyTo ? 'reply' : 'comment',
        articleId:wajdCommentsLegacyPostId,
        commentScope:publishScope,
        articleUrl:wajdCommentsPostUrl,
        articleTitle:wajdCommentsPostTitle,
        commentId:commentRef.id,
        actorAnonymous:anonymous,
        actorName:anonymous ? '' : publicProfile.displayName,
        preview:body.slice(0, 180),
        count:1,
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp(),
        read:false
      };
      if (!wajdCommentsIsAdmin(activeUser)) batch.set(doc(wajdCommentsDb, 'adminNotifications', commentRef.id), notificationData);
      if (parentData && parentData.authorRole !== 'author' && parentData.notificationKey && parentData.notificationKey !== notificationIdentity.key) {
        batch.set(doc(wajdCommentsDb, 'notificationInboxes', parentData.notificationKey, 'items', commentRef.id), notificationData);
      }
      await batch.commit();
    };
    try {
      await buildAndCommit();
    } catch (firstError) {
      const staleSession = /permission-denied|unauthenticated/i.test(String(firstError && (firstError.code || firstError.message) || ''));
      if (!staleSession) throw firstError;
      const retryUser = wajdCommentsActiveGoogleUser();
      if (!retryUser) { window.location.reload(); return; }
      await retryUser.getIdToken(true);
      if (!wajdCommentsActiveGoogleUser()) { window.location.reload(); return; }
      await buildAndCommit();
    }
    await waitForPendingWrites(wajdCommentsDb);
    const serverComment = await getDocFromServer(commentRef);
    if (!serverComment.exists()) throw new Error('comment-not-confirmed-by-server');
    if (window.wajdAudienceRecordExplicitAction) window.wajdAudienceRecordExplicitAction('commented', wajdCommentsLegacyPostId); else if (window.wajdJourneyRecordAction) window.wajdJourneyRecordAction('commented', wajdCommentsLegacyPostId);
    wajdCommentsOwned.add(commentRef.id);
    wajdCommentText.value = '';
    wajdCommentCounter.textContent = '٠ / ١٠٠٠';
    wajdCommentsCancelReply();
  } catch (error) {
    console.error('Wajd publish comment:', error);
    wajdCommentsSetStatus('لم يُحفظ التعليق على الخادم. تأكد من نشر قواعد v73 واتصال الإنترنت ثم حاول مرة أخرى.', true);
  } finally {
    wajdCommentSubmit.disabled = false;
  }
}

async function wajdInitializeComments() {
  if (!wajdCommentsRoot) return;
  // The canonical URL scope is sufficient on its own. Blogger's numeric post id
  // remains a compatibility scope when available, but must never block comments.
  try {
    wajdCommentsPostId = await wajdCommentsCanonicalScope();
  } catch (scopeError) {
    console.warn('Wajd comments canonical scope:', scopeError);
    wajdCommentsPostId = wajdCommentsLegacyPostId || ('url_' + String(window.location.pathname || 'post').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 100));
  }
  wajdCommentsScopes = Array.from(new Set([wajdCommentsPostId, wajdCommentsLegacyPostId].filter(Boolean)));
  if (!wajdCommentsScopes.length) {
    wajdCommentsSetStatus('تعذّر تحديد هذا المقال للتعليقات. أعد تحميل الصفحة وحاول مرة أخرى.', true);
    return;
  }

  const core = await window.wajdEnsureFirebaseCore();
  wajdCommentsDb = core.db;
  wajdCommentsAuth = core.auth;
  // Network recovery is useful, but it is not allowed to hold the composer hostage.
  enableNetwork(wajdCommentsDb).catch(networkError => console.warn('Wajd comments network:', networkError));

  try {
    wajdCommentsUser = await core.userPromise;
    // Render the account/login state immediately. Ownership, privacy and heart
    // reads are secondary and can complete afterwards without hiding the form.
    wajdCommentsRenderComposer().catch(error => console.warn('Wajd comment composer preferences:', error));
    wajdCommentsRender();

    wajdCommentsLoadOwnership().then(() => {
      wajdCommentsRender();
    }).catch(error => {
      console.warn('Wajd comment ownership:', error);
      wajdCommentsOwned = new Set();
    });
    wajdCommentsLoadHeartStates().catch(error => console.warn('Wajd comment hearts:', error));
  } catch (error) {
    console.error('Wajd comments identity:', error);
    wajdCommentsSetStatus('تعذّر تجهيز هوية التعليقات الآن. أعد تحميل الصفحة وحاول مرة أخرى.', true);
  }

  if (wajdCommentLoginButton) wajdCommentLoginButton.addEventListener('click', () => {
    const accountButton = document.getElementById('wajd-account-open');
    if (accountButton) accountButton.click();
  });
  if (wajdCommentText) wajdCommentText.addEventListener('input', () => {
    const length = wajdCommentText.value.length;
    if (wajdCommentCounter) wajdCommentCounter.textContent = wajdCommentsArabicNumber.format(length) + ' / ١٠٠٠';
    if (wajdCommentCounter) wajdCommentCounter.classList.toggle('is-limit', length >= 950);
  });
  if (wajdCommentComposer) wajdCommentComposer.addEventListener('submit', wajdCommentsPublish);
  if (wajdCommentReplyCancel) wajdCommentReplyCancel.addEventListener('click', wajdCommentsCancelReply);
  if (wajdCommentsSort) wajdCommentsSort.addEventListener('change', wajdCommentsRender);

  let successfulScopes = 0;
  let failedScopes = 0;
  wajdCommentsScopes.forEach(scopeId => {
    // The query constraint mirrors the security rule, so hidden comments never
    // reach a public reader. Rendering already applies the selected client sort.
    const commentsQuery = query(collection(wajdCommentsDb, 'articles', scopeId, 'comments'), where('moderationStatus', '==', 'visible'));
    onSnapshot(commentsQuery, { includeMetadataChanges:true }, snapshot => {
      const confirmed = snapshot.docs
        .filter(item => !item.metadata.hasPendingWrites)
        .map(item => ({ id:item.id, scopeId, data:item.data() }));
      wajdCommentsScopeData.set(scopeId, confirmed);
      wajdCommentsData = Array.from(wajdCommentsScopeData.values()).flat();
      successfulScopes += 1;
      wajdCommentsRender();
      // Cache is a valid first paint. Do not replace a usable empty/composer UI
      // with an endless syncing message merely because the server is slower.
      if (snapshot.metadata.fromCache && successfulScopes === 1 && !wajdCommentsData.length) {
        wajdCommentsSetStatus('لا توجد تعليقات ظاهرة بعد؛ يمكنك أن تكون أول من يعلّق.', false);
      }
    }, error => {
      failedScopes += 1;
      console.error('Wajd load comments:', error);
      // One compatibility scope may fail while the other succeeds. Only surface
      // a hard error when every scope has failed.
      if (failedScopes >= wajdCommentsScopes.length && successfulScopes === 0) {
        wajdCommentsSetStatus('تعذّر تحميل التعليقات الآن، لكن يمكنك إعادة المحاولة بعد تحديث الصفحة.', true);
      }
    });
  });
}

let wajdCommentsInitializationPromise = null;
function wajdStartComments() {
  if (!wajdCommentsInitializationPromise) {
    wajdCommentsInitializationPromise = wajdInitializeComments().catch(error => {
      // Allow a later pointer/scroll retry instead of permanently caching a failed init.
      wajdCommentsInitializationPromise = null;
      throw error;
    });
  }
  return wajdCommentsInitializationPromise;
}
function wajdScheduleComments() {
  if (!wajdCommentsRoot) return;
  let observer = null;
  let started = false;
  const nearViewport = () => {
    const rect = wajdCommentsRoot.getBoundingClientRect();
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    return rect.top <= height + 1200 && rect.bottom >= -400;
  };
  const start = () => {
    if (started) return;
    started = true;
    if (observer) observer.disconnect();
    window.removeEventListener('scroll', scrollFallback);
    window.removeEventListener('resize', scrollFallback);
    wajdCommentsRoot.removeEventListener('pointerdown', start);
    wajdCommentsRoot.removeEventListener('focusin', start);
    wajdStartComments().catch(error => {
      console.error('Wajd deferred comments:', error);
      started = false;
      wajdCommentsSetStatus('تعذّر تشغيل التعليقات الآن. حرّك الصفحة قليلًا أو أعد تحميلها للمحاولة مرة أخرى.', true);
      wajdCommentsRoot.addEventListener('pointerdown', start);
      wajdCommentsRoot.addEventListener('focusin', start);
      window.addEventListener('scroll', scrollFallback, { passive:true });
      window.addEventListener('resize', scrollFallback, { passive:true });
      window.setTimeout(scrollFallback, 1200);
    });
  };
  const scrollFallback = () => { if (nearViewport()) start(); };

  if (/comment/i.test(window.location.hash || '') || nearViewport()) { start(); return; }
  wajdCommentsRoot.addEventListener('pointerdown', start);
  wajdCommentsRoot.addEventListener('focusin', start);
  window.addEventListener('scroll', scrollFallback, { passive:true });
  window.addEventListener('resize', scrollFallback, { passive:true });
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting || entry.boundingClientRect.top <= (window.innerHeight || 0) + 1200)) start();
    }, { rootMargin:'1200px 0px' });
    observer.observe(wajdCommentsRoot);
  }
  // A visible section must never stay forever in its static loading state.
  window.setTimeout(scrollFallback, 900);
}
wajdScheduleComments();
