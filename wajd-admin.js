/* WAJD admin module (v118)
   يُحمَّل هذا الملف فقط بعد التأكد من أن الحساب المسجَّل هو حساب المدير.
   القرّاء لا ينزّلون شيئًا منه. لا تضع فيه أي سرّ: الحماية الحقيقية في قواعد Firestore.
   This file is loaded by the theme with import() only for the admin account. */
const B = window.wajdAdminBridge;
if (!B) throw new Error('wajd-admin-bridge-missing');
const {
  collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, limit, orderBy,
  query, serverTimestamp, setDoc, startAfter, where, writeBatch
} = await window.wajdFirebaseModulesPromise;
const wajdSavedDb = B.db();
const wajdSavedArabicNumber = B.number;
const wajdAdminCurrentUser = () => B.user();
const { wajdIsAdmin, wajdSavedShowToast, wajdSavedPostId, wajdSavedPostUrl, wajdSavedGetFeed, wajdNotificationSafeUrl, wajdAccountFallbackAvatar } = B.fn;
const { WAJD_ADMIN_EMAIL, WAJD_AUDIENCE_SESSION_TIMEOUT, WAJD_JOURNEY_COLLECTION } = B.constants;
const { wajdAdminContent, wajdAdminRefresh } = B.dom;


const WAJD_ADMIN_CSS = ".wajd-admin-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.wajd-admin-stat{padding:16px;border:1px solid var(--wajd-line);border-radius:14px;background:#fffaf5}.wajd-admin-stat span{display:block;color:var(--wajd-muted);font-size:11px}.wajd-admin-stat strong{display:block;margin-top:6px;color:var(--wajd-ink);font-size:25px;font-weight:700;font-variant-numeric:tabular-nums}.wajd-admin-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:16px}.wajd-admin-panel{min-width:0;padding:18px;border:1px solid var(--wajd-line);border-radius:15px;background:#fffaf5}.wajd-admin-panel-wide{grid-column:1/-1}.wajd-admin-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.wajd-admin-panel h3{margin:0;color:var(--wajd-ink);font-size:16px}.wajd-admin-note{color:var(--wajd-muted);font-size:10px}.wajd-admin-ranking{display:grid;gap:8px}.wajd-admin-rank{display:grid;grid-template-columns:25px minmax(0,1fr) auto;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid var(--wajd-line)}.wajd-admin-rank:last-child{border-bottom:0}.wajd-admin-rank-index{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#f1e4d9;color:var(--wajd-accent);font-size:10px;font-weight:700}.wajd-admin-rank a{overflow:hidden;color:var(--wajd-ink)!important;font-size:12px;font-weight:700;text-decoration:none!important;text-overflow:ellipsis;white-space:nowrap}.wajd-admin-rank strong{color:var(--wajd-accent);font-size:12px;font-variant-numeric:tabular-nums}.wajd-admin-empty{padding:24px 8px;color:var(--wajd-muted);font-size:12px;text-align:center}.wajd-admin-tabs{display:flex;gap:6px}.wajd-admin-tab{padding:7px 10px;border:1px solid var(--wajd-line);border-radius:999px;background:transparent;color:var(--wajd-muted);font:700 10px/1 'Tajawal',sans-serif;cursor:pointer}.wajd-admin-tab.is-active{border-color:var(--wajd-accent);background:var(--wajd-accent);color:#fff}.wajd-admin-chart{display:grid;grid-template-columns:repeat(30,minmax(5px,1fr));align-items:end;gap:4px;height:150px;padding-top:12px;border-bottom:1px solid var(--wajd-line)}.wajd-admin-bar{position:relative;min-height:2px;border-radius:4px 4px 0 0;background:#b88971;transition:height .2s ease}.wajd-admin-bar:hover{background:var(--wajd-accent)}.wajd-admin-bar:after{content:attr(data-tip);position:absolute;right:50%;bottom:calc(100% + 5px);z-index:2;display:none;min-width:max-content;padding:5px 7px;border-radius:6px;background:#2e2824;color:#fff;font-size:9px;transform:translateX(50%)}.wajd-admin-bar:hover:after{display:block}.wajd-admin-chart-legend{display:flex;justify-content:space-between;margin-top:7px;color:var(--wajd-muted);font-size:9px}.wajd-admin-nav{position:sticky;top:0;z-index:4;display:flex;gap:7px;margin:-22px -24px 20px;padding:13px 24px;border-bottom:1px solid var(--wajd-line);background:var(--wajd-paper)}.wajd-admin-nav-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:0 15px;border:1px solid transparent;border-radius:999px;background:transparent;color:var(--wajd-muted);font:700 11px/1 'Tajawal',sans-serif;cursor:pointer}.wajd-admin-nav-button:hover{background:#f4eadf;color:var(--wajd-accent)}.wajd-admin-nav-button.is-active{border-color:var(--wajd-accent);background:var(--wajd-accent);color:#fff}.wajd-admin-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px}.wajd-admin-toolbar-group{display:flex;align-items:center;flex-wrap:wrap;gap:7px}.wajd-admin-search,.wajd-admin-select{height:40px;border:1px solid var(--wajd-line);border-radius:10px;background:var(--wajd-paper);color:var(--wajd-ink);font:600 11px/1 'Tajawal',sans-serif;outline:none}.wajd-admin-search{width:min(330px,100%);padding:0 13px}.wajd-admin-select{padding:0 10px}.wajd-admin-search:focus,.wajd-admin-select:focus{border-color:var(--wajd-accent);box-shadow:0 0 0 3px rgba(149,83,64,.10)}.wajd-admin-stat small{display:block;margin-top:5px;color:var(--wajd-muted);font-size:9px}.wajd-admin-stat.is-accent{background:#f5e9df}.wajd-admin-stat.is-danger strong{color:#a33b2b}.wajd-admin-chart-controls{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.wajd-admin-range{display:flex;gap:4px;padding-right:8px;border-right:1px solid var(--wajd-line)}.wajd-admin-table{display:grid;gap:9px}.wajd-admin-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:13px 14px;border:1px solid var(--wajd-line);border-radius:12px;background:#fffaf5}.wajd-admin-row.is-hidden{opacity:.74;border-style:dashed}.wajd-admin-row-main{min-width:0}.wajd-admin-row-title{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin:0;color:var(--wajd-ink);font-size:13px;font-weight:700}.wajd-admin-row-meta{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-top:5px;color:var(--wajd-muted);font-size:9px}.wajd-admin-row-copy{display:-webkit-box;margin:7px 0 0;overflow:hidden;color:var(--txtColor);font-size:11px;line-height:1.75;-webkit-box-orient:vertical;-webkit-line-clamp:2}.wajd-admin-row-actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:6px}.wajd-admin-action{min-height:34px;padding:0 11px;border:1px solid var(--wajd-line);border-radius:9px;background:transparent;color:var(--wajd-accent);font:700 10px/1 'Tajawal',sans-serif;cursor:pointer}.wajd-admin-action:hover{background:#f4eadf}.wajd-admin-action.is-danger{border-color:#dfb8ad;color:#a33b2b}.wajd-admin-action.is-solid{border-color:var(--wajd-accent);background:var(--wajd-accent);color:#fff}.wajd-admin-action:disabled{cursor:wait;opacity:.5}.wajd-admin-pill{display:inline-flex;align-items:center;justify-content:center;min-height:22px;padding:0 8px;border-radius:999px;background:#f1e4d9;color:var(--wajd-accent);font-size:8px;font-weight:700}.wajd-admin-pill.is-muted{background:#eee8e1;color:var(--wajd-muted)}.wajd-admin-pill.is-danger{background:#f6ddd7;color:#9b3829}.wajd-admin-pill.is-success{background:#dfeae4;color:#446c58}.wajd-admin-reader{grid-template-columns:46px minmax(0,1fr) auto}.wajd-admin-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;background:#eadfce}.wajd-admin-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.wajd-admin-kpi{padding:8px;border-radius:9px;background:rgba(149,83,64,.055);text-align:center}.wajd-admin-kpi strong,.wajd-admin-kpi span{display:block}.wajd-admin-kpi strong{color:var(--wajd-ink);font-size:14px}.wajd-admin-kpi span{margin-top:2px;color:var(--wajd-muted);font-size:8px}.wajd-admin-result-count{color:var(--wajd-muted);font-size:10px}.wajd-admin-anonymous-note{margin:-5px 0 14px;padding:10px 12px;border:1px dashed var(--wajd-line);border-radius:10px;background:rgba(149,83,64,.045);color:var(--wajd-muted);font-size:9px;line-height:1.8}.wajd-admin-section-title{margin:0 0 13px;color:var(--wajd-ink);font-size:18px}.wajd-audience-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:14px}.wajd-audience-summary>div{padding:13px;border:1px solid var(--wajd-line);border-radius:13px;background:#fffaf5}.wajd-audience-summary span,.wajd-audience-summary strong,.wajd-audience-summary small{display:block}.wajd-audience-summary span{color:var(--wajd-muted);font-size:8px}.wajd-audience-summary strong{margin-top:4px;color:var(--wajd-ink);font-size:20px}.wajd-audience-summary small{margin-top:2px;color:var(--wajd-muted);font-size:7px}.wajd-audience-filters{display:flex;flex-wrap:wrap;gap:5px}.wajd-audience-code-avatar{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;background:#f1e4d9;color:var(--wajd-accent);font-size:10px;font-weight:800;letter-spacing:.03em}.wajd-audience-row{grid-template-columns:46px minmax(0,1fr) auto}.wajd-audience-row .wajd-admin-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.wajd-audience-last-page{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:8px;color:var(--wajd-muted);font-size:9px}.wajd-audience-last-page a{max-width:520px;overflow:hidden;color:var(--wajd-accent)!important;font-weight:700;text-decoration:none!important;text-overflow:ellipsis;white-space:nowrap}.wajd-audience-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:13px}.wajd-audience-detail-head h3{margin:0;color:var(--wajd-ink);font-size:20px}.wajd-audience-detail-head p{margin:4px 0 0;color:var(--wajd-muted);font-size:9px}.wajd-audience-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:13px}.wajd-audience-detail-stat{padding:11px;border:1px solid var(--wajd-line);border-radius:11px;background:rgba(149,83,64,.045)}.wajd-audience-detail-stat span,.wajd-audience-detail-stat strong{display:block}.wajd-audience-detail-stat span{color:var(--wajd-muted);font-size:8px}.wajd-audience-detail-stat strong{margin-top:3px;color:var(--wajd-ink);font-size:15px}.wajd-audience-context{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:14px}.wajd-audience-context>div{padding:11px 12px;border:1px solid var(--wajd-line);border-radius:11px}.wajd-audience-context small,.wajd-audience-context strong,.wajd-audience-context a{display:block}.wajd-audience-context small{color:var(--wajd-muted);font-size:8px}.wajd-audience-context strong,.wajd-audience-context a{margin-top:3px;overflow:hidden;color:var(--wajd-ink)!important;font-size:10px;font-weight:700;text-decoration:none!important;text-overflow:ellipsis;white-space:nowrap}.wajd-audience-sessions{display:grid;gap:7px}.wajd-audience-session{display:grid;grid-template-columns:125px 88px 72px minmax(0,1fr);align-items:center;gap:9px;padding:10px 11px;border:1px solid var(--wajd-line);border-radius:10px;background:#fffaf5}.wajd-audience-session>span{color:var(--wajd-muted);font-size:8px}.wajd-audience-session>strong{color:var(--wajd-ink);font-size:10px}.wajd-audience-session-route{min-width:0}.wajd-audience-session-route small,.wajd-audience-session-route a{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wajd-audience-session-route small{color:var(--wajd-muted);font-size:7px}.wajd-audience-session-route a{margin-top:2px;color:var(--wajd-accent)!important;font-size:9px;font-weight:700;text-decoration:none!important}body.dark-mode .wajd-audience-summary>div,body.dark-mode .wajd-audience-session{background:var(--MinBgColor)}.wajd-behavior-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:15px}.wajd-behavior-head>div:first-child>span{display:block;color:var(--wajd-accent);font-size:9px;font-weight:800}.wajd-behavior-head h3{margin:3px 0;color:var(--wajd-ink);font:700 24px/1.5 'Noto Naskh Arabic',serif}.wajd-behavior-head p{max-width:670px;margin:0;color:var(--wajd-muted);font-size:10px;line-height:1.8}.wajd-behavior-ranges{display:flex;flex:0 0 auto;gap:4px;padding:4px;border:1px solid var(--wajd-line);border-radius:999px}.wajd-behavior-ranges button{padding:8px 11px;border:0;border-radius:999px;background:transparent;color:var(--wajd-muted);font:800 9px/1 'Tajawal',sans-serif;cursor:pointer}.wajd-behavior-ranges button.is-active{background:var(--wajd-accent);color:#fff}.wajd-behavior-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin-bottom:13px}.wajd-behavior-stat{padding:13px;border:1px solid var(--wajd-line);border-radius:13px;background:#fffaf5}.wajd-behavior-stat span,.wajd-behavior-stat strong,.wajd-behavior-stat small{display:block}.wajd-behavior-stat span{color:var(--wajd-muted);font-size:8px}.wajd-behavior-stat strong{margin-top:4px;color:var(--wajd-ink);font-size:19px}.wajd-behavior-stat small{margin-top:2px;color:var(--wajd-muted);font-size:7px;line-height:1.5}.wajd-behavior-note{margin-bottom:13px;padding:10px 12px;border:1px dashed var(--wajd-line);border-radius:10px;background:rgba(149,83,64,.035);color:var(--wajd-muted);font-size:9px;line-height:1.8}.wajd-behavior-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.wajd-behavior-wide{grid-column:1/-1}.wajd-behavior-chart{gap:2px;height:135px}.wajd-behavior-bars{display:grid;gap:10px}.wajd-behavior-bar-head{display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--wajd-muted);font-size:9px}.wajd-behavior-bar-head b{color:var(--wajd-ink);font-size:10px}.wajd-behavior-track{display:block;height:6px;margin-top:5px;overflow:hidden;border-radius:999px;background:#eadfd7}.wajd-behavior-track i{display:block;height:100%;border-radius:inherit;background:var(--wajd-accent)}.wajd-behavior-pairs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:14px}.wajd-behavior-pair{padding:10px;border:1px solid var(--wajd-line);border-radius:10px;text-align:center}.wajd-behavior-pair strong,.wajd-behavior-pair span{display:block}.wajd-behavior-pair strong{color:var(--wajd-ink);font-size:17px}.wajd-behavior-pair span{margin-top:2px;color:var(--wajd-muted);font-size:8px}.wajd-behavior-entries{display:grid;gap:7px}.wajd-behavior-entry{display:grid;grid-template-columns:26px minmax(0,1fr) auto;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--wajd-line)}.wajd-behavior-entry:last-child{border-bottom:0}.wajd-behavior-entry>span{display:flex;align-items:center;justify-content:center;width:25px;height:25px;border-radius:50%;background:#f1e4d9;color:var(--wajd-accent);font-size:9px;font-weight:800}.wajd-behavior-entry a{overflow:hidden;color:var(--wajd-ink)!important;font-size:10px;font-weight:700;text-decoration:none!important;text-overflow:ellipsis;white-space:nowrap}.wajd-behavior-entry strong{color:var(--wajd-accent);font-size:10px}.wajd-behavior-empty{padding:22px 8px;color:var(--wajd-muted);font-size:10px;text-align:center}body.dark-mode .wajd-behavior-stat,body.dark-mode .wajd-behavior-pair{background:var(--MinBgColor)}body.dark-mode .wajd-behavior-track{background:#463831}.wajd-behavior-grid .wajd-admin-panel-head{align-items:flex-start;flex-wrap:wrap}.wajd-behavior-compare{width:100%;margin:0;border:0;border-collapse:collapse;table-layout:fixed;background:transparent;text-align:right}.wajd-behavior-compare th,.wajd-behavior-compare td{padding:10px 4px;border:0;border-bottom:1px solid var(--wajd-line);background:transparent;color:var(--wajd-ink);font-size:10px;line-height:1.65;vertical-align:middle}.wajd-behavior-compare thead th{color:var(--wajd-muted);font-size:8px;font-weight:600}.wajd-behavior-compare tbody th{font-weight:700}.wajd-behavior-help{margin:11px 0 0;color:var(--wajd-muted);font-size:9px;line-height:1.8}.wajd-path-admin-layout{display:grid;grid-template-columns:260px minmax(0,1fr);gap:14px}.wajd-path-admin-list-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:11px}.wajd-path-admin-list-head h3{margin:0;font-size:15px}.wajd-path-admin-list-items{display:grid;gap:7px}.wajd-path-admin-select{width:100%;padding:10px;border:1px solid var(--wajd-line);border-radius:10px;background:transparent;color:var(--wajd-ink);text-align:right;cursor:pointer}.wajd-path-admin-select.is-active{border-color:var(--wajd-accent);background:#f1e4d9}.wajd-path-admin-select strong,.wajd-path-admin-select span{display:block}.wajd-path-admin-select strong{font-size:11px}.wajd-path-admin-select span{margin-top:3px;color:var(--wajd-muted);font-size:8px}.wajd-path-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.wajd-path-field{display:grid;gap:5px}.wajd-path-field.is-wide{grid-column:1/-1}.wajd-path-field label{color:var(--wajd-muted);font-size:9px;font-weight:700}.wajd-path-field input,.wajd-path-field textarea,.wajd-path-field select{width:100%;padding:10px;border:1px solid var(--wajd-line);border-radius:9px;background:var(--wajd-paper);color:var(--wajd-ink);font:600 11px/1.7 'Tajawal',sans-serif;outline:none}.wajd-path-field textarea{min-height:78px;resize:vertical}.wajd-path-editor-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:12px}.wajd-path-admin-items{display:grid;gap:7px;margin-top:13px}.wajd-path-admin-item{display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:center;gap:8px;padding:8px;border:1px solid var(--wajd-line);border-radius:9px;background:var(--wajd-paper)}.wajd-path-admin-item[draggable=true]{cursor:grab}.wajd-path-admin-item.is-dragging{opacity:.45}.wajd-path-admin-item-title{overflow:hidden;font-size:10px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.wajd-path-admin-item-actions{display:flex;gap:3px}.wajd-path-admin-item-actions button{width:28px;height:28px;padding:0;border:1px solid var(--wajd-line);border-radius:7px;background:transparent;color:var(--wajd-accent);cursor:pointer}.wajd-path-picker{margin-top:15px;padding-top:14px;border-top:1px solid var(--wajd-line)}.wajd-path-picker-results{display:grid;max-height:230px;margin-top:8px;overflow:auto}.wajd-path-picker-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border-bottom:1px solid var(--wajd-line);font-size:10px}.wajd-path-unassigned{margin-top:14px;padding:12px;border:1px dashed var(--wajd-line);border-radius:10px;color:var(--wajd-muted);font-size:10px;line-height:1.8}.wajd-path-analytics-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:15px}.wajd-path-analytics-head>div:first-child>span{display:block;color:var(--wajd-accent);font-size:9px;font-weight:800}.wajd-path-analytics-head h3{margin:3px 0;color:var(--wajd-ink);font:700 24px/1.5 'Noto Naskh Arabic',serif}.wajd-path-analytics-head p{max-width:650px;margin:0;color:var(--wajd-muted);font-size:10px;line-height:1.8}.wajd-path-analytics-ranges{display:flex;flex:0 0 auto;gap:4px;padding:4px;border:1px solid var(--wajd-line);border-radius:999px}.wajd-path-analytics-ranges button{padding:8px 11px;border:0;border-radius:999px;background:transparent;color:var(--wajd-muted);font:800 9px/1 'Tajawal',sans-serif;cursor:pointer}.wajd-path-analytics-ranges button.is-active{background:var(--wajd-accent);color:#fff}.wajd-path-analytics-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:11px}.wajd-path-analytics-summary>div{padding:13px;border:1px solid var(--wajd-line);border-radius:13px;background:#fffaf5}.wajd-path-analytics-summary span,.wajd-path-analytics-summary strong{display:block}.wajd-path-analytics-summary span{color:var(--wajd-muted);font-size:8px}.wajd-path-analytics-summary strong{margin-top:4px;color:var(--wajd-ink);font-size:20px}.wajd-path-analytics-note{margin-bottom:13px;padding:10px 12px;border:1px dashed var(--wajd-line);border-radius:10px;color:var(--wajd-muted);font-size:9px;line-height:1.8}.wajd-path-analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.wajd-path-analytics-card{padding:15px;border:1px solid var(--wajd-line);border-radius:15px;background:#fffaf5}.wajd-path-analytics-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.wajd-path-analytics-card-head span{color:var(--wajd-accent);font-size:8px;font-weight:800}.wajd-path-analytics-card-head h4{margin:3px 0 0;color:var(--wajd-ink);font-size:14px}.wajd-path-analytics-card-head>b{padding:5px 8px;border-radius:999px;background:#f1e4d9;color:var(--wajd-accent);font-size:8px;white-space:nowrap}.wajd-path-analytics-numbers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:13px 0}.wajd-path-analytics-numbers>div{padding:9px;border:1px solid var(--wajd-line);border-radius:10px;text-align:center}.wajd-path-analytics-numbers strong,.wajd-path-analytics-numbers span{display:block}.wajd-path-analytics-numbers strong{color:var(--wajd-ink);font-size:17px}.wajd-path-analytics-numbers span{margin-top:2px;color:var(--wajd-muted);font-size:7px}.wajd-path-analytics-bars{display:grid;gap:8px}.wajd-path-analytics-bars>div>span{display:flex;justify-content:space-between;gap:8px;color:var(--wajd-muted);font-size:8px}.wajd-path-analytics-bars b{font-weight:700}.wajd-path-analytics-bars em{font-style:normal}.wajd-path-analytics-bars i{display:block;height:5px;margin-top:4px;overflow:hidden;border-radius:999px;background:#eadfd7}.wajd-path-analytics-bars i b{display:block;height:100%;border-radius:inherit;background:var(--wajd-accent)}.wajd-path-analytics-details{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.wajd-path-analytics-details>span{padding:5px 8px;border-radius:999px;background:rgba(149,83,64,.07);color:var(--wajd-muted);font-size:8px}.wajd-path-analytics-stop{padding:10px 11px;border-right:3px solid var(--wajd-accent);border-radius:8px;background:rgba(149,83,64,.05)}.wajd-path-analytics-stop small,.wajd-path-analytics-stop strong,.wajd-path-analytics-stop span{display:block}.wajd-path-analytics-stop small{color:var(--wajd-muted);font-size:7px}.wajd-path-analytics-stop strong{margin-top:3px;color:var(--wajd-ink);font-size:10px;line-height:1.65}.wajd-path-analytics-stop span{margin-top:2px;color:var(--wajd-muted);font-size:8px}body.dark-mode .wajd-path-admin-select.is-active{background:#3a302b}body.dark-mode .wajd-path-analytics-card-head>b,body.dark-mode .wajd-path-analytics-bars i{background:#463831}.wajd-path-admin-permalink{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px}.wajd-path-admin-permalink input{direction:ltr;text-align:left}.wajd-path-admin-permalink a,.wajd-path-admin-permalink button{display:flex;align-items:center;justify-content:center;min-height:39px;padding:0 11px;border:1px solid var(--wajd-line);border-radius:9px;background:transparent;color:var(--wajd-accent)!important;font:800 9px/1 'Tajawal',sans-serif;text-decoration:none!important;cursor:pointer}@media(max-width:720px){.wajd-path-admin-permalink{grid-template-columns:1fr 1fr}.wajd-path-admin-permalink input{grid-column:1/-1}}body.dark-mode .wajd-admin-stat,body.dark-mode .wajd-admin-panel{background:#302a26}body.dark-mode .wajd-admin-rank-index{background:#3a302b}body.dark-mode .wajd-admin-nav{background:#28231f}body.dark-mode .wajd-admin-nav-button:hover,body.dark-mode .wajd-admin-action:hover{background:#352e29}body.dark-mode .wajd-admin-row{background:#302a26}body.dark-mode .wajd-admin-search,body.dark-mode .wajd-admin-select{background:#302a26}body.dark-mode .wajd-admin-stat.is-accent{background:#3a302b}body.dark-mode .wajd-admin-pill.is-muted{background:#403830}body.dark-mode .wajd-admin-pill.is-danger{background:#512f29}body.dark-mode .wajd-admin-pill.is-success{background:#314139}@media screen and (max-width:640px){.wajd-admin-nav{margin:-16px -16px 16px;padding:10px 16px;overflow-x:auto}.wajd-admin-nav-button{flex:0 0 auto;padding:0 12px}.wajd-admin-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.wajd-admin-stat:last-child{grid-column:auto}.wajd-admin-grid{grid-template-columns:1fr}.wajd-admin-panel-wide{grid-column:auto}.wajd-admin-chart{gap:2px;height:130px}.wajd-admin-toolbar{align-items:stretch;flex-direction:column}.wajd-admin-toolbar-group{width:100%}.wajd-admin-search{width:100%}.wajd-admin-row,.wajd-admin-reader{grid-template-columns:1fr}.wajd-admin-reader .wajd-admin-avatar{display:none}.wajd-admin-row-actions{justify-content:flex-start}.wajd-admin-chart-controls{align-items:flex-start;flex-direction:column}.wajd-admin-range{padding:6px 0 0;border:0;border-top:1px solid var(--wajd-line)}.wajd-audience-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.wajd-audience-summary>div:last-child{grid-column:1/-1}.wajd-audience-row{grid-template-columns:1fr}.wajd-audience-code-avatar{display:none}.wajd-audience-row .wajd-admin-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.wajd-audience-detail-head{flex-direction:column}.wajd-audience-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wajd-audience-context{grid-template-columns:1fr}.wajd-audience-session{grid-template-columns:1fr 1fr}.wajd-audience-session-route{grid-column:1/-1}.wajd-behavior-head{align-items:stretch;flex-direction:column}.wajd-behavior-ranges{width:100%}.wajd-behavior-ranges button{flex:1}.wajd-behavior-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.wajd-behavior-grid{grid-template-columns:1fr}.wajd-behavior-wide{grid-column:auto}.wajd-behavior-chart{height:120px}.wajd-behavior-pairs{grid-template-columns:repeat(2,minmax(0,1fr))}.wajd-path-admin-layout{grid-template-columns:1fr}.wajd-path-admin-list-items{grid-template-columns:1fr}.wajd-path-form-grid{grid-template-columns:1fr}.wajd-path-field.is-wide{grid-column:auto}.wajd-path-analytics-head{align-items:stretch;flex-direction:column}.wajd-path-analytics-ranges{width:100%}.wajd-path-analytics-ranges button{flex:1}.wajd-path-analytics-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.wajd-path-analytics-grid{grid-template-columns:1fr}.wajd-path-analytics-card{padding:13px}}#wajd-journey-root{min-width:0;color:var(--wajd-ink);font-family:'Tajawal',sans-serif;direction:rtl;text-align:right}#wajd-journey-root *{box-sizing:border-box}#wajd-journey-root .wj-header{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:0 0 20px}#wajd-journey-root .wj-header>div{min-width:0}#wajd-journey-root .wj-header>div>span{color:var(--wajd-accent);font-size:11px;font-weight:700}#wajd-journey-root h3{margin:5px 0;font:700 28px/1.5 'Noto Naskh Arabic',serif}#wajd-journey-root h4{margin:0 0 6px;color:var(--wajd-ink);font-size:15px;line-height:1.7}#wajd-journey-root p{margin:5px 0 13px;color:var(--wajd-muted);font-size:12px;line-height:1.9;overflow-wrap:anywhere}#wajd-journey-root .wj-filters{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:15px}#wajd-journey-root .wj-filter{display:block;min-width:0;margin:0}#wajd-journey-root .wj-filter>span{display:block;margin-bottom:6px;color:var(--wajd-muted);font-size:11px}#wajd-journey-root .wj-filter select,#wajd-journey-root .wj-filter input{width:100%;min-width:0;min-height:42px;padding:9px 10px;border:1px solid var(--wajd-line);border-radius:10px;background:var(--MinBgColor,#fffaf5);color:var(--wajd-ink);font:500 12px/1.6 'Tajawal',sans-serif;direction:rtl}#wajd-journey-root .wj-note{margin:0 0 14px;padding:12px 14px;border:1px solid var(--wajd-line);border-radius:12px;background:rgba(149,83,64,.035);color:var(--wajd-muted);font-size:11px;line-height:1.9;overflow-wrap:anywhere}#wajd-journey-root .wj-note.is-warning{border-style:dashed;border-color:var(--wajd-accent)}#wajd-journey-root .wj-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px}#wajd-journey-root .wj-kpis>div{min-width:0;padding:16px;border:1px solid var(--wajd-line);border-radius:15px;background:rgba(149,83,64,.035)}#wajd-journey-root .wj-kpis span,#wajd-journey-root .wj-kpis strong,#wajd-journey-root .wj-kpis small{display:block}#wajd-journey-root .wj-kpis span{font-size:12px;color:var(--wajd-muted)}#wajd-journey-root .wj-kpis strong{margin:8px 0;font-size:24px;line-height:1.5;overflow-wrap:anywhere}#wajd-journey-root .wj-kpis small{font-size:10px;line-height:1.8;color:var(--wajd-muted)}#wajd-journey-root .wj-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}#wajd-journey-root .wj-panel{min-width:0;padding:18px;border:1px solid var(--wajd-line);border-radius:16px;background:rgba(149,83,64,.018)}#wajd-journey-root .wj-wide{grid-column:1/-1}#wajd-journey-root .wj-funnel{display:grid;gap:12px;margin:17px 0}#wajd-journey-root .wj-funnel>div{display:grid;grid-template-columns:1fr auto;gap:6px;font-size:12px}#wajd-journey-root .wj-funnel small{margin-inline-start:6px;color:var(--wajd-muted);font-size:10px;font-weight:400}#wajd-journey-root .wj-funnel i{display:block;grid-column:1/-1;height:6px;border-radius:6px;background:rgba(149,83,64,.12);overflow:hidden}#wajd-journey-root .wj-funnel em{display:block;height:100%;border-radius:6px;background:var(--wajd-accent)}#wajd-journey-root .wj-retention{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:18px 0}#wajd-journey-root .wj-retention>div{min-width:0;padding:12px 8px;border:1px solid var(--wajd-line);border-radius:12px;text-align:center}#wajd-journey-root .wj-retention span,#wajd-journey-root .wj-retention strong,#wajd-journey-root .wj-retention small{display:block}#wajd-journey-root .wj-retention span{font-size:12px}#wajd-journey-root .wj-retention strong{margin:9px 0;font-size:24px}#wajd-journey-root .wj-retention small{font-size:10px;line-height:1.8;color:var(--wajd-muted)}#wajd-journey-root .wj-table-wrap{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;border:1px solid var(--wajd-line);border-radius:10px;margin:13px 0;scrollbar-width:thin}#wajd-journey-root table{width:100%;border-collapse:collapse;table-layout:auto;font-size:11px;line-height:1.8}#wajd-journey-root th,#wajd-journey-root td{padding:11px 10px;border:0;border-bottom:1px solid var(--wajd-line);text-align:right;vertical-align:middle}#wajd-journey-root th{font-weight:700}#wajd-journey-root thead{background:rgba(149,83,64,.07);color:var(--wajd-muted)}#wajd-journey-root tbody tr:last-child th,#wajd-journey-root tbody tr:last-child td{border-bottom:0}#wajd-journey-root .wj-ranked{display:grid;gap:9px;margin-top:12px}#wajd-journey-root .wj-ranked>div{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:5px 12px;padding:12px;border-radius:10px;background:rgba(149,83,64,.045)}#wajd-journey-root .wj-ranked strong{font-size:12px;line-height:1.8;overflow-wrap:anywhere}#wajd-journey-root .wj-ranked span{font-size:11px;white-space:nowrap;color:var(--wajd-accent)}#wajd-journey-root .wj-ranked small{grid-column:1/-1;font-size:10px;color:var(--wajd-muted)}#wajd-journey-root .wj-insights{display:grid;gap:10px;margin:13px 0 0;padding:0;list-style:none}#wajd-journey-root .wj-insights li{padding:14px;border-inline-start:3px solid var(--wajd-accent);border-radius:9px;background:rgba(149,83,64,.05);font-size:12px;line-height:1.95;overflow-wrap:anywhere}#wajd-journey-root .wj-session-head{display:flex;justify-content:space-between;align-items:start;gap:15px;margin-bottom:14px}#wajd-journey-root .wj-session-head .wj-filter{width:280px;max-width:100%;flex:0 1 280px}#wajd-journey-root .wj-session{min-width:0;margin-top:10px;border:1px solid var(--wajd-line);border-radius:12px;overflow:hidden}#wajd-journey-root .wj-session summary{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px;list-style:none;cursor:pointer;background:rgba(149,83,64,.025)}#wajd-journey-root .wj-session summary::-webkit-details-marker{display:none}#wajd-journey-root .wj-session summary:after{content:'+';flex:0 0 auto;color:var(--wajd-accent);font-size:20px}#wajd-journey-root .wj-session[open] summary:after{content:'\\2212'}#wajd-journey-root .wj-session summary>div{min-width:0;flex:1}#wajd-journey-root .wj-session summary strong,#wajd-journey-root .wj-session summary b{display:block;font-size:12px;line-height:1.8;overflow-wrap:anywhere}#wajd-journey-root .wj-session summary small{display:block;margin-top:4px;color:var(--wajd-muted);font-size:10px;line-height:1.8;overflow-wrap:anywhere}#wajd-journey-root .wj-session-body{padding:16px;border-top:1px solid var(--wajd-line)}#wajd-journey-root .wj-timeline{margin:17px 0;padding:0;list-style:none}#wajd-journey-root .wj-timeline>li{display:grid;grid-template-columns:28px minmax(0,1fr);align-items:start;gap:12px;margin:0;padding:0 0 22px;position:relative}#wajd-journey-root .wj-timeline>li:not(:last-child):before{content:'';position:absolute;inset-inline-start:13px;top:29px;bottom:0;width:1px;background:var(--wajd-line)}#wajd-journey-root .wj-step-number{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--wajd-accent);color:#fff;font-size:11px}#wajd-journey-root .wj-step-copy{min-width:0}#wajd-journey-root .wj-step-copy>small{display:block;color:var(--wajd-muted);font-size:10px;line-height:1.8}#wajd-journey-root .wj-step-copy>a{display:block;margin:5px 0;color:var(--wajd-accent);font-size:14px;font-weight:700;line-height:1.8;text-decoration:none;overflow-wrap:anywhere}#wajd-journey-root .wj-step-copy>p{font-size:11px;margin-bottom:9px}#wajd-journey-root .wj-milestones,#wajd-journey-root .wj-events{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#wajd-journey-root .wj-milestones>span,#wajd-journey-root .wj-events>span{padding:5px 8px;border:1px solid var(--wajd-line);border-radius:7px;font-size:10px;color:var(--wajd-muted)}#wajd-journey-root .wj-milestones .is-reached{background:var(--wajd-accent);border-color:var(--wajd-accent);color:#fff}#wajd-journey-root .wj-events>span{background:rgba(99,130,105,.09);color:var(--wajd-ink)}#wajd-journey-root .wj-load{display:flex;justify-content:center;margin:18px 0}#wajd-journey-root .wj-user-filter{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;margin-bottom:14px;border:1px solid var(--wajd-line);border-radius:12px;font-size:12px}#wajd-journey-root .wj-footnote{font-size:11px;margin-top:18px}@media(max-width:850px){#wajd-journey-root .wj-filters{grid-template-columns:repeat(3,minmax(0,1fr))}#wajd-journey-root .wj-grid{grid-template-columns:1fr}#wajd-journey-root .wj-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){#wajd-journey-root .wj-header{align-items:start}#wajd-journey-root h3{font-size:25px}#wajd-journey-root .wj-header>button{flex:0 0 auto;max-width:110px;line-height:1.6}#wajd-journey-root .wj-filters{grid-template-columns:repeat(2,minmax(0,1fr))}#wajd-journey-root .wj-filters>.wj-filter:last-child{grid-column:1/-1}#wajd-journey-root .wj-panel{padding:13px}#wajd-journey-root .wj-kpis{gap:8px}#wajd-journey-root .wj-kpis>div{padding:12px}#wajd-journey-root .wj-kpis strong{font-size:20px}#wajd-journey-root .wj-session-head{flex-direction:column}#wajd-journey-root .wj-session-head .wj-filter{width:100%;flex:auto}#wajd-journey-root .wj-session summary{flex-wrap:wrap;gap:8px;padding:12px}#wajd-journey-root .wj-session summary>div:first-child{flex-basis:100%}#wajd-journey-root .wj-session-body{padding:11px}#wajd-journey-root .wj-timeline>li{gap:8px}#wajd-journey-root th,#wajd-journey-root td{padding:8px 6px;font-size:10px}#wajd-journey-root .wj-retention{gap:5px}#wajd-journey-root .wj-retention>div{padding:10px 5px}#wajd-journey-root .wj-note{padding:10px}}";

/* أنماط لوحة الإدارة: كانت داخل القالب وتصل لكل زائر، صارت هنا. */
(function wajdAdminInjectStyles() {
  if (document.getElementById('wajd-admin-module-styles')) return;
  const style = document.createElement('style');
  style.id = 'wajd-admin-module-styles';
  style.textContent = WAJD_ADMIN_CSS;
  document.head.appendChild(style);
})();

let wajdAdminData;
let wajdAdminView = 'overview';
let wajdAdminMetric = 'views';
let wajdAdminRange = 30;
let wajdAdminCommentSearch = '';
let wajdAdminCommentFilter = 'all';
let wajdAdminReaderSearch = '';
let wajdAdminAudienceFilter = 'all';
let wajdAdminAudienceSelected = '';
let wajdAdminAudienceRange = 30;

function wajdAdminEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function wajdAdminSafeUrl(value) {
  return wajdNotificationSafeUrl(value);
}

function wajdAdminTimestamp(data, key) {
  const value = data && data[key];
  return value && value.toMillis ? value.toMillis() : 0;
}

function wajdAdminNav() {
  const items = [
    ['overview','نظرة عامة'],
    ['content','المحتوى'],
    ['paths','مسارات القراءة'],
    ['path-analytics','تحليلات المسارات'],
    ['audience-analytics','سلوك الجمهور'],
    ['audience-journey','رحلة الجمهور'],
    ['comments','التعليقات'],
    ['readers','الجمهور']
  ];
  return '<nav aria-label="أقسام لوحة الإدارة" class="wajd-admin-nav">' + items.map(item => '<button class="wajd-admin-nav-button' + (wajdAdminView === item[0] ? ' is-active' : '') + '" data-admin-view="' + item[0] + '" type="button">' + item[1] + '</button>').join('') + '</nav>';
}

function wajdAdminDate(value, detailed) {
  const time = value && value.toMillis ? value.toMillis() : (value instanceof Date ? value.getTime() : 0);
  if (!time) return 'غير متاح';
  return new Intl.DateTimeFormat('ar-EG', detailed ? { dateStyle:'medium', timeStyle:'short' } : { dateStyle:'medium' }).format(new Date(time));
}

function wajdAdminDuration(value) {
  const seconds = Math.max(0, Math.round(Number(value) || 0));
  if (seconds < 60) return wajdSavedArabicNumber.format(seconds) + ' ث';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return wajdSavedArabicNumber.format(minutes) + ' د';
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return wajdSavedArabicNumber.format(hours) + ' س' + (rest ? ' ' + wajdSavedArabicNumber.format(rest) + ' د' : '');
}

function wajdAdminAudienceCode(userId) {
  let hash = 2166136261;
  String(userId || '').split('').forEach(character => { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); });
  return ('0000' + (hash >>> 0).toString(16).toUpperCase()).slice(-4);
}

function wajdAdminAudienceSource(value) {
  return ({ direct:'دخول مباشر', internal:'من صفحة داخل وَجْد', google:'بحث Google', telegram:'Telegram', facebook:'Facebook أو Instagram', other:'مصدر خارجي' })[value] || 'غير معروف';
}

function wajdAdminAudienceDevice(value) {
  return ({ mobile:'هاتف', tablet:'جهاز لوحي', desktop:'كمبيوتر' })[value] || 'جهاز غير معروف';
}

function wajdAdminAudienceBrowser(value) {
  return ({chrome:'Chrome',safari:'Safari',firefox:'Firefox',edge:'Edge',opera:'Opera',other:'متصفح آخر',unknown:'غير معروف'})[value] || 'غير معروف';
}

function wajdAdminAudienceOs(value) {
  return ({android:'Android',ios:'iOS',windows:'Windows',macos:'macOS',linux:'Linux',other:'نظام آخر',unknown:'غير معروف'})[value] || 'غير معروف';
}

function wajdAdminAudienceType(value) {
  return ({ home:'الرئيسية', article:'مقالة', category:'قسم', path:'مسار قراءة', qa:'سؤال وجواب', other:'صفحة أخرى' })[value] || 'صفحة أخرى';
}

function wajdAdminAudienceMillis(row, key) {
  const analytics = row && row.analytics || {};
  const value = analytics[key] || row && row[key];
  return value && value.toMillis ? value.toMillis() : value instanceof Date ? value.getTime() : Number(value) || 0;
}

function wajdAdminAudienceOnline(row) {
  return wajdAdminAudienceMillis(row, 'lastActiveAt') > Date.now() - 2 * 60 * 1000;
}

function wajdAdminArticleFromRef(item) {
  return item && item.ref && item.ref.parent && item.ref.parent.parent ? item.ref.parent.parent.id : '';
}

function wajdAdminOwnerFromRef(item) {
  return item && item.ref && item.ref.parent && item.ref.parent.parent ? item.ref.parent.parent.id : '';
}

function wajdAdminCountByOwner(snapshot) {
  const map = new Map();
  snapshot.forEach(item => {
    const owner = wajdAdminOwnerFromRef(item);
    if (owner) map.set(owner, (map.get(owner) || 0) + 1);
  });
  return map;
}

function wajdAdminCountByDocumentId(snapshot) {
  const map = new Map();
  snapshot.forEach(item => map.set(item.id,(map.get(item.id)||0)+1));
  return map;
}

function wajdAdminSnapshot(items) {
  const docs = Array.isArray(items) ? items : [];
  return {
    docs,
    size:docs.length,
    empty:docs.length === 0,
    forEach(callback) { docs.forEach(callback); }
  };
}

async function wajdAdminCollect(requests) {
  const results = await Promise.allSettled(requests.map(item => getDocs(item.ref)));
  const docs = [], failures = [];
  results.forEach((result,index) => {
    if (result.status === 'fulfilled') result.value.forEach(item => docs.push(item));
    else failures.push({ label:requests[index].label, error:result.reason });
  });
  return { snapshot:wajdAdminSnapshot(docs), failures };
}

function wajdAdminSeries(items, key, count) {
  const days = [], values = new Map();
  const formatter = new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit' });
  for (let offset = count - 1; offset >= 0; offset--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const id = formatter.format(date);
    const point = { id, label:new Intl.DateTimeFormat('ar-EG', { day:'numeric', month:'short' }).format(date), value:0 };
    days.push(point); values.set(id, point);
  }
  items.forEach(item => {
    const data = item && typeof item.data === 'function' ? item.data() : (item ? item.data : null);
    const value = data && data[key];
    const time = value && value.toMillis ? value.toMillis() : 0;
    if (!time) return;
    const id = formatter.format(new Date(time));
    if (values.has(id)) values.get(id).value += 1;
  });
  return days;
}

function wajdAdminStatsHtml() {
  const data = wajdAdminData;
  const stats = [
    ['المشاهدات',data.totalViews,'مشاهدة فريدة',''],
    ['الإعجابات',data.totalLikes,'إجمالي الإعجابات',''],
    ['التعليقات',data.comments.length,'وتشمل الردود','is-accent'],
    ['مرات الحفظ',data.saves.size,'للقراءة لاحقًا',''],
    ['إجمالي الجمهور',data.audience.length,wajdSavedArabicNumber.format(data.activeReaders + data.activeAnonymousVisitors) + ' نشط خلال ٣٠ يومًا',''],
    ['حسابات Google',data.registeredAudience,wajdSavedArabicNumber.format(data.activeReaders) + ' نشط خلال ٣٠ يومًا',''],
    ['الزوار المجهولون',data.anonymousVisitors,wajdSavedArabicNumber.format(data.activeAnonymousVisitors) + ' نشط خلال ٣٠ يومًا','is-accent'],
    ['الوقت النشط',wajdAdminDuration(data.totalAudienceActiveSeconds),'منذ تفعيل قياس الجلسات',''],
    ['الجلسات',data.audienceSessionCount,'جلسة مسجلة منذ v97',''],
    ['متوسط الجلسة',wajdAdminDuration(data.averageAudienceSessionSeconds),'وقت نشط لا وقت فتح التبويب',''],
    ['المتواجدون الآن',data.onlineAudience,'نشاط خلال آخر دقيقتين','is-accent'],
    ['المحظورون الآن',data.activeBlocks,'من التعليق','is-danger']
  ];
  return '<div class="wajd-admin-summary">' + stats.map(stat => '<div class="wajd-admin-stat ' + stat[3] + '"><span>' + stat[0] + '</span><strong>' + (typeof stat[1] === 'number' ? wajdSavedArabicNumber.format(stat[1]) : wajdAdminEscape(stat[1])) + '</strong><small>' + wajdAdminEscape(stat[2]) + '</small></div>').join('') + '</div>';
}

function wajdAdminRankingV47(title, map, note) {
  const rows = Array.from(map.entries()).sort((a,b) => b[1] - a[1]).slice(0, 8);
  let html = '<section class="wajd-admin-panel"><div class="wajd-admin-panel-head"><h3>' + title + '</h3><span class="wajd-admin-note">' + note + '</span></div><div class="wajd-admin-ranking">';
  if (!rows.length || rows[0][1] <= 0) return html + '<div class="wajd-admin-empty">لا توجد بيانات كافية بعد</div></div></section>';
  rows.forEach((row,index) => {
    const post = wajdAdminData.postsById.get(row[0]);
    const titleText = post && post.title ? post.title.$t : (wajdAdminData.articleMeta.get(row[0]) || 'مقال رقم ' + row[0]);
    const url = post ? wajdSavedPostUrl(post) : '#';
    html += '<div class="wajd-admin-rank"><span class="wajd-admin-rank-index">' + wajdSavedArabicNumber.format(index + 1) + '</span><a href="' + wajdAdminEscape(url) + '">' + wajdAdminEscape(titleText) + '</a><strong>' + wajdSavedArabicNumber.format(row[1]) + '</strong></div>';
  });
  return html + '</div></section>';
}

function wajdAdminChartHtml() {
  const labels = { views:'المشاهدات', likes:'الإعجابات', saves:'الحفظ', comments:'التعليقات' };
  const series = {
    views:wajdAdminSeries(Array.from(wajdAdminData.views.docs), 'createdAt', wajdAdminRange),
    likes:wajdAdminSeries(Array.from(wajdAdminData.likes.docs), 'createdAt', wajdAdminRange),
    saves:wajdAdminSeries(Array.from(wajdAdminData.saves.docs), 'createdAt', wajdAdminRange),
    comments:wajdAdminSeries(wajdAdminData.comments, 'createdAt', wajdAdminRange)
  }[wajdAdminMetric];
  const maximum = Math.max(1, ...series.map(day => day.value));
  const bars = series.map(day => '<span class="wajd-admin-bar" style="height:' + Math.max(2, Math.round(day.value / maximum * 100)) + '%" data-tip="' + wajdAdminEscape(day.label + ': ' + wajdSavedArabicNumber.format(day.value) + ' ' + labels[wajdAdminMetric]) + '"></span>').join('');
  const metrics = Object.entries(labels).map(item => '<button class="wajd-admin-tab' + (wajdAdminMetric === item[0] ? ' is-active' : '') + '" data-admin-metric="' + item[0] + '" type="button">' + item[1] + '</button>').join('');
  const ranges = [[7,'أسبوع'],[30,'شهر'],[90,'٣ أشهر']].map(item => '<button class="wajd-admin-tab' + (wajdAdminRange === item[0] ? ' is-active' : '') + '" data-admin-range="' + item[0] + '" type="button">' + item[1] + '</button>').join('');
  return '<section class="wajd-admin-panel wajd-admin-panel-wide"><div class="wajd-admin-panel-head"><h3>حركة التفاعل</h3><div class="wajd-admin-chart-controls"><div class="wajd-admin-tabs">' + metrics + '</div><div class="wajd-admin-range">' + ranges + '</div></div></div><div class="wajd-admin-chart" style="grid-template-columns:repeat(' + wajdAdminRange + ',minmax(3px,1fr))">' + bars + '</div><div class="wajd-admin-chart-legend"><span>منذ ' + wajdSavedArabicNumber.format(wajdAdminRange) + ' يومًا</span><span>اليوم</span></div></section>';
}

function wajdAdminCommentTitle(item) {
  const meta = wajdAdminData.commentMeta.get(item.id);
  if (meta && meta.articleTitle) return meta.articleTitle;
  return wajdAdminData.articleMeta.get(item.scopeId) || 'مقال من وَجْد';
}

function wajdAdminCommentUrl(item) {
  const meta = wajdAdminData.commentMeta.get(item.id);
  return meta && meta.articleUrl ? wajdAdminSafeUrl(meta.articleUrl) + '#wajd-comment-' + encodeURIComponent(item.id) : '#';
}

function wajdAdminCommentRow(item, compact) {
  const data = item.data;
  const ownerId = wajdAdminData.owners.get(item.id) || '';
  const profile = ownerId ? wajdAdminData.profilesById.get(ownerId) : null;
  const hidden = data.moderationStatus === 'hidden';
  const publicName = data.isAnonymous ? 'قارئ مجهول' : (data.displayName || 'قارئ وَجْد');
  const ownerHint = data.isAnonymous && profile ? 'الحساب المرتبط: ' + (profile.displayName || profile.email || 'قارئ') : '';
  let actions = '<a class="wajd-admin-action" href="' + wajdAdminEscape(wajdAdminCommentUrl(item)) + '" target="_blank">فتح</a>';
  if (!compact) {
    actions += '<button class="wajd-admin-action" data-admin-action="' + (hidden ? 'show-comment' : 'hide-comment') + '" data-comment-id="' + item.id + '" data-comment-scope="' + item.scopeId + '" type="button">' + (hidden ? 'إظهار' : 'إخفاء') + '</button>';
    if (ownerId && !(profile && profile.email === WAJD_ADMIN_EMAIL)) {
      const blocked = wajdAdminData.blocks.has(ownerId) && wajdAdminData.blocks.get(ownerId).untilMs > Date.now();
      actions += '<button class="wajd-admin-action" data-admin-action="' + (blocked ? 'unblock-reader' : 'block-reader') + '" data-reader-id="' + ownerId + '" data-block-days="7" type="button">' + (blocked ? 'رفع الحظر' : 'حظر ٧ أيام') + '</button>';
    }
    actions += '<button class="wajd-admin-action is-danger" data-admin-action="delete-comment" data-comment-id="' + item.id + '" data-comment-scope="' + item.scopeId + '" type="button">حذف نهائي</button>';
  }
  return '<article class="wajd-admin-row' + (hidden ? ' is-hidden' : '') + '"><div class="wajd-admin-row-main"><h4 class="wajd-admin-row-title">' + wajdAdminEscape(publicName) + (hidden ? '<span class="wajd-admin-pill is-danger">مخفي</span>' : '') + (data.parentId ? '<span class="wajd-admin-pill is-muted">رد</span>' : '') + '</h4><div class="wajd-admin-row-meta"><span>' + wajdAdminEscape(wajdAdminCommentTitle(item)) + '</span><span>•</span><span>' + wajdAdminEscape(wajdAdminDate(data.createdAt, true)) + '</span>' + (ownerHint ? '<span>•</span><span>' + wajdAdminEscape(ownerHint) + '</span>' : '') + '</div><p class="wajd-admin-row-copy">' + wajdAdminEscape(data.body || '') + '</p></div><div class="wajd-admin-row-actions">' + actions + '</div></article>';
}

function wajdAdminOverviewHtml() {
  const recent = wajdAdminData.comments.slice(0,5);
  return wajdAdminStatsHtml() + '<div class="wajd-admin-grid">' + wajdAdminChartHtml() + '<section class="wajd-admin-panel wajd-admin-panel-wide"><div class="wajd-admin-panel-head"><h3>أحدث التعليقات</h3><button class="wajd-admin-action" data-admin-view="comments" type="button">إدارة الكل</button></div><div class="wajd-admin-table">' + (recent.length ? recent.map(item => wajdAdminCommentRow(item,true)).join('') : '<div class="wajd-admin-empty">لا توجد تعليقات بعد</div>') + '</div></section></div>';
}

function wajdAdminContentHtml() {
  return '<h3 class="wajd-admin-section-title">أداء المحتوى</h3><div class="wajd-admin-grid">' +
    wajdAdminRankingV47('الأكثر قراءة', wajdAdminData.viewMap, 'مشاهدة فريدة') +
    wajdAdminRankingV47('الأكثر إعجابًا', wajdAdminData.likeMap, 'إعجاب') +
    wajdAdminRankingV47('الأكثر تعليقًا', wajdAdminData.commentMap, 'تعليق ورد') +
    wajdAdminRankingV47('الأكثر حفظًا', wajdAdminData.saveMap, 'حفظ') +
    wajdAdminRankingV47('الأكثر عودةً للقراءة', wajdAdminData.returnMap, 'زيارة إضافية') +
    '</div>';
}

function wajdAdminCommentsHtml() {
  const needle = wajdAdminCommentSearch.trim().toLowerCase();
  const filtered = wajdAdminData.comments.filter(item => {
    const hidden = item.data.moderationStatus === 'hidden';
    if (wajdAdminCommentFilter === 'visible' && hidden) return false;
    if (wajdAdminCommentFilter === 'hidden' && !hidden) return false;
    if (!needle) return true;
    const ownerId = wajdAdminData.owners.get(item.id) || '';
    const profile = ownerId ? wajdAdminData.profilesById.get(ownerId) : null;
    return [item.data.body,item.data.displayName,profile && profile.displayName,profile && profile.email,wajdAdminCommentTitle(item)].some(value => String(value || '').toLowerCase().includes(needle));
  });
  return '<div class="wajd-admin-toolbar"><div class="wajd-admin-toolbar-group"><input aria-label="البحث في التعليقات" class="wajd-admin-search" data-admin-input="comment-search" placeholder="ابحث في النص أو الاسم أو المقال…" type="search" value="' + wajdAdminEscape(wajdAdminCommentSearch) + '"/><select aria-label="تصفية التعليقات" class="wajd-admin-select" data-admin-input="comment-filter"><option value="all"' + (wajdAdminCommentFilter === 'all' ? ' selected="selected"' : '') + '>كل التعليقات</option><option value="visible"' + (wajdAdminCommentFilter === 'visible' ? ' selected="selected"' : '') + '>الظاهرة فقط</option><option value="hidden"' + (wajdAdminCommentFilter === 'hidden' ? ' selected="selected"' : '') + '>المخفية فقط</option></select></div><span class="wajd-admin-result-count">' + wajdSavedArabicNumber.format(filtered.length) + ' نتيجة</span></div><div class="wajd-admin-table">' + (filtered.length ? filtered.slice(0,120).map(item => wajdAdminCommentRow(item,false)).join('') : '<div class="wajd-admin-empty">لا توجد تعليقات مطابقة</div>') + '</div>';
}

function wajdAdminAudienceIsRegistered(row) {
  return Boolean(row && row.id && wajdAdminIsRegisteredUserId(row.id));
}

function wajdAdminAudienceLabel(row) {
  const registered = wajdAdminAudienceIsRegistered(row);
  const profile = registered && wajdAdminData && wajdAdminData.profilesById ? (wajdAdminData.profilesById.get(row.id) || {}) : {};
  return registered ? (profile.displayName || 'قارئ Google') : 'زائر مجهول ' + wajdAdminAudienceCode(row && row.id);
}

function wajdAdminAudienceRow(row) {
  const id = row.id, analytics = row.analytics || {}, registered = wajdAdminAudienceIsRegistered(row), profile = registered ? (wajdAdminData.profilesById.get(id) || {}) : {};
  const online = wajdAdminAudienceOnline(row), sessions = Math.max(0, Number(analytics.sessionCount) || 0);
  const completed = Math.max(wajdAdminData.readerCompleted.get(id) || 0, Number(analytics.completedArticles) || 0);
  const counts = [
    [wajdAdminDuration(analytics.totalActiveSeconds),'وقت نشط',true],
    [sessions,'جلسة',false],
    [Math.max(0,Number(analytics.pageViewCount)||0),'صفحة',false],
    [completed,'مكتملة',false]
  ];
  const avatar = registered ? '<img alt="" class="wajd-admin-avatar" loading="lazy" src="' + wajdAdminEscape(profile.photoURL || wajdAccountFallbackAvatar(profile.displayName || 'قارئ')) + '"/>' : '<span class="wajd-audience-code-avatar">' + wajdAdminAudienceCode(id) + '</span>';
  const lastValue = analytics.lastActiveAt || analytics.lastSeenAt || row.lastSeenAt;
  const firstValue = analytics.firstSeenAt || row.firstSeenAt;
  const label = wajdAdminAudienceLabel(row);
  const lastUrl = wajdAdminSafeUrl(analytics.lastPageUrl || '');
  const lastPage = analytics.lastPageTitle ? '<div class="wajd-audience-last-page"><span>آخر صفحة:</span><a href="' + wajdAdminEscape(lastUrl) + '" target="_blank">' + wajdAdminEscape(analytics.lastPageTitle) + '</a><span>· ' + wajdAdminEscape(wajdAdminAudienceSource(analytics.lastReferrer)) + '</span><span>· ' + wajdAdminEscape(wajdAdminAudienceDevice(analytics.deviceClass)) + '</span></div>' : '';
  const actions = '<button class="wajd-admin-action is-solid" data-admin-action="audience-detail" data-reader-id="' + wajdAdminEscape(id) + '" type="button">التفاصيل</button>';
  const telemetryBadge = row.telemetryMissing ? '<span class="wajd-admin-pill is-danger">تفاعل بلا جلسة</span>' : '';
  return '<article class="wajd-admin-row wajd-admin-reader wajd-audience-row">' + avatar + '<div class="wajd-admin-row-main"><h4 class="wajd-admin-row-title">' + wajdAdminEscape(label) + '<span class="wajd-admin-pill' + (registered ? '' : ' is-muted') + '">' + (registered ? 'Google' : 'مجهول') + '</span>' + telemetryBadge + (online ? '<span class="wajd-admin-pill is-success">نشط الآن</span>' : '') + (sessions > 1 ? '<span class="wajd-admin-pill">زائر عائد</span>' : '') + '</h4><div class="wajd-admin-row-meta">' + (profile.email ? '<span>' + wajdAdminEscape(profile.email) + '</span><span>•</span>' : '') + '<span>أول ظهور: ' + wajdAdminEscape(wajdAdminDate(firstValue,false)) + '</span><span>•</span><span>آخر نشاط: ' + wajdAdminEscape(wajdAdminDate(lastValue,true)) + '</span></div><div class="wajd-admin-kpis">' + counts.map(item => '<div class="wajd-admin-kpi"><strong>' + (item[2] ? wajdAdminEscape(item[0]) : wajdSavedArabicNumber.format(item[0])) + '</strong><span>' + item[1] + '</span></div>').join('') + '</div>' + lastPage + '</div><div class="wajd-admin-row-actions">' + actions + '</div></article>';
}

function wajdAdminAudienceDetailHtml(row) {
  if (!row) { wajdAdminAudienceSelected = ''; return '<div class="wajd-admin-empty">تعذّر العثور على هذا الزائر.</div>'; }
  const id = row.id, analytics = row.analytics || {}, registered = wajdAdminAudienceIsRegistered(row), profile = registered ? (wajdAdminData.profilesById.get(id) || {}) : {};
  const sessions = (wajdAdminData.audienceSessionsByUser.get(id) || []).slice(0, 12);
  const history = wajdAdminData.readerHistoryItems.get(id) || [];
  const completed = Math.max(history.filter(item => item.data && item.data.completed === true).length, Number(analytics.completedArticles) || 0);
  const activeSeconds = Math.max(0, Number(analytics.totalActiveSeconds) || 0);
  const sessionCount = Math.max(0, Number(analytics.sessionCount) || 0);
  const stats = [
    ['الوقت النشط',wajdAdminDuration(activeSeconds),true],
    ['عدد الجلسات',sessionCount,false],
    ['الصفحات المفتوحة',Math.max(0,Number(analytics.pageViewCount)||0),false],
    ['كتابات مكتملة',completed,false],
    ['مشاهدات فريدة',wajdAdminData.readerViews.get(id)||0,false],
    ['محفوظات',wajdAdminData.readerSaves.get(id)||0,false],
    ['تعليقات',wajdAdminData.readerComments.get(id)||0,false],
    ['متوسط الجلسة',wajdAdminDuration(sessionCount ? activeSeconds / sessionCount : 0),true]
  ];
  const progress = analytics.lastCompleted ? 'اكتملت القراءة' : wajdSavedArabicNumber.format(Math.round((Number(analytics.lastProgress)||0)*100)) + '٪ من الصفحة';
  const lastUrl = wajdAdminSafeUrl(analytics.lastPageUrl || '');
  const context = '<div class="wajd-audience-context"><div><small>آخر صفحة · ' + wajdAdminEscape(wajdAdminAudienceType(analytics.lastPageType)) + '</small>' + (analytics.lastPageTitle ? '<a href="' + wajdAdminEscape(lastUrl) + '" target="_blank">' + wajdAdminEscape(analytics.lastPageTitle) + '</a>' : '<strong>لا توجد صفحة مسجلة بعد</strong>') + '<small>' + wajdAdminEscape(progress) + '</small></div><div><small>سياق آخر زيارة</small><strong>' + wajdAdminEscape(wajdAdminAudienceSource(analytics.lastReferrer)) + ' · ' + wajdAdminEscape(wajdAdminAudienceDevice(analytics.deviceClass)) + '</strong><small>أول ظهور: ' + wajdAdminEscape(wajdAdminDate(analytics.firstSeenAt || row.firstSeenAt,true)) + ' · آخر نشاط: ' + wajdAdminEscape(wajdAdminDate(analytics.lastActiveAt || analytics.lastSeenAt || row.lastSeenAt,true)) + '</small></div></div>';
  const telemetryWarning = row.telemetryMissing ? '<div class="wajd-admin-anonymous-note">يوجد لهذا القارئ تفاعل مؤكد في Firestore (مثل مشاهدة أو إعجاب أو حفظ)، لكن لم تُحفظ جلسة Analytics المقابلة. لذلك لا تعرض اللوحة مدة قراءة مختلقة، وتُظهر هذا السجل للتشخيص بدل إخفائه.</div>' : '';
  const sessionsHtml = sessions.length ? sessions.map(item => {
    const data = item.data || {}, route = data.entryPageTitle && data.lastPageTitle && data.entryPageTitle !== data.lastPageTitle ? data.entryPageTitle + ' ← ' + data.lastPageTitle : (data.lastPageTitle || data.entryPageTitle || 'صفحة من وَجْد');
    return '<div class="wajd-audience-session"><span>' + wajdAdminEscape(wajdAdminDate(data.startedAt,true)) + '</span><strong>' + wajdAdminEscape(wajdAdminDuration(data.activeSeconds)) + ' نشط</strong><span>' + wajdSavedArabicNumber.format(Math.max(1,Number(data.pageViews)||1)) + ' صفحة</span><div class="wajd-audience-session-route"><small>' + wajdAdminEscape(wajdAdminAudienceSource(data.entryReferrer)) + ' · ' + wajdAdminEscape(wajdAdminAudienceDevice(data.deviceClass)) + '</small><a href="' + wajdAdminEscape(wajdAdminSafeUrl(data.lastPageUrl || data.entryPageUrl || '')) + '" target="_blank">' + wajdAdminEscape(route) + '</a></div></div>';
  }).join('') : '<div class="wajd-admin-empty">لم تُسجّل جلسات لهذه الهوية بعد؛ قد تكون من الزوار السابقين لنشر v97.</div>';
  return '<section><div class="wajd-audience-detail-head"><div><h3>' + wajdAdminEscape(wajdAdminAudienceLabel(row)) + '</h3><p>' + (registered ? wajdAdminEscape(profile.email || 'حساب Google') : 'هوية متصفح مجهولة، بلا اسم أو بريد أو عنوان IP') + (wajdAdminAudienceOnline(row) ? ' · نشط الآن' : '') + '</p></div><button class="wajd-admin-action" data-admin-action="audience-back" type="button">العودة إلى الجمهور</button></div>' + telemetryWarning + '<div class="wajd-audience-detail-grid">' + stats.map(item => '<div class="wajd-audience-detail-stat"><span>' + item[0] + '</span><strong>' + (item[2] ? wajdAdminEscape(item[1]) : wajdSavedArabicNumber.format(item[1])) + '</strong></div>').join('') + '</div>' + context + '<section class="wajd-admin-panel"><div class="wajd-admin-panel-head"><h3>أحدث الجلسات</h3><span class="wajd-admin-note">الوقت النشط فقط، وحتى ١٢ جلسة من البيانات المحمّلة</span></div><div class="wajd-audience-sessions">' + sessionsHtml + '</div></section></section>';
}

function wajdAdminIsGoogleProfile(profile) {
  if (!profile || typeof profile !== 'object') return false;
  const email = String(profile.email || '').trim().toLowerCase();
  const provider = String(profile.provider || '').trim().toLowerCase();
  // Current profiles explicitly store provider=google. The empty-provider branch
  // preserves older legitimate Google profiles that predate that field, but an
  // email is always required. Anonymous identities never become registered here.
  return Boolean(email && email.includes('@') && (!provider || provider === 'google' || provider === 'google.com'));
}

function wajdAdminIsRegisteredUserId(userId) {
  const id = String(userId || '');
  if (!id || !wajdAdminData || !wajdAdminData.profilesById) return false;
  const profile = wajdAdminData.profilesById.get(id);
  return wajdAdminIsGoogleProfile(profile) && String(profile.email || '').trim().toLowerCase() !== WAJD_ADMIN_EMAIL.toLowerCase();
}

function wajdAdminBehaviorValueMillis(value) {
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (value && Number.isFinite(Number(value.seconds))) return Number(value.seconds) * 1000 + Math.floor((Number(value.nanoseconds) || 0) / 1000000);
  return Number(value) || 0;
}

function wajdAdminBehaviorSessionMillis(item) {
  const data = item && item.data || {};
  return wajdAdminBehaviorValueMillis(data.startedAt) || wajdAdminBehaviorValueMillis(data.lastSeenAt) || wajdAdminBehaviorValueMillis(data.lastActiveAt);
}

function wajdAdminBehaviorIncrement(map, key) {
  const safeKey = String(key || 'unknown');
  map.set(safeKey, (map.get(safeKey) || 0) + 1);
}

function wajdAdminBehaviorData() {
  const now = Date.now(), rangeDays = [7,30,90].includes(wajdAdminAudienceRange) ? wajdAdminAudienceRange : 30;
  const firstDay = new Date(now); firstDay.setHours(0,0,0,0); firstDay.setDate(firstDay.getDate() - rangeDays + 1);
  const cutoff = firstDay.getTime();
  const sessions = (wajdAdminData.audienceSessions || []).filter(item => {
    if (!item || !item.userId || !item.data) return false;
    const profile = wajdAdminData.profilesById && wajdAdminData.profilesById.get(item.userId);
    if (profile && profile.email === WAJD_ADMIN_EMAIL) return false;
    const time = wajdAdminBehaviorSessionMillis(item);
    return time >= cutoff && time <= now;
  });
  const visitors = new Map(), sources = new Map(), devices = new Map(), browsers = new Map(), systems = new Map(), campaigns = new Map(), entries = new Map();
  const engagement = { quick:0, steady:0, deep:0 };
  const cohorts = { anonymous:{sessions:0,activeSeconds:0,pageViews:0}, registered:{sessions:0,activeSeconds:0,pageViews:0} };
  let activeSeconds = 0, pageViews = 0;
  sessions.forEach(item => {
    const data = item.data || {}, userId = item.userId || item.id || 'unknown';
    // v118: session metadata is historical telemetry, not proof of Google auth.
    // A reader is registered only while a confirmed Google profile exists.
    const readerType = wajdAdminIsRegisteredUserId(userId) ? 'registered' : 'anonymous';
    const visitor = visitors.get(userId) || { count:0, readerType };
    visitor.count += 1; if (readerType === 'registered') visitor.readerType = 'registered'; visitors.set(userId, visitor);
    const rawSeconds = Number(data.activeSeconds), rawPages = Number(data.pageViews);
    const seconds = Number.isFinite(rawSeconds) ? Math.max(0,rawSeconds) : 0, pages = Number.isFinite(rawPages) ? Math.max(1,Math.floor(rawPages)) : 1;
    activeSeconds += seconds; pageViews += pages;
    cohorts[readerType].sessions += 1; cohorts[readerType].activeSeconds += seconds; cohorts[readerType].pageViews += pages;
    wajdAdminBehaviorIncrement(sources, data.entryReferrer || 'unknown');
    wajdAdminBehaviorIncrement(devices, data.deviceClass || 'unknown');
    wajdAdminBehaviorIncrement(browsers, data.browserFamily || 'unknown');
    wajdAdminBehaviorIncrement(systems, data.osFamily || 'unknown');
    const campaign = [data.campaignSource,data.campaignMedium,data.campaignName].filter(Boolean).join(' / ');
    if (campaign) wajdAdminBehaviorIncrement(campaigns,campaign);
    if (seconds >= 120 || pages >= 3) engagement.deep += 1;
    else if (seconds < 30 && pages <= 1) engagement.quick += 1;
    else engagement.steady += 1;
    const entryTitle = String(data.entryPageTitle || 'صفحة غير معروفة'), entryUrl = String(data.entryPageUrl || '');
    const entryKey = entryUrl || entryTitle;
    const entry = entries.get(entryKey) || { title:entryTitle, url:entryUrl, count:0 };
    entry.count += 1; entries.set(entryKey, entry);
  });
  const visitorRows = Array.from(visitors.values()), returners = visitorRows.filter(item => item.count > 1).length;
  const daily = [], dailyByKey = new Map();
  const keyFormatter = new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit' });
  for (let offset = rangeDays - 1; offset >= 0; offset--) {
    const date = new Date(now); date.setHours(12,0,0,0); date.setDate(date.getDate() - offset);
    const point = { key:keyFormatter.format(date), label:new Intl.DateTimeFormat('ar-EG',{day:'numeric',month:'short'}).format(date), count:0 };
    daily.push(point); dailyByKey.set(point.key, point);
  }
  sessions.forEach(item => {
    const point = dailyByKey.get(keyFormatter.format(new Date(wajdAdminBehaviorSessionMillis(item))));
    if (point) point.count += 1;
  });
  const sortCounts = map => Array.from(map.entries()).map(item => ({ key:item[0], count:item[1] })).sort((a,b) => b.count - a.count || a.key.localeCompare(b.key));
  return {
    sessions, visitors:visitors.size, activeSeconds, pageViews, returners, daily, engagement, cohorts, rangeDays, cutoff,
    anonymousVisitors:visitorRows.filter(item => item.readerType !== 'registered').length,
    registeredVisitors:visitorRows.filter(item => item.readerType === 'registered').length,
    sources:sortCounts(sources), devices:sortCounts(devices), browsers:sortCounts(browsers), systems:sortCounts(systems), campaigns:sortCounts(campaigns),
    entries:Array.from(entries.values()).sort((a,b) => b.count - a.count || a.title.localeCompare(b.title)).slice(0,8)
  };
}

function wajdAdminBehaviorBarsHtml(rows, total, labeler) {
  if (!rows.length) return '<div class="wajd-behavior-empty">لا توجد بيانات كافية في هذه الفترة</div>';
  return '<div class="wajd-behavior-bars">' + rows.slice(0,8).map(item => {
    const percent = total ? Math.round(item.count / total * 100) : 0;
    return '<div><div class="wajd-behavior-bar-head"><b>' + wajdAdminEscape(labeler(item.key)) + '</b><span>' + wajdSavedArabicNumber.format(item.count) + ' · ' + wajdSavedArabicNumber.format(percent) + '٪</span></div><span class="wajd-behavior-track"><i style="width:' + Math.max(item.count ? 2 : 0,percent) + '%"></i></span></div>';
  }).join('') + '</div>';
}

function wajdAdminAudienceBehaviorHtml() {
  const data = wajdAdminBehaviorData(), sessionCount = data.sessions.length;
  const decimal = new Intl.NumberFormat('ar-EG',{maximumFractionDigits:1});
  const ranges = [[7,'٧ أيام'],[30,'٣٠ يومًا'],[90,'٩٠ يومًا']].map(item => '<button aria-pressed="' + (data.rangeDays === item[0]) + '" class="' + (data.rangeDays === item[0] ? 'is-active' : '') + '" data-admin-audience-range="' + item[0] + '" type="button">' + item[1] + '</button>').join('');
  const head = '<div class="wajd-behavior-head"><div><span>تحليلات الجلسات</span><h3>كيف يتحرك الجمهور داخل وَجْد؟</h3><p>صورة مجمّعة للمجهولين والمسجلين: من أين يأتون، وكم يبقون، وما الصفحات التي يبدأون منها.</p></div><div class="wajd-behavior-ranges">' + ranges + '</div></div>';
  const note = '<div class="wajd-behavior-note">الوقت النشط تقديري؛ يتوقف مع الخمول أو إخفاء التبويب، ولا يثبت قراءة النص فعلًا. تبدأ بيانات الجلسات منذ نشر v97، وتشمل المدة المختارة اليوم.' + (wajdAdminData.audienceSessionsIndexFallback ? ' استُخدمت قراءة توافقية كاملة لعدم توفر فهرس startedAt؛ الأرقام كاملة لكن التحميل قد يكون أبطأ.' : '') + '</div>';
  if (!sessionCount) return head + note + '<section class="wajd-admin-panel"><div class="wajd-behavior-empty">لا توجد جلسات مسجلة خلال المدة المختارة بعد.</div></section>';
  const summary = [
    ['الجلسات',wajdSavedArabicNumber.format(sessionCount),'زيارة خلال الفترة'],
    ['الزوار',wajdSavedArabicNumber.format(data.visitors),'هوية زائر فريدة'],
    ['الوقت النشط',wajdAdminDuration(data.activeSeconds),'إجمالي النشاط'],
    ['متوسط الجلسة',wajdAdminDuration(data.activeSeconds / sessionCount),'وقت نشط'],
    ['صفحات لكل جلسة',decimal.format(data.pageViews / sessionCount),'متوسط التصفح'],
    ['الزوار العائدون',wajdSavedArabicNumber.format(Math.round(data.returners / data.visitors * 100)) + '٪','جلستان فأكثر خلال الفترة']
  ];
  const summaryHtml = '<div class="wajd-behavior-summary">' + summary.map(item => '<div class="wajd-behavior-stat"><span>' + item[0] + '</span><strong>' + wajdAdminEscape(item[1]) + '</strong><small>' + item[2] + '</small></div>').join('') + '</div>';
  const maximum = Math.max(1,...data.daily.map(item => item.count));
  const chart = data.daily.map(item => '<span class="wajd-admin-bar" title="' + wajdAdminEscape(item.label + ': ' + wajdSavedArabicNumber.format(item.count) + ' جلسة') + '" data-tip="' + wajdAdminEscape(item.label + ': ' + wajdSavedArabicNumber.format(item.count) + ' جلسة') + '" style="height:' + Math.max(2,Math.round(item.count / maximum * 100)) + '%"></span>').join('');
  const dailyPanel = '<section class="wajd-admin-panel wajd-behavior-wide"><div class="wajd-admin-panel-head"><h3>حركة الجلسات</h3><span class="wajd-admin-note">عدد الجلسات الجديدة يوميًا</span></div><div class="wajd-admin-chart wajd-behavior-chart" style="grid-template-columns:repeat(' + data.rangeDays + ',minmax(1px,1fr))">' + chart + '</div><div class="wajd-admin-chart-legend"><span>' + wajdAdminEscape(data.daily[0].label) + '</span><span>اليوم</span></div></section>';
  const sourcesPanel = '<section class="wajd-admin-panel"><div class="wajd-admin-panel-head"><h3>من أين يصل الزوار؟</h3><span class="wajd-admin-note">مصدر بداية الجلسة</span></div>' + wajdAdminBehaviorBarsHtml(data.sources,sessionCount,value => value === 'direct' ? 'مباشر أو دون إحالة' : wajdAdminAudienceSource(value)) + '</section>';
  const audiencePanel = '<section class="wajd-admin-panel"><div class="wajd-admin-panel-head"><h3>تركيبة الجمهور والأجهزة</h3><span class="wajd-admin-note">زوار فريدون ثم جلسات</span></div><div class="wajd-behavior-pairs"><div class="wajd-behavior-pair"><strong>' + wajdSavedArabicNumber.format(data.anonymousVisitors) + '</strong><span>زائر مجهول · ' + wajdSavedArabicNumber.format(Math.round(data.anonymousVisitors / data.visitors * 100)) + '٪</span></div><div class="wajd-behavior-pair"><strong>' + wajdSavedArabicNumber.format(data.registeredVisitors) + '</strong><span>حساب Google · ' + wajdSavedArabicNumber.format(Math.round(data.registeredVisitors / data.visitors * 100)) + '٪</span></div></div>' + wajdAdminBehaviorBarsHtml(data.devices,sessionCount,wajdAdminAudienceDevice) + '</section>';
  const browsersPanel = '<section class="wajd-admin-panel"><div class="wajd-admin-panel-head"><h3>المتصفحات والأنظمة</h3><span class="wajd-admin-note">أبعاد تقنية غير شخصية</span></div>' + wajdAdminBehaviorBarsHtml(data.browsers,sessionCount,wajdAdminAudienceBrowser) + wajdAdminBehaviorBarsHtml(data.systems,sessionCount,wajdAdminAudienceOs) + '</section>';
  const campaignsPanel = '<section class="wajd-admin-panel wajd-behavior-wide"><div class="wajd-admin-panel-head"><h3>الحملات</h3><span class="wajd-admin-note">UTM source / medium / campaign</span></div>' + (data.campaigns.length?wajdAdminBehaviorBarsHtml(data.campaigns,sessionCount,value=>value):'<div class="wajd-behavior-empty">لا توجد زيارات معلّمة بحملة في هذه الفترة</div>') + '</section>';
  const engagementRows = [{key:'قصيرة · أقل من ٣٠ ثانية وصفحة واحدة',count:data.engagement.quick},{key:'متوسطة · ما بين القصيرة والممتدة',count:data.engagement.steady},{key:'ممتدة · دقيقتان أو ٣ صفحات فأكثر',count:data.engagement.deep}];
  const engagementPanel = '<section class="wajd-admin-panel"><div class="wajd-admin-panel-head"><h3>نمط الجلسات</h3><span class="wajd-admin-note">تصنيف وصفي للمدة والتصفح</span></div>' + wajdAdminBehaviorBarsHtml(engagementRows,sessionCount,value => value) + '</section>';
  const comparisonRows = [['anonymous','المجهولون'],['registered','حسابات Google']].map(item => {
    const group = data.cohorts[item[0]];
    return '<tr><th scope="row">' + item[1] + '</th><td>' + wajdSavedArabicNumber.format(group.sessions) + '</td><td>' + (group.sessions ? wajdAdminEscape(wajdAdminDuration(group.activeSeconds / group.sessions)) : '—') + '</td><td>' + (group.sessions ? decimal.format(group.pageViews / group.sessions) : '—') + '</td></tr>';
  }).join('');
  const comparisonPanel = '<section class="wajd-admin-panel"><div class="wajd-admin-panel-head"><h3>المجهولون والمسجلون</h3><span class="wajd-admin-note">المسجل = حساب Google مؤكد فقط</span></div><table class="wajd-behavior-compare"><thead><tr><th scope="col">الجمهور</th><th scope="col">الجلسات</th><th scope="col">متوسط الوقت</th><th scope="col">صفحات/جلسة</th></tr></thead><tbody>' + comparisonRows + '</tbody></table><p class="wajd-behavior-help">كل UID يُحسب هوية مستقلة؛ لا تُدمج الزيارات المجهولة مع حساب Google الذي قد يُسجَّل لاحقًا. تغيير المتصفح أو تسجيل الخروج قد ينشئ هوية مجهولة أخرى.</p></section>';
  const entries = data.entries.length ? data.entries.map((item,index) => '<div class="wajd-behavior-entry"><span>' + wajdSavedArabicNumber.format(index + 1) + '</span><a href="' + wajdAdminEscape(wajdAdminSafeUrl(item.url)) + '" target="_blank" rel="noopener noreferrer">' + wajdAdminEscape(item.title) + '</a><strong>' + wajdSavedArabicNumber.format(item.count) + '</strong></div>').join('') : '<div class="wajd-behavior-empty">لا توجد صفحات دخول مسجلة</div>';
  const entriesPanel = '<section class="wajd-admin-panel wajd-behavior-wide"><div class="wajd-admin-panel-head"><h3>أكثر صفحات الدخول</h3><span class="wajd-admin-note">الصفحة التي بدأت منها الجلسة</span></div><div class="wajd-behavior-entries">' + entries + '</div></section>';
  return head + summaryHtml + note + '<div class="wajd-behavior-grid">' + dailyPanel + sourcesPanel + audiencePanel + browsersPanel + engagementPanel + comparisonPanel + campaignsPanel + entriesPanel + '</div>';
}

/* WAJD v100 JOURNEY ADMIN: lazy, dated and explicitly paginated; no writes. */
const wajdJourneyAdmin = {
  range:30, type:'all', frequency:'all', device:'all', source:'all', user:'', search:'',
  rows:[], cursor:null, hasMore:false, loaded:false, loading:false, error:'', cached:false,
  generation:0, now:0, cutoff:0, loadedAt:0, sessionLimit:12
};

function wajdAdminJourneyWindow(days, now) {
  const first = new Date(now); first.setHours(0,0,0,0); first.setDate(first.getDate() - days + 1);
  return first.getTime();
}

function wajdAdminJourneyRepaint() {
  if (wajdAdminView !== 'audience-journey') return;
  const root = document.getElementById('wajd-journey-root');
  if (root) root.innerHTML = wajdAdminJourneyHtml();
}

async function wajdAdminJourneyLoad(reset) {
  if (!wajdIsAdmin(wajdAdminCurrentUser())) return;
  const state = wajdJourneyAdmin;
  if (state.loading && !reset) return;
  if (reset || !state.now) {
    state.generation++; state.rows = []; state.cursor = null; state.hasMore = false;
    state.now = Date.now(); state.cutoff = wajdAdminJourneyWindow(state.range, state.now);
    state.loaded = false; state.cached = false; state.sessionLimit = 12;
  }
  const generation = state.generation;
  state.loading = true; state.error = ''; wajdAdminJourneyRepaint();
  try {
    const constraints = [where('startedAt','>=',new Date(state.cutoff)),where('startedAt','<=',new Date(state.now)),orderBy('startedAt','desc')];
    if (state.cursor) constraints.push(startAfter(state.cursor));
    constraints.push(limit(501));
    const snapshot = await getDocs(query(collection(wajdSavedDb,WAJD_JOURNEY_COLLECTION),...constraints));
    if (generation !== state.generation || !wajdIsAdmin(wajdAdminCurrentUser())) return;
    const docs = snapshot.docs.slice(0,500), seen = new Set(state.rows.map(row => row.id));
    docs.forEach(item => {
      const original = item.data();
      if (![100,106].includes(original.schemaVersion) || typeof original.userId !== 'string' || seen.has(item.id)) return;
      const userId = original.userId;
      const data = original;
      const profile = wajdAdminData.profilesById.get(userId);
      if (profile && profile.email === WAJD_ADMIN_EMAIL) return;
      state.rows.push({id:item.id,data}); seen.add(item.id);
    });
    state.cursor = docs.length ? docs[docs.length-1] : state.cursor;
    state.hasMore = snapshot.size > 500;
    state.cached = state.cached || Boolean(snapshot.metadata && snapshot.metadata.fromCache);
    state.loaded = true; state.loadedAt = Date.now();
  } catch (error) {
    if (generation !== state.generation) return;
    const code = String(error && error.code || '');
    state.error = /permission-denied/.test(code) ? 'لم تُمنح صلاحية قراءة الرحلات. انشر قواعد v73 أولًا؛ الأقسام القديمة لا تعتمد على هذه البيانات.' : /failed-precondition/.test(code) ? 'تعذّر ترتيب بيانات الرحلات. تحقق من تفعيل الفهرس الافتراضي لحقل startedAt ثم حاول مجددًا.' : 'تعذّر تحميل رحلات الجمهور الآن. البيانات القديمة لم تتغير؛ أعد المحاولة عند استقرار الاتصال.';
  } finally {
    if (generation === state.generation) { state.loading = false; wajdAdminJourneyRepaint(); }
  }
}

function wajdAdminJourneyIsArticle(data) { return data.pageType === 'article' || data.pageType === 'answer'; }
function wajdAdminJourneyArticleKey(data) { return String(data.articleId || data.pageUrl || ''); }
function wajdAdminJourneyEngaged(data) { return wajdAdminJourneyIsArticle(data) && Number(data.readingSeconds) >= 30 && Number(data.maxProgress) >= .25; }
function wajdAdminJourneyNumber(value) { return wajdSavedArabicNumber.format(Number.isFinite(value) ? value : 0); }
function wajdAdminJourneyPercent(n, total) { return total ? wajdAdminJourneyNumber(Math.round(n / total * 100)) + '٪' : '—'; }
function wajdAdminJourneyDate(value) { return wajdAdminDate(new Date(wajdAdminBehaviorValueMillis(value)),true); }

function wajdAdminJourneyAnalyze(rows, filters, now, complete) {
  const sessionsMap = new Map(), visitsById = new Map();
  rows.forEach(row => {
    const d = row.data || {}, at = wajdAdminBehaviorValueMillis(d.startedAt);
    if (!d.userId || !d.sessionId || !at || at > now || at < (filters.cutoff || 0)) return;
    const key = d.userId + '::' + d.sessionId;
    if (!sessionsMap.has(key)) sessionsMap.set(key,{key,userId:d.userId,id:d.sessionId,rows:[]});
    sessionsMap.get(key).rows.push(row); visitsById.set(row.id,row);
  });
  const allSessions = Array.from(sessionsMap.values()).map(session => {
    session.rows.sort((a,b) => wajdAdminBehaviorValueMillis(a.data.startedAt) - wajdAdminBehaviorValueMillis(b.data.startedAt) || a.id.localeCompare(b.id));
    const first = session.rows[0].data, last = session.rows[session.rows.length-1].data;
    session.start = wajdAdminBehaviorValueMillis(first.startedAt);
    session.last = Math.max(...session.rows.map(row => wajdAdminBehaviorValueMillis(row.data.updatedAt) || wajdAdminBehaviorValueMillis(row.data.startedAt)));
    session.readerType = wajdAdminIsRegisteredUserId(session.userId) ? 'registered' : 'anonymous'; session.returning = Boolean(first.returning);
    session.source = first.source; session.device = first.deviceClass;
    // Keep this only as a diagnostic for old telemetry; it never changes the displayed identity.
    session.mixed = new Set(session.rows.map(row => row.data.readerType)).size > 1;
    session.articles = session.rows.filter(row => wajdAdminJourneyIsArticle(row.data));
    session.uniqueArticles = new Set(session.articles.map(row => wajdAdminJourneyArticleKey(row.data))).size;
    session.engaged = session.articles.some(row => wajdAdminJourneyEngaged(row.data));
    session.active = session.rows.reduce((sum,row) => sum + Math.max(0,Number(row.data.activeSeconds)||0),0);
    session.reading = session.articles.reduce((sum,row) => sum + Math.max(0,Number(row.data.readingSeconds)||0),0);
    session.ends = session.articles.filter(row => row.data.reachedEnd === true).length;
    session.lastPage = last;
    return session;
  }).sort((a,b) => b.start - a.start || a.key.localeCompare(b.key));
  const sessions = allSessions.filter(session => {
    if (filters.type !== 'all' && session.readerType !== filters.type) return false;
    if (filters.frequency !== 'all' && (session.returning ? 'returning' : 'new') !== filters.frequency) return false;
    if (filters.device !== 'all' && session.device !== filters.device) return false;
    if (filters.source !== 'all' && session.source !== filters.source) return false;
    return !filters.user || session.userId === filters.user;
  });
  const articleRows = sessions.flatMap(session => session.articles);
  const articleSessions = sessions.filter(session => session.articles.length);
  const active = sessions.reduce((sum,session) => sum+session.active,0);
  const reading = sessions.reduce((sum,session) => sum+session.reading,0);
  const summarize = group => ({sessions:group.length,readers:new Set(group.map(s=>s.userId)).size,
    engaged:group.filter(s=>s.engaged).length,second:group.filter(s=>s.uniqueArticles>=2).length,
    articleSessions:group.filter(s=>s.articles.length).length,articles:group.reduce((n,s)=>n+s.articles.length,0),
    ends:group.reduce((n,s)=>n+s.ends,0),active:group.reduce((n,s)=>n+s.active,0)});
  const sources = ['direct','internal','google','telegram','facebook','other'].map(source => ({source,...summarize(sessions.filter(s=>s.source===source))})).filter(s=>s.sessions).sort((a,b)=>b.sessions-a.sessions);
  const comparisons = [
    ['مجهولون',sessions.filter(s=>s.readerType==='anonymous')],['مسجلون',sessions.filter(s=>s.readerType==='registered')],
    ['زيارة أولى',sessions.filter(s=>!s.returning)],['زيارات عائدة',sessions.filter(s=>s.returning)]
  ].map(([label,group])=>({label,...summarize(group)}));
  // Anchor the cohort in the selected sessions, but count returns from ANY source/device.
  const anchors = new Map();
  sessions.forEach(s=>{if(!anchors.has(s.userId)||s.start<anchors.get(s.userId).start)anchors.set(s.userId,s);});
  const retention = [1,7,30].map(days=>{
    const windowMs = days * 86400000;
    const eligible = Array.from(anchors.values()).filter(s=>now-s.start>=windowMs);
    const returned = eligible.filter(anchor=>allSessions.some(s=>s.userId===anchor.userId&&s.id!==anchor.id&&s.start>anchor.start&&s.start<=anchor.start+windowMs)).length;
    return {days,eligible:eligible.length,returned,available:complete};
  });
  const topics = new Map(), writings = new Map(), transitions = new Map();
  articleRows.forEach(row=>{
    const d=row.data, key=wajdAdminJourneyArticleKey(d), category=String(d.category||'غير مصنف');
    if(!topics.has(category))topics.set(category,{category,visits:0,readers:new Set(),reading:0,engaged:0});
    const topic=topics.get(category);topic.visits++;topic.readers.add(d.userId);topic.reading+=Number(d.readingSeconds)||0;if(wajdAdminJourneyEngaged(d))topic.engaged++;
    if(!writings.has(key))writings.set(key,{key,title:d.pageTitle,url:d.pageUrl,visits:0,readers:new Set(),half:0,ends:0,reading:0});
    const writing=writings.get(key);writing.visits++;writing.readers.add(d.userId);writing.reading+=Number(d.readingSeconds)||0;if(d.maxProgress>=.5)writing.half++;if(d.reachedEnd)writing.ends++;
    const previous=visitsById.get(d.previousVisitId);
    if(previous&&previous.data.userId===d.userId&&previous.data.sessionId===d.sessionId&&previous.data.tabId===d.tabId&&wajdAdminJourneyIsArticle(previous.data)&&wajdAdminJourneyArticleKey(previous.data)!==key&&wajdAdminBehaviorValueMillis(previous.data.startedAt)<=wajdAdminBehaviorValueMillis(d.startedAt)){
      const pairKey=wajdAdminJourneyArticleKey(previous.data)+'::'+key;
      if(!transitions.has(pairKey))transitions.set(pairKey,{from:previous.data.pageTitle,to:d.pageTitle,count:0,readers:new Set()});
      const pair=transitions.get(pairKey);pair.count++;pair.readers.add(d.userId);
    }
  });
  const stops = [0,0,0,0,0], stoppedPages = new Map();
  sessions.filter(s=>now-s.last>=WAJD_AUDIENCE_SESSION_TIMEOUT&&wajdAdminJourneyIsArticle(s.lastPage)).forEach(s=>{
    const d=s.lastPage,p=Number(d.maxProgress)||0,index=p>=1?4:p>=.75?3:p>=.5?2:p>=.25?1:0;
    stops[index]++;
    const key=wajdAdminJourneyArticleKey(d);
    if(!stoppedPages.has(key))stoppedPages.set(key,{title:d.pageTitle,count:0});
    stoppedPages.get(key).count++;
  });
  const funnel = [0,.25,.5,.75,1].map(level=>({level,count:articleRows.filter(row=>Number(row.data.maxProgress)>=level).length}));
  return {sessions,allSessions,articleRows,articleSessions,active,reading,sources,comparisons,retention,funnel,stops,
    readers:new Set(sessions.map(s=>s.userId)).size,engaged:sessions.filter(s=>s.engaged).length,second:sessions.filter(s=>s.uniqueArticles>=2).length,
    topics:Array.from(topics.values()).sort((a,b)=>b.reading-a.reading),writings:Array.from(writings.values()),
    transitions:Array.from(transitions.values()).sort((a,b)=>b.count-a.count),stoppedPages:Array.from(stoppedPages.values()).sort((a,b)=>b.count-a.count),complete};
}

function wajdAdminJourneyInsights(data) {
  if (!data.complete) return ['تنتظر الملاحظات اكتمال تحميل الفترة من الخادم، حتى لا تُبنى على جزء من الجمهور.'];
  if (data.sessions.length < 10 || data.readers < 5) return ['العينة ما زالت صغيرة. ستظهر ملاحظات موضّحة بالأعداد عندما تتوفر ١٠ جلسات و٥ هويات على الأقل؛ لا نعطي حكمًا على كتابة من زيارتين.'];
  const notes = [], sources = data.sources.filter(s=>s.sessions>=10&&s.readers>=5).sort((a,b)=>b.engaged/b.sessions-a.engaged/a.sessions);
  if(sources.length>=2&&sources[0].engaged/sources[0].sessions-sources[1].engaged/sources[1].sessions>=.15){
    const best=sources[0];notes.push('«'+wajdAdminAudienceSource(best.source)+'» سجل قراءة متفاعلة في '+wajdAdminJourneyPercent(best.engaged,best.sessions)+' من '+wajdAdminJourneyNumber(best.sessions)+' جلسة. يمكن تجربة مشاركة كتابة قريبة هناك؛ هذه ملاحظة ارتباط وليست إثباتًا لسبب.');
  }
  const candidate=data.writings.filter(w=>w.visits>=15&&w.readers.size>=5&&w.half/w.visits<.4).sort((a,b)=>b.visits-a.visits)[0];
  if(candidate)notes.push('«'+candidate.title+'»: وصل '+wajdAdminJourneyNumber(candidate.half)+' من '+wajdAdminJourneyNumber(candidate.visits)+' زيارة إلى المنتصف. راجع المقدمة والعرض على الهاتف، مع مراعاة طول النص ومصدر الزيارة؛ هذا لا يحكم على جودة الكتابة.');
  const pair=data.transitions.find(p=>p.readers.size>=3);
  if(pair)notes.push('انتقل '+wajdAdminJourneyNumber(pair.readers.size)+' قراء من «'+pair.from+'» إلى «'+pair.to+'». قد يفيد ربطهما تحريريًا أو وضعهما في مسار واحد.');
  const week=data.retention.find(r=>r.days===7);
  if(week&&week.eligible>=10)notes.push('عاد '+wajdAdminJourneyNumber(week.returned)+' من '+wajdAdminJourneyNumber(week.eligible)+' قارئًا مؤهّلًا خلال أسبوع من أول جلسة مرصودة في الفترة. الزوار الذين لم يمر عليهم أسبوع مستبعدون من هذه النسبة.');
  return notes.length ? notes.slice(0,3) : ['لا يظهر فرق يستحق استنتاجًا تحريريًا بعد. راقب الاتجاه مع اتساع العينة، ولا تتعامل مع النسب الحالية كحكم على النصوص.'];
}

function wajdAdminJourneyLabel(userId, readerType) {
  const profile=wajdAdminData.profilesById.get(userId);
  return wajdAdminIsRegisteredUserId(userId) && profile ? (profile.displayName||'قارئ Google') : 'زائر مجهول '+wajdAdminAudienceCode(userId);
}

function wajdAdminJourneySelect(field,label,items,current) {
  return '<label class="wj-filter"><span>'+label+'</span><select data-journey-filter="'+field+'">'+items.map(([value,title])=>'<option value="'+wajdAdminEscape(value)+'"'+(String(current)===String(value)?' selected="selected"':'')+'>'+wajdAdminEscape(title)+'</option>').join('')+'</select></label>';
}

function wajdAdminJourneyTimeline(session) {
  const n=wajdAdminJourneyNumber,e=wajdAdminEscape;
  const pages=session.rows.map((row,index)=>{
    const d=row.data,isArticle=wajdAdminJourneyIsArticle(d),steps=[.25,.5,.75,1].map(level=>'<span class="'+(d.maxProgress>=level?'is-reached':'')+'">'+n(level*100)+'٪</span>').join('');
    const actions=[['saved','حفظ الكتابة'],['liked','أعجبته'],['commented','نشر تعليقًا'],['completed','سُجل إكمالها في هذه الزيارة']].filter(([key])=>d[key]).map(([,label])=>'<span>'+label+'</span>').join('');
    return '<li><span class="wj-step-number">'+n(index+1)+'</span><div class="wj-step-copy"><small>'+e(wajdAdminJourneyDate(d.startedAt))+' · '+e(d.pageType==='answer'?'إجابة تللينوم':wajdAdminAudienceType(d.pageType))+'</small><a href="'+e(wajdAdminSafeUrl(d.pageUrl))+'" target="_blank" rel="noopener">'+e(d.pageTitle)+'</a><p>'+e(wajdAdminDuration(d.activeSeconds))+' نشط في الصفحة'+(isArticle?' · '+e(wajdAdminDuration(d.readingSeconds))+' والنص ظاهر · أقصى عمق '+wajdAdminJourneyPercent(Number(d.maxProgress)||0,1):'')+(d.pathId?' · داخل مسار قراءة':'')+'</p>'+(isArticle?'<div class="wj-milestones" aria-label="مراحل عمق القراءة">'+steps+'</div>':'')+(actions?'<div class="wj-events">'+actions+'</div>':'')+'</div></li>';
  }).join('');
  const status=Date.now()-session.last<WAJD_AUDIENCE_SESSION_TIMEOUT?'قد تستمر الجلسة':'آخر نشاط منذ ٣٠ دقيقة أو أكثر';
  return '<details class="wj-session"><summary><div><strong>'+e(wajdAdminJourneyLabel(session.userId,session.readerType))+'</strong><small>'+e(wajdAdminJourneyDate(session.start))+' · '+(session.readerType==='registered'?'Google':'مجهول')+' · '+(session.returning?'عائد':'زيارة أولى')+'</small></div><div><b>'+n(session.rows.length)+' صفحات · '+e(wajdAdminDuration(session.active))+'</b><small>'+e(wajdAdminAudienceSource(session.source))+' · '+e(wajdAdminAudienceDevice(session.device))+'</small></div></summary><div class="wj-session-body"><p class="wj-note">'+status+'. هذا سجل زيارات مرتّب زمنيًا، لا تسجيل للشاشة أو للنقرات. قد تتداخل علامات تبويب؛ الانتقالات الملخّصة أدناه تعتمد على رابط الزيارة السابقة فقط.'+(session.mixed?' تحمل بعض سجلات هذه الجلسة تصنيف هوية تاريخيًا مختلفًا؛ العرض الحالي يعتمد وجود حساب Google مؤكد فقط.':'')+'</p><button class="wajd-admin-action" data-journey-user="'+e(session.userId)+'" type="button">جلسات هذا القارئ في الفترة</button><ol class="wj-timeline">'+pages+'</ol><p class="wj-note">آخر صفحة مسجلة لا تثبت وحدها مغادرة الموقع أو سبب التوقف.</p></div></details>';
}

function wajdAdminJourneyHtml() {
  const state=wajdJourneyAdmin,e=wajdAdminEscape,n=wajdAdminJourneyNumber,pct=wajdAdminJourneyPercent;
  const header='<div class="wj-header"><div><span>من الزيارة إلى القراءة والعودة</span><h3>رحلة الجمهور</h3><p>إضافة مستقلة؛ النظرة العامة وبيانات الجمهور السابقة باقية كما هي.</p></div><button class="wajd-admin-action" data-journey-command="refresh" type="button"'+(state.loading?' disabled="disabled"':'')+'>تحديث الرحلات</button></div>';
  const filters='<div class="wj-filters">'+wajdAdminJourneySelect('range','الفترة',[[7,'٧ أيام'],[30,'٣٠ يومًا'],[90,'٩٠ يومًا']],state.range)+wajdAdminJourneySelect('type','هوية بداية الجلسة',[['all','الجميع'],['anonymous','مجهول'],['registered','حساب Google']],state.type)+wajdAdminJourneySelect('frequency','نوع الزيارة',[['all','كل الزيارات'],['new','زيارة أولى'],['returning','عائد']],state.frequency)+wajdAdminJourneySelect('device','الجهاز',[['all','كل الأجهزة'],['mobile','هاتف'],['tablet','جهاز لوحي'],['desktop','كمبيوتر']],state.device)+wajdAdminJourneySelect('source','مصدر بداية الجلسة',[['all','كل المصادر'],...['direct','internal','google','telegram','facebook','other'].map(value=>[value,wajdAdminAudienceSource(value)])],state.source)+'</div>';
  const error=state.error?'<div class="wj-note is-warning" role="alert">'+e(state.error)+' <button class="wajd-admin-action" data-journey-command="'+(state.rows.length?'more':'refresh')+'" type="button">إعادة المحاولة</button></div>':'';
  if(!state.loaded&&!state.rows.length)return header+filters+error+(state.loading?'<div class="wajd-admin-state" role="status">جارٍ تحميل أحدث رحلات الفترة…</div>':'');
  const complete=!state.hasMore&&!state.cached&&!state.error&&!state.loading;
  const data=wajdAdminJourneyAnalyze(state.rows,state,state.now||Date.now(),complete);
  const coverage='<div class="wj-note'+(!complete?' is-warning':'')+'">'+(complete?'اكتمل تحميل الفترة: ':'عرض جزئي: ')+n(state.rows.length)+' زيارة صفحة منذ '+e(wajdAdminDate(new Date(state.cutoff),false))+'. آخر تحديث: '+e(wajdAdminJourneyDate(state.loadedAt))+'. '+(state.hasMore?'توجد سجلات أقدم؛ حمّلها لإكمال الرحلات ونسب العودة. ':'')+(state.cached?'هذه نسخة مخبأة، وليست تأكيدًا لاكتمال بيانات الخادم. ':'')+'الفترة تختار زيارات الصفحات التي بدأت خلالها. تبدأ التفاصيل الجديدة بعد نشر v100؛ عدم ظهور رحلة قديمة لا يعني حذفها من الإحصاءات السابقة.</div>';
  const more=state.hasMore?'<div class="wj-load"><button class="wajd-admin-action is-solid" data-journey-command="more" type="button"'+(state.loading?' disabled="disabled"':'')+'>'+(state.loading?'جارٍ التحميل…':'تحميل ٥٠٠ زيارة أقدم من الفترة')+'</button></div>':'';
  const user=state.user?'<div class="wj-user-filter">عرض هوية '+e(wajdAdminAudienceCode(state.user))+' فقط <button class="wajd-admin-action" data-journey-command="clear-user" type="button">عرض الجمهور كله</button></div>':'';
  if(!data.sessions.length)return header+filters+error+coverage+user+'<div class="wajd-admin-empty">'+(state.rows.length?'لا توجد جلسات مطابقة لهذه المرشحات.':'لا توجد رحلات تفصيلية في هذه الفترة بعد. افتح المدونة بمتصفح مجهول أو حساب غير إداري واقرأ كتابتين، ثم حدّث هذا التبويب. حساب المدير مستبعد من القياس.')+'</div>'+more;
  const stopTotal=data.stops.reduce((a,b)=>a+b,0), stopIndex=data.stops.indexOf(Math.max(...data.stops));
  const stopLabels=['قبل الربع','بين الربع والنصف','بين النصف و٧٥٪','بين ٧٥٪ والنهاية','عند النهاية'];
  const stats=[
    ['القراءة المتفاعلة',pct(data.engaged,data.sessions.length),n(data.engaged)+' من '+n(data.sessions.length)+' جلسة'],
    ['فتحت كتابة ثانية',pct(data.second,data.articleSessions.length),n(data.second)+' من '+n(data.articleSessions.length)+' جلسة فتحت كتابة'],
    ['كتابات مختلفة / جلسة',n(Math.round(data.sessions.reduce((sum,s)=>sum+s.uniqueArticles,0)/data.sessions.length*10)/10),'يشمل الجلسات التي لم تفتح كتابة'],
    ['وقت نشط والنص ظاهر',e(wajdAdminDuration(data.reading)),'وقت المقالات فقط، باستبعاد نوافذ الحساب والتعليق'],
    ['هويات في العينة',n(data.readers),n(data.sessions.length)+' جلسة · '+n(data.articleRows.length)+' زيارة كتابة'],
    ['التوقف المسجل الأشيع',stopTotal?stopLabels[stopIndex]:'بانتظار جلسات هادئة',stopTotal?n(data.stops[stopIndex])+' من '+n(stopTotal)+' جلسة توقفت عند كتابة':'آخر نشاط منذ ٣٠ دقيقة أو أكثر']
  ];
  const kpis='<div class="wj-kpis">'+stats.map(([label,value,note])=>'<div><span>'+label+'</span><strong>'+value+'</strong><small>'+note+'</small></div>').join('')+'</div>';
  const funnel='<section class="wj-panel"><h4>إلى أين وصلوا داخل الكتابة؟</h4><p>عدد زيارات الكتابات؛ إعادة فتح الكتابة تُحسب زيارة جديدة.</p><div class="wj-funnel">'+data.funnel.map((item,index)=>'<div><span>'+['فتح كتابة','ظهر له ٢٥٪','ظهر له ٥٠٪','ظهر له ٧٥٪','وصل إلى النهاية'][index]+'</span><b>'+n(item.count)+' <small>'+pct(item.count,data.articleRows.length)+'</small></b><i><em style="width:'+(data.articleRows.length?Math.round(item.count/data.articleRows.length*100):0)+'%"></em></i></div>').join('')+'</div><p class="wj-note">الوصول للنهاية وصف للعمق الظاهر، وليس إثباتًا لقراءة كل كلمة. «قراءة متفاعلة» تعني ٣٠ ثانية نشطة والنص ظاهر مع بلوغ ٢٥٪ في كتابة واحدة على الأقل.</p></section>';
  const returns='<section class="wj-panel"><h4>هل عادوا بعد الزيارة؟</h4><p>خلال المدة التالية لأول جلسة مرصودة لكل هوية في الفترة المختارة.</p><div class="wj-retention">'+data.retention.map(r=>'<div><span>خلال '+(r.days===1?'يوم':n(r.days)+(r.days===7?' أيام':' يومًا'))+'</span><strong>'+(r.available?pct(r.returned,r.eligible):'—')+'</strong><small>'+(r.available?(r.eligible?n(r.returned)+' عادوا من '+n(r.eligible)+' مؤهّلًا':'لم تكتمل مدة الانتظار بعد'):'يلزم اكتمال تحميل الفترة')+'</small></div>').join('')+'</div><p class="wj-note">لا يدخل القارئ في مقام النسبة إلا بعد مرور المدة كاملة. لتقييم العودة خلال ٣٠ يومًا اختر فترة ٩٠ يومًا. العودة تُحسب بجلسة أخرى للهوية نفسها، ولو من مصدر أو جهاز مختلف مسجّل للحساب. المجهول يمثل هذا المتصفح؛ مسح بياناته أو الانتقال لجهاز آخر قد ينتج هوية جديدة.</p></section>';
  const table=(heads,rows,label)=>'<div class="wj-table-wrap" tabindex="0" role="region" aria-label="'+label+'"><table><thead><tr>'+heads.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
  const sourcePanel='<section class="wj-panel wj-wide"><h4>مصادر تأتي بقرّاء</h4><p>المصدر المعروف عند بداية الجلسة؛ «مباشر» قد يشمل تطبيقًا لم يرسل معلومة المصدر.</p>'+table(['المصدر','جلسات','متوسط الوقت النشط','قراءة متفاعلة','كتابة ثانية','بلوغ النهاية'],data.sources.map(s=>'<tr><th scope="row">'+e(wajdAdminAudienceSource(s.source))+'</th><td>'+n(s.sessions)+'</td><td>'+e(wajdAdminDuration(s.active/s.sessions))+'</td><td>'+pct(s.engaged,s.sessions)+'</td><td>'+pct(s.second,s.articleSessions)+'</td><td>'+pct(s.ends,s.articles)+'</td></tr>'),'جودة مصادر الزيارة')+'<p class="wj-note">القراءة المتفاعلة من جميع الجلسات؛ الكتابة الثانية من جلسات فتحت كتابة؛ بلوغ النهاية من زيارات الكتابات. المقامات مختلفة ومقصودة.</p></section>';
  const comparison='<section class="wj-panel"><h4>مقارنة مجموعات الجمهور</h4>'+table(['المجموعة','جلسات','متفاعل','كتابة ثانية'],data.comparisons.map(s=>'<tr><th scope="row">'+s.label+'</th><td>'+n(s.sessions)+'</td><td>'+pct(s.engaged,s.sessions)+'</td><td>'+pct(s.second,s.articleSessions)+'</td></tr>'),'مقارنة الجمهور')+'<p class="wj-note">المجموعات متداخلة: قد يكون القارئ مجهولًا وعائدًا معًا. «زيارة أولى» تعني أول جلسة في نظام قياس الجمهور، لا ضمان أنه لم يزر الموقع سابقًا.</p></section>';
  const interests='<section class="wj-panel"><h4>الموضوعات التي تستبقي الانتباه</h4><p>بحسب التصنيف المسجّل عند فتح الكتابة، مرتّبة بوقت القراءة النشط.</p><div class="wj-ranked">'+(data.topics.length?data.topics.slice(0,6).map(t=>'<div><strong>'+e(t.category)+'</strong><span>'+e(wajdAdminDuration(t.reading))+'</span><small>'+n(t.readers.size)+' هويات · '+n(t.visits)+' زيارات كتابة</small></div>').join(''):'<p>لم تُفتح كتابة في العينة بعد.</p>')+'</div></section>';
  const connections='<section class="wj-panel"><h4>من كتابة إلى أخرى</h4><p>انتقالات موصولة بين زيارتين في الجلسة وعلامة التبويب نفسها.</p><div class="wj-ranked">'+(data.transitions.length?data.transitions.slice(0,5).map(pair=>'<div><strong>'+e(pair.from)+' ← '+e(pair.to)+'</strong><span>'+n(pair.count)+'</span><small>'+n(pair.readers.size)+' هويات مختلفة</small></div>').join(''):'<p>لم تُرصد انتقالات موصولة بين كتابتين بعد.</p>')+'</div></section>';
  const stops='<section class="wj-panel"><h4>آخر صفحات قبل توقف النشاط</h4><p>آخر صفحة مسجلة في جلسة لم تتجدد منذ ٣٠ دقيقة؛ ليست معرفة مؤكدة بالخروج.</p><div class="wj-ranked">'+(data.stoppedPages.length?data.stoppedPages.slice(0,5).map(page=>'<div><strong>'+e(page.title)+'</strong><span>'+n(page.count)+' جلسات</span></div>').join(''):'<p>بانتظار جلسات متوقفة انتهت عند كتابة.</p>')+'</div></section>';
  const insights='<section class="wj-panel wj-wide"><h4>ملاحظات تساعدك في الكتابة</h4><ul class="wj-insights">'+wajdAdminJourneyInsights(data).map(note=>'<li>'+e(note)+'</li>').join('')+'</ul></section>';
  const needle=state.search.trim().toLowerCase();
  const sessions=data.sessions.filter(s=>!needle||[wajdAdminJourneyLabel(s.userId,s.readerType),wajdAdminAudienceCode(s.userId),...s.rows.map(row=>row.data.pageTitle)].some(value=>String(value||'').toLowerCase().includes(needle)));
  const timeline='<section class="wj-panel wj-wide"><div class="wj-session-head"><div><h4>الجلسات بالتفصيل</h4><p>افتح الجلسة لرؤية الصفحات والوقت وعمق القراءة والتفاعلات.</p></div><label class="wj-filter"><span>بحث داخل الجلسات فقط</span><input type="search" data-journey-search="true" placeholder="اسم، رمز مجهول، أو عنوان كتابة…" value="'+e(state.search)+'"/></label></div>'+sessions.slice(0,state.sessionLimit).map(wajdAdminJourneyTimeline).join('')+(!sessions.length?'<p>لا توجد جلسات مطابقة للبحث.</p>':'')+(sessions.length>state.sessionLimit?'<div class="wj-load"><button class="wajd-admin-action" data-journey-command="sessions" type="button">عرض ١٢ جلسة أخرى</button></div>':'')+'</section>';
  return header+filters+error+coverage+user+kpis+'<div class="wj-grid">'+funnel+returns+sourcePanel+comparison+interests+connections+stops+insights+timeline+'</div>'+more+'<p class="wj-footnote">القياس تقديري وقد يفوّت آخر ثوانٍ عند إغلاق المتصفح فجأة. لا نسجل الشاشة، ولا نصوص البحث، ولا الأسماء أو البريد أو IP في بيانات الرحلات. التفاعلات تعني أنها حدثت أثناء الزيارة، وليست حالة الحفظ أو الإعجاب الحالية.</p>';
}

function wajdAdminJourneyHandleClick(button) {
  const state=wajdJourneyAdmin,command=button.dataset.journeyCommand,user=button.dataset.journeyUser;
  if(!command&&!user)return false;
  if(user){state.user=user;state.sessionLimit=12;wajdAdminJourneyRepaint();return true;}
  if(command==='refresh')wajdAdminJourneyLoad(true);
  else if(command==='more')wajdAdminJourneyLoad(false);
  else if(command==='clear-user'){state.user='';wajdAdminJourneyRepaint();}
  else if(command==='sessions'){state.sessionLimit+=12;wajdAdminJourneyRepaint();}
  return true;
}

function wajdAdminJourneyHandleFilter(target) {
  const field=target.dataset.journeyFilter,state=wajdJourneyAdmin;
  const choices={range:['7','30','90'],type:['all','anonymous','registered'],frequency:['all','new','returning'],device:['all','mobile','tablet','desktop'],source:['all','direct','internal','google','telegram','facebook','other']};
  if(!choices[field]||!choices[field].includes(target.value))return false;
  state[field]=field==='range'?Number(target.value):target.value;state.sessionLimit=12;
  if(field==='range')wajdAdminJourneyLoad(true);else wajdAdminJourneyRepaint();
  const control=document.querySelector('#wajd-journey-root [data-journey-filter="'+field+'"]');
  if(control)control.focus({preventScroll:true});
  return true;
}
/* END WAJD v100 JOURNEY ADMIN */

function wajdAdminReadersHtml() {
  if (wajdAdminAudienceSelected) return wajdAdminAudienceDetailHtml(wajdAdminData.audienceById.get(wajdAdminAudienceSelected));
  const audience = wajdAdminData.audience || [], needle = wajdAdminReaderSearch.trim().toLowerCase();
  const registered = audience.filter(wajdAdminAudienceIsRegistered).length;
  const anonymous = audience.length - registered;
  const filtered = audience.filter(item => {
    const isRegistered = wajdAdminAudienceIsRegistered(item);
    if (wajdAdminAudienceFilter === 'anonymous' && isRegistered) return false;
    if (wajdAdminAudienceFilter === 'registered' && !isRegistered) return false;
    if (wajdAdminAudienceFilter === 'online' && !wajdAdminAudienceOnline(item)) return false;
    if (!needle) return true;
    const analytics = item.analytics || {}, profile = item.profile || {};
    return [wajdAdminAudienceLabel(item),wajdAdminAudienceCode(item.id),profile.displayName,profile.email,analytics.lastPageTitle].some(value => String(value || '').toLowerCase().includes(needle));
  });
  const summary = [
    ['إجمالي الجمهور',audience.length,'هوية متصفح'],
    ['زوار مجهولون',anonymous,'بلا بيانات شخصية'],
    ['حسابات Google',registered,'Profile مؤكد'],
    ['متواجدون الآن',wajdAdminData.onlineAudience,'خلال دقيقتين'],
    ['متوسط الجلسة',wajdAdminDuration(wajdAdminData.averageAudienceSessionSeconds),'وقت نشط']
  ];
  const filters = [['all','الجميع'],['anonymous','المجهولون'],['registered','حسابات Google'],['online','الآن']].map(item => '<button class="wajd-admin-tab' + (wajdAdminAudienceFilter === item[0] ? ' is-active' : '') + '" data-admin-audience-filter="' + item[0] + '" type="button">' + item[1] + '</button>').join('');
  return '<div class="wajd-audience-summary">' + summary.map(item => '<div><span>' + item[0] + '</span><strong>' + (typeof item[1] === 'number' ? wajdSavedArabicNumber.format(item[1]) : wajdAdminEscape(item[1])) + '</strong><small>' + item[2] + '</small></div>').join('') + '</div><div class="wajd-admin-toolbar"><div class="wajd-admin-toolbar-group"><input aria-label="البحث في الجمهور" class="wajd-admin-search" data-admin-input="reader-search" placeholder="ابحث بالاسم أو البريد أو رمز المجهول…" type="search" value="' + wajdAdminEscape(wajdAdminReaderSearch) + '"/><div class="wajd-audience-filters">' + filters + '</div></div><span class="wajd-admin-result-count">' + wajdSavedArabicNumber.format(filtered.length) + ' نتيجة</span></div><div class="wajd-admin-anonymous-note">الوقت المعروض هو الوقت النشط التقريبي فقط: يتوقف عند إخفاء الصفحة أو الخمول، وتبدأ بيانات الجلسات من لحظة نشر v97. هوية المجهول تمثل هذا المتصفح ولا تكشف اسمًا أو بريدًا أو IP. تصنيف «حساب Google» لا يعتمد على وسم قديم داخل الجلسات أو على نوع التفاعل؛ مصدره الوحيد Profile حساب Google المؤكد.' + (wajdAdminData.audienceSessionsLimited ? ' تُحمّل عينة من ٣٠٠٠ جلسة للتفاصيل، بينما تبقى الإجماليات الدقيقة محفوظة داخل بطاقة كل زائر.' : '') + '</div><div class="wajd-admin-table">' + (filtered.length ? filtered.map(wajdAdminAudienceRow).join('') : '<div class="wajd-admin-empty">لا يوجد زائر مطابق لهذا الفلتر</div>') + '</div>';
}

function wajdAdminRenderView() {
  if (!wajdAdminContent || !wajdAdminData) return;
  const body = wajdAdminView === 'audience-journey' ? '<div id="wajd-journey-root">'+wajdAdminJourneyHtml()+'</div>' : wajdAdminView === 'paths' ? '<div id="wajd-paths-admin-root"><div class="wajd-admin-state">جارٍ تحميل مسارات القراءة…</div></div>' : wajdAdminView === 'path-analytics' ? '<div id="wajd-paths-analytics-root"><div class="wajd-admin-state">جارٍ تحليل حركة المسارات…</div></div>' : wajdAdminView === 'content' ? wajdAdminContentHtml() : wajdAdminView === 'audience-analytics' ? wajdAdminAudienceBehaviorHtml() : wajdAdminView === 'comments' ? wajdAdminCommentsHtml() : wajdAdminView === 'readers' ? wajdAdminReadersHtml() : wajdAdminOverviewHtml();
  const warning = wajdAdminData.loadWarnings && wajdAdminData.loadWarnings.length
    ? '<div class="wajd-admin-state">تم تحميل اللوحة، مع تعذّر قراءة ' + wajdSavedArabicNumber.format(wajdAdminData.loadWarnings.length) + ' مصدر فرعي. اضغط «تحديث» للمحاولة مجددًا.</div>'
    : '';
  wajdAdminContent.innerHTML = wajdAdminNav() + warning + body;
  if (wajdAdminView === 'paths' && window.wajdReadingPathsAdminRender) window.wajdReadingPathsAdminRender();
  if (wajdAdminView === 'path-analytics' && window.wajdReadingPathsAnalyticsRender) window.wajdReadingPathsAnalyticsRender();
  if (wajdAdminView === 'audience-journey' && !wajdJourneyAdmin.loaded && !wajdJourneyAdmin.loading && !wajdJourneyAdmin.error) wajdAdminJourneyLoad(true);
}

async function wajdAdminLoadDatedCollection(reference,field,days) {
  const cutoff = new Date(); cutoff.setHours(0,0,0,0); cutoff.setDate(cutoff.getDate() - days + 1);
  const docs = []; let cursor = null;
  while (true) {
    const constraints = [where(field,'>=',cutoff),orderBy(field,'desc')];
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(500));
    const snapshot = await getDocs(query(reference,...constraints));
    docs.push(...snapshot.docs);
    if (snapshot.size < 500) break;
    cursor = snapshot.docs[snapshot.docs.length-1];
  }
  return wajdAdminSnapshot(docs);
}

async function wajdAdminLoadAudienceSessions() {
  try {
    const snapshot = await wajdAdminLoadDatedCollection(collectionGroup(wajdSavedDb,'audienceSessions'),'startedAt',90);
    snapshot.indexFallback = false;
    return snapshot;
  } catch (error) {
    const code = String(error && error.code || '');
    if (!/failed-precondition/.test(code)) throw error;
    console.warn('Wajd audienceSessions index unavailable; using complete client-side fallback.');
    const cutoff = new Date(); cutoff.setHours(0,0,0,0); cutoff.setDate(cutoff.getDate() - 89);
    try {
      const unindexed = await getDocs(collectionGroup(wajdSavedDb,'audienceSessions'));
      const docs = unindexed.docs.filter(item => wajdAdminBehaviorValueMillis(item.data().startedAt) >= cutoff.getTime());
      docs.sort((a,b) => wajdAdminBehaviorValueMillis(b.data().startedAt) - wajdAdminBehaviorValueMillis(a.data().startedAt) || b.id.localeCompare(a.id));
      const snapshot = wajdAdminSnapshot(docs);
      snapshot.indexFallback = true;
      return snapshot;
    } catch (fallbackError) {
      console.warn('Wajd audienceSessions collection-group index unavailable; dashboard will continue without session rows.', fallbackError && fallbackError.code || fallbackError);
      const snapshot = wajdAdminSnapshot([]);
      snapshot.indexUnavailable = true;
      return snapshot;
    }
  }
}

function wajdAdminOptionalSnapshot(promise,label) {
  return promise.catch(error => {
    console.warn('Wajd optional admin data '+label+':',error && error.code || error);
    return wajdAdminSnapshot([]);
  });
}

async function wajdAdminLoad() {
  if (!wajdAdminContent || !wajdIsAdmin(wajdAdminCurrentUser())) return;
  if (wajdAdminView === 'audience-journey' && wajdAdminData) return wajdAdminJourneyLoad(true);
  wajdJourneyAdmin.generation++; wajdJourneyAdmin.loaded=false; wajdJourneyAdmin.loading=false; wajdJourneyAdmin.error='';
  wajdAdminRefresh.disabled = true;
  wajdAdminContent.innerHTML = '<div class="wajd-admin-state">جارٍ جمع بيانات لوحة الإدارة…</div>';
  try {
    const [articles, profilesSnapshot, notifications, blocksSnapshot, anonymousVisitorsSnapshot, audienceVisitorsSnapshot, audienceSessionsSnapshot, audienceRecoverySnapshot] = await Promise.all([
      getDocs(collection(wajdSavedDb,'articles')),
      getDocs(collection(wajdSavedDb,'profiles')),
      getDocs(collection(wajdSavedDb,'adminNotifications')),
      getDocs(collection(wajdSavedDb,'moderationBlocks')),
      getDocs(collection(wajdSavedDb,'anonymousVisitors')),
      getDocs(collection(wajdSavedDb,'audienceVisitors')),
      wajdAdminLoadAudienceSessions(),
      wajdAdminOptionalSnapshot(wajdAdminLoadDatedCollection(collection(wajdSavedDb,'audienceRecoveryDeltas'),'recordedAt',90),'audience recovery')
    ]);
    let posts=[];
    try{posts=await wajdSavedGetFeed();}
    catch(feedError){console.warn('Wajd admin Blogger feed unavailable; continuing with Firestore data:',feedError);}
    const discoverableArticleIds = new Set(posts.map(wajdSavedPostId).filter(Boolean));
    if(!discoverableArticleIds.size){
      const hiddenIds=window.wajdContentHiddenPostIds||new Set();
      articles.forEach(item=>{if(!hiddenIds.has(String(item.id)))discoverableArticleIds.add(item.id);});
    }
    // One collection-group query per interaction type keeps dashboard cost fixed
    // instead of issuing two additional reads for every article ever discovered.
    const interactionRequests = [
      { label:'all-likes', ref:collectionGroup(wajdSavedDb,'likes') },
      { label:'all-views', ref:collectionGroup(wajdSavedDb,'views') },
      { label:'all-saved', ref:collectionGroup(wajdSavedDb,'saved') },
      { label:'all-history', ref:collectionGroup(wajdSavedDb,'history') },
      { label:'all-owner-comments', ref:collectionGroup(wajdSavedDb,'comments') }
    ];
    const interactionData = await wajdAdminCollect(interactionRequests);
    const interactionDocs = interactionData.snapshot.docs;
    const likes = wajdAdminSnapshot(interactionDocs.filter(item => item.ref.parent.id === 'likes' && discoverableArticleIds.has(wajdAdminArticleFromRef(item))));
    const views = wajdAdminSnapshot(interactionDocs.filter(item => item.ref.parent.id === 'views' && discoverableArticleIds.has(wajdAdminArticleFromRef(item))));
    const saves = wajdAdminSnapshot(interactionDocs.filter(item => item.ref.parent.id === 'saved' && discoverableArticleIds.has(item.id)));
    const history = wajdAdminSnapshot(interactionDocs.filter(item => item.ref.parent.id === 'history' && discoverableArticleIds.has(item.id)));
    const publicComments = interactionDocs.filter(item => item.ref.parent.id === 'comments' && typeof item.data().body === 'string');
    const ownerComments = interactionDocs.filter(item => item.ref.parent.id === 'comments' && typeof item.data().body !== 'string' && item.data().articleId);
    const allComments = wajdAdminSnapshot(publicComments.concat(ownerComments));
    const postsById = new Map(posts.map(post => [wajdSavedPostId(post),post]));
    const likeMap = new Map(), viewMap = new Map(), saveMap = new Map(), returnMap = new Map(), commentMap = new Map(), articleMeta = new Map(), commentMeta = new Map();
    let totalLikes = 0, totalViews = 0, returnVisits = 0;
    articles.forEach(item => { if(!discoverableArticleIds.has(item.id))return; const data=item.data(), likesCount=Number(data.likeCount)||0, viewsCount=Number(data.viewCount)||0; likeMap.set(item.id,likesCount); viewMap.set(item.id,viewsCount); totalLikes+=likesCount; totalViews+=viewsCount; });
    saves.forEach(item => saveMap.set(item.id,(saveMap.get(item.id)||0)+1));
    history.forEach(item => { const value=Math.max(0,(Number(item.data().readCount)||1)-1); returnMap.set(item.id,(returnMap.get(item.id)||0)+value); returnVisits+=value; });
    notifications.forEach(item => { const data=item.data(); if (data.commentId) commentMeta.set(data.commentId,data); if (data.articleId && data.articleTitle) articleMeta.set(data.articleId,data.articleTitle); });
    const owners = new Map(), comments = [], ownerCommentDocs = [];
    allComments.forEach(item => {
      const data=item.data();
      if (typeof data.body === 'string') {
        const scopeId=wajdAdminArticleFromRef(item); comments.push({id:item.id,scopeId,data,ref:item.ref});
        const meta=commentMeta.get(item.id), articleId=meta && meta.articleId ? meta.articleId : scopeId;
        if(discoverableArticleIds.has(articleId))commentMap.set(articleId,(commentMap.get(articleId)||0)+1);
      } else if (data.articleId) { owners.set(item.id,wajdAdminOwnerFromRef(item)); ownerCommentDocs.push(item); }
    });
    comments.sort((a,b) => wajdAdminTimestamp(b.data,'createdAt')-wajdAdminTimestamp(a.data,'createdAt'));
    const rawProfiles = [];
    profilesSnapshot.forEach(item => rawProfiles.push({id:item.id,data:item.data()}));
    // v118 root fix: a Profile is accepted as registered evidence only when it
    // actually carries Google-account identity data. Historical telemetry rows,
    // saves, comments, or a stale readerType can never promote an anonymous UID.
    const profiles = rawProfiles.filter(item => wajdAdminIsGoogleProfile(item.data));
    profiles.sort((a,b) => wajdAdminTimestamp(b.data,'lastSeenAt')-wajdAdminTimestamp(a.data,'lastSeenAt'));
    const profilesById = new Map(profiles.map(item => [item.id,item.data]));
    const registeredGoogleIds = new Set(profiles.filter(item => String(item.data.email || '').trim().toLowerCase() !== WAJD_ADMIN_EMAIL.toLowerCase()).map(item => item.id));
    window.wajdAdminRegisteredGoogleIds = registeredGoogleIds;
    const legacyAnonymousById = new Map();
    anonymousVisitorsSnapshot.forEach(item => legacyAnonymousById.set(item.id,item.data()));

    // v117 reconciliation: a successful like/view/save/history/comment is proof
    // that this Firebase UID reached the site even if optional audience telemetry
    // failed. Keep that reader visible in the dashboard without inventing a
    // session duration that was never recorded.
    const interactionEvidenceByUser = new Map();
    const addInteractionEvidence = (userId, millis, kind) => {
      userId = String(userId || '');
      if (!userId || (profilesById.has(userId) && profilesById.get(userId).email === WAJD_ADMIN_EMAIL)) return;
      millis = Number(millis) || 0;
      const current = interactionEvidenceByUser.get(userId) || { firstMillis:0, lastMillis:0, kinds:new Set() };
      if (millis > 0) {
        current.firstMillis = current.firstMillis ? Math.min(current.firstMillis,millis) : millis;
        current.lastMillis = Math.max(current.lastMillis,millis);
      }
      current.kinds.add(kind);
      interactionEvidenceByUser.set(userId,current);
    };
    likes.forEach(item => addInteractionEvidence(item.id,wajdAdminTimestamp(item.data(),'createdAt'),'like'));
    views.forEach(item => addInteractionEvidence(item.id,wajdAdminTimestamp(item.data(),'createdAt'),'view'));
    saves.forEach(item => addInteractionEvidence(wajdAdminOwnerFromRef(item),wajdAdminTimestamp(item.data(),'createdAt') || wajdAdminTimestamp(item.data(),'updatedAt'),'save'));
    history.forEach(item => addInteractionEvidence(wajdAdminOwnerFromRef(item),wajdAdminTimestamp(item.data(),'updatedAt') || wajdAdminTimestamp(item.data(),'createdAt'),'history'));
    ownerCommentDocs.forEach(item => addInteractionEvidence(wajdAdminOwnerFromRef(item),wajdAdminTimestamp(item.data(),'createdAt') || wajdAdminTimestamp(item.data(),'updatedAt'),'comment'));

    const audienceAnalyticsById = new Map();
    audienceVisitorsSnapshot.forEach(item => audienceAnalyticsById.set(item.id,item.data()));
    const audienceSessions = [], audienceSessionsByUser = new Map();
    audienceSessionsSnapshot.forEach(item => {
      const originalUserId = item.ref && item.ref.parent && item.ref.parent.parent ? item.ref.parent.parent.id : '';
      if (!originalUserId) return;
      const userId = originalUserId;
      const entry = { id:item.id, userId, originalUserId, data:item.data() };
      audienceSessions.push(entry);
      if (!audienceSessionsByUser.has(userId)) audienceSessionsByUser.set(userId,[]);
      audienceSessionsByUser.get(userId).push(entry);
    });
    const recoveryByUser = new Map(), sessionByKey = new Map(audienceSessions.map(item => [item.userId+'::'+item.id,item]));
    audienceRecoverySnapshot.forEach(item => {
      const data=item.data(), rawUser=String(data.sourceUserId||data.userId||''), userId=rawUser||String(data.userId||''), seconds=Math.max(0,Math.min(300,Number(data.activeSeconds)||0));
      if(!userId||!seconds)return;
      recoveryByUser.set(userId,(recoveryByUser.get(userId)||0)+seconds);
      const session=sessionByKey.get(userId+'::'+String(data.sessionId||''));
      if(session)session.data={...session.data,activeSeconds:Math.max(0,Number(session.data.activeSeconds)||0)+seconds,recoveredSeconds:(Number(session.data.recoveredSeconds)||0)+seconds};
    });
    audienceSessionsByUser.forEach(items => items.sort((a,b) => wajdAdminTimestamp(b.data,'lastSeenAt') - wajdAdminTimestamp(a.data,'lastSeenAt') || wajdAdminTimestamp(b.data,'startedAt') - wajdAdminTimestamp(a.data,'startedAt')));
    const audienceById = new Map();
    profiles.filter(item => String(item.data.email || '').trim().toLowerCase() !== WAJD_ADMIN_EMAIL.toLowerCase()).forEach(item => audienceById.set(item.id,{ id:item.id, readerType:'registered', profile:item.data, analytics:null, firstSeenAt:item.data.createdAt, lastSeenAt:item.data.lastSeenAt }));
    legacyAnonymousById.forEach((data,id) => {
      if (!audienceById.has(id)) audienceById.set(id,{ id, readerType:'anonymous', profile:null, analytics:null, firstSeenAt:data.firstSeenAt, lastSeenAt:data.lastSeenAt });
    });
    audienceAnalyticsById.forEach((data,id) => {
      if (profilesById.has(id) && String(profilesById.get(id).email || '').trim().toLowerCase() === WAJD_ADMIN_EMAIL.toLowerCase()) return;
      const googleProfile = profilesById.get(id) || null;
      const current = audienceById.get(id) || { id, readerType:googleProfile ? 'registered' : 'anonymous', profile:googleProfile };
      // Never trust data.readerType here: old analytics may contain stale labels.
      current.readerType = googleProfile ? 'registered' : 'anonymous';
      current.profile = googleProfile;
      current.analytics = data;
      current.firstSeenAt = current.firstSeenAt || data.firstSeenAt;
      current.lastSeenAt = data.lastActiveAt || data.lastSeenAt || current.lastSeenAt;
      audienceById.set(id,current);
    });
    interactionEvidenceByUser.forEach((evidence,id) => {
      const profile = profilesById.get(id) || null;
      let row = audienceById.get(id);
      if (!row) {
        // Likes, saves, history and comments prove that this UID interacted,
        // but they do not prove Google registration. Only a Google Profile does.
        row = { id, readerType:profile ? 'registered' : 'anonymous', profile, analytics:null };
        audienceById.set(id,row);
      }
      row.interactionEvidence = evidence;
      row.telemetryMissing = !row.analytics;
      if (!row.firstSeenAt && evidence.firstMillis) row.firstSeenAt = new Date(evidence.firstMillis);
      if ((!row.lastSeenAt || !row.analytics) && evidence.lastMillis) row.lastSeenAt = new Date(evidence.lastMillis);
    });
    recoveryByUser.forEach((seconds,userId)=>{
      const row=audienceById.get(userId); if(!row)return;
      row.analytics={...(row.analytics||{}),totalActiveSeconds:Math.max(0,Number(row.analytics&&row.analytics.totalActiveSeconds)||0)+seconds,recoveredActiveSeconds:seconds};
    });
    const audience = Array.from(audienceById.values()).sort((a,b) => wajdAdminAudienceMillis(b,'lastActiveAt')-wajdAdminAudienceMillis(a,'lastActiveAt') || wajdAdminAudienceMillis(b,'lastSeenAt')-wajdAdminAudienceMillis(a,'lastSeenAt'));
    const blocks = new Map();
    blocksSnapshot.forEach(item => { const data=item.data(), untilMs=data.until && data.until.toMillis ? data.until.toMillis() : 0; blocks.set(item.id,{...data,untilMs}); });
    const readerComments = new Map(); ownerCommentDocs.forEach(item => { const id=wajdAdminOwnerFromRef(item); readerComments.set(id,(readerComments.get(id)||0)+1); });
    const readerHistoryItems = new Map(), readerCompleted = new Map();
    history.forEach(item => {
      const id = wajdAdminOwnerFromRef(item);
      if (!id) return;
      if (!readerHistoryItems.has(id)) readerHistoryItems.set(id,[]);
      const entry = { id:item.id, data:item.data(), ref:item.ref };
      readerHistoryItems.get(id).push(entry);
      if (entry.data.completed === true) readerCompleted.set(id,(readerCompleted.get(id)||0)+1);
    });
    readerHistoryItems.forEach(items => items.sort((a,b) => wajdAdminTimestamp(b.data,'updatedAt')-wajdAdminTimestamp(a.data,'updatedAt')));
    const now=Date.now();
    const activeSince = now - 30 * 86400000;
    const anonymousVisitors = audience.filter(item => item.readerType === 'anonymous').length;
    const registeredAudience = registeredGoogleIds.size;
    const activeAnonymousVisitors = audience.filter(item => item.readerType === 'anonymous' && Math.max(wajdAdminAudienceMillis(item,'lastActiveAt'),wajdAdminAudienceMillis(item,'lastSeenAt')) > activeSince).length;
    const activeReaders = audience.filter(item => item.readerType === 'registered' && Math.max(wajdAdminAudienceMillis(item,'lastActiveAt'),wajdAdminAudienceMillis(item,'lastSeenAt')) > activeSince).length;
    const totalAudienceActiveSeconds = audience.reduce((sum,item) => sum + Math.max(0,Number(item.analytics && item.analytics.totalActiveSeconds)||0),0);
    const audienceSessionCount = audience.reduce((sum,item) => sum + Math.max(0,Number(item.analytics && item.analytics.sessionCount)||0),0);
    const onlineAudience = audience.filter(wajdAdminAudienceOnline).length;
    wajdAdminData = {
      articles,likes,views,saves,history,comments,owners,profiles,profilesById,blocks,postsById,articleMeta,commentMeta,
      likeMap,viewMap,saveMap,returnMap,commentMap,totalLikes,totalViews,returnVisits,
      audience,audienceById,audienceSessions,audienceSessionsByUser,audienceAnalyticsById,legacyAnonymousById,recoveryByUser,readerHistoryItems,readerCompleted,
      anonymousVisitors,registeredAudience,activeAnonymousVisitors,activeReaders,
      totalAudienceActiveSeconds,audienceSessionCount,averageAudienceSessionSeconds:audienceSessionCount ? totalAudienceActiveSeconds/audienceSessionCount : 0,onlineAudience,
      activeBlocks:Array.from(blocks.values()).filter(item => item.untilMs > now).length,
      readerViews:wajdAdminCountByDocumentId(views),readerLikes:wajdAdminCountByDocumentId(likes),readerSaves:wajdAdminCountByOwner(saves),readerComments,
      audienceSessionsLimited:false,
      audienceSessionsIndexFallback:Boolean(audienceSessionsSnapshot.indexFallback),
      loadWarnings:interactionData.failures.concat(audienceSessionsSnapshot.indexUnavailable ? [{label:'audience-sessions',error:'index-unavailable'}] : [])
    };
    wajdAdminRenderView();
  } catch (error) {
    console.error('Wajd admin center:',error);
    const code = error && error.code ? String(error.code).replace('firestore/','') : '';
    wajdAdminContent.innerHTML = '<div class="wajd-admin-state">تعذّر تحميل البيانات الأساسية للوحة الإدارة' + (code ? ' (' + wajdAdminEscape(code) + ')' : '') + '. تأكد من نشر قواعد v73 ثم حاول مرة أخرى.</div>';
  } finally { wajdAdminRefresh.disabled=false; }
}

async function wajdAdminSetCommentStatus(scopeId,commentId,status) {
  await setDoc(doc(wajdSavedDb,'articles',scopeId,'comments',commentId),{moderationStatus:status},{merge:true});
  const item=wajdAdminData.comments.find(comment => comment.id===commentId && comment.scopeId===scopeId);
  if (item) item.data.moderationStatus=status;
  wajdAdminRenderView();
  wajdSavedShowToast(status === 'hidden' ? 'تم إخفاء التعليق' : 'أُعيد إظهار التعليق',false);
}

async function wajdAdminDeleteComment(scopeId,commentId) {
  if (!window.confirm('سيُحذف التعليق نهائيًا ولا يمكن استعادته. هل تريد المتابعة؟')) return;
  const batch=writeBatch(wajdSavedDb);
  batch.delete(doc(wajdSavedDb,'articles',scopeId,'comments',commentId));
  const owner=wajdAdminData.owners.get(commentId);
  if (owner) batch.delete(doc(wajdSavedDb,'users',owner,'comments',commentId));
  await batch.commit();
  wajdAdminData.comments=wajdAdminData.comments.filter(item => item.id!==commentId);
  wajdAdminData.owners.delete(commentId);
  wajdAdminRenderView();
  wajdSavedShowToast('تم حذف التعليق نهائيًا',true);
}

async function wajdAdminBlockReader(userId,days) {
  const until=new Date(Date.now()+Math.max(1,Number(days)||7)*86400000);
  await setDoc(doc(wajdSavedDb,'moderationBlocks',userId),{until,reason:'إدارة التعليقات',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  wajdAdminData.blocks.set(userId,{until,untilMs:until.getTime(),reason:'إدارة التعليقات'});
  wajdAdminData.activeBlocks=Array.from(wajdAdminData.blocks.values()).filter(item => item.untilMs>Date.now()).length;
  wajdAdminRenderView();
  wajdSavedShowToast('تم منع القارئ من إضافة تعليقات جديدة',false);
}

async function wajdAdminUnblockReader(userId) {
  await deleteDoc(doc(wajdSavedDb,'moderationBlocks',userId));
  wajdAdminData.blocks.delete(userId); wajdAdminData.activeBlocks=Array.from(wajdAdminData.blocks.values()).filter(item => item.untilMs>Date.now()).length;
  wajdAdminRenderView();
  wajdSavedShowToast('تم رفع حظر التعليق',false);
}

function wajdAdminBindContent() {
  if (!wajdAdminContent) return;
  wajdAdminContent.addEventListener('click',async event => {
    const button=event.target.closest('button'); if (!button) return;
    try {
      if (wajdAdminJourneyHandleClick(button)) return;
      if (button.dataset.adminView) { wajdAdminView=button.dataset.adminView; wajdAdminRenderView(); return; }
      if (button.dataset.adminMetric) { wajdAdminMetric=button.dataset.adminMetric; wajdAdminRenderView(); return; }
      if (button.dataset.adminRange) { wajdAdminRange=Number(button.dataset.adminRange)||30; wajdAdminRenderView(); return; }
      if (button.dataset.adminAudienceRange) { const range=Number(button.dataset.adminAudienceRange); wajdAdminAudienceRange=[7,30,90].includes(range)?range:30; wajdAdminRenderView(); const active=wajdAdminContent.querySelector('[data-admin-audience-range="'+wajdAdminAudienceRange+'"]'); if(active)active.focus({preventScroll:true}); return; }
      if (button.dataset.adminAudienceFilter) { wajdAdminAudienceFilter=button.dataset.adminAudienceFilter; wajdAdminAudienceSelected=''; wajdAdminRenderView(); return; }
      const action=button.dataset.adminAction; if (!action) return; button.disabled=true;
      if (action==='audience-detail') { wajdAdminAudienceSelected=button.dataset.readerId||''; button.disabled=false; wajdAdminRenderView(); return; }
      if (action==='audience-back') { wajdAdminAudienceSelected=''; button.disabled=false; wajdAdminRenderView(); return; }
      if (action==='hide-comment' || action==='show-comment') await wajdAdminSetCommentStatus(button.dataset.commentScope,button.dataset.commentId,action==='hide-comment'?'hidden':'visible');
      else if (action==='delete-comment') await wajdAdminDeleteComment(button.dataset.commentScope,button.dataset.commentId);
      else if (action==='unblock-reader') await wajdAdminUnblockReader(button.dataset.readerId);
      else if (action==='block-reader') { const select=button.parentElement.querySelector('.wajd-admin-block-duration'); await wajdAdminBlockReader(button.dataset.readerId,button.dataset.blockDays || (select && select.value) || 7); }
    } catch (error) { console.error('Wajd admin action:',error); button.disabled=false; wajdSavedShowToast('تعذّر تنفيذ الإجراء الآن',true); }
  });
  wajdAdminContent.addEventListener('input',event => {
    if(event.target.dataset.journeySearch){wajdJourneyAdmin.search=event.target.value;const position=event.target.selectionStart;wajdAdminJourneyRepaint();const input=wajdAdminContent.querySelector('[data-journey-search]');if(input){input.focus({preventScroll:true});input.setSelectionRange(position,position);}return;}
    if (event.target.dataset.adminInput==='comment-search') { wajdAdminCommentSearch=event.target.value; const position=event.target.selectionStart; wajdAdminRenderView(); const input=wajdAdminContent.querySelector('[data-admin-input="comment-search"]'); if(input){input.focus();input.setSelectionRange(position,position);} }
    if (event.target.dataset.adminInput==='reader-search') { wajdAdminReaderSearch=event.target.value; const position=event.target.selectionStart; wajdAdminRenderView(); const input=wajdAdminContent.querySelector('[data-admin-input="reader-search"]'); if(input){input.focus();input.setSelectionRange(position,position);} }
  });
  wajdAdminContent.addEventListener('change',event => { if(wajdAdminJourneyHandleFilter(event.target))return;if(event.target.dataset.adminInput==='comment-filter'){wajdAdminCommentFilter=event.target.value;wajdAdminRenderView();} });
}

/* ===================== إدارة مسارات القراءة ===================== */
const PB = window.wajdPathsAdminBridge || null;
const {
  wajdPathsEscape, wajdPathsArabic, wajdPathsPermalink, wajdPathsNormalize, wajdPathsDepth, wajdPathsSorted,
  wajdPathsWritePublicCache, wajdPathsScheduleRender, wajdPathsNeed, wajdPathsMood, wajdPathsCopyText,
  wajdPathsAudience, wajdPathsAnalyticsRank, wajdPathsAnalyticsMillis, wajdPathsSyncCurrentTitles, wajdPathsLoadPosts
} = PB ? PB.fn : {};
let wajdPathsDb, wajdPathsAuth;
let wajdPathsAdmin=[],wajdPathsSelected='',wajdPathsPickerSearch='',wajdPathsDragIndex=-1,wajdPathsAnalyticsRange=30,wajdPathsAnalyticsData=null;
async function wajdPathsInitialize(){if(!PB)throw new Error('paths-bridge-missing');await PB.initialize();wajdPathsDb=PB.db();wajdPathsAuth=PB.auth();}
async function wajdPathsAdminLoad(){
  await wajdPathsInitialize();
  const user=window.wajdFirebaseUserPromise?await window.wajdFirebaseUserPromise:wajdPathsAuth.currentUser;
  if(!user||!wajdIsAdmin(user))throw new Error('admin-only');
  // v119: the published paths are defined in reading-paths.js (wajdPathsDefaults), not Firestore.
  wajdPathsAdmin=wajdPathsSorted(wajdPathsSyncCurrentTitles(PB.defaults.map(path=>({...path}))));
  if(!wajdPathsSelected||!wajdPathsAdmin.some(item=>item.id===wajdPathsSelected))wajdPathsSelected=wajdPathsAdmin[0]&&wajdPathsAdmin[0].id||'';
  await wajdPathsLoadPosts();
}
function wajdPathsAdminCurrent(){return wajdPathsAdmin.find(item=>item.id===wajdPathsSelected);}
function wajdPathsAdminHtml(){const path=wajdPathsAdminCurrent();const assigned=new Set(wajdPathsAdmin.flatMap(item=>(item.items||[]).map(article=>wajdPathsNormalize(article.url))));const unassigned=PB.posts().filter(item=>!assigned.has(wajdPathsNormalize(item.url)));const list=wajdPathsAdmin.map(item=>'<button class="wajd-path-admin-select'+(item.id===wajdPathsSelected?' is-active':'')+'" data-path-select="'+wajdPathsEscape(item.id)+'" type="button"><strong>'+wajdPathsEscape(item.title||'مسار جديد')+'</strong><span>'+(item.status==='published'?'منشور':'مسودة')+' · '+wajdPathsArabic.format((item.items||[]).length)+' كتابة</span></button>').join('');if(!path)return '<div class="wajd-admin-state">لا توجد مسارات بعد. أنشئ المسار الأول.</div>';const needle=wajdPathsPickerSearch.trim().toLowerCase();const available=PB.posts().filter(item=>!needle||item.title.toLowerCase().includes(needle)).slice(0,30);return '<div class="wajd-path-admin-layout"><aside class="wajd-path-admin-list"><div class="wajd-path-admin-list-head"><h3>المسارات</h3><button class="wajd-admin-action is-solid" data-path-action="new" type="button">إضافة</button></div><div class="wajd-path-admin-list-items">'+list+'</div><div class="wajd-path-unassigned"><strong>'+wajdPathsArabic.format(unassigned.length)+' كتابة غير مسندة</strong><br/>تتحدث القائمة تلقائيًا عند نشر كتابة جديدة في Blogger.</div></aside><section class="wajd-path-admin-editor"><div class="wajd-path-form-grid"><div class="wajd-path-field"><label>اسم المسار</label><input data-path-field="title" value="'+wajdPathsEscape(path.title||'')+'"/></div><div class="wajd-path-field"><label>معرّف الرابط · لا تغيّره بعد المشاركة</label><input data-path-field="slug" dir="ltr" value="'+wajdPathsEscape(path.slug||path.id)+'"/></div><div class="wajd-path-field is-wide"><label>الوصف الظاهر للقارئ</label><textarea data-path-field="description">'+wajdPathsEscape(path.description||'')+'</textarea></div><div class="wajd-path-field is-wide"><label>وعد الرحلة / النتيجة</label><textarea data-path-field="promise">'+wajdPathsEscape(path.promise||'')+'</textarea></div><div class="wajd-path-field"><label>النوع</label><select data-path-field="kind"><option value="path"'+(path.kind!=='collection'?' selected="selected"':'')+'>مسار مرتب</option><option value="collection"'+(path.kind==='collection'?' selected="selected"':'')+'>مجموعة اكتشاف</option></select></div><div class="wajd-path-field"><label>الحالة</label><select data-path-field="status"><option value="draft"'+(path.status!=='published'?' selected="selected"':'')+'>مسودة</option><option value="published"'+(path.status==='published'?' selected="selected"':'')+'>منشور</option></select></div><div class="wajd-path-field"><label>الترتيب</label><input data-path-field="order" min="1" type="number" value="'+(Number(path.order)||1)+'"/></div><div class="wajd-path-field"><label>دقائق القراءة</label><input data-path-field="duration" min="0" type="number" value="'+(Number(path.duration)||0)+'"/></div><div class="wajd-path-field is-wide"><label><input data-path-field="featured" type="checkbox"'+(path.featured!==false?' checked="checked"':'')+'/> يظهر ضمن «ماذا تحتاج الآن؟» في الرئيسية</label></div></div><div class="wajd-path-admin-items">'+(path.items||[]).map((item,index)=>'<div class="wajd-path-admin-item" data-path-item-index="'+index+'" draggable="true"><span>↕</span><span class="wajd-path-admin-item-title">'+wajdPathsEscape(item.title)+'</span><span class="wajd-path-admin-item-actions"><button aria-label="لأعلى" data-path-action="up" data-index="'+index+'" type="button">↑</button><button aria-label="لأسفل" data-path-action="down" data-index="'+index+'" type="button">↓</button><button aria-label="حذف" data-path-action="remove" data-index="'+index+'" type="button">×</button></span></div>').join('')+'</div><div class="wajd-path-picker"><div class="wajd-path-field"><label>أضف كتابة</label><input data-path-picker-search="true" placeholder="ابحث بعنوان المقالة…" type="search" value="'+wajdPathsEscape(wajdPathsPickerSearch)+'"/></div><div class="wajd-path-picker-results">'+available.map(item=>'<div class="wajd-path-picker-row"><span>'+wajdPathsEscape(item.title)+'</span><button class="wajd-admin-action" data-path-action="add" data-title="'+wajdPathsEscape(item.title)+'" data-url="'+wajdPathsEscape(item.url)+'" type="button">إضافة</button></div>').join('')+'</div></div><div class="wajd-path-editor-actions"><button class="wajd-admin-action is-danger" data-path-action="delete" type="button">حذف المسار</button><button class="wajd-admin-action is-solid" data-path-action="save" type="button">حفظ التغييرات</button></div></section></div>';}
function wajdPathsAdminPaint(){
  const root=document.getElementById('wajd-paths-admin-root');if(!root)return;root.innerHTML=wajdPathsAdminHtml();const path=wajdPathsAdminCurrent(),slug=root.querySelector('[data-path-field="slug"]');if(!path||!slug)return;
  let anchor=slug.closest('.wajd-path-field'),field=document.createElement('div');field.className='wajd-path-field is-wide';field.innerHTML='<label>السؤال الذي يراه القارئ على البطاقة</label><input data-path-field="prompt" placeholder="مثال: أحتاج أن أهدأ من صخب رأسي" value="'+wajdPathsEscape(path.prompt||wajdPathsNeed(path))+'"/>';anchor.insertAdjacentElement('afterend',field);anchor=field;
  field=document.createElement('div');field.className='wajd-path-field is-wide';field.innerHTML='<label>لمن تناسب هذه الرحلة؟</label><textarea data-path-field="audience" placeholder="مثال: لمن يرهقه القلق والمقارنة واللوم…">'+wajdPathsEscape(path.audience||wajdPathsAudience(path))+'</textarea>';anchor.insertAdjacentElement('afterend',field);anchor=field;
  field=document.createElement('div');field.className='wajd-path-field';field.innerHTML='<label>عمق القراءة</label><select data-path-field="depth"><option value="خفيف"'+(wajdPathsDepth(path)==='خفيف'?' selected="selected"':'')+'>خفيف</option><option value="متوسط"'+(wajdPathsDepth(path)==='متوسط'?' selected="selected"':'')+'>متوسط</option><option value="عميق"'+(wajdPathsDepth(path)==='عميق'?' selected="selected"':'')+'>عميق</option></select>';anchor.insertAdjacentElement('afterend',field);anchor=field;
  field=document.createElement('div');field.className='wajd-path-field';field.innerHTML='<label>مزاج الرحلة</label><input data-path-field="mood" placeholder="مثال: هادئ · تأملي" value="'+wajdPathsEscape(path.mood||wajdPathsMood(path))+'"/>';anchor.insertAdjacentElement('afterend',field);anchor=field;
  field=document.createElement('div');field.className='wajd-path-field is-wide';field.innerHTML='<label>الرابط الدائم للمسار</label><div class="wajd-path-admin-permalink"><input data-path-permalink="true" dir="ltr" readonly="readonly" value="'+wajdPathsEscape(wajdPathsPermalink(path))+'"/><button data-path-action="copy-link" type="button">نسخ الرابط</button><a data-path-open-link="true" href="'+wajdPathsEscape(wajdPathsPermalink(path))+'" rel="noopener" target="_blank">فتح الصفحة</a></div>';anchor.insertAdjacentElement('afterend',field);
}
function wajdPathsAnalyticsRows(pathId){
  const rows=wajdPathsAnalyticsData&&wajdPathsAnalyticsData.byPath.get(pathId)||[];
  if(!wajdPathsAnalyticsRange)return rows;
  const cutoff=Date.now()-wajdPathsAnalyticsRange*86400000;
  return rows.filter(item=>wajdPathsAnalyticsMillis(item.lastSeenAt)>=cutoff);
}
function wajdPathsAnalyticsIsRegistered(userId){return Boolean(window.wajdAdminRegisteredGoogleIds&&window.wajdAdminRegisteredGoogleIds.has(String(userId||'')));}
function wajdPathsAnalyticsStats(path){
  const rows=wajdPathsAnalyticsRows(path.id).map(item=>({...item,readerType:wajdPathsAnalyticsIsRegistered(item.id)?'registered':'anonymous'})),started=rows.filter(item=>wajdPathsAnalyticsRank(item.status)>=1),completed=rows.filter(item=>item.status==='completed');
  const anonymous=rows.filter(item=>item.readerType==='anonymous').length,registered=rows.length-anonymous;
  const startRate=rows.length?Math.round(started.length/rows.length*100):0,completionRate=started.length?Math.round(completed.length/started.length*100):0;
  const average=started.length?Math.round(started.reduce((sum,item)=>sum+Math.min(1,(Number(item.completedCount)||0)/Math.max(1,Number(item.totalItems)||1)),0)/started.length*100):0;
  const stops=new Map();started.filter(item=>item.status!=='completed'&&Number(item.lastStep)>0).forEach(item=>{const step=Math.max(1,Math.min((path.items||[]).length,Number(item.lastStep)||1));stops.set(step,(stops.get(step)||0)+1);});
  const stop=Array.from(stops.entries()).sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0]||null;
  return{path,rows,started,completed,anonymous,registered,startRate,completionRate,average,stop};
}
function wajdPathsAnalyticsCard(stats){
  const path=stats.path,stopTitle=stats.stop&&path.items&&path.items[stats.stop[0]-1]?path.items[stats.stop[0]-1].title:'';
  return '<section class="wajd-path-analytics-card"><div class="wajd-path-analytics-card-head"><div><span>'+(path.kind==='collection'?'مجموعة اكتشاف':'مسار مرتب')+'</span><h4>'+wajdPathsEscape(path.title)+'</h4></div><b>'+wajdPathsArabic.format((path.items||[]).length)+' كتابات</b></div><div class="wajd-path-analytics-numbers"><div><strong>'+wajdPathsArabic.format(stats.rows.length)+'</strong><span>فتحوا المسار</span></div><div><strong>'+wajdPathsArabic.format(stats.started.length)+'</strong><span>بدؤوا القراءة</span></div><div><strong>'+wajdPathsArabic.format(stats.completed.length)+'</strong><span>أكملوه</span></div></div><div class="wajd-path-analytics-bars"><div><span><b>البدء بعد الفتح</b><em>'+wajdPathsArabic.format(stats.startRate)+'٪</em></span><i><b style="width:'+stats.startRate+'%"></b></i></div><div><span><b>الإكمال بعد البدء</b><em>'+wajdPathsArabic.format(stats.completionRate)+'٪</em></span><i><b style="width:'+stats.completionRate+'%"></b></i></div></div><div class="wajd-path-analytics-details"><span>متوسط الإنجاز: <b>'+wajdPathsArabic.format(stats.average)+'٪</b></span><span>مجهولون: <b>'+wajdPathsArabic.format(stats.anonymous)+'</b></span><span>Google: <b>'+wajdPathsArabic.format(stats.registered)+'</b></span></div><div class="wajd-path-analytics-stop"><small>نقطة التوقف الحالية الأكثر شيوعًا</small>'+(stats.stop?'<strong>الكتابة '+wajdPathsArabic.format(stats.stop[0])+': '+wajdPathsEscape(stopTitle)+'</strong><span>آخر موضع معروف لدى '+wajdPathsArabic.format(stats.stop[1])+' من القرّاء</span>':'<strong>لا توجد بيانات توقف كافية بعد</strong>')+'</div></section>';
}
function wajdPathsAnalyticsHtml(){
  const paths=wajdPathsAnalyticsData.paths,stats=paths.map(wajdPathsAnalyticsStats),opened=new Map(),started=new Set(),completed=new Set();let startedEntries=0,completedEntries=0;
  stats.forEach(item=>item.rows.forEach(row=>{const current=opened.get(row.id);if(!current||row.readerType==='registered')opened.set(row.id,row.readerType);if(wajdPathsAnalyticsRank(row.status)>=1){started.add(row.id);startedEntries++;}if(row.status==='completed'){completed.add(row.id);completedEntries++;}}));
  const anonymous=Array.from(opened.values()).filter(type=>type==='anonymous').length,rate=startedEntries?Math.round(completedEntries/startedEntries*100):0;
  const ranges=[[7,'٧ أيام'],[30,'٣٠ يومًا'],[0,'كل المدة']].map(item=>'<button class="'+(wajdPathsAnalyticsRange===item[0]?'is-active':'')+'" data-path-analytics-range="'+item[0]+'" type="button">'+item[1]+'</button>').join('');
  const summary=[['قارئ فتح مسارًا',opened.size],['بدأوا القراءة',started.size],['أكملوا مسارًا',completed.size],['معدل الإكمال',wajdPathsArabic.format(rate)+'٪'],['زوار مجهولون',anonymous]];
  return '<div class="wajd-path-analytics-head"><div><span>قراءة سلوك الرحلات</span><h3>تحليلات مسارات القراءة</h3><p>الفترة تختار القرّاء الذين تفاعلوا مع المسار خلالها، ثم تعرض حالتهم الحالية داخله.</p></div><div class="wajd-path-analytics-ranges">'+ranges+'</div></div><div class="wajd-path-analytics-summary">'+summary.map(item=>'<div><span>'+item[0]+'</span><strong>'+(typeof item[1]==='number'?wajdPathsArabic.format(item[1]):item[1])+'</strong></div>').join('')+'</div><div class="wajd-path-analytics-note">كل رقم فريد داخل المسار، ولا تُحفظ أسماء أو عناوين بريد. تبدأ البيانات من لحظة نشر القالب v86.'+(wajdPathsAnalyticsData.limited?' وصلت إحدى المجموعات إلى حد العرض؛ النسب التفصيلية مبنية على أحدث ٣٠٠٠ سجل.':'')+'</div><div class="wajd-path-analytics-grid">'+stats.map(wajdPathsAnalyticsCard).join('')+'</div>';
}
function wajdPathsAnalyticsPaint(){const root=document.getElementById('wajd-paths-analytics-root');if(root&&wajdPathsAnalyticsData)root.innerHTML=wajdPathsAnalyticsHtml();}
async function wajdPathsAnalyticsLoad(){
  await wajdPathsAdminLoad();
  const paths=wajdPathsAdmin.filter(path=>path.status==='published'),results=await Promise.all(paths.map(async path=>{const snapshot=await getDocs(query(collection(wajdPathsDb,'readingPathAnalytics',path.id,'participants'),orderBy('lastSeenAt','desc'),limit(3001)));return[path.id,snapshot.docs.slice(0,3000).map(item=>({id:item.id,...item.data()})),snapshot.size>3000];}));
  wajdPathsAnalyticsData={paths,byPath:new Map(results.map(item=>[item[0],item[1]])),limited:results.some(item=>item[2])};
}
window.wajdReadingPathsAnalyticsRender=async function(){const root=document.getElementById('wajd-paths-analytics-root');if(!root)return;root.innerHTML='<div class="wajd-admin-state">جارٍ تحليل فتح المسارات والتقدم داخلها…</div>';try{await wajdPathsAnalyticsLoad();wajdPathsAnalyticsPaint();}catch(error){console.error('Wajd path analytics admin:',error);root.innerHTML='<div class="wajd-admin-state">تعذّر تحميل تحليلات المسارات. انشر قواعد Firestore v73 أولًا ثم اضغط «تحديث».</div>';}};
window.wajdReadingPathsAdminRender=async function(){const root=document.getElementById('wajd-paths-admin-root');if(!root)return;try{await wajdPathsAdminLoad();}catch(error){root.innerHTML='<div class="wajd-admin-state">تعذّر تحميل المسارات.</div>';return;}
  /* v119: read-only. Paths are edited in reading-paths.js (ask Claude), so the old Firestore editor is retired. */
  const e=wajdPathsEscape,n=value=>wajdPathsArabic.format(value);
  root.innerHTML='<div class="wajd-admin-state" style="text-align:right;line-height:1.9">المسارات أصبحت محفوظة في الكود (ملف reading-paths.js)، والتعديل من هنا متوقف. لإضافة مقالة أو تعديل مسار اطلب ذلك من Claude.</div>'+wajdPathsAdmin.map(path=>'<section class="wajd-admin-panel" style="margin-top:14px"><h3 style="margin:0 0 6px">'+e(path.title)+' <small style="font-weight:400">· '+n((path.items||[]).length)+' في الرحلة · '+n((path.extras||[]).length)+' إضافية</small></h3><ol style="margin:0 0 8px;padding-inline-start:22px">'+(path.items||[]).map(item=>'<li><a href="'+e(item.url)+'" target="_blank" rel="noopener">'+e(item.title)+'</a></li>').join('')+'</ol>'+((path.extras||[]).length?'<p style="margin:0;font-size:13px">إضافية: '+path.extras.map(item=>'<a href="'+e(item.url)+'" target="_blank" rel="noopener">'+e(item.title)+'</a>').join(' · ')+'</p>':'')+'</section>').join('');};
window.wajdReadingPathsAdminRenderLegacy=async function(){const root=document.getElementById('wajd-paths-admin-root');if(!root)return;root.innerHTML='<div class="wajd-admin-state">جارٍ تحميل المسودة والمسارات…</div>';try{await wajdPathsAdminLoad();wajdPathsAdminPaint();}catch(error){console.error('Wajd paths admin:',error);root.innerHTML='<div class="wajd-admin-state">تعذّر تحميل المسارات. انشر قواعد Firestore v73 أولًا ثم اضغط «تحديث».</div>';}};
async function wajdPathsAdminSave(path){const slug=String(path.slug||path.id).trim().slice(0,120);if(!/^[\p{L}\p{N}][\p{L}\p{N}_-]{0,119}$/u.test(slug))throw new Error('invalid-path-slug');if(wajdPathsAdmin.some(item=>item.id!==path.id&&String(item.slug||item.id).trim().toLowerCase()===slug.toLowerCase()))throw new Error('duplicate-path-slug');path.slug=slug;const data={title:String(path.title||'').slice(0,120),slug,prompt:String(path.prompt||wajdPathsNeed(path)).slice(0,180),audience:String(path.audience||wajdPathsAudience(path)).slice(0,400),depth:['خفيف','متوسط','عميق'].includes(path.depth)?path.depth:wajdPathsDepth(path),mood:String(path.mood||wajdPathsMood(path)).slice(0,80),description:String(path.description||'').slice(0,600),promise:String(path.promise||'').slice(0,600),kind:path.kind==='collection'?'collection':'path',status:path.status==='published'?'published':'draft',featured:path.featured!==false,order:Math.max(1,Number(path.order)||1),duration:Math.max(0,Number(path.duration)||0),items:(path.items||[]).slice(0,100).map(item=>({title:String(item.title||'').slice(0,250),url:String(item.url||'').slice(0,1500)})),updatedAt:serverTimestamp()};await setDoc(doc(wajdPathsDb,'readingPaths',path.id),data,{merge:true});}
async function wajdPathsAdminDelete(pathId){const participants=await getDocs(collection(wajdPathsDb,'readingPathAnalytics',pathId,'participants'));for(let offset=0;offset<participants.docs.length;offset+=200){const batch=writeBatch(wajdPathsDb);participants.docs.slice(offset,offset+200).forEach(item=>{batch.delete(item.ref);batch.delete(doc(wajdPathsDb,'users',item.id,'pathAnalytics',pathId));});await batch.commit();}await deleteDoc(doc(wajdPathsDb,'readingPaths',pathId));}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-path-select],[data-path-action]');if(!button)return;if(button.dataset.pathSelect){wajdPathsSelected=button.dataset.pathSelect;wajdPathsAdminPaint();return;}const path=wajdPathsAdminCurrent(),action=button.dataset.pathAction;
  if(action==='new'){const id='path-'+Date.now();wajdPathsAdmin.push({id,title:'مسار جديد',slug:id,prompt:'',audience:'',depth:'متوسط',mood:'هادئ · متدرج',description:'',promise:'',kind:'path',status:'draft',featured:false,order:wajdPathsAdmin.length+1,duration:0,items:[]});wajdPathsSelected=id;wajdPathsAdminPaint();return;}
  if(!path)return;
  if(action==='copy-link'){const original=button.textContent;try{await wajdPathsCopyText(wajdPathsPermalink(path));button.textContent='نُسخ ✓';}catch(error){button.textContent='تعذّر النسخ';}setTimeout(()=>{button.textContent=original;},1600);return;}
  const index=Number(button.dataset.index);if(action==='add'){if(!(path.items||[]).some(item=>wajdPathsNormalize(item.url)===wajdPathsNormalize(button.dataset.url)))path.items.push({title:button.dataset.title,url:button.dataset.url});wajdPathsAdminPaint();}else if(action==='remove'){path.items.splice(index,1);wajdPathsAdminPaint();}else if(action==='up'&&index>0){[path.items[index-1],path.items[index]]=[path.items[index],path.items[index-1]];wajdPathsAdminPaint();}else if(action==='down'&&index<path.items.length-1){[path.items[index+1],path.items[index]]=[path.items[index],path.items[index+1]];wajdPathsAdminPaint();}else if(action==='save'){button.disabled=true;try{await wajdPathsAdminSave(path);PB.setPublic(wajdPathsSorted(wajdPathsAdmin.filter(item=>item.status==='published')));wajdPathsWritePublicCache(PB.getPublic());wajdPathsScheduleRender();button.textContent='تم الحفظ ✓';}catch(error){console.error('Wajd path save:',error);button.disabled=false;button.textContent=error&&error.message==='duplicate-path-slug'?'المعرّف مستخدم':error&&error.message==='invalid-path-slug'?'معرّف غير صالح':'تعذّر الحفظ';}}else if(action==='delete'){if(!confirm('حذف هذا المسار وبيانات تقدمه نهائيًا؟'))return;button.disabled=true;try{await wajdPathsAdminDelete(path.id);wajdPathsAdmin=wajdPathsAdmin.filter(item=>item.id!==path.id);wajdPathsSelected=wajdPathsAdmin[0]&&wajdPathsAdmin[0].id||'';PB.setPublic(wajdPathsSorted(wajdPathsAdmin.filter(item=>item.status==='published')));wajdPathsWritePublicCache(PB.getPublic());wajdPathsScheduleRender();wajdPathsAdminPaint();}catch(error){console.error('Wajd path delete:',error);button.disabled=false;button.textContent='تعذّر الحذف';}}
});
document.addEventListener('click',event=>{const button=event.target.closest('[data-path-analytics-range]');if(!button)return;wajdPathsAnalyticsRange=Number(button.dataset.pathAnalyticsRange);wajdPathsAnalyticsPaint();});
document.addEventListener('input',event=>{const path=wajdPathsAdminCurrent();if(!path)return;if(event.target.dataset.pathField){const field=event.target.dataset.pathField;path[field]=event.target.type==='checkbox'?event.target.checked:(event.target.type==='number'?Number(event.target.value):event.target.value);if(field==='slug'){const value=wajdPathsPermalink(path),input=document.querySelector('[data-path-permalink]'),link=document.querySelector('[data-path-open-link]');if(input)input.value=value;if(link)link.href=value;}}if(event.target.dataset.pathPickerSearch){wajdPathsPickerSearch=event.target.value;const position=event.target.selectionStart;wajdPathsAdminPaint();const input=document.querySelector('[data-path-picker-search]');if(input){input.focus();input.setSelectionRange(position,position);}}});
document.addEventListener('dragstart',event=>{const row=event.target.closest('[data-path-item-index]');if(!row)return;wajdPathsDragIndex=Number(row.dataset.pathItemIndex);row.classList.add('is-dragging');});document.addEventListener('dragend',event=>{const row=event.target.closest('[data-path-item-index]');if(row)row.classList.remove('is-dragging');});document.addEventListener('dragover',event=>{if(event.target.closest('[data-path-item-index]'))event.preventDefault();});document.addEventListener('drop',event=>{const row=event.target.closest('[data-path-item-index]'),path=wajdPathsAdminCurrent();if(!row||!path||wajdPathsDragIndex<0)return;event.preventDefault();const target=Number(row.dataset.pathItemIndex),item=path.items.splice(wajdPathsDragIndex,1)[0];path.items.splice(target,0,item);wajdPathsDragIndex=-1;wajdPathsAdminPaint();});

wajdAdminBindContent();

export default Object.freeze({ load: wajdAdminLoad });
