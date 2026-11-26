const { collection, deleteDoc, deleteUser, doc, getDoc, getDocs, GoogleAuthProvider, query, reauthenticateWithPopup, runTransaction, serverTimestamp, setDoc, where, writeBatch } = await window.wajdFirebaseModulesPromise;
const wajdReaderCore = await window.wajdEnsureFirebaseCore();
const wajdReaderAuth = wajdReaderCore.auth;
const wajdReaderDb = wajdReaderCore.db;
const wajdReaderNumber=new Intl.NumberFormat('ar-EG');
const wajdReaderIsGoogle=user=>Boolean(user&&!user.isAnonymous&&(user.providerData||[]).some(item=>item.providerId==='google.com'));
const wajdReaderEscape=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wajdReaderDate=value=>value&&value.toDate?new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(value.toDate()):'';
const WAJD_READER_BATCH_LIMIT=350;
// v118: كل تعليق يستهلك استدعاءين من حد القواعد (٢٠ للدفعة)، فلا تتجاوز الدفعة ٩ تعليقات.
const WAJD_READER_COMMENT_BATCH_SIZE=9;
let wajdReaderUser=null;
let wajdReaderPrivacy={anonymousByDefault:false,hidePhoto:false};
let wajdReaderAccountDataPromise=null;

function wajdReaderActiveGoogleUser(){
  const active=wajdReaderAuth&&wajdReaderAuth.currentUser;
  return active&&wajdReaderIsGoogle(active)&&wajdReaderUser&&active.uid===wajdReaderUser.uid?active:null;
}

function wajdReaderSafeUrl(value){
  try{
    const url=new URL(String(value||'/'),window.location.origin);
    return url.origin===window.location.origin?url.pathname+url.search:'/';
  }catch(error){
    return '/';
  }
}

function wajdReaderChunks(items,size){
  const chunks=[];
  for(let index=0;index<items.length;index+=size)chunks.push(items.slice(index,index+size));
  return chunks;
}

async function wajdReaderDeleteRefs(refs){
  for(const refsChunk of wajdReaderChunks(refs,WAJD_READER_BATCH_LIMIT)){
    const batch=writeBatch(wajdReaderDb);
    refsChunk.forEach(ref=>batch.delete(ref));
    await batch.commit();
  }
}

function wajdReaderPathAnalyticsRefs(userId,snapshot){
  return snapshot.docs.map(item=>String(item.data().pathId||item.id)).filter(pathId=>pathId&&!pathId.includes('/')).map(pathId=>doc(wajdReaderDb,'readingPathAnalytics',pathId,'participants',userId));
}

function wajdReaderPanel(name){
  document.querySelectorAll('[data-account-panel-content]').forEach(panel=>panel.classList.toggle('is-active',panel.dataset.accountPanelContent===name));
  document.querySelectorAll('.wajd-account-nav-button[data-account-panel]').forEach(button=>button.classList.toggle('is-active',button.dataset.accountPanel===name));
  if(name==='comments') wajdReaderLoadComments();
  if(name==='saved'||name==='history'){
    const root=document.getElementById(name==='saved'?'wajd-account-saved-list':'wajd-account-history-list');
    if(root&&window.wajdRenderReaderCollection)window.wajdRenderReaderCollection(name,root);
  }
}

async function wajdReaderCounts(){
  if(!wajdReaderUser)return;
  if(!wajdReaderIsGoogle(wajdReaderUser)){
    ['wajd-account-saved-count','wajd-account-history-count','wajd-account-stat-saved','wajd-account-stat-history','wajd-account-stat-completed'].forEach(id=>{const node=document.getElementById(id);if(node)node.textContent=wajdReaderNumber.format(0);});
    return;
  }
  let candidate=window.wajdReaderListSummary&&window.wajdReaderListSummary.uid===wajdReaderUser.uid?window.wajdReaderListSummary:null;
  if(candidate&&!(candidate.savedLoaded===true&&candidate.historyLoaded===true)&&window.wajdEnsureReaderLists){
    try{await window.wajdEnsureReaderLists({saved:true,history:true});}
    catch(error){console.warn('Wajd reader lists for account:',error);}
    candidate=window.wajdReaderListSummary&&window.wajdReaderListSummary.uid===wajdReaderUser.uid?window.wajdReaderListSummary:null;
  }
  const summary=candidate&&candidate.savedLoaded===true&&candidate.historyLoaded===true?candidate:null;
  const comments={size:0};
  let values;
  if(summary){
    values={saved:summary.saved,history:summary.history,completed:summary.completed,comments:comments.size};
  }else{
    const [saved,history]=await Promise.all([
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'saved')),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'history'))
    ]);
    values={saved:saved.size,history:history.size,completed:history.docs.filter(item=>item.data().completed===true).length,comments:comments.size};
  }
  [['wajd-account-saved-count',values.saved],['wajd-account-history-count',values.history],['wajd-account-stat-saved',values.saved],['wajd-account-stat-history',values.history],['wajd-account-stat-completed',values.completed]].forEach(([id,value])=>{const node=document.getElementById(id);if(node)node.textContent=wajdReaderNumber.format(value);});
}

async function wajdReaderEnsureAccountData(){
  if(wajdReaderAccountDataPromise)return wajdReaderAccountDataPromise;
  wajdReaderAccountDataPromise=(async()=>{
    wajdReaderUser=wajdReaderUser||await wajdReaderCore.userPromise;
    if(wajdReaderIsGoogle(wajdReaderUser)&&window.wajdEnsureReaderLists){
      try{await window.wajdEnsureReaderLists({saved:true,history:true});}
      catch(error){console.warn('Wajd reader center lists:',error);}
    }
    const jobs=[wajdReaderCounts().catch(error=>console.warn('Wajd reader center counts:',error))];
    if(wajdReaderIsGoogle(wajdReaderUser))jobs.push(wajdReaderLoadPrivacy().catch(error=>console.warn('Wajd reader center privacy:',error)));
    await Promise.all(jobs);
  })();
  return wajdReaderAccountDataPromise;
}

async function wajdReaderLoadComments(){
  const root=document.getElementById('wajd-account-comments');
  if(!root||!wajdReaderUser)return;
  root.innerHTML='<div class="wajd-account-state">جارٍ تحميل مشاركاتك…</div>';
  try{
    const ownership=await getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'comments'));
    const items=(await Promise.all(ownership.docs.map(async owner=>{
      const data=owner.data();
      const publicComment=await getDoc(doc(wajdReaderDb,'articles',data.articleId,'comments',owner.id));
      return publicComment.exists()?{id:owner.id,owner:data,data:publicComment.data()}:null;
    }))).filter(Boolean).sort((a,b)=>{
      const at=a.data.createdAt&&a.data.createdAt.toMillis?a.data.createdAt.toMillis():0;
      const bt=b.data.createdAt&&b.data.createdAt.toMillis?b.data.createdAt.toMillis():0;
      return bt-at;
    });
    if(!items.length){root.innerHTML='<div class="wajd-account-state">لم تكتب أي تعليق أو رد بعد.</div>';return;}
    root.innerHTML=items.map(item=>{
      const url=wajdReaderSafeUrl(item.owner.articleUrl);
      const title=item.owner.articleTitle||'إحدى كتابات وَجْد';
      const kind=item.data.parentId?'رد':'تعليق';
      return '<article class="wajd-account-comment"><a href="'+wajdReaderEscape(url)+'#wajd-comment-'+encodeURIComponent(item.id)+'"><strong>'+kind+' على «'+wajdReaderEscape(title)+'»</strong><p>'+wajdReaderEscape(item.data.body||'')+'</p><time>'+wajdReaderEscape(wajdReaderDate(item.data.createdAt))+'</time></a></article>';
    }).join('');
  }catch(error){console.error('Wajd reader comments:',error);root.innerHTML='<div class="wajd-account-state">تعذّر تحميل تعليقاتك الآن.</div>';}
}

async function wajdReaderLoadPrivacy(){
  if(!wajdReaderUser)return;
  const snapshot=await getDoc(doc(wajdReaderDb,'users',wajdReaderUser.uid,'settings','privacy'));
  if(snapshot.exists())wajdReaderPrivacy={...wajdReaderPrivacy,...snapshot.data()};
  const anonymous=document.getElementById('wajd-privacy-anonymous');
  const photo=document.getElementById('wajd-privacy-hide-photo');
  if(anonymous)anonymous.checked=wajdReaderPrivacy.anonymousByDefault===true;
  if(photo)photo.checked=wajdReaderPrivacy.hidePhoto===true;
}

async function wajdReaderSavePrivacy(){
  const active=wajdReaderActiveGoogleUser();
  if(!active){if(wajdReaderUser)window.location.reload();return;}
  wajdReaderUser=active;
  const anonymous=document.getElementById('wajd-privacy-anonymous');
  const photo=document.getElementById('wajd-privacy-hide-photo');
  wajdReaderPrivacy={anonymousByDefault:Boolean(anonymous&&anonymous.checked),hidePhoto:Boolean(photo&&photo.checked)};
  const write=()=>setDoc(doc(wajdReaderDb,'users',active.uid,'settings','privacy'),{...wajdReaderPrivacy,updatedAt:serverTimestamp()},{merge:true});
  try{await write();}
  catch(firstError){
    const stale=/permission-denied|unauthenticated/i.test(String(firstError&&(firstError.code||firstError.message)||''));
    if(!stale)throw firstError;
    await active.getIdToken(true);
    if(!wajdReaderActiveGoogleUser()){window.location.reload();return;}
    await write();
  }
  window.dispatchEvent(new CustomEvent('wajd-privacy-updated',{detail:wajdReaderPrivacy}));
}

async function wajdReaderClearHistory(){
  const active=wajdReaderActiveGoogleUser();
  if(!active){if(wajdReaderUser)window.location.reload();return;}
  wajdReaderUser=active;
  if(!window.confirm('هل تريد مسح سجل القراءة ومواضع التقدم كلها؟'))return;
  const button=document.getElementById('wajd-account-clear-history');if(button)button.disabled=true;
  try{
    const [snapshot,pathAnalyticsIndex]=await Promise.all([getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'history')),getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'pathAnalytics'))]);
    await wajdReaderDeleteRefs([...wajdReaderPathAnalyticsRefs(wajdReaderUser.uid,pathAnalyticsIndex),...pathAnalyticsIndex.docs.map(item=>item.ref)]);
    await wajdReaderDeleteRefs(snapshot.docs.map(item=>item.ref));
    try{sessionStorage.removeItem('wajd-reader-lists-v1:'+wajdReaderUser.uid);}catch(cacheError){}
    window.location.reload();
  }catch(error){console.error('Wajd clear reader history:',error);window.alert('تعذّر مسح السجل الآن.');if(button)button.disabled=false;}
}

async function wajdReaderRemoveCommentHearts(snapshot){
  for(const heart of snapshot.docs){
    const heartData=heart.data();
    const commentRef=doc(wajdReaderDb,'articles',heartData.articleId,'comments',heartData.commentId);
    await runTransaction(wajdReaderDb,async transaction=>{
      const commentSnapshot=await transaction.get(commentRef);
      if(commentSnapshot.exists()){
        if(heartData.isAdminHeart===true){
          transaction.update(commentRef,{adminHearted:false,adminHeartPhotoURL:''});
        }else{
          const count=Number(commentSnapshot.data().heartCount||0);
          if(count>0)transaction.update(commentRef,{heartCount:count-1});
        }
      }
      if(heartData.notificationId&&heartData.targetInboxKey){
        transaction.delete(doc(wajdReaderDb,'notificationInboxes',heartData.targetInboxKey,'items',heartData.notificationId));
      }
      transaction.delete(heart.ref);
    });
  }
}

async function wajdReaderRemoveArticleInteractions(userId,likeIndex,viewIndex,articles){
  const likeIds=new Set(likeIndex.docs.map(item=>item.id));
  const viewIds=new Set(viewIndex.docs.map(item=>item.id));

  // Reverse indexes cover registered likes and any indexed views. This bounded
  // scan also discovers older or non-indexed interactions before account erasure.
  for(const articleChunk of wajdReaderChunks(articles.docs,30)){
    const legacy=await Promise.all(articleChunk.map(async article=>{
      const [like,view]=await Promise.all([
        getDoc(doc(wajdReaderDb,'articles',article.id,'likes',userId)),
        getDoc(doc(wajdReaderDb,'articles',article.id,'views',userId))
      ]);
      return {id:article.id,like:like.exists(),view:view.exists()};
    }));
    legacy.forEach(item=>{if(item.like)likeIds.add(item.id);if(item.view)viewIds.add(item.id);});
  }

  const remove=async(kind,articleId)=>{
    const counterField=kind==='likes'?'likeCount':'viewCount';
    const indexCollection=kind==='likes'?'articleLikes':'articleViews';
    const articleRef=doc(wajdReaderDb,'articles',articleId);
    const interactionRef=doc(wajdReaderDb,'articles',articleId,kind,userId);
    const indexRef=doc(wajdReaderDb,'users',userId,indexCollection,articleId);
    await runTransaction(wajdReaderDb,async transaction=>{
      const [article,interaction]=await Promise.all([transaction.get(articleRef),transaction.get(interactionRef)]);
      if(interaction.exists()){
        const count=article.exists()?Math.max(0,Number(article.data()[counterField])||0):0;
        if(article.exists()&&count>0)transaction.set(articleRef,{[counterField]:count-1},{merge:true});
        transaction.delete(interactionRef);
      }
      transaction.delete(indexRef);
    });
  };

  const jobs=[...Array.from(likeIds,id=>['likes',id]),...Array.from(viewIds,id=>['views',id])];
  for(const jobChunk of wajdReaderChunks(jobs,12))await Promise.all(jobChunk.map(([kind,id])=>remove(kind,id)));
}

async function wajdReaderAnonymizeComments(snapshot){
  for(const ownersChunk of wajdReaderChunks(snapshot.docs,WAJD_READER_COMMENT_BATCH_SIZE)){
    const publicComments=await Promise.all(ownersChunk.map(owner=>{
      const ownerData=owner.data();
      return getDoc(doc(wajdReaderDb,'articles',ownerData.articleId,'comments',owner.id));
    }));
    const batch=writeBatch(wajdReaderDb);
    ownersChunk.forEach((owner,index)=>{
      const publicSnapshot=publicComments[index];
      if(publicSnapshot.exists()){
        const data=publicSnapshot.data();
        batch.update(publicSnapshot.ref,{
          isAnonymous:true,
          displayName:'',
          photoURL:'',
          anonymousKey:data.notificationKey||data.anonymousKey||''
        });
      }
      batch.delete(doc(wajdReaderDb,'adminNotifications',owner.id));
      batch.delete(owner.ref);
    });
    await batch.commit();
  }
}

async function wajdReaderDeleteNotificationInboxes(aliasSnapshot,inboxIndexSnapshot){
  const entries=new Map();
  const add=(key,ref)=>{
    key=String(key||'');
    if(!key){return;}
    if(!entries.has(key))entries.set(key,[]);
    if(ref)entries.get(key).push(ref);
  };
  aliasSnapshot.docs.forEach(alias=>add(alias.data().aliasKey,alias.ref));
  inboxIndexSnapshot.docs.forEach(index=>add(index.id,index.ref));
  for(const [inboxKey,indexRefs] of entries){
    const inboxItems=await getDocs(collection(wajdReaderDb,'notificationInboxes',inboxKey,'items'));
    await wajdReaderDeleteRefs(inboxItems.docs.map(item=>item.ref));
    const batch=writeBatch(wajdReaderDb);
    batch.delete(doc(wajdReaderDb,'notificationInboxes',inboxKey));
    indexRefs.forEach(ref=>batch.delete(ref));
    await batch.commit();
  }
  const orphanRefs=[
    ...aliasSnapshot.docs.filter(alias=>!String(alias.data().aliasKey||'')).map(alias=>alias.ref),
    ...inboxIndexSnapshot.docs.filter(index=>!String(index.id||'')).map(index=>index.ref)
  ];
  await wajdReaderDeleteRefs(orphanRefs);
}

async function wajdReaderDeletePrivateData(userId,snapshots){
  const pathAnalyticsRefs=wajdReaderPathAnalyticsRefs(userId,snapshots.pathAnalyticsIndex);
  await wajdReaderDeleteRefs([...pathAnalyticsRefs,...snapshots.pathAnalyticsIndex.docs.map(item=>item.ref)]);
  await wajdReaderDeleteRefs([
    ...snapshots.journeyVisits.docs.map(item=>item.ref),
    ...snapshots.audienceSessions.docs.map(item=>item.ref),
    ...snapshots.audienceRecoveryDeltas.docs.map(item=>item.ref),
    ...snapshots.saved.docs.map(item=>item.ref),
    ...snapshots.history.docs.map(item=>item.ref),
    doc(wajdReaderDb,'users',userId,'settings','privacy'),
    doc(wajdReaderDb,'audienceVisitors',userId),
    doc(wajdReaderDb,'profiles',userId)
  ]);
}

function wajdReaderClearAccountCache(userId){
  try{
    localStorage.removeItem('wajd-account-identity-v1');
    localStorage.removeItem('wajd-profile-refresh-v1:'+userId);
    localStorage.removeItem('wajd-audience-session-v1:'+userId);
    localStorage.removeItem('wajd-audience-active-tab-v1:'+userId);
    localStorage.removeItem('wajd-audience-pending-v106:'+userId);
    localStorage.removeItem('wajd-early-entry-queue-v106');
    localStorage.removeItem('wajd-journey-source-v100:'+userId);
    sessionStorage.removeItem('wajd-journey-previous-v100:'+userId);
    sessionStorage.removeItem('wajd-reader-lists-v1:'+userId);
    sessionStorage.removeItem('wajd-comment-hearts-v1:'+userId);
    for(let index=localStorage.length-1;index>=0;index-=1){
      const key=localStorage.key(index);
      if(key&&key.indexOf('wajd-linked-reader-recovery-v108:'+userId+':')===0)localStorage.removeItem(key);
    }
  }catch(cacheError){}
}

async function wajdReaderDeleteAccount(){
  const active=wajdReaderActiveGoogleUser();
  if(!active){if(wajdReaderUser)window.location.reload();return;}
  wajdReaderUser=active;
  if(!window.confirm('سيُحذف حسابك ومحفوظاتك وسجل قراءتك وإعجاباتك ومشاهداتك وإعداداتك نهائيًا، وتتحول تعليقاتك إلى مجهولة. هل تريد المتابعة؟'))return;
  const confirmation=window.prompt('للتأكيد اكتب كلمة: حذف');
  if(confirmation!=='حذف')return;
  const button=document.getElementById('wajd-account-delete-data');if(button)button.disabled=true;
  let stage='إعادة تأكيد الهوية';
  try{
    await reauthenticateWithPopup(wajdReaderUser,new GoogleAuthProvider());
    if(window.wajdStopAudienceTracking)await window.wajdStopAudienceTracking();
    stage='قراءة بيانات الحساب';
    const [saved,history,comments,aliases,commentInboxes,commentHearts,pathAnalyticsIndex,audienceSessions,journeyVisits,audienceRecoveryDeltas,articleLikes,articleViews,articles]=await Promise.all([
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'saved')),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'history')),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'comments')),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'commentAliases')),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'commentInboxes')),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'commentHearts')),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'pathAnalytics')),
      getDocs(collection(wajdReaderDb,'audienceVisitors',wajdReaderUser.uid,'audienceSessions')),
      getDocs(query(collection(wajdReaderDb,'audienceJourneyVisits'),where('userId','==',wajdReaderUser.uid))),
      getDocs(query(collection(wajdReaderDb,'audienceRecoveryDeltas'),where('userId','==',wajdReaderUser.uid))),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'articleLikes')),
      getDocs(collection(wajdReaderDb,'users',wajdReaderUser.uid,'articleViews')),
      getDocs(collection(wajdReaderDb,'articles'))
    ]);
    const snapshots={saved,history,comments,aliases,commentInboxes,commentHearts,pathAnalyticsIndex,audienceSessions,journeyVisits,audienceRecoveryDeltas,articleLikes,articleViews};
    stage='إزالة الإعجابات والمشاهدات';
    await wajdReaderRemoveArticleInteractions(wajdReaderUser.uid,articleLikes,articleViews,articles);
    stage='إزالة تفاعلات التعليقات';
    await wajdReaderRemoveCommentHearts(commentHearts);
    stage='تحويل التعليقات إلى مجهولة';
    await wajdReaderAnonymizeComments(comments);
    stage='حذف صناديق الإشعارات';
    await wajdReaderDeleteNotificationInboxes(aliases,commentInboxes);
    stage='حذف البيانات الخاصة';
    if(window.wajdStopAudienceTracking)window.wajdStopAudienceTracking();
    await wajdReaderDeletePrivateData(wajdReaderUser.uid,snapshots);
    wajdReaderClearAccountCache(wajdReaderUser.uid);
    stage='حذف هوية تسجيل الدخول';
    await deleteUser(wajdReaderUser);
    window.location.assign('/');
  }catch(error){
    console.error('Wajd delete reader data:',error);
    const cancelled=error&&error.code==='auth/popup-closed-by-user';
    window.alert(cancelled?'تم إلغاء العملية.':'توقفت العملية أثناء «'+stage+'». يمكنك الضغط على الحذف مرة أخرى لاستكمال ما تبقى بأمان.');
    if(button)button.disabled=false;
  }
}

function wajdReaderBindAccount(){
  const accountOpen=document.getElementById('wajd-account-open');
  if(accountOpen)accountOpen.addEventListener('click',()=>wajdReaderEnsureAccountData().catch(error=>console.error('Wajd reader center:',error)));
  const accountOverlay=document.getElementById('wajd-account-overlay');
  if(accountOverlay)accountOverlay.addEventListener('click',event=>{const button=event.target.closest('[data-account-panel]');if(button)wajdReaderPanel(button.dataset.accountPanel);});
  document.querySelectorAll('[data-account-open]').forEach(button=>button.addEventListener('click',()=>{
    const target=button.dataset.accountOpen;
    const id=target==='saved'?'wajd-saved-open':target==='history'?'wajd-history-open':'wajd-notifications-open';
    const opener=document.getElementById(id);if(opener)opener.click();
  }));
  ['wajd-privacy-anonymous','wajd-privacy-hide-photo'].forEach(id=>{const input=document.getElementById(id);if(input)input.addEventListener('change',()=>wajdReaderSavePrivacy().catch(error=>console.error('Wajd privacy save:',error)));});
  const clear=document.getElementById('wajd-account-clear-history');if(clear)clear.addEventListener('click',wajdReaderClearHistory);
  const remove=document.getElementById('wajd-account-delete-data');if(remove)remove.addEventListener('click',wajdReaderDeleteAccount);
  window.addEventListener('wajd-reader-data-updated',()=>{
    if(!wajdReaderAccountDataPromise)return;
    wajdReaderCounts().catch(error=>console.warn('Wajd reader counts refresh:',error));
    const active=document.querySelector('[data-account-panel-content].is-active');
    if(active&&(active.dataset.accountPanelContent==='saved'||active.dataset.accountPanelContent==='history'))wajdReaderPanel(active.dataset.accountPanelContent);
  });
}

function wajdReadingSetup(){
  const body=document.querySelector('.post .post-body,.post-body');
  const panel=document.getElementById('wajd-like-panel');
  const postId=panel&&panel.dataset.postId;
  if(window.wajdContentIsTrackable&&!window.wajdContentIsTrackable(window.location.href))return;
  if(!body||!postId)return;
  const progressBar=document.getElementById('wajd-reading-progress');
  const storageKey='wajd-reading-preferences-v1';
  const readerFonts={
    tajawal:{family:'Tajawal'},
    cairo:{family:'Cairo',url:'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap'},
    almarai:{family:'Almarai',url:'https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&display=swap'},
    'noto-naskh':{family:'Noto Naskh Arabic'},
    amiri:{family:'Amiri',url:'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap'}
  };
  const loadReaderFont=key=>{
    const font=readerFonts[key];
    if(!font||!font.url||document.getElementById('wajd-reader-font-'+key))return;
    const link=document.createElement('link');link.id='wajd-reader-font-'+key;link.rel='stylesheet';link.href=font.url;document.head.appendChild(link);
  };
  let settings={font:2,line:2,quiet:false,typeface:'tajawal'};
  try{settings={...settings,...JSON.parse(localStorage.getItem(storageKey)||'{}')};}catch(error){}
  const applySettings=()=>{
    if(!Object.prototype.hasOwnProperty.call(readerFonts,settings.typeface))settings.typeface='tajawal';
    loadReaderFont(settings.typeface);
    document.body.setAttribute('data-wajd-reading-font',settings.typeface);
    [1,2,3,4].forEach(value=>document.body.classList.toggle('wajd-reading-size-'+value,settings.font===value));
    [1,2,3].forEach(value=>document.body.classList.toggle('wajd-reading-line-'+value,settings.line===value));
    document.body.classList.toggle('wajd-quiet-reading',settings.quiet===true);
    const quiet=document.querySelector('[data-reading-action="quiet"]');if(quiet){quiet.classList.toggle('is-active',settings.quiet===true);quiet.setAttribute('aria-pressed',settings.quiet?'true':'false');}
    const fontButton=document.querySelector('[data-reading-action="font-family"]');if(fontButton)fontButton.classList.toggle('is-active',settings.typeface!=='tajawal');
    document.querySelectorAll('[data-reading-font]').forEach(option=>{const selected=option.dataset.readingFont===settings.typeface;option.classList.toggle('is-selected',selected);option.setAttribute('aria-checked',selected?'true':'false');});
    localStorage.setItem(storageKey,JSON.stringify(settings));
  };
  const fontPicker=document.getElementById('wajd-font-picker');
  const fontTrigger=document.querySelector('[data-reading-action="font-family"]');
  const setFontPickerOpen=open=>{
    if(!fontPicker||!fontTrigger)return;
    fontPicker.classList.toggle('is-open',open);
    fontPicker.setAttribute('aria-hidden',open?'false':'true');
    fontTrigger.setAttribute('aria-expanded',open?'true':'false');
    fontTrigger.classList.toggle('is-active',open||settings.typeface!=='tajawal');
  };
  applySettings();
  document.querySelectorAll('[data-reading-action]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.readingAction;
    if(action==='font-family'){
      Object.keys(readerFonts).forEach(loadReaderFont);
      setFontPickerOpen(!fontPicker||!fontPicker.classList.contains('is-open'));
      return;
    }
    if(action==='font-down')settings.font=Math.max(1,settings.font-1);
    if(action==='font-up')settings.font=Math.min(4,settings.font+1);
    if(action==='line-height')settings.line=settings.line>=3?1:settings.line+1;
    if(action==='quiet')settings.quiet=!settings.quiet;
    applySettings();updateProgress();
  }));
  document.querySelectorAll('[data-reading-font]').forEach(option=>option.addEventListener('click',()=>{
    if(!Object.prototype.hasOwnProperty.call(readerFonts,option.dataset.readingFont))return;
    settings.typeface=option.dataset.readingFont;applySettings();setFontPickerOpen(false);updateProgress();fontTrigger&&fontTrigger.focus();
  }));
  document.addEventListener('click',event=>{const toolbar=document.getElementById('wajd-reading-toolbar');if(fontPicker&&fontPicker.classList.contains('is-open')&&toolbar&&!toolbar.contains(event.target))setFontPickerOpen(false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&fontPicker&&fontPicker.classList.contains('is-open')){setFontPickerOpen(false);fontTrigger&&fontTrigger.focus();}});
  // On phones the toolbar sits over the last lines: tuck it away while the reader scrolls down,
  // bring it back on any scroll up or once the article text has ended.
  const readingToolbar=document.getElementById('wajd-reading-toolbar');
  if(readingToolbar){
    const narrow=window.matchMedia('(max-width:720px)');let toolbarLastY=window.scrollY;
    window.addEventListener('scroll',()=>{
      const y=window.scrollY,dy=y-toolbarLastY;if(Math.abs(dy)<6)return;toolbarLastY=y;
      const textEnded=body.getBoundingClientRect().bottom<window.innerHeight;
      const pickerOpen=fontPicker&&fontPicker.classList.contains('is-open');
      // v122: once the article text is well behind, the font tools have no use and only cover the end.
      const pastText=body.getBoundingClientRect().bottom<window.innerHeight*.45;
      readingToolbar.classList.toggle('is-tucked',narrow.matches&&!pickerOpen&&(pastText||(dy>0&&y>240&&!textEnded)));
    },{passive:true});
  }
  const text=(body.innerText||body.textContent||'').trim();
  const words=text?text.split(/\s+/).filter(Boolean).length:0;
  const codeWords=Array.from(body.querySelectorAll('pre,code')).reduce((sum,node)=>sum+(node.textContent||'').trim().split(/\s+/).filter(Boolean).length,0);
  const seconds=(words/180)*60+(codeWords/90)*60+body.querySelectorAll('img').length*11+body.querySelectorAll('h2,h3,h4').length*3;
  const minutes=Math.max(1,Math.ceil(seconds/60));
  const readTime=document.getElementById('rdTime');if(readTime)readTime.textContent=wajdReaderNumber.format(minutes)+' '+(minutes===1?'دقيقة للقراءة':'دقائق للقراءة');
  let completed=false;
  let lastSavedProgress=-1;
  let lastSavedAt=0;
  let lastSavedCompleted=false;
  // v122: no manual «أكملت القراءة» box. Completion is recorded automatically (see completeAtArticleEnd).
  const renderComplete=()=>{};
  const metrics=()=>{
    const rect=body.getBoundingClientRect();
    const start=window.scrollY+rect.top;
    const end=start+body.offsetHeight-window.innerHeight;
    return{progress:Math.max(0,Math.min(1,(window.scrollY-start)/Math.max(1,end-start))),scrollY:Math.max(0,Math.round(window.scrollY))};
  };
  const activeGoogleUser=()=>{
    const active=wajdReaderAuth&&wajdReaderAuth.currentUser;
    return active&&wajdReaderIsGoogle(active)&&wajdReaderUser&&active.uid===wajdReaderUser.uid?active:null;
  };
  const saveProgress=async force=>{
    const activeUser=activeGoogleUser();
    if(!activeUser)return false;
    const current=metrics();
    const historyData={progress:completed?1:Math.round(current.progress*1000)/1000,scrollY:current.scrollY,completed,articleTitle:panel.dataset.postTitle||document.title,articleUrl:panel.dataset.postUrl||window.location.href,updatedAt:serverTimestamp()};
    const progressDelta=Math.abs(historyData.progress-lastSavedProgress);
    const completionChanged=completed!==lastSavedCompleted;
    if(!force&&(progressDelta<.10||Date.now()-lastSavedAt<60000))return false;
    if(force&&lastSavedAt&&!completionChanged&&progressDelta<.05)return false;
    const historyRef=doc(wajdReaderDb,'users',activeUser.uid,'history',postId);
    const writeProgress=()=>setDoc(historyRef,historyData,{merge:true});
    try{
      await writeProgress();
    }catch(firstError){
      const staleSession=/permission-denied|unauthenticated/i.test(String(firstError&&(firstError.code||firstError.message)||''));
      if(!staleSession)throw firstError;
      const retryUser=activeGoogleUser();
      if(!retryUser)return false;
      await retryUser.getIdToken(true);
      if(!activeGoogleUser())return false;
      await writeProgress();
    }
    if(window.wajdUpdateReaderHistoryCache)window.wajdUpdateReaderHistoryCache(activeUser.uid,postId,historyData);
    lastSavedProgress=historyData.progress;
    lastSavedCompleted=completed;
    lastSavedAt=Date.now();
    return true;
  };
  // v120: one definition of "completed" everywhere. core.js decides it (end reached + enough time with
  // the text on screen) and announces it; the Google reading history follows that instead of
  // completing as soon as the reader scrolls to the end.
  const readingCompleted=()=>Boolean(window.wajdCompletedArticleIds&&window.wajdCompletedArticleIds.has(String(postId)));
  window.addEventListener('wajd-article-completed',event=>{if(event.detail&&String(event.detail.articleId)===String(postId))completeAtArticleEnd();});
  const completeAtArticleEnd=()=>{
    if(completed||!activeGoogleUser()||!readingCompleted())return false;
    completed=true;renderComplete();
    saveProgress(true).then(saved=>{
      if(saved){if(window.wajdAudienceRecordExplicitAction)window.wajdAudienceRecordExplicitAction('completed',postId);else if(window.wajdJourneyRecordAction)window.wajdJourneyRecordAction('completed',postId);}
      else{completed=false;renderComplete();}
    }).catch(error=>{completed=false;renderComplete();console.warn('Wajd automatic reading completion:',error);});
    return true;
  };
  // Reading position kept on this device for every reader (signed-in readers also have it in Firestore).
  const localPosKey='wajd-reading-pos-v1';
  const readLocalPos=()=>{try{const all=JSON.parse(localStorage.getItem(localPosKey)||'{}');return all&&typeof all==='object'?all:{};}catch(error){return{};}};
  let localPosTimer=0;
  const rememberLocalPos=progress=>{
    if(progress<.04&&!completed)return;
    window.clearTimeout(localPosTimer);
    localPosTimer=window.setTimeout(()=>{try{
      const all=readLocalPos();
      if(completed||progress>=.97)delete all[postId];else all[postId]={p:Math.round(progress*1000)/1000,t:Date.now()};
      Object.keys(all).sort((a,b)=>(all[b].t||0)-(all[a].t||0)).slice(60).forEach(key=>delete all[key]);
      localStorage.setItem(localPosKey,JSON.stringify(all));
    }catch(error){}},1500);
  };
  const scrollToProgress=progress=>{
    const rect=body.getBoundingClientRect();
    const start=window.scrollY+rect.top;
    const end=start+body.offsetHeight-window.innerHeight;
    window.scrollTo({top:Math.max(0,start+progress*Math.max(1,end-start)),behavior:'smooth'});
  };
  const offerLocalResume=()=>{
    if(window.location.hash||window.scrollY>=80)return;
    const saved=readLocalPos()[postId];const progress=saved&&Number(saved.p);
    if(!(progress>.04&&progress<.97))return;
    const chip=document.createElement('button');
    chip.type='button';chip.className='wajd-resume-chip';
    chip.textContent='أكمل من حيث توقفت · '+wajdReaderNumber.format(Math.round(progress*100))+'٪';
    let removed=false;
    const remove=()=>{if(removed)return;removed=true;window.removeEventListener('scroll',onScroll);chip.classList.remove('is-visible');window.setTimeout(()=>chip.remove(),300);};
    const onScroll=()=>{if(window.scrollY>400)remove();};
    chip.addEventListener('click',()=>{scrollToProgress(progress);remove();});
    document.body.appendChild(chip);
    if(window.getComputedStyle(chip).position!=='fixed'){chip.remove();return;}
    window.requestAnimationFrame(()=>chip.classList.add('is-visible'));
    window.addEventListener('scroll',onScroll,{passive:true});
    window.setTimeout(remove,15000);
  };
  const updateProgress=()=>{
    const current=metrics();if(progressBar)progressBar.style.width=(current.progress*100).toFixed(1)+'%';
    rememberLocalPos(current.progress);
    if(completeAtArticleEnd(current)){window.clearTimeout(updateProgress.timer);return;}
    window.clearTimeout(updateProgress.timer);updateProgress.timer=window.setTimeout(()=>saveProgress(false).catch(error=>console.warn('Wajd reading progress:',error)),5000);
  };
  window.addEventListener('scroll',updateProgress,{passive:true});window.addEventListener('resize',updateProgress,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveProgress(true).catch(()=>{});});
  (async()=>{
    try{
      const user=wajdReaderAuth.currentUser||await wajdReaderCore.userPromise;wajdReaderUser=user;
      if(!wajdReaderIsGoogle(user)){
        offerLocalResume();
        updateProgress();
        return;
      }
      const snapshot=await getDoc(doc(wajdReaderDb,'users',user.uid,'history',postId));
      if(snapshot.exists()){
        const data=snapshot.data();completed=data.completed===true;lastSavedCompleted=completed;lastSavedProgress=Math.max(0,Math.min(1,Number(data.progress)||0));lastSavedAt=Date.now();renderComplete();
        if(!window.location.hash&&window.scrollY<80&&!completed&&Number(data.progress)>.04&&Number(data.progress)<.97){
          window.setTimeout(()=>{
            const rect=body.getBoundingClientRect();
            const start=window.scrollY+rect.top;
            const end=start+body.offsetHeight-window.innerHeight;
            window.scrollTo({top:Math.max(0,start+Number(data.progress)*Math.max(1,end-start)),behavior:'smooth'});
          },500);
        }
      }
      const pending=window.wajdReadPostLoginAction?window.wajdReadPostLoginAction(false):null;
      if(pending&&pending.action==='complete'&&pending.postId===postId){
        window.wajdReadPostLoginAction(true);completed=true;renderComplete();await saveProgress(true);
      }
      updateProgress();
    }catch(error){console.warn('Wajd restore reading position:',error);}
  })();
}

wajdReaderBindAccount();
wajdReaderCore.userPromise.then(user=>{wajdReaderUser=user;}).catch(error=>console.error('Wajd reader identity:',error));
wajdReadingSetup();
