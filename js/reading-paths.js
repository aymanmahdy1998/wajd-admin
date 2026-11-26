const { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } = await window.wajdFirebaseModulesPromise;
/* v119: reading paths live in this file (edited by Claude on request), not in Firestore.
   Each path: items = the core route (4-6, ordered), extras = more writings on the same meaning.
   Path ids must keep matching a published readingPaths doc, or path analytics writes are refused. */
const wajdPathsDefaults=[
 {id:'start-here',title:'ابدأ من هنا',slug:'start-here',description:'مدخل قصير يعرّفك إلى صوت وَجْد: لماذا يكتب، وكيف ينظر إلى نفسه، وإلى الدين، وإلى الناس، ثم يضحك قليلًا.',promise:'تخرج وأنت تعرف من يكتب هنا وكيف ينظر إلى نفسه والناس والدين والحياة.',kind:'path',status:'published',featured:true,order:1,duration:17,items:[
  ['لماذا أكتب','https://www.wajd.blog/2024/09/purpose-of-writing.html'],['كيف لا أتعجّل على أكل قطعة المارشملو؟','https://www.wajd.blog/2026/09/how-not-to-rush-the-marshmallow.html'],['حوار على الدرج','https://www.wajd.blog/2026/08/conversation-on-the-stairs.html'],['مناسبة سعيدة','https://www.wajd.blog/2026/04/blog-post.html'],['كل المكتئبات جميلات','https://www.wajd.blog/2026/03/all-depressed-women-are-beautiful.html']],extras:[
  ['القدرة على التعبير','https://www.wajd.blog/2026/01/ability-to-express-feelings.html'],['ما الفائدة من طي الغطاء بعد الاستيقاظ من النوم؟','https://www.wajd.blog/2025/08/why-fold-the-blanket-after-waking-up.html'],['علبة تونة','https://www.wajd.blog/2026/08/a-can-of-tuna.html']]},
 {id:'dont-eat-yourself',title:'لا تأكل نفسك',slug:'dont-eat-yourself',description:'لمن يرهقه القلق والوسواس والمقارنة واللوم والخوف من أن يضيع أثره.',promise:'تنتقل من التفكير الزائد ومراقبة نفسك بعين قاسية إلى فهم تكوينها والعمل معها برفق وصدق.',kind:'path',status:'published',featured:true,order:2,duration:18,items:[
  ['عن التفكير في التفكير','https://www.wajd.blog/2026/08/thinking-about-thinking.html'],['إلقاء الساندوتش','https://www.wajd.blog/2026/08/throwing-away-the-sandwich.html'],['ابتلاء الجينات.. أن تقاوم ما جُبلت عليه','https://www.wajd.blog/2026/08/the-genetic-trial-resisting-what-you-were-born-with.html'],['الابتلاء: قدرٌ إنساني مشترك','https://www.wajd.blog/2021/05/the-affliction.html'],['اذكروني عند موتي (اذكرني بخير)','https://www.wajd.blog/2024/04/remember-me.html']],extras:[
  ['عن التشافي والحكمة: انطباعاتي عن المؤتمر السنوي الثالث عشر للطب النفسي','https://www.wajd.blog/2026/09/my-impressions-on-the-13th-psychiatry-conference.html'],['صديقي لا تأكل نفسك','https://www.wajd.blog/2024/05/blog-post.html'],['حب وراء الأشجار','https://www.wajd.blog/2024/09/love-behind-the%20trees.html'],['الخصومة.. والنفس الإنسانية','https://www.wajd.blog/2023/12/adversity-human-soul.html']]},
 {id:'fear-and-hope',title:'بين الخوف والرجاء',slug:'fear-and-hope',description:'رحلة من النية إلى العبادة اليومية ومجاهدة الذنب والابتلاء، بعيدًا عن تحويل الدين إلى عدّاد مهام أو ضمانات رياضية.',promise:'ترى الطريق إلى الله علاقة يومية فيها عمل القلب ومجاهدة بلا اغترار ولا قنوط.',kind:'path',status:'published',featured:true,order:3,duration:29,items:[
  ['النية: هل نخدع الله أم نخدع أنفسنا؟','https://www.wajd.blog/2026/09/the-meaning-of-intention.html'],['عن حكمة التقطيع.. كيف تُنقذنا الصلاة من الاحتراق؟','https://www.wajd.blog/2025/05/the-wisdom-of-intervals-how-prayer-saves-us-from-burning-out.html'],['بين اثنين','https://www.wajd.blog/2023/12/between-good-and-evil.html'],['إنك إن تفتحه تلجه','https://www.wajd.blog/2025/07/if-you-open-it-you-will-enter-it.html'],['الابتلاء','https://www.wajd.blog/2025/07/life-trials.html'],['خلفة لمن أراد أن يذكر','https://www.wajd.blog/2026/08/alternation-for-those-who-wish-to-remember.html']],extras:[
  ['أوتاد المسجد','https://www.wajd.blog/2021/01/mosque-pegs.html'],['اللقاء الأخير','https://www.wajd.blog/2025/08/the-last-meeting.html'],['البئر القادم','https://www.wajd.blog/2024/03/the-next-well.html'],['ستموتين يا حلوة','https://www.wajd.blog/2024/04/you-will-die.html'],['"الأسماء والصفات.. والثانوية العامة"','https://www.wajd.blog/2021/08/names-and-attributes.html'],['الدعاء','https://www.wajd.blog/2019/12/prayer.html']]},
 {id:'leave-the-dispute-grinder',title:'اخرج من مفرمة الخلاف',slug:'leave-the-dispute-grinder',description:'لمن أتعبته معارك التدين على مواقع التواصل، والتصنيفات، وتقديس الأشخاص، والرغبة في حسم كل خلاف.',promise:'تعود إلى مركز أبسط: تعرف ما يلزمك وتميّز الدين عن المتحدثين باسمه.',kind:'path',status:'published',featured:true,order:4,duration:36,items:[
  ['الاختلاف','https://www.wajd.blog/2021/02/the-difference.html'],['كيف يصنع الجهل الديني ملحدًا؟','https://www.wajd.blog/2021/02/blog-post.html'],['لماذا يحرّم الدين كل شيء؟','https://www.wajd.blog/2026/08/why-does-religion-forbid-everything.html'],['سفاح الكوفة','https://www.wajd.blog/2023/12/butcher-of-kufa.html'],['المرأة الجميلة والأشاعرة والسلفية المعاصرة وإنعام سالوسة','https://www.wajd.blog/2026/08/the-beautiful-woman-asharis-contemporary-salafis-and-inaam-salousa.html'],['ادعاء الرحمة','https://www.wajd.blog/2024/04/claiming-mercy.html']],extras:[
  ['حين لا يكون الأسقف قديساً.. كيف يبحث الصادق عن الحق؟','https://www.wajd.blog/2026/11/when-the-bishop-is-not-a-saint.html'],['كل أمتي معافى','https://www.wajd.blog/2022/12/the-secret.html'],['التغير لاجتلاب طبقة جديدة','https://www.wajd.blog/2022/12/change-for-others.html'],['غرور العقل وضعف الإنسان','https://www.wajd.blog/2026/08/arrogance-of-reason-and-human-weakness.html'],['رؤية شرعية: إلحاد اجتماعي','https://www.wajd.blog/2026/11/Social%20Atheism.html']]},
 {id:'modern-life-grinder',title:'في مفرمة العصر',slug:'modern-life-grinder',description:'عن التعليم والعمل والبيروقراطية واللهث خلف النجاة في واقع يطلب منك دائمًا مزيدًا من نفسك.',promise:'ترى أن تعبك ليس فشلًا فرديًا فقط، ثم تختار ما يستحق أن تبذل فيه عمرك.',kind:'path',status:'published',featured:true,order:5,duration:21,items:[
  ['هترتاح بعد الثانوية','https://www.wajd.blog/2024/09/you-will-rest-in.html'],['يعمل إيه التعليم في وطن ضايع؟','https://www.wajd.blog/2023/12/education-in-lost-homeland.html'],['محلات الأحذية.. والتعليم في مصر','https://www.wajd.blog/2021/07/shoe-stores-education-in-egypt.html'],['التعاقدية','https://www.wajd.blog/2022/12/bureaucratic-contractual.html'],['اسمه سعيد','https://www.wajd.blog/2023/12/his-name-happy.html'],['دع القلق.. وودع الحياة!','https://www.wajd.blog/2026/08/let-go-of-worry-and-bid-life-farewell.html']],extras:[
  ['كيف تحصل على وظيفة في LinkedIn','https://www.wajd.blog/2023/05/linkedin-job.html'],['معضلة حمو بيكا','https://www.wajd.blog/2022/12/hamou-Becas-dilemma.html'],['نظرية المؤامرة','https://www.wajd.blog/2023/02/conspiracy-theory.html'],['سؤال لا ينتظر إجابة!','https://www.wajd.blog/2026/08/a-question-that-expects-no-answer.html']]},
 {id:'relationships-not-equations',title:'العلاقات ليست معادلات',slug:'relationships-not-equations',description:'من وهم الحب السريع إلى الاختيار، ولوم الطرف الآخر، والخيانة، والطلاق بمعروف.',promise:'تتخفف من أحكام فيسبوك والاختبارات الخفية، وتنظر إلى العلاقات بوصفها حياة مركبة.',kind:'path',status:'published',featured:true,order:6,duration:21,items:[
  ['الحب في الدراسة','https://www.wajd.blog/2019/11/love-in-study.html'],['شَرَك الحب','https://www.wajd.blog/2023/12/about-love.html'],['الخديعة','https://www.wajd.blog/2026/08/the-trap-of-first-impressions.html'],['إنك لغوي مبين','https://www.wajd.blog/2026/08/the-problem-is-always-someone-else.html'],['الخيانة','https://www.wajd.blog/2025/06/betrayal.html'],['إمساك بمعروف','https://www.wajd.blog/2026/06/honourable-retention.html']],extras:[
  ['قيمة السر','https://www.wajd.blog/2023/12/secret-value.html'],['حكم الفيس بوك','https://www.wajd.blog/2021/08/facebook-wisdom.html'],['زوج وزوجته','https://www.wajd.blog/2021/08/husband-and-wife.html'],['دورات الزواج','https://www.wajd.blog/2019/11/about-marriage-courses.html'],['لماذا يخاف الرجال من مسألة طاعة الزوج؟','https://www.wajd.blog/2026/08/blog-post_21.html'],['عن المرأة: بين إثبات الذات واستنزاف الطاقات','https://www.wajd.blog/2026/08/women-between-self-actualization-and-burnout.html'],['صديقي المغفّل','https://www.wajd.blog/2021/08/my-stupid-friend.html'],['المرأة كالقطة','https://www.wajd.blog/2024/09/women-like-cats.html']]},
 {id:'pushback-sunnah',title:'ما دام الشر موجودًا: سُنّة التدافع',slug:'pushback-sunnah',description:'أربع زوايا عن الأثر الذي لا نراه، ومقاومة التطبيع مع الأذى، ومسؤولية الكلمة والفعل.',promise:'سلسلة قصيرة تبدأ بالمفهوم ثم تطبيقه ثم أخلاق الممارسة.',kind:'collection',status:'published',featured:false,order:7,duration:11,items:[
  ['سُنّة التدافع','https://www.wajd.blog/2023/12/jostle-sunnah.html'],['سُنّة التدافع 2','https://www.wajd.blog/2023/12/jostle-sunnah-2.html'],['الساديون في الأرض','https://www.wajd.blog/2021/01/sadists-on-earth.html'],['وعد ووعيد','https://www.wajd.blog/2023/12/promise-and-threat.html']],extras:[
  ]}
].map(path=>({...path,items:path.items.map(item=>({title:item[0],url:item[1]})),extras:(path.extras||[]).map(item=>({title:item[0],url:item[1]}))}));

let wajdPathsDb,wajdPathsAuth,wajdPathsPublic=wajdPathsDefaults,wajdPathsPublicPromise=null,wajdPathsPublicReady=false,wajdPathsPublicCacheFresh=false,wajdPathsCompleted=new Set(),wajdPathsReading=new Map(),wajdPathsPosts=[],wajdPathsPostsPromise=null,wajdPathsRenderQueued=false,wajdPathsArticleTrackKey='';
const wajdPathsAnalyticsCache=new Map(),wajdPathsAnalyticsQueues=new Map();
const wajdPathsRouteTracked=new Set();
const WAJD_PATHS_PUBLIC_CACHE_KEY='wajd-reading-paths-public-v1';
const WAJD_PATHS_PUBLIC_CACHE_TTL=5*60*1000;
const wajdPathsNormalize=value=>{try{const url=new URL(String(value||''),location.origin);return decodeURIComponent(url.pathname).replace(/\/$/,'')||'/';}catch(error){return String(value||'').replace(/[?#].*$/,'').replace(/\/$/,'');}};
const wajdPathsCurrentTitles=new Map([
  ['/2021/05/the-affliction.html','الابتلاء: قدرٌ إنساني مشترك'],
  ['/2025/07/life-trials.html','الابتلاء']
]);
function wajdPathsSyncCurrentTitles(paths){return (paths||[]).map(path=>({...path,items:(Array.isArray(path.items)?path.items:[]).map(item=>{const title=wajdPathsCurrentTitles.get(wajdPathsNormalize(item.url));return title?{...item,title}:item;})}));}
const wajdPathsContextUrl=(value,pathId)=>{try{const url=new URL(String(value||''),location.origin);url.searchParams.set('wajdPath',pathId);return url.href;}catch(error){return String(value||'');}};
const wajdPathsCleanUrl=value=>{try{const url=new URL(String(value||''),location.origin);url.searchParams.delete('wajdPath');return url.href;}catch(error){return String(value||'');}};
const wajdPathsEscape=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const wajdPathsArabic=new Intl.NumberFormat('ar-EG');
function wajdPathsFeedUrl(entry){const link=(entry.link||[]).find(item=>item.rel==='alternate');return link?link.href:'';}
function wajdPathsFeedId(entry){const value=entry&&entry.id&&entry.id.$t||'';return value.split('post-').pop();}
async function wajdPathsLoadPosts(){if(wajdPathsPosts.length)return wajdPathsPosts;if(!wajdPathsPostsPromise)wajdPathsPostsPromise=(async()=>{const entries=window.wajdLoadAllFeedEntries?await window.wajdLoadAllFeedEntries('/feeds/posts/summary?alt=json&orderby=published',40):[];wajdPathsPosts=entries.map(entry=>({id:wajdPathsFeedId(entry),title:entry.title&&entry.title.$t||'كتابة بلا عنوان',url:wajdPathsFeedUrl(entry)})).filter(item=>item.url);return wajdPathsPosts;})();try{return await wajdPathsPostsPromise;}catch(error){wajdPathsPostsPromise=null;throw error;}}
async function wajdPathsInitialize(){if(wajdPathsDb)return;const core=await window.wajdEnsureFirebaseCore();wajdPathsDb=core.db;wajdPathsAuth=core.auth;}
function wajdPathsSorted(paths){return paths.slice().sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999));}
function wajdPathsCacheShape(path){return{id:String(path.id||''),title:String(path.title||''),slug:String(path.slug||path.id||''),prompt:String(path.prompt||''),audience:String(path.audience||''),depth:String(path.depth||''),mood:String(path.mood||''),description:String(path.description||''),promise:String(path.promise||''),kind:path.kind==='collection'?'collection':'path',status:'published',featured:path.featured!==false,order:Number(path.order)||999,duration:Number(path.duration)||0,items:(Array.isArray(path.items)?path.items:[]).map(item=>({title:String(item.title||''),url:String(item.url||'')})).filter(item=>item.url)};}
function wajdPathsWritePublicCache(paths){try{localStorage.setItem(WAJD_PATHS_PUBLIC_CACHE_KEY,JSON.stringify({savedAt:Date.now(),paths:(paths||[]).map(wajdPathsCacheShape)}));wajdPathsPublicCacheFresh=true;}catch(error){}}
function wajdPathsHydratePublicCache(){/* v119: paths come from this file; drop the old Firestore copy. */try{localStorage.removeItem(WAJD_PATHS_PUBLIC_CACHE_KEY);}catch(error){}wajdPathsPublic=wajdPathsSorted(wajdPathsSyncCurrentTitles(wajdPathsDefaults));wajdPathsPublicReady=true;wajdPathsPublicCacheFresh=true;return true;}
function wajdPathsHydratePublicCacheLegacy(){try{const cached=JSON.parse(localStorage.getItem(WAJD_PATHS_PUBLIC_CACHE_KEY)||'null');if(!cached||!Array.isArray(cached.paths))return false;const paths=cached.paths.filter(path=>path&&path.id);wajdPathsPublic=wajdPathsSorted(wajdPathsSyncCurrentTitles(paths));wajdPathsPublicReady=true;wajdPathsPublicCacheFresh=Date.now()-(Number(cached.savedAt)||0)<WAJD_PATHS_PUBLIC_CACHE_TTL;return true;}catch(error){return false;}}
function wajdPathsRenderAll(){wajdPathsRenderHome();wajdPathsRenderArticleContext();wajdPathsRenderJourney();wajdPathsRenderPage();if(typeof window!=='undefined'&&typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('wajd-reading-paths-updated'));}
function wajdPathsScheduleRender(){if(wajdPathsRenderQueued)return;wajdPathsRenderQueued=true;Promise.resolve().then(()=>{wajdPathsRenderQueued=false;wajdPathsRenderAll();});}
async function wajdPathsLoadPublic(){
  // v119: no Firestore read; the lineup is defined in wajdPathsDefaults.
  if(!wajdPathsPublicReady)wajdPathsHydratePublicCache();
  wajdPathsScheduleRender();
  return wajdPathsPublic;
}
async function wajdPathsLoadPublicLegacy(){
  const routeKey=wajdPathsRouteKey(),cachedRouteMissing=wajdPathsHasRoute()&&routeKey!=='all'&&!wajdPathsPublic.some(path=>String(path.slug||path.id)===routeKey||String(path.id)===routeKey);
  if(wajdPathsPublicCacheFresh&&!cachedRouteMissing)return Promise.resolve(wajdPathsPublic);
  if(cachedRouteMissing)wajdPathsPublicCacheFresh=false;
  if(wajdPathsPublicPromise)return wajdPathsPublicPromise;
  wajdPathsPublicPromise=(async()=>{try{await wajdPathsInitialize();const snap=await getDocs(query(collection(wajdPathsDb,'readingPaths'),where('status','==','published')));wajdPathsPublic=wajdPathsSorted(wajdPathsSyncCurrentTitles(snap.docs.map(item=>({id:item.id,...item.data()}))));wajdPathsWritePublicCache(wajdPathsPublic);}catch(error){console.warn('Wajd reading paths fallback:',error);}wajdPathsPublicReady=true;wajdPathsScheduleRender();return wajdPathsPublic;})();
  return wajdPathsPublicPromise;
}
/* v119: articles completed in this browser (any reader, signed in or not),
   recorded by core.js. Signed-in readers also get their cloud history below. */
function wajdPathsLoadLocalCompleted(uid){try{const urls=JSON.parse(localStorage.getItem('wajd-completed-urls-v119:'+uid)||'[]');if(Array.isArray(urls))urls.forEach(url=>{if(typeof url==='string'&&url)wajdPathsCompleted.add(wajdPathsNormalize(url));});}catch(error){}}
window.addEventListener('wajd-article-completed',event=>{
  const here=event&&event.detail&&event.detail.path;if(!here)return;
  wajdPathsCompleted.add(wajdPathsNormalize(here));wajdPathsReading.delete(wajdPathsNormalize(here));
  // Re-record progress for the path the reader is in (or the first path this article belongs to).
  const requestedId=new URL(location.href).searchParams.get('wajdPath')||'';
  const memberships=wajdPathsSorted(wajdPathsPublic).filter(path=>(path.items||[]).some(item=>wajdPathsNormalize(item.url)===wajdPathsNormalize(here)));
  // Only inside path mode: reading an article that happens to be in a path is not "starting" that path.
  const path=requestedId?memberships.find(item=>item.id===requestedId):null;
  if(path)wajdPathsTrack(path,'started',0).catch(error=>console.warn('Wajd path completion analytics:',error));
  wajdPathsScheduleRender();
});
async function wajdPathsLoadProgress(){
  try{await wajdPathsInitialize();const user=wajdPathsAuth.currentUser||(window.wajdFirebaseUserPromise?await window.wajdFirebaseUserPromise:null);if(!user)return;wajdPathsCompleted.clear();wajdPathsReading.clear();wajdPathsLoadLocalCompleted(user.uid);if(user.isAnonymous){wajdPathsScheduleRender();return;}const history=await getDocs(collection(wajdPathsDb,'users',user.uid,'history')),entries=history.docs.map(item=>({id:item.id,data:item.data()})),needsLegacyLookup=entries.some(entry=>!entry.data.articleUrl),posts=needsLegacyLookup?await wajdPathsLoadPosts():[],byId=new Map(posts.map(item=>[item.id,wajdPathsNormalize(item.url)]));entries.forEach(entry=>{const data=entry.data,url=data.articleUrl?wajdPathsNormalize(data.articleUrl):byId.get(entry.id);if(!url)return;if(data.completed===true)wajdPathsCompleted.add(url);else if(Number(data.progress)>0)wajdPathsReading.set(url,{progress:Number(data.progress),updatedAt:data.updatedAt&&data.updatedAt.toMillis?data.updatedAt.toMillis():0});});wajdPathsScheduleRender();
  }catch(error){console.warn('Wajd reading path progress:',error);}
}
function wajdPathsProgress(path){const items=Array.isArray(path.items)?path.items:[];const done=items.filter(item=>wajdPathsCompleted.has(wajdPathsNormalize(item.url))).length;return {done,total:items.length,percent:items.length?Math.round(done/items.length*100):0};}
function wajdPathsAnalyticsMillis(value){if(value&&value.toMillis)return value.toMillis();if(value instanceof Date)return value.getTime();return Number(value)||0;}
function wajdPathsAnalyticsRank(status){return status==='completed'?2:status==='started'?1:0;}
async function wajdPathsTrackNow(path,event,step){
  if(!path||!path.id||!(path.items||[]).length)return;
  await (wajdPathsPublicPromise||wajdPathsLoadPublic());
  path=wajdPathsPublic.find(item=>item.id===path.id);if(!path||!(path.items||[]).length)return;
  if(event==='started'){const current=wajdPathsNormalize(location.href),currentIndex=path.items.findIndex(item=>wajdPathsNormalize(item.url)===current);if(currentIndex<0)return;step=currentIndex+1;}
  await wajdPathsInitialize();
  const user=wajdPathsAuth.currentUser||(window.wajdFirebaseUserPromise?await window.wajdFirebaseUserPromise:null);if(!user)return;
  const ref=doc(wajdPathsDb,'readingPathAnalytics',path.id,'participants',user.uid);
  const cacheKey=user.uid+':'+path.id;
  let existing;
  if(wajdPathsAnalyticsCache.has(cacheKey))existing=wajdPathsAnalyticsCache.get(cacheKey);
  else{const snapshot=await getDoc(ref);existing=snapshot.exists()?snapshot.data():null;wajdPathsAnalyticsCache.set(cacheKey,existing);}
  const isGoogle=Boolean(user&&!user.isAnonymous&&(user.providerData||[]).some(provider=>provider&&provider.providerId==='google.com'));
  const progress=wajdPathsProgress(path),now=Date.now(),readerType=isGoogle?'registered':'anonymous';
  let status=existing&&existing.status||'seen',totalItems=progress.total,completedCount=0,lastStep=0;
  if(existing&&existing.status==='completed'){
    status='completed';totalItems=Math.max(1,Number(existing.totalItems)||progress.total);completedCount=totalItems;lastStep=Math.max(1,Math.min(totalItems,Number(existing.lastStep)||totalItems));
  }else{
    completedCount=Math.min(totalItems,Math.max(Number(existing&&existing.completedCount)||0,progress.done));
    lastStep=Math.max(0,Math.min(totalItems,Number(existing&&existing.lastStep)||0));
    if(event==='started'){status=wajdPathsAnalyticsRank(status)<1?'started':status;lastStep=Math.max(1,Math.min(totalItems,Number(step)||1));}
    if(status!=='seen'&&completedCount===totalItems)status='completed';
  }
  const changed=!existing||existing.readerType!==readerType||existing.pathKind!==(path.kind==='collection'?'collection':'path')||existing.status!==status||Number(existing.completedCount)!==completedCount||Number(existing.totalItems)!==totalItems||Number(existing.lastStep)!==lastStep;
  const activityTime=event==='started'?wajdPathsAnalyticsMillis(existing&&existing.lastActivityAt):wajdPathsAnalyticsMillis(existing&&existing.lastSeenAt);
  const freshness=event==='started'?21600000:86400000;
  if(existing&&!changed&&now-activityTime<freshness)return;
  const creating=!existing,patch={pathId:path.id,pathKind:path.kind==='collection'?'collection':'path',readerType,status,completedCount,totalItems,lastStep,lastSeenAt:serverTimestamp(),updatedAt:serverTimestamp()};
  if(creating){patch.firstSeenAt=serverTimestamp();patch.startedAt=status==='seen'?null:serverTimestamp();patch.lastActivityAt=status==='seen'?null:serverTimestamp();patch.completedAt=status==='completed'?serverTimestamp():null;}
  else{if(status!=='seen'&&!existing.startedAt)patch.startedAt=serverTimestamp();if(status!=='seen'&&(event==='started'||!existing.lastActivityAt))patch.lastActivityAt=serverTimestamp();if(status==='completed'&&!existing.completedAt)patch.completedAt=serverTimestamp();}
  const writePathProgress=async()=>{
    const current=wajdPathsAuth&&wajdPathsAuth.currentUser;if(!current||current.uid!==user.uid)return false;
    if(creating){const batch=writeBatch(wajdPathsDb);batch.set(ref,patch);batch.set(doc(wajdPathsDb,'users',user.uid,'pathAnalytics',path.id),{pathId:path.id,createdAt:serverTimestamp()});await batch.commit();}
    else await setDoc(ref,patch,{merge:true});
    return true;
  };
  let wrote=false;
  try{wrote=await writePathProgress();}
  catch(firstError){const stale=!user.isAnonymous&&/permission-denied|unauthenticated/i.test(String(firstError&&(firstError.code||firstError.message)||''));if(!stale)throw firstError;const current=wajdPathsAuth&&wajdPathsAuth.currentUser;if(!current||current.uid!==user.uid)return;await current.getIdToken(true);wrote=await writePathProgress();}
  if(!wrote)return;
  const date=new Date(now);
  wajdPathsAnalyticsCache.set(cacheKey,{...(existing||{}),...patch,firstSeenAt:existing&&existing.firstSeenAt||date,lastSeenAt:date,startedAt:status==='seen'?null:(existing&&existing.startedAt||date),lastActivityAt:status==='seen'?null:(event==='started'?date:(existing&&existing.lastActivityAt||date)),completedAt:status==='completed'?(existing&&existing.completedAt||date):null,updatedAt:date});
}
function wajdPathsTrack(path,event,step){
  const previous=wajdPathsAnalyticsQueues.get(path.id)||Promise.resolve();
  const task=previous.catch(()=>{}).then(()=>wajdPathsTrackNow(path,event,step));
  wajdPathsAnalyticsQueues.set(path.id,task);
  task.then(()=>{if(wajdPathsAnalyticsQueues.get(path.id)===task)wajdPathsAnalyticsQueues.delete(path.id);},()=>{if(wajdPathsAnalyticsQueues.get(path.id)===task)wajdPathsAnalyticsQueues.delete(path.id);});
  return task;
}
function wajdJourneyReaderData(){
  try{return window.wajdGetReaderJourneyData?window.wajdGetReaderJourneyData():{uid:'',saved:[],history:[]};}
  catch(error){return{uid:'',saved:[],history:[]};}
}
function wajdJourneyHistoryUrl(entry){
  const details=entry&&entry.details||{};
  if(details.articleUrl)return wajdPathsNormalize(details.articleUrl);
  const post=wajdPathsPosts.find(item=>item.id===String(entry&&entry.id||''));
  return post?wajdPathsNormalize(post.url):'';
}
function wajdJourneyHistoryTimes(data){
  const times=new Map();
  (data.history||[]).forEach(entry=>{const url=wajdJourneyHistoryUrl(entry);if(url)times.set(url,Math.max(times.get(url)||0,Number(entry.lastReadAt)||0));});
  return times;
}
function wajdJourneyEstimatedMinutes(data){
  const estimates=new Map();
  wajdPathsSorted(wajdPathsPublic).forEach(path=>{
    const items=Array.isArray(path.items)?path.items:[],share=items.length?Math.max(1,(Number(path.duration)||items.length*4)/items.length):4;
    items.forEach(item=>{const url=wajdPathsNormalize(item.url);if(!estimates.has(url))estimates.set(url,share);});
  });
  const completed=new Set();
  (data.history||[]).forEach(entry=>{if(!(entry.details&&entry.details.completed===true))return;const url=wajdJourneyHistoryUrl(entry);completed.add(url||'id:'+entry.id);});
  let total=0;completed.forEach(url=>{total+=url.indexOf('id:')===0?4:(estimates.get(url)||4);});
  return Math.round(total);
}
function wajdJourneyPathState(path,times){
  const progress=wajdPathsProgress(path),items=Array.isArray(path.items)?path.items:[];
  const partials=items.map(item=>({item,state:wajdPathsReading.get(wajdPathsNormalize(item.url))})).filter(entry=>entry.state).sort((a,b)=>(b.state.updatedAt||0)-(a.state.updatedAt||0));
  const touched=Math.max(0,...items.map(item=>times.get(wajdPathsNormalize(item.url))||0));
  const partial=partials[0]||null,next=partial?partial.item:items.find(item=>!wajdPathsCompleted.has(wajdPathsNormalize(item.url)));
  const effective=progress.total?Math.min(100,Math.round((progress.done+(partial?Math.max(0,Math.min(1,Number(partial.state.progress)||0)):0))/progress.total*100)):0;
  return{path,progress,partial,next,started:progress.done>0||Boolean(partial)||touched>0,completed:progress.total>0&&progress.done===progress.total,lastUpdated:Math.max(touched,partial&&partial.state.updatedAt||0),effectivePercent:effective};
}
function wajdPathsNextReadingRecommendation(currentValue){
  const current=wajdPathsNormalize(currentValue||location.href),times=wajdJourneyHistoryTimes(wajdJourneyReaderData());
  const active=wajdPathsSorted(wajdPathsPublic.filter(path=>path.kind!=='collection')).map(path=>wajdJourneyPathState(path,times)).filter(state=>state.started&&!state.completed).sort((a,b)=>b.lastUpdated-a.lastUpdated||b.effectivePercent-a.effectivePercent);
  for(const state of active){
    const items=Array.isArray(state.path.items)?state.path.items:[];
    let next=state.next;
    if(next&&wajdPathsNormalize(next.url)===current){
      const currentIndex=items.findIndex(item=>wajdPathsNormalize(item.url)===current);
      next=items.slice(currentIndex+1).find(item=>!wajdPathsCompleted.has(wajdPathsNormalize(item.url)))||items.find(item=>wajdPathsNormalize(item.url)!==current&&!wajdPathsCompleted.has(wajdPathsNormalize(item.url)));
    }
    if(!next||wajdPathsNormalize(next.url)===current)continue;
    const step=Math.max(1,items.findIndex(item=>wajdPathsNormalize(item.url)===wajdPathsNormalize(next.url))+1);
    return{type:'path',pathId:state.path.id,pathTitle:state.path.title,pathDescription:state.path.promise||state.path.description||'',title:next.title,url:next.url,href:wajdPathsContextUrl(next.url,state.path.id),step,total:items.length,completed:state.progress.done,percent:state.effectivePercent};
  }
  return null;
}
window.wajdGetNextReadingRecommendation=wajdPathsNextReadingRecommendation;
function wajdJourneyPathCard(state){
  const next=state.next&&state.next.title||'راجع محتويات المسار';
  return '<button class="wajd-journey-path" data-wajd-path-id="'+wajdPathsEscape(state.path.id)+'" type="button"><span class="wajd-journey-path-top"><h5>'+wajdPathsEscape(state.path.title)+'</h5><small>'+wajdPathsArabic.format(state.progress.done)+' / '+wajdPathsArabic.format(state.progress.total)+'</small></span><span class="wajd-journey-path-next">التالي: '+wajdPathsEscape(next)+'</span><span class="wajd-journey-progress"><span style="width:'+state.effectivePercent+'%"></span></span></button>';
}
function wajdPathsRenderJourney(){
  const root=document.getElementById('wajd-account-journey');if(!root)return;
  const data=wajdJourneyReaderData(),times=wajdJourneyHistoryTimes(data);
  const states=wajdPathsSorted(wajdPathsPublic.filter(path=>path.kind!=='collection')).map(path=>wajdJourneyPathState(path,times));
  const active=states.filter(state=>state.started&&!state.completed).sort((a,b)=>b.lastUpdated-a.lastUpdated||b.effectivePercent-a.effectivePercent);
  const finished=states.filter(state=>state.completed),suggested=states.find(state=>!state.started&&!state.completed);
  const completedArticles=(data.history||[]).filter(entry=>entry.details&&entry.details.completed===true).length;
  const minutes=wajdJourneyEstimatedMinutes(data),google=Boolean(document.getElementById('wajd-account-user')&&document.getElementById('wajd-account-user').classList.contains('is-google'));
  let html='<div class="wajd-journey-heading"><div><h3>رحلتي في وَجْد</h3><p>موضعك في المسارات وما أنجزته وما ينتظرك بعده، من غير نقاط ولا سباق.</p></div><span class="wajd-journey-sync-note">'+(google?'متزامنة على أجهزتك':'محفوظة على هذا المتصفح')+'</span></div>';
  html+='<div class="wajd-journey-stats"><div class="wajd-journey-stat"><strong>'+wajdPathsArabic.format(completedArticles)+'</strong><span>كتابة مكتملة</span></div><div class="wajd-journey-stat"><strong>'+wajdPathsArabic.format(minutes)+'</strong><span>دقيقة قراءة تقريبية</span></div><div class="wajd-journey-stat"><strong>'+wajdPathsArabic.format(finished.length)+'</strong><span>مسارات مكتملة</span></div></div>';
  if(active.length){
    const resume=active[0],next=resume.next;
    html+='<section class="wajd-journey-resume"><div class="wajd-journey-resume-copy"><span class="wajd-journey-kicker">أكمل من حيث توقفت · '+wajdPathsEscape(resume.path.title)+'</span><h4>'+wajdPathsEscape(next?next.title:'محتويات المسار')+'</h4><p>أكملت '+wajdPathsArabic.format(resume.progress.done)+' من '+wajdPathsArabic.format(resume.progress.total)+' كتابات في هذه الرحلة.</p><div class="wajd-journey-progress"><span style="width:'+resume.effectivePercent+'%"></span></div></div>'+(next?'<a class="wajd-journey-primary" href="'+wajdPathsEscape(wajdPathsContextUrl(next.url,resume.path.id))+'">تابع الرحلة ←</a>':'<button class="wajd-journey-primary" data-wajd-path-id="'+wajdPathsEscape(resume.path.id)+'" type="button">افتح المسار</button>')+'</section>';
    if(active.length>1)html+='<section class="wajd-journey-section"><div class="wajd-journey-section-head"><h4>رحلات أخرى بدأتَها</h4><span>'+wajdPathsArabic.format(active.length-1)+' قيد القراءة</span></div><div class="wajd-journey-paths">'+active.slice(1).map(wajdJourneyPathCard).join('')+'</div></section>';
  }else{
    html+='<section class="wajd-journey-empty"><h4>'+(finished.length?'أتممت ما بدأتَه':'لم تبدأ رحلة مرتبة بعد')+'</h4><p>'+(finished.length?'يمكنك اختيار مسار جديد، أو العودة إلى رحلة مكتملة بعيون مختلفة.':'اختر احتياجك الآن، وسنضع أمامك أول كتابة وما يليها خطوة خطوة.')+'</p>'+(suggested?'<button class="wajd-journey-primary" data-wajd-path-id="'+wajdPathsEscape(suggested.path.id)+'" type="button">ابدأ «'+wajdPathsEscape(suggested.path.title)+'»</button>':'<button class="wajd-journey-primary" data-wajd-paths-all="true" type="button">استكشف المسارات</button>')+'</section>';
  }
  if(finished.length)html+='<section class="wajd-journey-section"><div class="wajd-journey-section-head"><h4>رحلات أتممتها</h4><span>يمكنك العودة إليها في أي وقت</span></div><div class="wajd-journey-completed">'+finished.map(state=>'<button data-wajd-path-id="'+wajdPathsEscape(state.path.id)+'" type="button">✓ '+wajdPathsEscape(state.path.title)+'</button>').join('')+'</div></section>';
  if(active.length&&suggested)html+='<section class="wajd-journey-suggestion"><span><strong>وبعدها: '+wajdPathsEscape(suggested.path.title)+'</strong><small>'+wajdPathsEscape(suggested.path.promise||suggested.path.description||'رحلة أخرى تنتظرك.')+'</small></span><button data-wajd-path-id="'+wajdPathsEscape(suggested.path.id)+'" type="button">تعرّف إليها</button></section>';
  html+='<div class="wajd-journey-shortcuts"><button class="wajd-journey-shortcut" data-account-panel="saved" type="button"><span>المحفوظات<small>'+wajdPathsArabic.format((data.saved||[]).length)+' كتابات للعودة لاحقًا</small></span><b>←</b></button><button class="wajd-journey-shortcut" data-account-panel="history" type="button"><span>سجل القراءة<small>'+wajdPathsArabic.format((data.history||[]).length)+' كتابات فُتحت من قبل</small></span><b>←</b></button></div>';
  root.innerHTML=html;
}
async function wajdPathsSyncReaderBridge(){
  const data=wajdJourneyReaderData(),history=Array.isArray(data.history)?data.history:[],needsLegacyLookup=history.some(entry=>!(entry.details&&entry.details.articleUrl)),posts=needsLegacyLookup?await wajdPathsLoadPosts():[],byId=new Map(posts.map(item=>[item.id,wajdPathsNormalize(item.url)]));
  wajdPathsCompleted.clear();wajdPathsReading.clear();
  history.forEach(entry=>{const details=entry.details||{},url=details.articleUrl?wajdPathsNormalize(details.articleUrl):byId.get(String(entry.id));if(!url)return;if(details.completed===true)wajdPathsCompleted.add(url);else if(Number(details.progress)>0)wajdPathsReading.set(url,{progress:Number(details.progress),updatedAt:Number(entry.lastReadAt)||0});});
  wajdPathsScheduleRender();
}
function wajdPathsNeed(path){const needs={'start-here':'أريد أن أتعرف إلى وَجْد','dont-eat-yourself':'أحتاج أن أهدأ من صخب رأسي','fear-and-hope':'أريد أن أفهم علاقتي بالله','leave-the-dispute-grinder':'أتعبتني الخلافات الدينية','modern-life-grinder':'أشعر أن العصر يطحنني','relationships-not-equations':'أنا مرتبك في علاقة','truth-behind-image':'أريد أن أرى ما وراء الصور الجاهزة','inside-human-stories':'أريد حكايات تكشف الإنسان من الداخل','wajd-library':'أبحث عن كتب وأعمال بعين مختلفة','pushback-sunnah':'أريد أن أفهم معنى مقاومة الشر','laugh-then-notice':'أريد أن أضحك ثم أنتبه لما وراء الضحك'};return path.prompt||needs[path.id]||path.title||'أريد طريقًا للقراءة';}
function wajdPathsIcon(path){const icons={
  'start-here':'<circle cx="12" cy="12" r="8"/><path d="m15 9-2 4-4 2 2-4 4-2Z"/>',
  'dont-eat-yourself':'<path d="M4 8c2.2-2.4 4.4-2.4 6.6 0s4.4 2.4 6.6 0M4 12c2.2-2.4 4.4-2.4 6.6 0s4.4 2.4 6.6 0M4 16c2.2-2.4 4.4-2.4 6.6 0s4.4 2.4 6.6 0"/>',
  'fear-and-hope':'<path d="M16.8 15.7A7 7 0 1 1 9.2 5a6 6 0 0 0 7.6 10.7Z"/><path d="M17 5v3M15.5 6.5h3"/>',
  'leave-the-dispute-grinder':'<path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3"/>',
  'modern-life-grinder':'<path d="M7 3h10M7 21h10M8 3c0 5 1.5 6 4 9-2.5 3-4 4-4 9M16 3c0 5-1.5 6-4 9 2.5 3 4 4 4 9"/>',
  'relationships-not-equations':'<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M10.8 9.2 13.2 14.8"/>'
  };return '<svg aria-hidden="true" viewBox="0 0 24 24">'+(icons[path.id]||'<path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v18H8.5A3.5 3.5 0 0 0 5 23V5.5ZM19 5.5A3.5 3.5 0 0 0 15.5 2H12v18h3.5A3.5 3.5 0 0 1 19 23V5.5Z"/>')+'</svg>';}
function wajdPathsHasRoute(){try{return new URL(location.href).searchParams.has('reading-path');}catch(error){return false;}}
function wajdPathsRouteKey(){try{return String(new URL(location.href).searchParams.get('reading-path')||'').trim();}catch(error){return '';}}
function wajdPathsPermalink(value){const slug=typeof value==='object'&&value?value.slug||value.id:value||'all';try{const url=new URL('/',location.origin);url.searchParams.set('reading-path',String(slug));return url.href;}catch(error){return '/?reading-path='+encodeURIComponent(String(slug));}}
function wajdPathsAllUrl(){return wajdPathsPermalink('all');}
function wajdPathsDepth(path){if(['خفيف','متوسط','عميق'].includes(path.depth))return path.depth;const duration=Number(path.duration)||0;return duration<=20?'خفيف':duration<=35?'متوسط':'عميق';}
function wajdPathsMood(path){const moods={'start-here':'متنوع · تعريفي','dont-eat-yourself':'هادئ · تصالحي','fear-and-hope':'روحي · تأملي','leave-the-dispute-grinder':'نقدي · متزن','modern-life-grinder':'واقعي · كاشف','relationships-not-equations':'إنساني · متأنٍ','truth-behind-image':'كاشف · نقدي','inside-human-stories':'إنساني · سردي','wajd-library':'تحليلي · ثقافي','pushback-sunnah':'فكري · عملي','laugh-then-notice':'ساخر · لاذع'};return String(path.mood||'').trim()||moods[path.id]||(path.kind==='collection'?'حر · انتقائي':'هادئ · متدرج');}
function wajdPathsAudience(path){return String(path.audience||'').trim()||wajdPathsNeed(path);}
function wajdPathsPreparePage(){if(!wajdPathsHasRoute())return null;document.documentElement.classList.add('wajd-reading-path-route');document.body.classList.add('wajd-reading-path-page');let root=document.getElementById('wajd-path-page');if(root)return root;const host=document.querySelector('.r-r');if(!host)return null;root=document.createElement('main');root.id='wajd-path-page';root.className='wajd-path-page';root.setAttribute('aria-live','polite');root.innerHTML='<div class="wajd-path-page-loading">جارٍ إعداد رحلة القراءة…</div>';host.insertAdjacentElement('afterbegin',root);return root;}
function wajdPathsSetPageMeta(path){const title=path?path.title+' · مسارات القراءة | وَجْد':'مسارات القراءة | وَجْد',description=path?(path.promise||path.description||'رحلة قراءة مختارة بعناية في وَجْد.'):'رحلات قراءة مرتبة ومجموعات للاكتشاف في وَجْد.';document.title=title;const values=[['meta[name="description"]','content',description],['meta[property="og:title"]','content',title],['meta[property="og:description"]','content',description],['meta[property="og:url"]','content',path?wajdPathsPermalink(path):wajdPathsAllUrl()]];values.forEach(item=>{const node=document.querySelector(item[0]);if(node)node.setAttribute(item[1],item[2]);});}
function wajdPathsNextItem(path){const items=Array.isArray(path.items)?path.items:[],reading=items.map(item=>({item,state:wajdPathsReading.get(wajdPathsNormalize(item.url))})).filter(entry=>entry.state).sort((a,b)=>(b.state.updatedAt||0)-(a.state.updatedAt||0))[0];return reading&&reading.item||items.find(item=>!wajdPathsCompleted.has(wajdPathsNormalize(item.url)))||items[0]||null;}
function wajdPathsPageItem(path,item,index,next){const normalized=wajdPathsNormalize(item.url),complete=wajdPathsCompleted.has(normalized),reading=wajdPathsReading.has(normalized),current=!complete&&next===item;let state=complete?'اكتملت':reading?'أكمل من هنا':current?(path.kind==='collection'?'اقرأ الآن':'الخطوة التالية'):'لم تُقرأ بعد';return '<a class="wajd-path-page-item'+(complete?' is-complete':'')+(current?' is-current':'')+'" data-wajd-path-id="'+wajdPathsEscape(path.id)+'" href="'+wajdPathsEscape(wajdPathsContextUrl(item.url,path.id))+'"><span class="wajd-path-page-item-index">'+(complete?'✓':wajdPathsArabic.format(index+1))+'</span><span class="wajd-path-page-item-copy"><strong>'+wajdPathsEscape(item.title)+'</strong><small>'+(path.kind==='collection'?'ضمن هذه المجموعة':'الكتابة '+wajdPathsArabic.format(index+1)+' من '+wajdPathsArabic.format(path.items.length))+'</small></span><span class="wajd-path-page-item-state">'+state+'</span></a>';}
/* v119: the open layer under each path: same meaning, outside the ordered route. */
function wajdPathsExtrasHtml(path){const extras=Array.isArray(path.extras)?path.extras:[];if(!extras.length)return '';return '<section class="wajd-path-page-extras"><header class="wajd-path-page-section-head"><div><h2>كتابات أخرى في نفس المعنى</h2><p>خارج خطوات الرحلة، لمن يريد أن يبقى مع المعنى أطول.</p></div></header><div class="wajd-path-page-extras-list">'+extras.map(item=>{const done=wajdPathsCompleted.has(wajdPathsNormalize(item.url));return '<a class="wajd-path-page-extra'+(done?' is-complete':'')+'" href="'+wajdPathsEscape(item.url)+'"><span>'+wajdPathsEscape(item.title)+'</span><b>'+(done?'✓':'←')+'</b></a>';}).join('')+'</div></section>';}
function wajdPathsPageHtml(path){const progress=wajdPathsProgress(path),next=wajdPathsNextItem(path),complete=progress.total>0&&progress.done===progress.total,started=progress.done>0||Boolean((path.items||[]).some(item=>wajdPathsReading.has(wajdPathsNormalize(item.url))));const action=path.kind==='collection'?(started?'تابع استكشاف المجموعة':'ابدأ الاستكشاف'):complete?'أعد زيارة المسار':started?'تابع الرحلة':'ابدأ المسار';const permalink=wajdPathsPermalink(path),shareText=path.title+' — '+(path.promise||path.description||'مسار قراءة في وَجْد'),telegram='https://t.me/share/url?url='+encodeURIComponent(permalink)+'&text='+encodeURIComponent(shareText),whatsapp='https://api.whatsapp.com/send?text='+encodeURIComponent(shareText+'\n'+permalink);return '<nav class="wajd-path-page-breadcrumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span>←</span><a href="'+wajdPathsEscape(wajdPathsAllUrl())+'">مسارات القراءة</a><span>←</span><b>'+wajdPathsEscape(path.title)+'</b></nav><section class="wajd-path-page-hero"><div class="wajd-path-page-copy"><span class="wajd-path-page-eyebrow">'+(path.kind==='collection'?'مجموعة اكتشاف · تُقرأ بأي ترتيب':'رحلة قراءة مرتبة')+'</span><h1>'+wajdPathsEscape(path.title)+'</h1><p class="wajd-path-page-description">'+wajdPathsEscape(path.description||path.promise||'')+'</p><div class="wajd-path-page-meta"><span>'+wajdPathsArabic.format((path.items||[]).length)+' كتابات</span><span>'+wajdPathsArabic.format(Number(path.duration)||0)+' دقيقة تقريبًا</span><span>العمق: '+wajdPathsEscape(wajdPathsDepth(path))+'</span><span>المزاج: '+wajdPathsEscape(wajdPathsMood(path))+'</span></div></div><aside class="wajd-path-page-for"><small>هذه الرحلة لك إذا…</small><strong>'+wajdPathsEscape(wajdPathsAudience(path))+'</strong><p>'+wajdPathsEscape(path.promise||'تقرأ هذه الكتابات معًا بوصفها رحلة واحدة، لا روابط منفصلة.')+'</p></aside></section><div class="wajd-path-page-layout"><section class="wajd-path-page-main"><header class="wajd-path-page-section-head"><div><h2>'+(path.kind==='collection'?'كتابات المجموعة':'خطوات الرحلة')+'</h2><p>'+(path.kind==='collection'?'ابدأ بما يجذبك؛ لا ترتيب ملزم هنا.':'رُتبت الكتابات لتبني كل واحدة على ما قبلها.')+'</p></div><span class="wajd-path-page-count">'+wajdPathsArabic.format(progress.done)+' مكتملة من '+wajdPathsArabic.format(progress.total)+'</span></header><div class="wajd-path-page-items">'+(path.items||[]).map((item,index)=>wajdPathsPageItem(path,item,index,next)).join('')+'</div>'+wajdPathsExtrasHtml(path)+'</section><aside class="wajd-path-page-aside"><section class="wajd-path-page-panel"><span class="wajd-path-page-panel-kicker">موضعك في الرحلة</span><div class="wajd-path-page-progress-copy"><strong>'+wajdPathsArabic.format(progress.percent)+'٪</strong><span>'+wajdPathsArabic.format(progress.done)+' / '+wajdPathsArabic.format(progress.total)+'</span></div><div class="wajd-path-page-progress"><span style="width:'+progress.percent+'%"></span></div><p class="wajd-path-page-progress-note">'+(complete?'أكملت هذه الرحلة. تظل كتاباتها مفتوحة للعودة إليها متى شئت.':started?'سنفتح لك آخر كتابة بدأتَها أو أول خطوة لم تُكملها.':'يُحفظ تقدّمك تلقائيًا عند القراءة، حتى لو لم تضغط أي زر.')+'</p>'+(next?'<a class="wajd-path-page-primary" data-wajd-path-id="'+wajdPathsEscape(path.id)+'" href="'+wajdPathsEscape(wajdPathsContextUrl(next.url,path.id))+'">'+action+' ←</a>':'')+'</section><section class="wajd-path-page-panel"><h3 class="wajd-path-page-share-title">أرسل الرحلة لمن يحتاجها</h3><p class="wajd-path-page-share-copy">الرابط ثابت ويفتح صفحة المسار نفسها، لا الصفحة الرئيسية.</p><div class="wajd-path-page-share-actions"><a href="'+wajdPathsEscape(telegram)+'" rel="noopener" target="_blank">تيليجرام</a><a href="'+wajdPathsEscape(whatsapp)+'" rel="noopener" target="_blank">واتساب</a><button data-wajd-path-share="copy" data-wajd-share-id="'+wajdPathsEscape(path.id)+'" type="button">نسخ الرابط</button><button data-wajd-path-share="native" data-wajd-share-id="'+wajdPathsEscape(path.id)+'" type="button">مشاركة</button></div></section></aside></div>';}
function wajdPathsAllPageHtml(){const paths=wajdPathsSorted(wajdPathsPublic),ordered=paths.filter(path=>path.kind!=='collection').length,collections=paths.length-ordered;return '<nav class="wajd-path-page-breadcrumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span>←</span><b>مسارات القراءة</b></nav><section class="wajd-path-page-all-hero"><div><span class="wajd-path-page-eyebrow">اختر حاجتك لا تاريخ النشر</span><h1>مسارات القراءة</h1><p>رحلات مرتبة حين تحتاج إلى طريق واضح، ومجموعات حرة حين تريد الاكتشاف بلا ترتيب إلزامي.</p></div><span class="wajd-path-page-all-meta">'+wajdPathsArabic.format(ordered)+' مسارات · '+wajdPathsArabic.format(collections)+' مجموعات</span></section><div class="wajd-path-page-all-grid">'+paths.map(wajdPathsCard).join('')+'</div>';}
function wajdPathsRenderPage(){if(!wajdPathsHasRoute())return;const root=wajdPathsPreparePage();if(!root||!wajdPathsPublicReady)return;const key=wajdPathsRouteKey()||'all';if(key==='all'){wajdPathsSetPageMeta(null);root.innerHTML=wajdPathsAllPageHtml();root.setAttribute('aria-live','off');return;}const path=wajdPathsPublic.find(item=>String(item.slug||item.id)===key||String(item.id)===key);if(!path){wajdPathsSetPageMeta(null);root.innerHTML='<section class="wajd-path-page-empty"><h1>هذا المسار غير موجود</h1><p>ربما تغيّر رابطه أو عاد إلى وضع المسودة.</p><a class="wajd-path-page-primary" href="'+wajdPathsEscape(wajdPathsAllUrl())+'">استكشف المسارات المنشورة</a></section>';root.setAttribute('aria-live','off');return;}wajdPathsSetPageMeta(path);root.innerHTML=wajdPathsPageHtml(path);root.setAttribute('aria-live','off');if(!wajdPathsRouteTracked.has(path.id)){wajdPathsRouteTracked.add(path.id);wajdPathsTrack(path,'seen',0).catch(error=>console.warn('Wajd path route analytics:',error));}}
async function wajdPathsCopyText(value){if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return;}const input=document.createElement('textarea');input.value=value;input.setAttribute('readonly','readonly');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();document.execCommand('copy');input.remove();}
function wajdPathsCard(path,index){const progress=wajdPathsProgress(path),collection=path.kind==='collection';let action;if(collection)action='<span class="wajd-path-card-start"><span>استكشف المجموعة</span><b>←</b></span>';else if(progress.done>0)action='<span class="wajd-path-card-progress-copy"><span>'+(progress.done===progress.total?'اكتمل المسار ✓':'أكملت '+wajdPathsArabic.format(progress.done)+' من '+wajdPathsArabic.format(progress.total))+'</span><span>'+(progress.done===progress.total?'أعد الزيارة':'تابع')+'</span></span><span class="wajd-path-card-progress"><span style="width:'+progress.percent+'%"></span></span>';else action='<span class="wajd-path-card-start"><span>ابدأ المسار</span><b>←</b></span>';return '<a class="wajd-path-card" data-wajd-path-id="'+wajdPathsEscape(path.id)+'" href="'+wajdPathsEscape(wajdPathsPermalink(path))+'"><span class="wajd-path-card-top"><span class="wajd-path-card-identity"><span class="wajd-path-card-icon">'+wajdPathsIcon(path)+'</span><span class="wajd-path-card-name">'+wajdPathsEscape(collection?'مجموعة اكتشاف':path.title)+'</span></span><span class="wajd-path-card-kind">'+(collection?'تُقرأ بأي ترتيب':'رحلة '+wajdPathsArabic.format(index+1))+'</span></span><h3>'+wajdPathsEscape(wajdPathsNeed(path))+'</h3><p>'+wajdPathsEscape(path.promise||path.description||'')+'</p><span class="wajd-path-card-meta"><span>'+wajdPathsArabic.format((path.items||[]).length)+' كتابات</span><span>'+wajdPathsArabic.format(Number(path.duration)||0)+' دقيقة تقريبًا</span></span>'+action+'</a>';}
function wajdPathsRenderResume(){const resume=document.getElementById('wajd-paths-resume');if(!resume)return;const started=wajdPathsPublic.filter(path=>path.kind!=='collection').map(path=>{const progress=wajdPathsProgress(path),active=(path.items||[]).map(item=>({item,state:wajdPathsReading.get(wajdPathsNormalize(item.url))})).filter(entry=>entry.state).sort((a,b)=>b.state.updatedAt-a.state.updatedAt)[0];return {path,progress,active};}).filter(item=>(item.progress.done>0||item.active)&&item.progress.done<item.progress.total).sort((a,b)=>(b.active?b.active.state.updatedAt:0)-(a.active?a.active.state.updatedAt:0)||b.progress.percent-a.progress.percent)[0];resume.classList.remove('is-new-reader');if(started){const next=started.active?started.active.item:(started.path.items||[]).find(item=>!wajdPathsCompleted.has(wajdPathsNormalize(item.url)));if(!next)return;resume.innerHTML='<span class="wajd-paths-resume-icon">↶</span><span class="wajd-paths-resume-copy"><small>أكمل من حيث توقفت</small><strong>'+wajdPathsEscape(started.path.title)+' · '+wajdPathsEscape(next.title)+'</strong><span class="wajd-paths-resume-meter"><span class="wajd-paths-resume-bar"><span style="width:'+Math.max(4,Math.round(started.progress.percent))+'%"></span></span><em>أكملت '+wajdPathsArabic.format(started.progress.done)+' من '+wajdPathsArabic.format(started.progress.total)+'</em></span></span><a href="'+wajdPathsEscape(wajdPathsContextUrl(next.url,started.path.id))+'">تابع القراءة</a>';resume.classList.add('is-visible');return;}const beginning=wajdPathsPublic.find(path=>path.id==='start-here'&&path.kind!=='collection')||wajdPathsSorted(wajdPathsPublic.filter(path=>path.kind!=='collection'))[0];if(!beginning){resume.classList.remove('is-visible');resume.innerHTML='';return;}resume.innerHTML='<span class="wajd-paths-resume-icon">✦</span><span class="wajd-paths-resume-copy"><small>أول مرة في وَجْد؟</small><strong>'+wajdPathsEscape(beginning.title)+' · '+wajdPathsEscape(wajdPathsNeed(beginning))+'</strong></span><a href="'+wajdPathsEscape(wajdPathsPermalink(beginning))+'">ابدأ الرحلة</a>';resume.classList.add('is-visible','is-new-reader');}
function wajdPathsRenderHome(){const section=document.getElementById('wajd-reading-paths'),grid=document.getElementById('wajd-paths-grid');if(!section||!grid)return;const featured=wajdPathsSorted(wajdPathsPublic.filter(path=>path.featured!==false)).slice(0,3);if(!featured.length)return;grid.innerHTML=featured.map(wajdPathsCard).join('');wajdPathsRenderResume();section.classList.add('is-ready');section.setAttribute('aria-busy','false');}
function wajdPathsRenderArticleContext(){
  const body=document.querySelector('.post .post-body');if(!body)return;
  const current=wajdPathsNormalize(location.href),requestedId=new URL(location.href).searchParams.get('wajdPath')||'';
  const memberships=wajdPathsSorted(wajdPathsPublic).filter(candidate=>(candidate.items||[]).some(item=>wajdPathsNormalize(item.url)===current));
  const activePath=memberships.find(candidate=>candidate.id===requestedId),path=activePath||memberships[0];
  // v119: an article can also sit in a path's "extras" (same meaning, outside the core route).
  const extraOf=path?null:wajdPathsSorted(wajdPathsPublic).find(candidate=>(candidate.extras||[]).some(item=>wajdPathsNormalize(item.url)===current));
  let head=document.getElementById('wajd-path-mode-head'),box=document.getElementById('wajd-article-path');
  if(!path&&!extraOf){document.body.classList.remove('wajd-path-reading-mode');if(head)head.remove();if(box)box.remove();return;}
  // v123: the like row and the comments come first after the text; the path box sits below the comments.
  if(!box){box=document.createElement('section');box.id='wajd-article-path';(document.querySelector('.post .commentsection')||body).insertAdjacentElement('afterend',box);}
  // v122: when the box already offers the next step, the «خطوتك التالية» block below is hidden (extras.js).
  box.toggleAttribute('data-has-next',Boolean(path&&path.items.findIndex(item=>wajdPathsNormalize(item.url)===current)<path.items.length-1));
  if(!path){
    document.body.classList.remove('wajd-path-reading-mode');if(head)head.remove();
    const first=(extraOf.items||[])[0];
    box.className='wajd-article-path is-membership';
    box.innerHTML='<div class="wajd-article-path-membership-row"><div><small>إن لمستك هذه الكتابة، فهي قريبة من مسار</small><h3>'+wajdPathsEscape(extraOf.title)+'</h3><p>'+wajdPathsEscape(extraOf.description||extraOf.promise||'')+'</p></div><div class="wajd-article-path-membership-actions">'+(first?'<a class="is-primary" data-wajd-path-id="'+wajdPathsEscape(extraOf.id)+'" href="'+wajdPathsEscape(wajdPathsContextUrl(first.url,extraOf.id))+'">ابدأ المسار: '+wajdPathsEscape(first.title)+' ←</a>':'')+'<a href="'+wajdPathsEscape(wajdPathsPermalink(extraOf))+'">كل كتابات المسار</a></div></div>';
    return;
  }
  const index=path.items.findIndex(item=>wajdPathsNormalize(item.url)===current),previous=index>0?path.items[index-1]:null,next=index<path.items.length-1?path.items[index+1]:null;
  if(!activePath){
    document.body.classList.remove('wajd-path-reading-mode');if(head)head.remove();
    const target=next||path.items[0];
    box.className='wajd-article-path is-membership';
    box.innerHTML='<div class="wajd-article-path-membership-row"><div><small>هذه الكتابة '+wajdPathsArabic.format(index+1)+' من '+wajdPathsArabic.format(path.items.length)+' في مسار</small><h3>'+wajdPathsEscape(path.title)+'</h3><p>'+wajdPathsEscape(path.description||path.promise||'')+'</p></div><div class="wajd-article-path-membership-actions">'+(target?'<a class="is-primary" data-wajd-path-id="'+wajdPathsEscape(path.id)+'" href="'+wajdPathsEscape(wajdPathsContextUrl(target.url,path.id))+'">'+(next?'التالي في المسار: ':'ابدأ المسار من أوله: ')+wajdPathsEscape(target.title)+' ←</a>':'')+'<a href="'+wajdPathsEscape(wajdPathsPermalink(path))+'">كل كتابات المسار</a></div></div>';
    return;
  }
  const articleTrackKey=activePath.id+':'+index+':'+current;if(wajdPathsArticleTrackKey!==articleTrackKey){wajdPathsArticleTrackKey=articleTrackKey;wajdPathsTrack(activePath,'started',index+1).catch(error=>console.warn('Wajd path analytics:',error));}
  document.body.classList.add('wajd-path-reading-mode');
  if(!head){head=document.createElement('section');head.id='wajd-path-mode-head';head.className='wajd-path-mode-head';body.insertAdjacentElement('beforebegin',head);}
  const position=Math.round((index+1)/Math.max(1,path.items.length)*100);
  head.innerHTML='<div class="wajd-path-mode-row"><div class="wajd-path-mode-copy"><small>تقرأ الآن ضمن مسار</small><h2>'+wajdPathsEscape(path.title)+'</h2><p>الكتابة '+wajdPathsArabic.format(index+1)+' من '+wajdPathsArabic.format(path.items.length)+' · '+wajdPathsEscape(path.items[index].title)+'</p></div><div class="wajd-path-mode-actions"><a href="'+wajdPathsEscape(wajdPathsPermalink(path))+'">محتويات المسار</a><a href="'+wajdPathsEscape(wajdPathsCleanUrl(location.href))+'">الخروج من المسار</a></div></div><div class="wajd-path-mode-progress"><span style="width:'+position+'%"></span></div><div class="wajd-path-mode-steps"><span>بداية الرحلة</span><span>موضعك: '+wajdPathsArabic.format(index+1)+' / '+wajdPathsArabic.format(path.items.length)+'</span><span>نهاية الرحلة</span></div>';
  box.className='wajd-article-path is-mode';
  box.innerHTML='<span class="wajd-article-path-label">'+(next?'الخطوة التالية في المسار':'وصلت إلى نهاية المسار')+'</span><h3>'+(next?wajdPathsEscape(next.title):'أكملت كتابات «'+wajdPathsEscape(path.title)+'»')+'</h3><p>'+(next?'استمر داخل الرحلة نفسها دون الرجوع إلى صفحة المسار.':'يمكنك العودة إلى محتويات المسار أو إعادة زيارة أي كتابة منه.')+'</p><div class="wajd-article-path-nav is-mode-nav">'+(previous?'<a href="'+wajdPathsEscape(wajdPathsContextUrl(previous.url,path.id))+'">السابق: '+wajdPathsEscape(previous.title)+'</a>':'<a href="'+wajdPathsEscape(wajdPathsPermalink(path))+'">عرض بداية المسار</a>')+(next?'<a class="is-next" href="'+wajdPathsEscape(wajdPathsContextUrl(next.url,path.id))+'">التالي: '+wajdPathsEscape(next.title)+'</a>':'<a class="is-next" href="'+wajdPathsEscape(wajdPathsPermalink(path))+'">عرض المسار كاملًا ✓</a>')+'</div>';
}

/* WAJD v118: جسر صغير تستخدمه لوحة الإدارة الخارجية لإدارة المسارات. */
window.wajdPathsAdminBridge=Object.freeze({initialize:wajdPathsInitialize,db:()=>wajdPathsDb,auth:()=>wajdPathsAuth,getPublic:()=>wajdPathsPublic,setPublic:value=>{wajdPathsPublic=value;},posts:()=>wajdPathsPosts,defaults:wajdPathsDefaults,fn:Object.freeze({wajdPathsEscape,wajdPathsArabic,wajdPathsPermalink,wajdPathsNormalize,wajdPathsDepth,wajdPathsSorted,wajdPathsWritePublicCache,wajdPathsScheduleRender,wajdPathsNeed,wajdPathsMood,wajdPathsCopyText,wajdPathsAudience,wajdPathsAnalyticsRank,wajdPathsAnalyticsMillis,wajdPathsSyncCurrentTitles,wajdPathsLoadPosts})});
document.addEventListener('click',event=>{const button=event.target.closest('[data-wajd-path-id]');if(!button)return;const path=wajdPathsPublic.find(item=>item.id===button.dataset.wajdPathId);if(path)wajdPathsTrack(path,'seen',0).catch(error=>console.warn('Wajd path analytics:',error));},true);
document.addEventListener('click',async event=>{
  const shareButton=event.target.closest('[data-wajd-path-share]');if(shareButton){event.preventDefault();const path=wajdPathsPublic.find(item=>item.id===shareButton.dataset.wajdShareId);if(!path)return;const original=shareButton.textContent,share={title:path.title+' | وَجْد',text:path.promise||path.description||'مسار قراءة في وَجْد',url:wajdPathsPermalink(path)};try{if(shareButton.dataset.wajdPathShare==='native'&&navigator.share)await navigator.share(share);else await wajdPathsCopyText(share.url);shareButton.textContent=shareButton.dataset.wajdPathShare==='native'&&navigator.share?'تمت المشاركة ✓':'نُسخ الرابط ✓';}catch(error){if(error&&error.name!=='AbortError'){console.warn('Wajd path share:',error);shareButton.textContent='تعذّر النسخ';}}setTimeout(()=>{shareButton.textContent=original;},1800);return;}
  const pathButton=event.target.closest('[data-wajd-path-id]');if(pathButton){if(pathButton.matches('a[href]'))return;event.preventDefault();const publicPath=wajdPathsPublic.find(item=>item.id===pathButton.dataset.wajdPathId);if(publicPath)location.assign(wajdPathsPermalink(publicPath));return;}
  if(event.target.closest('[data-wajd-paths-all]')){event.preventDefault();location.assign(wajdPathsAllUrl());return;}
});
window.addEventListener('wajd-reader-data-updated',()=>wajdPathsSyncReaderBridge().catch(error=>console.warn('Wajd journey live sync:',error)));
wajdPathsHydratePublicCache();const wajdPathsInitialRouteKey=wajdPathsRouteKey();wajdPathsPublicReady=!wajdPathsHasRoute()||wajdPathsInitialRouteKey==='all'||wajdPathsPublic.some(path=>String(path.slug||path.id)===wajdPathsInitialRouteKey||String(path.id)===wajdPathsInitialRouteKey);wajdPathsPreparePage();wajdPathsScheduleRender();
const wajdPathsNeedsPublicData=wajdPathsHasRoute()||Boolean(document.getElementById('wajd-reading-paths'))||document.body.classList.contains('post');
if(wajdPathsNeedsPublicData)wajdPathsLoadPublic();
const wajdPathsAccountOpen=document.getElementById('wajd-account-open');if(wajdPathsAccountOpen)wajdPathsAccountOpen.addEventListener('click',()=>wajdPathsLoadPublic());
if(window.wajdGetReaderJourneyData)wajdPathsSyncReaderBridge().catch(error=>console.warn('Wajd journey initial sync:',error));else if(wajdPathsNeedsPublicData)wajdPathsLoadProgress();
