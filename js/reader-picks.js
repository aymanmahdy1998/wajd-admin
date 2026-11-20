(async function(){
  let route;
  try{route=new URL(window.location.href);}catch(error){return;}
  if(!route.searchParams.has('reader-picks'))return;

  document.documentElement.classList.add('wajd-reader-picks-route');
  const host=document.querySelector('.r-r');
  if(!host)return;

  const root=document.createElement('main');
  root.id='wajd-reader-picks-page';
  root.className='wajd-reader-picks-page';
  root.setAttribute('aria-live','polite');
  root.innerHTML='<nav class="wajd-reader-picks-breadcrumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span>←</span><b>مختارات القرّاء</b></nav><section class="wajd-reader-picks-hero"><span class="wajd-reader-picks-eyebrow">ما بقي مع القرّاء</span><h1>مختارات القرّاء</h1><p>نافذة هادئة على الكتابات التي أحبّها القرّاء أو عادوا إليها أكثر، بعيدًا عن زحام الصفحة الرئيسية.</p></section><div class="wajd-reader-picks-tabs" role="tablist" aria-label="نوع المختارات"><button data-reader-picks-tab="liked" role="tab" type="button">الأكثر إعجابًا</button><button data-reader-picks-tab="read" role="tab" type="button">الأكثر قراءة</button></div><section class="wajd-reader-picks-results" aria-busy="true" aria-live="polite"><header><h2 id="wajd-reader-picks-heading">جارٍ إعداد المختارات…</h2><p id="wajd-reader-picks-note">نرتّبها بحسب تفاعل قرّاء وَجْد.</p></header><div class="wajd-reader-picks-grid" id="wajd-reader-picks-grid"><div class="wajd-reader-picks-loading">لحظات ونفتح لك الرف…</div></div></section>';
  host.insertAdjacentElement('afterbegin',root);

  const pageTitle='مختارات القرّاء | وَجْد';
  const pageDescription='الكتابات الأكثر إعجابًا والأكثر قراءة لدى قرّاء وَجْد.';
  document.title=pageTitle;
  [['meta[name="description"]','content',pageDescription],['meta[property="og:title"]','content',pageTitle],['meta[property="og:description"]','content',pageDescription],['meta[property="og:url"]','content',route.href]].forEach(function(item){const node=document.querySelector(item[0]);if(node)node.setAttribute(item[1],item[2]);});

  let sharedFirebase;
  try{
    const bridgeDeadline=Date.now()+15000;
    while((!window.wajdFirebaseModulesPromise||!window.wajdEnsureFirebaseCore)&&Date.now()<bridgeDeadline){
      await new Promise(function(resolve){window.setTimeout(resolve,50);});
    }
    if(!window.wajdFirebaseModulesPromise||!window.wajdEnsureFirebaseCore)throw new Error('firebase-core-unavailable');
    sharedFirebase=await window.wajdFirebaseModulesPromise;
  }catch(error){
    console.error('Wajd reader picks modules:',error);
    root.querySelector('#wajd-reader-picks-heading').textContent='تعذّر فتح المختارات الآن';
    root.querySelector('#wajd-reader-picks-note').textContent='جرّب إعادة تحميل الصفحة بعد قليل.';
    root.querySelector('#wajd-reader-picks-grid').innerHTML='<div class="wajd-reader-picks-empty">لم نتمكن من تشغيل صفحة المختارات.</div>';
    root.querySelector('.wajd-reader-picks-results').setAttribute('aria-busy','false');
    return;
  }
  const { collection, getDocs, limit, orderBy, query }=sharedFirebase;
  const arabicNumber=new Intl.NumberFormat('ar-EG');
  const qaLabel='إجابات تللينوم';
  const rankings={liked:[],read:[]};

  function routeTab(){let value='liked';try{value=new URL(window.location.href).searchParams.get('reader-picks')||'liked';}catch(error){}return value==='read'?'read':'liked';}
  function postId(entry){const value=entry&&entry.id&&entry.id.$t?entry.id.$t:'';const match=value.match(/post-(\d+)$/);return match?match[1]:'';}
  function postUrl(entry){const link=(entry.link||[]).find(function(item){return item.rel==='alternate';});return link?link.href.replace(/^http:/,'https:'):'#';}
  function postImage(entry){const thumbnail=entry.media$thumbnail&&entry.media$thumbnail.url;if(!thumbnail)return '';return thumbnail.replace(/\/s\d+(?:-c)?\//,'/w640-h360-p-k-no-nu/').replace(/=s\d+(?:-c)?$/,'=w640-h360-p-k-no-nu');}
  function isQa(entry){return (entry.category||[]).some(function(item){return String(item.term||'').trim()===qaLabel;});}
  function card(item,index,type){const isViews=type==='read';const article=document.createElement('article');article.className='wajd-liked-card'+(isViews?' wajd-read-card':'');const link=document.createElement('a');link.className='wajd-liked-link';link.href=postUrl(item.post);link.setAttribute('aria-label',item.post.title.$t+'، '+arabicNumber.format(item.count)+(isViews?' مشاهدة':' إعجاب'));const imageWrap=document.createElement('div');imageWrap.className='wajd-liked-image-wrap';const rank=document.createElement('span');rank.className='wajd-liked-rank';rank.textContent=arabicNumber.format(index+1);imageWrap.appendChild(rank);const imageUrl=postImage(item.post);if(imageUrl){const image=document.createElement('img');image.className='wajd-liked-image';image.src=imageUrl;image.alt='';image.loading=index<2?'eager':'lazy';image.decoding='async';imageWrap.appendChild(image);}else{const placeholder=document.createElement('span');placeholder.className='wajd-liked-placeholder';placeholder.textContent='وَجْد';imageWrap.appendChild(placeholder);}const content=document.createElement('div');content.className='wajd-liked-content';const title=document.createElement('h3');title.className='wajd-liked-name';title.textContent=item.post.title.$t;const meta=document.createElement('div');meta.className='wajd-liked-meta';meta.innerHTML=isViews?'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>':'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>';const count=document.createElement('span');count.textContent=arabicNumber.format(item.count)+(isViews?' مشاهدة':' إعجاب');meta.appendChild(count);content.appendChild(title);content.appendChild(meta);link.appendChild(imageWrap);link.appendChild(content);article.appendChild(link);return article;}
  function paint(){const active=routeTab();root.querySelectorAll('[data-reader-picks-tab]').forEach(function(button){const selected=button.dataset.readerPicksTab===active;button.classList.toggle('is-active',selected);button.setAttribute('aria-selected',selected?'true':'false');button.setAttribute('tabindex',selected?'0':'-1');});const heading=root.querySelector('#wajd-reader-picks-heading');const note=root.querySelector('#wajd-reader-picks-note');const grid=root.querySelector('#wajd-reader-picks-grid');heading.textContent=active==='read'?'الأكثر قراءة':'الأكثر إعجابًا';note.textContent=active==='read'?'كتابات عاد إليها القرّاء أكثر من غيرها.':'كتابات اختار القرّاء أن يتركوا عليها علامة إعجاب.';grid.innerHTML='';const items=rankings[active];if(!items.length){grid.innerHTML='<div class="wajd-reader-picks-empty">لا توجد بيانات كافية لعرض هذه القائمة الآن.</div>';}else{items.forEach(function(item,index){grid.appendChild(card(item,index,active));});}root.querySelector('.wajd-reader-picks-results').setAttribute('aria-busy','false');root.setAttribute('aria-live','off');}
  function collect(records,postsById,field){const items=[];records.forEach(function(record){const count=Math.max(0,Number(record.data()[field])||0);const post=postsById.get(record.id);if(post&&count>0&&!isQa(post))items.push({post:post,count:count});});items.sort(function(a,b){return b.count-a.count;});return items.slice(0,5);}
  function selectTab(value,push){const next=value==='read'?'read':'liked';const url=new URL(window.location.href);url.searchParams.set('reader-picks',next);if(push&&window.history&&window.history.pushState)window.history.pushState(null,'',url.href);paint();}

  let allArticlesPromise=null;
  async function loadRanking(db,field){
    try{
      const snapshot=await getDocs(query(collection(db,'articles'),orderBy(field,'desc'),limit(20)));
      return snapshot.docs;
    }catch(error){
      const code=String(error&&error.code||'');
      if(!/failed-precondition/.test(code))throw error;
      console.warn('Wajd reader picks index unavailable for '+field+'; using client-side ordering.');
      if(!allArticlesPromise)allArticlesPromise=getDocs(collection(db,'articles'));
      const snapshot=await allArticlesPromise;
      return snapshot.docs.slice().sort(function(a,b){return (Number(b.data()[field])||0)-(Number(a.data()[field])||0);}).slice(0,20);
    }
  }

  root.addEventListener('click',function(event){const button=event.target.closest('[data-reader-picks-tab]');if(!button)return;selectTab(button.dataset.readerPicksTab,true);});
  root.addEventListener('keydown',function(event){const button=event.target.closest('[data-reader-picks-tab]');if(!button||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const next=button.dataset.readerPicksTab==='liked'?'read':'liked';selectTab(next,true);const target=root.querySelector('[data-reader-picks-tab="'+next+'"]');if(target)target.focus();});
  window.addEventListener('popstate',paint);

  try{
    const core=await window.wajdEnsureFirebaseCore();
    const db=core.db;
    const results=await Promise.all([
      loadRanking(db,'likeCount'),
      loadRanking(db,'viewCount'),
      window.wajdLoadAllFeedEntries('/feeds/posts/summary?alt=json&orderby=published',40)
    ]);
    const postsById=new Map(results[2].map(function(post){return [postId(post),post];}));
    rankings.liked=collect(results[0],postsById,'likeCount');
    rankings.read=collect(results[1],postsById,'viewCount');
    paint();
  }catch(error){
    console.error('Wajd reader picks:',error);
    root.querySelector('#wajd-reader-picks-heading').textContent='تعذّر فتح المختارات الآن';
    root.querySelector('#wajd-reader-picks-note').textContent='جرّب إعادة تحميل الصفحة بعد قليل.';
    root.querySelector('#wajd-reader-picks-grid').innerHTML='<div class="wajd-reader-picks-empty">لم نتمكن من الوصول إلى بيانات القراءة والإعجاب.</div>';
    root.querySelector('.wajd-reader-picks-results').setAttribute('aria-busy','false');
  }
})();
