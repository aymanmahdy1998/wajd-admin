const { collection, deleteDoc, doc, getDoc, getDocs, runTransaction, serverTimestamp, setDoc } = await window.wajdFirebaseModulesPromise;

const wajdArabicNumber = new Intl.NumberFormat('ar-EG');
let wajdToastTimer;

function wajdShowLikeToast(message, sad) {
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
  toast.querySelector('.wajd-like-toast-icon').textContent = sad ? '☹' : '♥';
  toast.querySelector('.wajd-like-toast-text').textContent = message;
  toast.classList.toggle('is-sad', Boolean(sad));
  toast.classList.add('is-visible');
  clearTimeout(wajdToastTimer);
  wajdToastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function wajdRenderLike(button, countNode, statusNode, liked, count) {
  const safeCount = Math.max(0, Number(count) || 0);
  button.classList.toggle('is-liked', liked);
  button.setAttribute('aria-pressed', liked ? 'true' : 'false');
  button.setAttribute('aria-label', liked ? 'إلغاء الإعجاب بهذا المقال' : 'الإعجاب بهذا المقال');
  countNode.textContent = wajdArabicNumber.format(safeCount);
  statusNode.textContent = liked ? 'أنت معجب بهذا المقال' : 'لم تسجل إعجابك بهذا المقال';
}

function wajdRenderViews(viewNode, count) {
  if (!viewNode) return;
  const safeCount = Math.max(0, Number(count) || 0);
  const numberNode = document.getElementById('wajd-view-number');
  // v121: Arabic plural, and no "٠ مشاهدة" on a brand-new article.
  const label = safeCount === 1 ? 'مشاهدة واحدة' : safeCount === 2 ? 'مشاهدتان' : wajdArabicNumber.format(safeCount) + (safeCount >= 3 && safeCount <= 10 ? ' مشاهدات' : ' مشاهدة');
  if (numberNode) numberNode.textContent = label;
  viewNode.hidden = safeCount === 0;
  viewNode.setAttribute('aria-label', label + ' لهذا المقال');
  viewNode.setAttribute('aria-busy', 'false');
}

async function wajdInitializeLikes() {
  const panel = document.getElementById('wajd-like-panel');
  const button = document.getElementById('wajd-like-button');
  const countNode = document.getElementById('wajd-like-count');
  const statusNode = document.getElementById('wajd-like-status');
  const viewNode = document.getElementById('wajd-view-count');
  const postId = (panel && panel.dataset.postId) || (viewNode && viewNode.dataset.postId);
  const postTitle = panel ? (panel.dataset.postTitle || '') : '';
  const postUrl = panel ? (panel.dataset.postUrl || window.location.pathname) : window.location.pathname;
  if(window.wajdContentIsTrackable&&!window.wajdContentIsTrackable(window.location.href))return;
  if (!panel || !button || !countNode || !statusNode || !postId) return;

  let db, user, auth;
  try {
    const core = await window.wajdEnsureFirebaseCore();
    db = core.db;
    auth = core.auth;
    user = await core.userPromise;
  } catch (error) {
    console.error('Wajd likes identity:', error);
    statusNode.textContent = 'تعذّر الاتصال بخدمة الإعجاب الآن';
    return;
  }

  const articleRef = doc(db, 'articles', postId);
  const likeRef = doc(db, 'articles', postId, 'likes', user.uid);
  const viewRef = doc(db, 'articles', postId, 'views', user.uid);
  const likeIndexRef = doc(db, 'users', user.uid, 'articleLikes', postId);
  const likeNotificationRef = doc(db, 'adminNotifications', 'like_' + postId);
  let liked = false;
  let count = 0;
  let interactionRevision = 0;

  async function wajdPublishLikeNotification(nextCount) {
    const userEmail = String(user.email || ((user.providerData || []).find(item => item && item.providerId === 'google.com') || {}).email || '').toLowerCase();
    if (userEmail === 'aymanmahdy1996@gmail.com') return;
    const existing = await getDoc(likeNotificationRef);
    if (existing.exists()) {
      await setDoc(likeNotificationRef, { count:nextCount, updatedAt:serverTimestamp(), read:false }, { merge:true });
      return;
    }
    await setDoc(likeNotificationRef, {
      type:'like', articleId:postId, commentScope:'', articleUrl:postUrl, articleTitle:postTitle,
      commentId:'', actorAnonymous:Boolean(user.isAnonymous), actorName:'', preview:'',
      count:nextCount, createdAt:serverTimestamp(), updatedAt:serverTimestamp(), read:false
    });
  }

  // Keep the heart interaction intentionally local to the current Firebase UID.
  // Anonymous and Google identities never claim, migrate or merge likes.
  wajdRenderLike(button, countNode, statusNode, liked, count);
  button.disabled = false;
  button.setAttribute('aria-busy', 'false');

  const stateRevision = interactionRevision;
  Promise.all([getDoc(articleRef), getDoc(likeRef)]).then(([articleSnapshot, likeSnapshot]) => {
    if (stateRevision !== interactionRevision) return;
    liked = likeSnapshot.exists();
    count = articleSnapshot.exists() ? Math.max(0, Number(articleSnapshot.data().likeCount) || 0) : 0;
    wajdRenderLike(button, countNode, statusNode, liked, count);
    if (viewNode) wajdRenderViews(viewNode, articleSnapshot.exists() ? articleSnapshot.data().viewCount : 0);
    button.setAttribute('aria-busy', 'false');
    button.disabled = false;
  }).catch(error => {
    console.warn('Wajd initial like state:', error);
    button.setAttribute('aria-busy', 'false');
    button.disabled = false;
  });

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    const activeUser = auth && auth.currentUser;
    if (!activeUser || activeUser.uid !== user.uid) {
      window.location.reload();
      return;
    }
    user = activeUser;
    interactionRevision += 1;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const toggleLike = () => runTransaction(db, async transaction => {
        const currentArticle = await transaction.get(articleRef);
        const currentLike = await transaction.get(likeRef);
        const currentCount = currentArticle.exists() ? Math.max(0, Number(currentArticle.data().likeCount) || 0) : 0;
        if (currentLike.exists()) {
          if (!currentArticle.exists() || currentCount < 1) {
            transaction.delete(likeRef);
            return { liked:false, count:currentCount, repaired:true };
          }
          transaction.set(articleRef, { likeCount:currentCount - 1 }, { merge:true });
          transaction.delete(likeRef);
          return { liked:false, count:currentCount - 1 };
        }
        transaction.set(articleRef, { likeCount:currentCount + 1 }, { merge:true });
        transaction.set(likeRef, { createdAt:serverTimestamp() });
        return { liked:true, count:currentCount + 1 };
      });
      let result;
      try {
        result = await toggleLike();
      } catch (firstError) {
        const staleRegisteredSession = !user.isAnonymous && /permission-denied|unauthenticated/i.test(String(firstError && (firstError.code || firstError.message) || ''));
        if (!staleRegisteredSession) throw firstError;
        await user.getIdToken(true);
        result = await toggleLike();
      }
      liked = result.liked;
      count = result.count;
      if (liked) { if (window.wajdAudienceRecordExplicitAction) window.wajdAudienceRecordExplicitAction('liked', postId, user); else if (window.wajdJourneyRecordAction) window.wajdJourneyRecordAction('liked', postId); }
      wajdRenderLike(button, countNode, statusNode, liked, count);
      wajdShowLikeToast(liked ? 'شكرًا لإعجابك بهذا المقال' : 'يؤسفنا أنك تراجعت عن إعجابك', !liked);
      if (liked) {
        if (!user.isAnonymous) setDoc(likeIndexRef, { createdAt:serverTimestamp() }).catch(() => {});
        wajdPublishLikeNotification(count).catch(error => console.warn('Wajd like notification:', error));
      } else {
        if (!user.isAnonymous) deleteDoc(likeIndexRef).catch(() => {});
      }
    } catch (error) {
      console.error('Wajd likes:', error);
      try {
        const [freshArticle, freshLike] = await Promise.all([getDoc(articleRef), getDoc(likeRef)]);
        count = freshArticle.exists() ? Math.max(0, Number(freshArticle.data().likeCount) || 0) : 0;
        liked = freshLike.exists();
        wajdRenderLike(button, countNode, statusNode, liked, count);
      } catch (syncError) {}
      wajdShowLikeToast(window.wajdIsQuotaError && window.wajdIsQuotaError(error) ? 'الإعجاب متوقف مؤقتًا بسبب امتلاء حصة قاعدة البيانات' : 'تعذّر تحديث الإعجاب الآن، حاول مرة أخرى', true);
    } finally {
      button.setAttribute('aria-busy', 'false');
      button.disabled = false;
    }
  });

  // Unique-view bookkeeping runs in the background. A failure affects only the
  // counter, never the like control. Registered readers get the same one-time
  // stale-token recovery used by the explicit like/save interactions.
  (async () => {
    try {
      const recordView = () => runTransaction(db, async transaction => {
        const currentArticle = await transaction.get(articleRef);
        const currentView = await transaction.get(viewRef);
        const currentCount = currentArticle.exists() ? Math.max(0, Number(currentArticle.data().viewCount) || 0) : 0;
        if (currentView.exists()) return { viewCount:currentCount };
        transaction.set(articleRef, { viewCount:currentCount + 1 }, { merge:true });
        transaction.set(viewRef, { createdAt:serverTimestamp() });
        return { viewCount:currentCount + 1 };
      });
      const activeUser = auth && auth.currentUser;
      if (!activeUser || activeUser.uid !== user.uid) { if (viewNode) viewNode.setAttribute('aria-busy','false'); return; }
      user = activeUser;
      let viewResult;
      try {
        viewResult = await recordView();
      } catch (firstError) {
        const staleRegisteredSession = !user.isAnonymous && /permission-denied|unauthenticated/i.test(String(firstError && (firstError.code || firstError.message) || ''));
        if (!staleRegisteredSession) throw firstError;
        await user.getIdToken(true);
        const retryUser = auth && auth.currentUser;
        if (!retryUser || retryUser.uid !== user.uid) { if (viewNode) viewNode.setAttribute('aria-busy','false'); return; }
        viewResult = await recordView();
      }
      wajdRenderViews(viewNode, viewResult.viewCount);
    } catch (error) {
      console.error('Wajd views:', error);
      try {
        const fallbackArticle = await getDoc(articleRef);
        wajdRenderViews(viewNode, fallbackArticle.exists() ? fallbackArticle.data().viewCount : 0);
      } catch (fallbackError) {
        if (viewNode) viewNode.setAttribute('aria-busy','false');
      }
    }
  })();
}

wajdInitializeLikes();
