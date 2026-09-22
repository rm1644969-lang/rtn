
// ─── FIREBASE ───────────────────────────────────────────
firebase.initializeApp({
  apiKey:"AIzaSyC4ExRu3Oze8api5-ueDTBqZOceSa8wclo",
  authDomain:"ratanweab.firebaseapp.com",
  databaseURL:"https://ratanweab-default-rtdb.firebaseio.com",
  projectId:"ratanweab",
  storageBucket:"ratanweab.firebasestorage.app",
  messagingSenderId:"611953936063",
  appId:"1:611953936063:web:52153dcf9af5eb17b2a80a"
});
const db=firebase.database();
// Network-safe Firebase helpers: prevent the splash screen from hanging forever.
const FB_TIMEOUT=7000;
const withTimeout=(promise,ms=FB_TIMEOUT,label='Firebase request')=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' timed out')),ms))]);
const fbGet=p=>withTimeout(db.ref(p).once('value').then(s=>s.val()));
const fbSet=(p,d)=>withTimeout(db.ref(p).set(d));
const fbUpd=(p,d)=>withTimeout(db.ref(p).update(d));
const fbPush=(p,d)=>withTimeout((()=>{const r=db.ref(p);return r.set({...d,id:r.key}).then(()=>r.key);})());
const fbDel=p=>withTimeout(db.ref(p).remove());

// ─── DEFAULTS ────────────────────────────────────────────
const DEF={
  siteName:'EarnifyBD',siteLogo:'💰',siteTagline:'Task করো · Refer করো · টাকা কামাও',
  siteDesc:'EarnifyBD — Task করো, Refer করো, টাকা কামাও',
  siteTitle:'EarnifyBD',siteUrl:'',
  bkash:'01712-345678',nagad:'01812-345678',
  activationAmount:100,minWithdraw:100,maxWithdraw:25000,
  minDeposit:100,maxDeposit:10000,
  adminPassword:'admin123',appsLink:'https://bucket.appilix.com/app-apk-2d3c94f5dea642e69e0c89ee5c5bc4f9-1789889458.apk',
  themePrimary:'#14693f',themeSecondary:'#1e8f57',themeMode:'green',animationEnabled:true,vipAnimationEnabled:true,maintenanceMode:false,maintenanceText:'সার্ভার আপডেট চলছে, কিছুক্ষণ পর চেষ্টা করুন',marketApiEnabled:false,marketApiUrl:'',marketApiSymbol:'GBPNZD',marketApiAuth:'bearer',marketApiHeader:'Authorization',marketApiQuery:'apikey',marketApiInterval:5000,geminiModel:'gemini-3.8-flash',geminiInterval:5000,geminiModes:'30s,1m,3m,5m',
  referGens:[300,250,200,250,100,100,100,100],
  vipLevels:[
    {level:0,name:'VIP 0',minRefers:0,bonus:0},
    {level:1,name:'VIP 1',minRefers:5,bonus:100},
    {level:2,name:'VIP 2',minRefers:10,bonus:200},
    {level:3,name:'VIP 3',minRefers:20,bonus:350},
    {level:4,name:'VIP 4',minRefers:35,bonus:500},
    {level:5,name:'VIP 5',minRefers:50,bonus:750},
    {level:6,name:'VIP 6',minRefers:75,bonus:1000},
    {level:7,name:'VIP 7',minRefers:100,bonus:1500},
    {level:8,name:'VIP 8',minRefers:150,bonus:2200},
    {level:9,name:'VIP 9',minRefers:200,bonus:3000},
    {level:10,name:'VIP 10',minRefers:300,bonus:4500},
    {level:11,name:'VIP 11',minRefers:500,bonus:7000},
    {level:12,name:'VIP 12',minRefers:800,bonus:10000}
  ]
};
const PLAT_ICO={Facebook:'📘',YouTube:'📺',Instagram:'📸',TikTok:'🎵',Other:'🌐'};
const TLBL={deposit:'Deposit',activation:'Activation Deposit',withdraw:'Withdraw',task_earning:'Task Earning',refer_bonus:'Refer Bonus',vip_bonus:'VIP Bonus',admin_add:'Admin Bonus',checkin:'Daily Check-in',account_close:'Account Close',plan_buy:'Plan Purchase',plan_daily:'Plan Daily Bonus',plan_commission:'Plan Commission'};
const HICO={deposit:'⬇️',activation:'🔑',withdraw:'⬆️',task_earning:'📋',refer_bonus:'🔗',vip_bonus:'⭐',admin_add:'🎁',checkin:'☀️',account_close:'🔒'};

let _cfg=null;
async function getCfg(){
  if(!_cfg){
    try{_cfg=await fbGet('config/settings');}catch(e){console.warn('Firebase config read skipped:',e.message);_cfg=null;}
    if(!_cfg){_cfg=DEF;}
  }
  const merged={...DEF,..._cfg};
  if(Number(merged.activationAmount)===1000) merged.activationAmount=100;
  // Force VIP 0-12 even if old Firebase settings still have only VIP 0-4
  merged.referGens=Array.from({length:8},(_,i)=>((_cfg.referGens&&_cfg.referGens[i]!=null)?_cfg.referGens[i]:DEF.referGens[i]));
  merged.vipLevels=Array.from({length:13},(_,i)=>{
    const oldVip=(_cfg.vipLevels||[]).find(v=>Number(v.level)===i)||(_cfg.vipLevels||[])[i]||{};
    const defVip=DEF.vipLevels[i];
    return {level:i,name:oldVip.name||defVip.name,minRefers:Number(oldVip.minRefers ?? defVip.minRefers)||0,bonus:Number(oldVip.bonus ?? defVip.bonus)||0};
  });
  return merged;
}
async function reloadCfg(){_cfg=null;return getCfg();}


// Remove unwanted old Max Win notice/notification from Firebase when rules allow it.
function isBlockedNotice(n){
  const txt=((n&&n.title)||'')+' '+((n&&n.body)||'')+' '+((n&&n.msg)||'');
  const clean=txt.replace(/\s+/g,' ').trim().toLowerCase();
  if(!clean)return false;
  if(clean.includes('max win')||clean.includes('platform name max win')||clean.includes('max win-vip'))return true;
  if(/^[.\s]+$/.test(txt))return true;
  return false;
}
async function cleanupBlockedNotices(){
  try{
    const [notices,notifications]=await Promise.all([fbGet('notices'),fbGet('notifications')]);
    Object.entries(notices||{}).forEach(([k,n])=>{if(isBlockedNotice(n))fbDel('notices/'+k).catch(()=>{});});
    Object.entries(notifications||{}).forEach(([k,n])=>{if(isBlockedNotice(n))fbDel('notifications/'+k).catch(()=>{});});
  }catch(e){console.warn('Notice cleanup skipped:',e&&e.message?e.message:e);}
}

// ─── SESSION ─────────────────────────────────────────────
const SK='eb_adm_s2';
function isAuth(){return localStorage.getItem(SK)==='ok';}
function setAuth(){localStorage.setItem(SK,'ok');}
function clrAuth(){localStorage.removeItem(SK);}

// ─── UTILS ───────────────────────────────────────────────
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function fmtN(n){return '৳ '+Number(n||0).toLocaleString();}
function fmtD(ts){return new Date(ts).toLocaleString('en-BD',{day:'2-digit',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'});}

let _sT;
function snack(m){const e=document.getElementById('snack');e.textContent=m;e.classList.add('show');clearTimeout(_sT);_sT=setTimeout(()=>e.classList.remove('show'),3200);}
function ldr(show){document.getElementById('loader').classList.toggle('h',!show);}
function showImg(src){document.getElementById('lb-img').src=src;document.getElementById('lb').classList.add('active');}
function setBadge(id,n){const e=document.getElementById(id);if(!e)return;e.textContent=n;e.style.display=n>0?'inline-block':'none';}

// ─── NAVIGATION ──────────────────────────────────────────
let _offs=[];
function offAll(){_offs.forEach(f=>f());_offs=[];}
function onDB(path,cb){const ref=db.ref(path);ref.on('value',s=>cb(s.val()));_offs.push(()=>ref.off('value'));}

function go(name){
  offAll();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('s-login').style.display='none';
  const el=document.getElementById('s-'+name);
  if(el){el.classList.add('active');window.scrollTo(0,0);}
  const fn={'admin-dash':renderDash,users:renderUsers,deposits:renderDeposits,
    withdrawals:renderWithdrawals,proofs:renderProofs,tasks:renderTasks,settings:renderSettings,
    'plans-admin':renderPlansAdmin,'games-admin':renderMiniGamesAdmin,
    'bulk-bonus':renderBulkBonus,'monthly-report':renderMonthlyReport,'wingo-admin':renderWingoAdmin,
    'live-chat':renderLiveChat,'chat-detail':()=>{}};
  if(fn[name]) fn[name]();
}
function showLogin(){
  offAll();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('s-login').style.display='flex';
}

// ─── AUTH ────────────────────────────────────────────────
async function doAdminLogin(){
  if(!rateCheck())return;
  const pw=document.getElementById('adm-pw').value;
  if(!pw){snack('Password দিন');return;}
  const cfg=await getCfg();
  if(_loginRole==='admin'){
    if(pw!==cfg.adminPassword){snack('❌ ভুল Admin Password');return;}
    setRole('admin');setAuth();RATE.attempts=0;go('admin-dash');
  } else {
    if(!cfg.subAdminPassword){snack('Sub-Admin disabled');return;}
    if(pw!==cfg.subAdminPassword){snack('❌ ভুল Sub-Admin Password');return;}
    setRole('sub');setAuth();RATE.attempts=0;go('admin-dash');
  }
}
function doLogout(){clrAuth();showLogin();}

// ─── DASH ────────────────────────────────────────────────
async function renderDash(){
  await cleanupBlockedNotices();
  const cfg=await getCfg();
  document.getElementById('adm-hdr-title').textContent=cfg.siteName+' Admin';
  const [users,txns,subs]=await Promise.all([fbGet('users'),fbGet('txns'),fbGet('subs')]);
  const uA=Object.values(users||{}),tA=Object.values(txns||{}),sA=Object.values(subs||{});
  const pD=tA.filter(t=>['activation','deposit','account_close'].includes(t.type)&&t.status==='pending');
  const pW=tA.filter(t=>t.type==='withdraw'&&t.status==='pending');
  const pP=sA.filter(s=>s.status==='pending');
  // Today stats
  const todayStr=new Date().toISOString().slice(0,10);
  const todayDep=tA.filter(t=>t.status==='approved'&&['deposit','activation'].includes(t.type)&&new Date(t.createdAt).toISOString().slice(0,10)===todayStr).reduce((s,t)=>s+t.amount,0);
  const todayWd=tA.filter(t=>t.status==='approved'&&t.type==='withdraw'&&new Date(t.createdAt).toISOString().slice(0,10)===todayStr).reduce((s,t)=>s+t.amount,0);
  const totalDep=tA.filter(t=>t.status==='approved'&&['deposit','activation'].includes(t.type)).reduce((s,t)=>s+t.amount,0);
  const totalWd=tA.filter(t=>t.status==='approved'&&t.type==='withdraw').reduce((s,t)=>s+t.amount,0);
  document.getElementById('adm-stats').innerHTML=
    `<div class="adm-stat"><div class="adm-stat-num">${uA.length}</div><div class="adm-stat-lbl">Total Users</div></div>
     <div class="adm-stat"><div class="adm-stat-num">${uA.filter(u=>u.isActive&&!u.closed).length}</div><div class="adm-stat-lbl">Active</div></div>
     <div class="adm-stat"><div class="adm-stat-num">${pD.length+pW.length}</div><div class="adm-stat-lbl">Pending Txn</div></div>
     <div class="adm-stat"><div class="adm-stat-num">${pP.length}</div><div class="adm-stat-lbl">Proofs</div></div>`;
  // Summary cards
  const sc=document.getElementById('adm-summary');
  if(sc) sc.innerHTML=`
    <div class="grid2">
      <div class="stat-card"><div class="stat-num" style="color:var(--g);font-size:18px">${fmtN(todayDep)}</div><div class="stat-lbl">Today Deposit ⬇️</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--red);font-size:18px">${fmtN(todayWd)}</div><div class="stat-lbl">Today Withdraw ⬆️</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--g);font-size:18px">${fmtN(totalDep)}</div><div class="stat-lbl">Total Deposited 💰</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--red);font-size:18px">${fmtN(totalWd)}</div><div class="stat-lbl">Total Withdrawn 💸</div></div>
    </div>`;
  // Analytics chart (last 7 days)
  drawAnalyticsChart(tA);
  setBadge('d-cnt',pD.length);setBadge('w-cnt',pW.length);setBadge('p-cnt',pP.length);
  // Sub-admin restrictions
  const isSub=isSubAdmin();
  const rb=document.getElementById('role-badge-wrap');
  if(rb) rb.style.display=isSub?'block':'none';
  // Hide certain menus for sub-admin
  ['menu-wingo'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display=isSub?'none':'flex';
  });
  // Disable users/deposits/withdrawals/settings for sub-admin
  document.querySelectorAll('.adm-menu').forEach(m=>{
    const ttl=m.querySelector('.adm-menu-ttl');
    if(!ttl)return;
    const txt=ttl.textContent;
    if(isSub&&(txt.includes('Deposit')||txt.includes('Withdrawal')||txt.includes('Settings')||txt.includes('Users'))){
      m.style.opacity='0.4';
      m.onclick=()=>snack('⛔ Sub-Admin এর এই section এ access নেই');
    }
  });
  onDB('txns',all=>{
    const a=Object.values(all||{});
    setBadge('d-cnt',a.filter(t=>['activation','deposit','account_close'].includes(t.type)&&t.status==='pending').length);
    setBadge('w-cnt',a.filter(t=>t.type==='withdraw'&&t.status==='pending').length);
  });
  onDB('subs',all=>setBadge('p-cnt',Object.values(all||{}).filter(s=>s.status==='pending').length));
}

function drawAnalyticsChart(tA){
  const el=document.getElementById('adm-chart');if(!el)return;
  const days=7;const labels=[];const deps=[];const wds=[];
  for(let i=days-1;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    labels.push(d.toLocaleDateString('en-BD',{month:'short',day:'numeric'}));
    deps.push(tA.filter(t=>t.status==='approved'&&['deposit','activation'].includes(t.type)&&new Date(t.createdAt).toISOString().slice(0,10)===ds).reduce((s,t)=>s+t.amount,0));
    wds.push(tA.filter(t=>t.status==='approved'&&t.type==='withdraw'&&new Date(t.createdAt).toISOString().slice(0,10)===ds).reduce((s,t)=>s+t.amount,0));
  }
  const maxV=Math.max(...deps,...wds,1);
  const W=el.clientWidth||340,H=160,pad=36,bW=Math.floor((W-pad*2)/(days*2+days-1)),gap=Math.floor(bW/2);
  let svg=`<svg viewBox="0 0 ${W} ${H+30}" xmlns="http://www.w3.org/2000/svg" style="width:100%;overflow:visible">`;
  // Grid lines
  for(let g=0;g<=4;g++){const y=pad+(H-pad)*(1-g/4);svg+=`<line x1="${pad}" y1="${y}" x2="${W-8}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;svg+=`<text x="${pad-4}" y="${y+4}" text-anchor="end" font-size="9" fill="#94a3b8">${fmtN(maxV*g/4).replace('৳ ','')}</text>`;}
  // Bars
  for(let i=0;i<days;i++){
    const x=pad+i*(bW*2+gap+4);
    const dh=Math.max(2,Math.round(((H-pad))*deps[i]/maxV));
    const wh=Math.max(2,Math.round(((H-pad))*wds[i]/maxV));
    svg+=`<rect x="${x}" y="${H-dh}" width="${bW}" height="${dh}" fill="#14693f" rx="3" opacity=".85"/>`;
    svg+=`<rect x="${x+bW+2}" y="${H-wh}" width="${bW}" height="${wh}" fill="#c0392b" rx="3" opacity=".75"/>`;
    svg+=`<text x="${x+bW}" y="${H+16}" text-anchor="middle" font-size="9" fill="#64748b">${labels[i]}</text>`;
  }
  // Legend
  svg+=`<rect x="${pad}" y="${H+22}" width="10" height="10" fill="#14693f" rx="2"/><text x="${pad+14}" y="${H+31}" font-size="10" fill="#64748b">Deposit</text>`;
  svg+=`<rect x="${pad+70}" y="${H+22}" width="10" height="10" fill="#c0392b" rx="2"/><text x="${pad+84}" y="${H+31}" font-size="10" fill="#64748b">Withdraw</text>`;
  svg+='</svg>';
  el.innerHTML=svg;
}

// ─── USERS ───────────────────────────────────────────────
let _uCache=[];
async function renderUsers(){
  ldr(true);_uCache=Object.values(await fbGet('users')||{});ldr(false);drawUsers();
}
let _uFilter='all';
function setUFilter(f,el){
  _uFilter=f;
  document.querySelectorAll('[onclick^="setUFilter"]').forEach(b=>{b.className=b.className.replace('btn-g','btn-gray');});
  if(el) el.className=el.className.replace('btn-gray','btn-g');
  drawUsers();
}
function drawUsers(){
  const q=(document.getElementById('u-srch').value||'').toLowerCase();
  let list=_uCache.filter(u=>!q||(u.name||'').toLowerCase().includes(q)||u.phone.includes(q)).sort((a,b)=>b.joinDate-a.joinDate);
  if(_uFilter==='active') list=list.filter(u=>u.isActive&&!u.closed);
  else if(_uFilter==='inactive') list=list.filter(u=>!u.isActive&&!u.closed);
  else if(_uFilter==='closed') list=list.filter(u=>u.closed);
  const el=document.getElementById('users-list');
  if(!list.length){el.innerHTML='<div style="color:var(--text2);text-align:center;padding:36px;background:var(--grayl);border-radius:14px">কোনো user নেই</div>';return;}
  el.innerHTML=list.map(u=>`
    <div class="adm-card" onclick="openUser('${u.uid}')" style="cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:46px;height:46px;background:linear-gradient(135deg,var(--g),var(--gm));border-radius:13px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;flex-shrink:0">👤</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">${esc(u.name)} <span class="badge ${u.closed?'bgray':u.isActive?'bg':'bred'}" style="font-size:10px">${u.closed?'Closed':u.isActive?'Active':'Inactive'}</span></div>
          <div style="font-size:12px;color:var(--text2);margin-top:2px">${u.phone} · ${u.referCode||'-'} · VIP ${u.vipLevel||0} · Refer: ${u.directRefers||0}</div>
        </div>
        <div style="font-weight:900;color:var(--g);font-size:15px;flex-shrink:0">${fmtN(u.balance)}</div>
      </div>
    </div>`).join('');
}

let _audID=null;
async function openUser(id){
  _audID=id;
  const [user,cfg]=await Promise.all([fbGet(`users/${id}`),getCfg()]);
  document.getElementById('ud-name').textContent=user.name;
  document.getElementById('ud-info').textContent=`${user.phone} · Code: ${user.referCode} · Joined: ${fmtD(user.joinDate)}`;
  document.getElementById('ud-status').innerHTML=`<span class="badge ${user.closed?'bgray':user.isActive?'bg':'bred'}">${user.closed?'🚫 Closed':user.isActive?'✅ Active':'⚠️ Inactive'}</span>`;
  document.getElementById('ud-bal').textContent=fmtN(user.balance);
  document.getElementById('ud-refs').textContent=user.directRefers||0;
  const vl=cfg.vipLevels.filter(v=>v.level<=(user.vipLevel||0)).pop()||cfg.vipLevels[0];
  document.getElementById('ud-vip').textContent=vl.name;
  document.getElementById('ud-add-amt').value='';document.getElementById('ud-add-note').value='';
  const txns=Object.values(await fbGet('txns')||{}).filter(t=>t.userId===id).sort((a,b)=>b.createdAt-a.createdAt).slice(0,15);
  document.getElementById('ud-txns').innerHTML=txns.length?txns.map(histRow).join(''):'<div style="color:var(--text2);font-size:12px;padding:12px 0">কোনো transaction নেই</div>';
  const ab=document.getElementById('ud-act-btn');
  ab.textContent=user.isActive?'❌ Deactivate':'✅ Activate User';
  ab.className='btn '+(user.isActive?'btn-red btn-sm':'btn-g btn-sm');
  go('user-detail');
}

function histRow(t){
  const isIn=['task_earning','refer_bonus','vip_bonus','admin_add','checkin'].includes(t.type)||(t.type==='deposit'&&t.status==='approved')||(t.type==='activation'&&t.status==='approved');
  const isOut=t.type==='withdraw'&&t.status!=='rejected';
  const iC=isIn?'hi-dep':isOut?'hi-wd':t.type==='refer_bonus'?'hi-ref':t.type==='vip_bonus'?'hi-vip':'hi-task';
  return `<div class="hist-item"><div class="hist-ico ${iC}">${HICO[t.type]||'💰'}</div><div class="hist-info"><div class="hist-ttl">${TLBL[t.type]||t.type}</div><div class="hist-dt">${fmtD(t.createdAt)} · <span class="badge ${t.status==='approved'?'bg':t.status==='rejected'?'bred':'bgold'}" style="font-size:10px">${t.status}</span></div></div><div class="hist-amt ${isIn&&t.status==='approved'?'plus':isOut&&t.status!=='rejected'?'minus':''}">${fmtN(t.amount)}</div></div>`;
}

async function adminAddMoney(){
  if(!_audID)return;
  const amt=parseInt(document.getElementById('ud-add-amt').value)||0;
  const note=document.getElementById('ud-add-note').value.trim()||'Admin bonus';
  if(amt<=0){snack('পরিমাণ দিন');return;}
  ldr(true);
  try{
    const ref=db.ref(`users/${_audID}/balance`);
    const tx=await ref.transaction(v=>Number(v||0)+amt);
    const user=await fbGet(`users/${_audID}`);
    if(!tx?.committed && user?.balance===undefined) throw new Error('Balance update failed');
    await fbPush('txns',{userId:_audID,amount:amt,type:'admin_add',status:'approved',note,createdAt:Date.now()});
    snack(`✅ ${fmtN(amt)} যোগ হয়েছে — ${user.name}`);
    openUser(_audID);
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

async function toggleActive(){
  if(!_audID)return;ldr(true);
  try{
    const user=await fbGet(`users/${_audID}`);
    const newAct=!user.isActive;
    await fbUpd(`users/${_audID}`,{isActive:newAct,closed:newAct?false:user.closed});
    if(newAct) await distributeReferBonuses(_audID);
    snack(newAct?'✅ User Activated! Refer bonuses দেওয়া হয়েছে।':'❌ User Deactivated');
    openUser(_audID);
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

async function deleteUser(){
  if(!_audID)return;
  if(!confirm('এই User সম্পূর্ণ মুছে দেবেন?'))return;
  ldr(true);await fbDel(`users/${_audID}`);ldr(false);snack('🗑 User মুছা হয়েছে');go('users');
}

// ─── TASKS ───────────────────────────────────────────────
let _editTID=null;
async function renderTasks(){
  const tasks=Object.values(await fbGet('tasks')||{}).sort((a,b)=>b.createdAt-a.createdAt);
  const el=document.getElementById('tasks-list');
  el.innerHTML=tasks.length?tasks.map(t=>`
    <div class="adm-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div class="task-plat">${PLAT_ICO[t.platform]||'🌐'} ${t.platform}</div>
        <span class="badge ${t.isActive?'bg':'bgray'}">${t.isActive?'Active':'Paused'}</span>
      </div>
      <div class="task-title">${esc(t.title)}</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:10px;line-height:1.5">${esc(t.description).slice(0,80)}…</div>
      <div class="task-foot">
        <div class="task-earn">${fmtN(t.reward)}</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-out btn-sm" onclick="editTask('${t.id}')">✏️ Edit</button>
          <button class="btn btn-gray btn-sm" onclick="toggleTask('${t.id}',${!t.isActive})">${t.isActive?'⏸':'▶'}</button>
          <button class="btn btn-red btn-sm" onclick="delTask('${t.id}')">🗑</button>
        </div>
      </div>
    </div>`).join(''):'<div style="color:var(--text2);text-align:center;padding:36px;background:var(--grayl);border-radius:14px">কোনো task নেই</div>';
}

function openAddTask(){
  _editTID=null;
  document.getElementById('at-hdr').textContent='➕ New Task';
  document.getElementById('at-plat').value='Facebook';
  ['at-title','at-desc','at-link'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('at-reward').value='';
  go('add-task');
}
async function editTask(id){
  const t=Object.values(await fbGet('tasks')||{}).find(t=>t.id===id);if(!t)return;
  _editTID=id;
  document.getElementById('at-hdr').textContent='✏️ Edit Task';
  document.getElementById('at-plat').value=t.platform;
  document.getElementById('at-title').value=t.title;
  document.getElementById('at-desc').value=t.description;
  document.getElementById('at-link').value=t.link||'';
  document.getElementById('at-reward').value=t.reward;
  go('add-task');
}
async function saveTask(){
  const plat=document.getElementById('at-plat').value,title=document.getElementById('at-title').value.trim(),
    desc=document.getElementById('at-desc').value.trim(),link=document.getElementById('at-link').value.trim(),
    reward=parseInt(document.getElementById('at-reward').value)||0;
  if(!title||!desc||!reward){snack('সব তথ্য পূরণ করুন');return;}
  ldr(true);
  try{
    if(_editTID){await fbUpd(`tasks/${_editTID}`,{platform:plat,title,description:desc,link,reward});snack('✅ Task update হয়েছে');}
    else{await fbPush('tasks',{platform:plat,title,description:desc,link,reward,isActive:true,createdAt:Date.now()});snack('✅ Task যোগ হয়েছে');}
    _editTID=null;go('tasks');
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}
async function toggleTask(id,val){await fbUpd(`tasks/${id}`,{isActive:val});snack(val?'▶ Task Active':'⏸ Task Paused');renderTasks();}
async function delTask(id){if(!confirm('Task মুছে দেবেন?'))return;await fbDel(`tasks/${id}`);snack('🗑 Deleted');renderTasks();}

// ─── DEPOSITS ────────────────────────────────────────────
async function renderDeposits(){
  if(isSubAdmin()){snack('⛔ Access নেই');go('admin-dash');return;}
  const [txns,users]=await Promise.all([fbGet('txns'),fbGet('users')]);
  const arr=Object.values(txns||{}).filter(t=>['activation','deposit','account_close'].includes(t.type)).sort((a,b)=>b.createdAt-a.createdAt);
  const el=document.getElementById('dep-list');
  el.innerHTML=arr.length?arr.map(t=>{
    const u=users[t.userId]||{};
    const tLabel=t.type==='activation'?'🔑 Activation':t.type==='account_close'?'🔒 Account Close':'💳 Wallet Deposit';
    return `<div class="adm-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-weight:800;font-size:15px">${esc(u.name||'Unknown')} <span class="badge bgray" style="font-size:10px">${tLabel}</span></div>
          <div style="font-size:12px;color:var(--text2);margin-top:3px">${u.phone||''} · ${t.method||''} · TrxID: <b style="font-family:monospace">${esc(t.trxId||'-')}</b></div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">${fmtD(t.createdAt)}</div>
        </div>
        <div style="font-size:20px;font-weight:900;color:var(--g);flex-shrink:0">${fmtN(t.amount)}</div>
      </div>
      ${t.ssData?`
        <img src="${t.ssData}" class="ss-img" onclick="showImg('${t.ssData}')" title="বড় করে দেখুন">
        <div class="btn-row" style="margin-bottom:8px">
          <button class="btn btn-gray btn-sm" onclick="downloadSS('${t.ssData}','deposit_${t.id}')" style="flex:1">📥 Download SS</button>
          <button class="btn btn-red btn-sm" onclick="deleteSS('txns','${t.id}')" style="flex:1">🗑 SS মুছুন</button>
        </div>`:'' }
      ${t.status==='pending'
        ?`<div class="btn-row">
            <button class="btn btn-g btn-sm" onclick="approveDeposit('${t.id}')">✅ Approve${t.type==='activation'?' & Activate':''}</button>
            <button class="btn btn-red btn-sm" onclick="rejectTxn('${t.id}','dep')">❌ Reject</button>
          </div>`
        :`<span class="badge ${t.status==='approved'?'bg':'bred'}">${t.status==='approved'?'✅ Approved':'❌ Rejected'}</span>`
      }
    </div>`;
  }).join(''):'<div style="color:var(--text2);text-align:center;padding:36px;background:var(--grayl);border-radius:14px">কোনো request নেই</div>';
}

async function approveDeposit(id){
  ldr(true);
  try{
    const [txn,users]=await Promise.all([fbGet(`txns/${id}`),fbGet('users')]);
    if(!txn){snack('Not found');return;}
    await fbUpd(`txns/${id}`,{status:'approved',approvedAt:Date.now()});
    const user=users[txn.userId];
    if(txn.type==='activation'){
      await fbUpd(`users/${txn.userId}`,{isActive:true,activatedAt:Date.now()});
      await distributeReferBonuses(txn.userId);
      snack('✅ Approved! একাউন্ট Activated ও Refer bonuses দেওয়া হয়েছে।');
    } else if(txn.type==='deposit'){
      await fbUpd(`users/${txn.userId}`,{balance:(user.balance||0)+txn.amount});
      snack('✅ Deposit Approved! Balance যোগ হয়েছে।');
    } else if(txn.type==='account_close'){
      await fbUpd(`users/${txn.userId}`,{closed:true,isActive:false,balance:0});
      snack('✅ Account Close Approved! Refund পাঠান।');
    }
    renderDeposits();
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

async function rejectTxn(id,type){
  ldr(true);
  try{
    const txn=await fbGet(`txns/${id}`);if(!txn)return;
    await fbUpd(`txns/${id}`,{status:'rejected',rejectedAt:Date.now()});
    if(type==='wd'){
      const user=await fbGet(`users/${txn.userId}`);
      await fbUpd(`users/${txn.userId}`,{balance:(user.balance||0)+txn.amount});
    }
    snack('❌ Rejected'+(type==='wd'?' — Balance refunded':''));
    if(type==='dep')renderDeposits();else renderWithdrawals();
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

// ─── WITHDRAWALS ─────────────────────────────────────────
async function renderWithdrawals(){
  if(isSubAdmin()){snack('⛔ Access নেই');go('admin-dash');return;}
  const [txns,users]=await Promise.all([fbGet('txns'),fbGet('users')]);
  const arr=Object.values(txns||{}).filter(t=>t.type==='withdraw').sort((a,b)=>b.createdAt-a.createdAt);
  const el=document.getElementById('wd-list');
  el.innerHTML=arr.length?arr.map(t=>{
    const u=users[t.userId]||{};
    return `<div class="adm-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-weight:800;font-size:15px">${esc(u.name||'Unknown')}</div>
          <div style="font-size:13px;margin-top:3px">${t.method}: <b style="font-size:15px;font-family:monospace">${t.toNumber||'-'}</b></div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">${fmtD(t.createdAt)} · ${u.phone||''}</div>
        </div>
        <div style="font-size:20px;font-weight:900;color:var(--red);flex-shrink:0">${fmtN(t.amount)}</div>
      </div>
      ${t.status==='pending'
        ?`<div class="btn-row">
            <button class="btn btn-g btn-sm" onclick="approveWd('${t.id}')">✅ Sent & Approve</button>
            <button class="btn btn-red btn-sm" onclick="rejectTxn('${t.id}','wd')">❌ Reject (Refund)</button>
          </div>`
        :`<span class="badge ${t.status==='approved'?'bg':'bred'}">${t.status==='approved'?'✅ Approved':'❌ Rejected (Refunded)'}</span>`}
    </div>`;
  }).join(''):'<div style="color:var(--text2);text-align:center;padding:36px;background:var(--grayl);border-radius:14px">কোনো withdrawal নেই</div>';
}
async function approveWd(id){
  await fbUpd(`txns/${id}`,{status:'approved',approvedAt:Date.now()});
  snack('✅ Withdrawal Approved!');renderWithdrawals();
}

// ─── PROOFS ──────────────────────────────────────────────
async function renderProofs(){
  const [subs,tasks,users]=await Promise.all([fbGet('subs'),fbGet('tasks'),fbGet('users')]);
  const arr=Object.values(subs||{}).sort((a,b)=>b.createdAt-a.createdAt);
  const el=document.getElementById('proofs-list');
  el.innerHTML=arr.length?arr.map(s=>{
    const u=users[s.userId]||{},t=tasks[s.taskId]||{};
    return `<div class="adm-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <div style="font-weight:800;font-size:14px">${esc(u.name||'Unknown')}</div>
          <div style="font-size:12px;color:var(--g);font-weight:700;margin-top:3px">${PLAT_ICO[t.platform]||'🌐'} ${esc(t.title||'Unknown task')} · ${fmtN(t.reward||0)}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">${fmtD(s.createdAt)} · ${u.phone||''}</div>
        </div>
        <span class="badge ${s.status==='approved'?'bg':s.status==='rejected'?'bred':'bgold'}">${s.status==='approved'?'✅':s.status==='rejected'?'❌':'⏳'} ${s.status}</span>
      </div>
      ${s.ssData?`
        <img src="${s.ssData}" class="ss-img" onclick="showImg('${s.ssData}')" title="বড় করে দেখুন">
        <div class="btn-row" style="margin-bottom:8px">
          <button class="btn btn-gray btn-sm" onclick="downloadSS('${s.ssData}','proof_${s.id}')" style="flex:1">📥 Download SS</button>
          <button class="btn btn-red btn-sm" onclick="deleteSS('subs','${s.id}')" style="flex:1">🗑 SS মুছুন</button>
        </div>`:'' }
      ${s.status==='pending'
        ?`<div class="btn-row">
            <button class="btn btn-g btn-sm" onclick="approveProof('${s.id}')">✅ Approve & Pay ${fmtN(t.reward||0)}</button>
            <button class="btn btn-red btn-sm" onclick="rejectProof('${s.id}')">❌ Reject</button>
          </div>`:''
      }
    </div>`;
  }).join(''):'<div style="color:var(--text2);text-align:center;padding:36px;background:var(--grayl);border-radius:14px">কোনো submission নেই</div>';
}

async function approveProof(id){
  ldr(true);
  try{
    const sub=await fbGet(`subs/${id}`);if(!sub)return;
    const [task,user]=await Promise.all([fbGet(`tasks/${sub.taskId}`),fbGet(`users/${sub.userId}`)]);
    if(!task||!user){snack('Data not found');return;}
    await fbUpd(`subs/${id}`,{status:'approved',approvedAt:Date.now()});
    await fbUpd(`users/${sub.userId}`,{balance:(user.balance||0)+task.reward});
    await fbPush('txns',{userId:sub.userId,amount:task.reward,type:'task_earning',status:'approved',note:'Task: '+task.title,createdAt:Date.now()});
    snack(`✅ Approved! ${fmtN(task.reward)} যোগ হয়েছে`);renderProofs();
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}
async function rejectProof(id){
  await fbUpd(`subs/${id}`,{status:'rejected',rejectedAt:Date.now()});
  snack('❌ Proof Rejected');renderProofs();
}

// ─── SCREENSHOT DOWNLOAD & DELETE ───────────────────────
function downloadSS(dataUrl,filename){
  const a=document.createElement('a');
  a.href=dataUrl;
  a.download=(filename||'screenshot')+'.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  snack('📥 Download শুরু হয়েছে');
}
async function deleteSS(collection,id){
  if(!confirm('এই Screenshot মুছে ফেলবেন? (অনুমোদন তথ্য থাকবে, শুধু ছবি মুছবে)'))return;
  ldr(true);
  try{
    await fbUpd(`${collection}/${id}`,{ssData:null});
    snack('🗑 Screenshot মুছে গেছে');
    if(collection==='txns')renderDeposits();
    else renderProofs();
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

// ─── SETTINGS ────────────────────────────────────────────
async function renderSettings(){
  if(isSubAdmin()){snack('⛔ Settings: Admin only');go('admin-dash');return;}
  const cfg=await getCfg();
  document.getElementById('s-sitename').value=cfg.siteName||'';
  document.getElementById('s-sitelogo').value=cfg.siteLogo||'💰';
  document.getElementById('s-sitelogourl').value=cfg.siteLogoUrl||'';
  document.getElementById('s-tagline').value=cfg.siteTagline||'';
  document.getElementById('s-seo-title').value=cfg.siteTitle||cfg.siteName||'';
  document.getElementById('s-seo-desc').value=cfg.siteDesc||'';
  document.getElementById('s-siteurl').value=cfg.siteUrl||'';
  document.getElementById('s-bkash').value=cfg.bkash;
  document.getElementById('s-nagad').value=cfg.nagad;
  document.getElementById('s-actamt').value=cfg.activationAmount;
  document.getElementById('s-mindep').value=cfg.minDeposit||100;
  document.getElementById('s-maxdep').value=cfg.maxDeposit||10000;
  document.getElementById('s-minwd').value=cfg.minWithdraw;
  document.getElementById('s-maxwd').value=cfg.maxWithdraw||25000;
  document.getElementById('s-appslink').value=cfg.appsLink||'https://bucket.appilix.com/app-apk-2d3c94f5dea642e69e0c89ee5c5bc4f9-1789889458.apk';
  document.getElementById('s-theme-primary').value=cfg.themePrimary||'#14693f';
  document.getElementById('s-theme-secondary').value=cfg.themeSecondary||'#1e8f57';
  document.getElementById('s-theme-mode').value=cfg.themeMode||'green';
  document.getElementById('s-maint-text').value=cfg.maintenanceText||'সার্ভার আপডেট চলছে, কিছুক্ষণ পর চেষ্টা করুন';
  document.getElementById('s-notice-title').value='';
  document.getElementById('s-notice-body').value='';
  document.getElementById('s-notice-type').value='info';
  document.getElementById('s-admpw').value='';
  document.getElementById('s-subpw').value='';
  document.getElementById('s-fb-link').value=cfg.fbLink||'';
  document.getElementById('s-tg-link').value=cfg.tgLink||'';
  document.getElementById('s-tg-support').value=cfg.tgSupport||'';
  document.getElementById('s-ref-prefix').value=cfg.referPrefix||'EARN';
  document.getElementById('s-mr-day').value=cfg.monthlyRewardDay||1;
  const saStatus=document.getElementById('subadmin-status');
  if(saStatus) saStatus.textContent=cfg.subAdminPassword?'✅ Sub-Admin active':'❌ No Sub-Admin set';
  if(document.getElementById('s-market-api-url')) document.getElementById('s-market-api-url').value=cfg.marketApiUrl||'';
  if(document.getElementById('s-market-api-symbol')) document.getElementById('s-market-api-symbol').value=cfg.marketApiSymbol||'GBPNZD';
  if(document.getElementById('s-market-api-interval')) document.getElementById('s-market-api-interval').value=cfg.marketApiInterval||5000;
  if(document.getElementById('s-market-api-auth')) document.getElementById('s-market-api-auth').value=cfg.marketApiAuth||'bearer';
  if(document.getElementById('s-market-api-header')) document.getElementById('s-market-api-header').value=cfg.marketApiHeader||'Authorization';
  if(document.getElementById('s-market-api-query')) document.getElementById('s-market-api-query').value=cfg.marketApiQuery||'apikey';
  if(document.getElementById('s-market-api-key')) document.getElementById('s-market-api-key').value=localStorage.getItem('earnifybd_market_api_key')||'';
  if(document.getElementById('s-gemini-key')) document.getElementById('s-gemini-key').value=localStorage.getItem('earnifybd_gemini_key')||'';
  if(document.getElementById('s-gemini-model')) document.getElementById('s-gemini-model').value=cfg.geminiModel||'gemini-3.8-flash';
  if(document.getElementById('s-gemini-interval')) document.getElementById('s-gemini-interval').value=cfg.geminiInterval||5000;
  if(document.getElementById('s-gemini-modes')) document.getElementById('s-gemini-modes').value=cfg.geminiModes||'30s,1m,3m,5m';
  updateMarketApiStatus(cfg.marketApiEnabled===true);
  updateGeminiWingoStatus();
  // Toggles
  _setToggles={
    fbVisible:cfg.fbVisible!==false,
    tgVisible:cfg.tgVisible!==false,
    liveChatEnabled:cfg.liveChatEnabled!==false,
    tgSupportVisible:cfg.tgSupportVisible!==false,
    monthlyRewardEnabled:cfg.monthlyRewardEnabled===true,
    animationEnabled:cfg.animationEnabled!==false,
    vipAnimationEnabled:cfg.vipAnimationEnabled!==false,
    maintenanceMode:cfg.maintenanceMode===true
  };
  updateAllToggles();
  // Wingo toggle
  _wingoOn=cfg.wingoEnabled!==false;
  updateWingoToggleUI();
  // Referral + VIP controls (v21)
  const safeGens=Array.from({length:8},(_,i)=>Number(cfg.referGens?.[i] ?? DEF.referGens[i])||0);
  const gf=document.getElementById('s-gens');
  if(gf) gf.innerHTML=safeGens.map((v,i)=>`
    <div class="refvip-gen-card ${i===0?'direct':''}">
      <div class="refvip-card-top">
        <div class="refvip-card-name">${i===0?'🔗 Direct Refer':'🌿 Generation '+(i+1)}</div>
        <span class="refvip-card-pill">G${i+1}${i===0?' · DIRECT':''}</span>
      </div>
      <div class="refvip-card-money">৳ <span id="sg-preview-${i}">${v}</span></div>
      <div class="refvip-field">
        <label class="refvip-field-label">${i===0?'Direct Refer Bonus':'Generation '+(i+1)+' Bonus'} (৳)</label>
        <input class="fi" id="${i===0?'s-direct-ref-bonus':'sg-'+i}" type="number" value="${v}" min="0" step="1" placeholder="0" oninput="const p=document.getElementById('sg-preview-${i}');if(p)p.textContent=Math.max(0,Math.floor(Number(this.value)||0));updateReferralVipSummary({referGens:Array.from({length:8},(_,x)=>x===${i}?Number(this.value||0):Number(document.getElementById(x===0?'s-direct-ref-bonus':'sg-'+x)?.value||0)),vipLevels:[]})">
      </div>
    </div>`).join('');

  const VICO=['🏅','⭐','🌟','💫','💎','👑','🔥','🚀','🏆','💰','✨','🌙','☀️'];
  const vls=Array.from({length:13},(_,i)=>cfg.vipLevels?.[i]||DEF.vipLevels[i]);
  const monthly=Array.from({length:13},(_,i)=>Number(cfg.monthlyRewards?.[i] ?? 0)||0);
  const vf=document.getElementById('s-vips');
  if(vf) vf.innerHTML=vls.map((v,i)=>`
    <div class="refvip-vip-card">
      <div class="refvip-card-top">
        <div class="refvip-card-name">${VICO[i]||'⭐'} ${v.name||'VIP '+i}</div>
        <span class="refvip-card-pill">VIP ${i}</span>
      </div>
      <div class="refvip-mini-grid">
        <div class="refvip-field"><label class="refvip-field-label">Required Direct Refers</label><input class="fi" id="sv-min-${i}" type="number" value="${Number(v.minRefers)||0}" min="0" step="1"></div>
        <div class="refvip-field"><label class="refvip-field-label">Level-up Bonus ৳</label><input class="fi" id="sv-bonus-${i}" type="number" value="${Number(v.bonus)||0}" min="0" step="1"></div>
        <div class="refvip-field"><label class="refvip-field-label">Monthly Reward ৳</label><input class="fi" id="sv-monthly-${i}" type="number" value="${monthly[i]}" min="0" step="1"></div>
      </div>
      <div class="refvip-field-note">Client Refer page-এ এই level-এর threshold এবং bonus values দেখানো হবে।</div>
    </div>`).join('');
  updateReferralVipSummary(cfg);
}

// Toggle state
let _setToggles={fbVisible:true,tgVisible:true,liveChatEnabled:true,tgSupportVisible:true,monthlyRewardEnabled:false};
function toggleSet(key){
  _setToggles[key]=!_setToggles[key];
  updateAllToggles();
}
function updateAllToggles(){
  const map={fbVisible:'fb',tgVisible:'tg',liveChatEnabled:'chat',tgSupportVisible:'tgs',monthlyRewardEnabled:'mr',animationEnabled:'anim',vipAnimationEnabled:'vipa',maintenanceMode:'maint'};
  for(const[key,suf] of Object.entries(map)){
    const tog=document.getElementById(`tog-${suf}`);
    const knob=document.getElementById(`knob-${suf}`);
    if(!tog||!knob)continue;
    const on=_setToggles[key];
    tog.style.background=on?'var(--g)':'#ccc';
    knob.style.transform=on?'translateX(24px)':'translateX(0)';
  }
}


async function sendGlobalNotice(){
  const title=(document.getElementById('s-notice-title')?.value||'').trim();
  const body=(document.getElementById('s-notice-body')?.value||'').trim();
  const type=document.getElementById('s-notice-type')?.value||'info';
  if(!title||!body){snack('Notice title/body দিন');return;}
  ldr(true);
  try{
    await fbPush('notices',{title,body,type,isActive:true,createdAt:Date.now()});
    await fbPush('notifications',{type:'admin_notice',title,body,global:true,createdAt:Date.now()});
    document.getElementById('s-notice-title').value='';
    document.getElementById('s-notice-body').value='';
    snack('✅ Notice পাঠানো হয়েছে');
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

async function forceSaveVip12Defaults(){
  if(isSubAdmin()){snack('⛔ Settings: Admin only');return;}
  ldr(true);
  try{
    const cur=await getCfg();
    const referGens=Array.from({length:8},(_,i)=>Number(cur.referGens?.[i] ?? DEF.referGens[i])||0);
    const vipLevels=Array.from({length:13},(_,i)=>cur.vipLevels?.[i]||DEF.vipLevels[i]);
    const monthlyRewards=Array.from({length:13},(_,i)=>Number(cur.monthlyRewards?.[i] ?? 0)||0);
    const next={...cur,referGens,vipLevels,monthlyRewards};
    await fbSet('config/settings',next);
    await Promise.allSettled([
      fbSet('settings/referGens',referGens),
      fbSet('settings/vipLevels',vipLevels),
      fbSet('settings/monthlyRewards',monthlyRewards)
    ]);
    _cfg=next;
    await renderSettings();
    snack('✅ VIP 0-12 defaults sync হয়েছে!');
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

function updateReferralVipSummary(cfg){
  const gens=Array.from({length:8},(_,i)=>Number(cfg?.referGens?.[i] ?? DEF.referGens[i])||0);
  const vips=Array.from({length:13},(_,i)=>cfg?.vipLevels?.[i]||DEF.vipLevels[i]);
  const monthly=Array.from({length:13},(_,i)=>Number(cfg?.monthlyRewards?.[i] ?? 0)||0);
  const rt=document.getElementById('ref-summary-text');
  const vt=document.getElementById('vip-summary-text');
  if(rt) rt.textContent=gens.map((v,i)=>`G${i+1}: ৳${v}`).join(' · ');
  if(vt) vt.textContent=vips.map((v,i)=>`V${i}: ${Number(v.minRefers)||0} refs / ৳${Number(v.bonus)||0} / ৳${monthly[i]}`).join(' · ');
}

async function reloadReferralVipControls(){
  try{
    _cfg=null;
    await renderSettings();
    const cfg=await getCfg();
    updateReferralVipSummary(cfg);
    const st=document.getElementById('refvip-save-status');
    if(st)st.textContent='✅ Firebase থেকে current Referral + VIP settings reload হয়েছে।';
  }catch(e){snack('Error: '+e.message);}
}

async function saveReferralVipSettings(){
  if(isSubAdmin()){snack('⛔ Settings: Admin only');return;}
  ldr(true);
  const readMoney=(id,fallback=0)=>{
    const raw=document.getElementById(id)?.value;
    if(raw===undefined||raw===null||String(raw).trim()==='') return Math.max(0,Math.floor(Number(fallback)||0));
    const n=Number(raw); return Number.isFinite(n)&&n>=0?Math.floor(n):Math.max(0,Math.floor(Number(fallback)||0));
  };
  try{
    const cur=await getCfg();
    const referGens=Array.from({length:8},(_,i)=>i===0?readMoney('s-direct-ref-bonus',cur.referGens?.[0]):readMoney(`sg-${i}`,cur.referGens?.[i]));
    const vipLevels=Array.from({length:13},(_,i)=>{
      const base=cur.vipLevels?.[i]||DEF.vipLevels[i];
      return {
        level:i,
        name:base.name||`VIP ${i}`,
        minRefers:readMoney(`sv-min-${i}`,base.minRefers),
        bonus:readMoney(`sv-bonus-${i}`,base.bonus)
      };
    });
    const monthlyRewards=Array.from({length:13},(_,i)=>readMoney(`sv-monthly-${i}`,cur.monthlyRewards?.[i]));
    // One canonical client config + legacy compatibility mirrors.
    const next={...cur,referGens,vipLevels,monthlyRewards};
    await fbSet('config/settings',next);
    await Promise.allSettled([
      fbSet('settings/referGens',referGens),
      fbSet('settings/vipLevels',vipLevels),
      fbSet('settings/monthlyRewards',monthlyRewards)
    ]);
    _cfg=next;
    updateReferralVipSummary(next);
    for(let i=0;i<13;i++){
      const p=document.getElementById(`monthly-preview-${i}`);if(p)p.textContent=monthlyRewards[i];
    }
    const st=document.getElementById('refvip-save-status');
    if(st)st.textContent='✅ Saved: config/settings + legacy referral/VIP settings updated. Client নতুন settings refresh/real-time load করবে।';
    snack('✅ Referral + VIP settings saved!');
  }catch(e){
    const st=document.getElementById('refvip-save-status');
    if(st)st.textContent='❌ Save failed: '+e.message;
    snack('Error: '+e.message);
  }finally{ldr(false);}
}

async function saveSettings(){
  const cur=await getCfg();
  const newPw=document.getElementById('s-admpw').value;
  const readS=(id,fb=0)=>{const raw=document.getElementById(id)?.value;if(raw===undefined||String(raw).trim()==='')return Number(fb)||0;const n=Number(raw);return Number.isFinite(n)&&n>=0?Math.floor(n):Number(fb)||0;};
  const referGens=Array.from({length:8},(_,i)=>i===0?readS('s-direct-ref-bonus',cur.referGens?.[0]):readS(`sg-${i}`,cur.referGens?.[i]));
  const vipLevels=Array.from({length:13},(_,i)=>{const v=cur.vipLevels?.[i]||DEF.vipLevels[i];return {...v,minRefers:readS(`sv-min-${i}`,v.minRefers),bonus:readS(`sv-bonus-${i}`,v.bonus)};});
  const monthlyRewards=Array.from({length:13},(_,i)=>readS(`sv-monthly-${i}`,cur.monthlyRewards?.[i]));
  const subPw=document.getElementById('s-subpw').value;
  const prefix=(document.getElementById('s-ref-prefix').value||'EARN').trim().toUpperCase()||'EARN';
  const ns={
    siteName:document.getElementById('s-sitename').value.trim()||cur.siteName,
    siteLogo:document.getElementById('s-sitelogo').value.trim()||cur.siteLogo,
    siteLogoUrl:document.getElementById('s-sitelogourl').value.trim()||'',
    siteTagline:document.getElementById('s-tagline').value.trim()||cur.siteTagline,
    siteTitle:document.getElementById('s-seo-title').value.trim()||cur.siteTitle,
    siteDesc:document.getElementById('s-seo-desc').value.trim()||cur.siteDesc,
    siteUrl:document.getElementById('s-siteurl').value.trim()||cur.siteUrl,
    bkash:document.getElementById('s-bkash').value.trim()||cur.bkash,
    nagad:document.getElementById('s-nagad').value.trim()||cur.nagad,
    activationAmount:100,
    minDeposit:parseInt(document.getElementById('s-mindep').value)||100,
    maxDeposit:parseInt(document.getElementById('s-maxdep').value)||10000,
    minWithdraw:parseInt(document.getElementById('s-minwd').value)||cur.minWithdraw,
    maxWithdraw:parseInt(document.getElementById('s-maxwd').value)||25000,
    appsLink:document.getElementById('s-appslink').value.trim()||'https://bucket.appilix.com/app-apk-2d3c94f5dea642e69e0c89ee5c5bc4f9-1789889458.apk',
    themePrimary:document.getElementById('s-theme-primary').value||'#14693f',
    themeSecondary:document.getElementById('s-theme-secondary').value||'#1e8f57',
    themeMode:document.getElementById('s-theme-mode').value||'green',
    maintenanceText:document.getElementById('s-maint-text').value.trim()||'সার্ভার আপডেট চলছে, কিছুক্ষণ পর চেষ্টা করুন',
    adminPassword:newPw||cur.adminPassword,
    referGens,vipLevels,monthlyRewards,
    wingoEnabled:_wingoOn,
    subAdminPassword:subPw||cur.subAdminPassword||'',
    fbLink:document.getElementById('s-fb-link').value.trim(),
    tgLink:document.getElementById('s-tg-link').value.trim(),
    tgSupport:document.getElementById('s-tg-support').value.trim(),
    referPrefix:prefix,
    monthlyRewardDay:parseInt(document.getElementById('s-mr-day').value)||1,
    marketApiEnabled:!!(document.getElementById('s-market-api-url')?.value.trim()||cur.marketApiUrl),
    marketApiUrl:document.getElementById('s-market-api-url')?.value.trim()||cur.marketApiUrl||'',
    marketApiSymbol:(document.getElementById('s-market-api-symbol')?.value.trim()||cur.marketApiSymbol||'GBPNZD').toUpperCase(),
    marketApiAuth:document.getElementById('s-market-api-auth')?.value||cur.marketApiAuth||'bearer',
    marketApiHeader:document.getElementById('s-market-api-header')?.value.trim()||cur.marketApiHeader||'Authorization',
    marketApiQuery:document.getElementById('s-market-api-query')?.value.trim()||cur.marketApiQuery||'apikey',
    marketApiInterval:Math.max(2000,parseInt(document.getElementById('s-market-api-interval')?.value)||Number(cur.marketApiInterval)||5000),
    geminiModel:document.getElementById('s-gemini-model')?.value.trim()||cur.geminiModel||'gemini-3.8-flash',
    geminiInterval:Math.max(3000,parseInt(document.getElementById('s-gemini-interval')?.value)||Number(cur.geminiInterval)||5000),
    geminiModes:document.getElementById('s-gemini-modes')?.value.trim()||cur.geminiModes||'30s,1m,3m,5m',
    ..._setToggles
  };
  ldr(true);await fbSet('config/settings',ns);await Promise.allSettled([fbSet('settings/referGens',ns.referGens),fbSet('settings/vipLevels',ns.vipLevels),fbSet('settings/monthlyRewards',ns.monthlyRewards)]);_cfg=ns;ldr(false);
  snack('✅ সব Settings Save হয়েছে!');
  await fbPush('notifications',{type:'admin',msg:'Admin updated site settings',createdAt:Date.now(),global:true});
}

async function distributeReferBonuses(activatedUID){
  const cfg=await getCfg();
  const gens=Array.isArray(cfg.referGens)?cfg.referGens:[];
  const allUsers=await fbGet('users')||{};
  let currentId=activatedUID;
  for(let gen=0;gen<gens.length;gen++){
    const cu=allUsers[currentId];
    if(!cu||!cu.referredBy) break;
    const parentId=cu.referredBy;
    const parent=allUsers[parentId];
    if(!parent||parent.closed){ currentId=parentId; continue; }
    const bonus=Number(gens[gen])||0;
    try{
      const freshP=await fbGet(`users/${parentId}`);
      if(!freshP){ currentId=parentId; continue; }
      if(bonus>0){
        await fbUpd(`users/${parentId}`,{balance:(Number(freshP.balance)||0)+bonus});
        await fbPush('txns',{userId:parentId,amount:bonus,type:'refer_bonus',status:'approved',generation:gen+1,note:`Generation ${gen+1} Refer Bonus`,createdAt:Date.now(),sourceActivatedUID:activatedUID});
      }
      if(gen===0){
        const newDR=(Number(freshP.directRefers)||0)+1;
        await fbUpd(`users/${parentId}`,{directRefers:newDR});
        // A VIP calculation error must never prevent G2-G8 referral payouts.
        try{ await checkVIP(parentId); }catch(vipErr){ console.warn('VIP sync skipped:',vipErr.message); }
      }
    }catch(err){
      console.warn(`Generation ${gen+1} payout skipped:`,err.message);
      // Continue traversing upward so a single bad parent record does not block later generations.
    }
    currentId=parentId;
  }
}

async function checkVIP(userId){
  const [user,cfg]=await Promise.all([fbGet(`users/${userId}`),getCfg()]);
  const dr=Number(user?.directRefers)||0;
  const vls=Array.isArray(cfg.vipLevels)&&cfg.vipLevels.length?cfg.vipLevels:DEF.vipLevels;
  const eligible=vls.filter(v=>dr>=Number(v.minRefers||0));
  const newLv=eligible.length?Number(eligible[eligible.length-1].level)||0:0;
  const curLv=user.vipLevel||0;
  if(newLv>curLv){
    for(let lv=curLv+1;lv<=newLv;lv++){
      const vl=vls.find(v=>v.level===lv);
      if(vl&&vl.bonus>0){
        const fu=await fbGet(`users/${userId}`);
        await fbUpd(`users/${userId}`,{balance:(fu.balance||0)+vl.bonus,vipLevel:lv});
        await fbPush('txns',{userId,amount:vl.bonus,type:'vip_bonus',status:'approved',note:`${vl.name} Level Up Bonus!`,createdAt:Date.now()});
      }
    }
    await fbUpd(`users/${userId}`,{vipLevel:newLv});
  }
}

async function repairReferralVipState(){
  if(!confirm('Existing users-এর Referral/VIP count আবার sync করবেন? কোনো নতুন bonus payout করা হবে না.')) return;
  ldr(true);
  try{
    const [users,cfg]=await Promise.all([fbGet('users')||{},getCfg()]);
    const arr=Object.values(users);
    const directMap={};
    arr.forEach(u=>{ if(u.referredBy){ directMap[u.referredBy]=(directMap[u.referredBy]||0)+1; } });
    let updated=0;
    for(const u of arr){
      const direct=Number(directMap[u.uid]||0);
      const vls=Array.isArray(cfg.vipLevels)&&cfg.vipLevels.length?cfg.vipLevels:DEF.vipLevels;
      const eligible=vls.filter(v=>direct>=Number(v.minRefers||0));
      const vip=eligible.length?Number(eligible[eligible.length-1].level)||0:0;
      if(Number(u.directRefers||0)!==direct || Number(u.vipLevel||0)!==vip){
        await fbUpd(`users/${u.uid}`,{directRefers:direct,vipLevel:vip});
        updated++;
      }
    }
    snack(`✅ Referral/VIP Sync সম্পন্ন — ${updated} user update হয়েছে।`);
  }catch(e){ snack('Sync Error: '+e.message); }
  finally{ ldr(false); }
}

// ─── BOOT ────────────────────────────────────────────────
// ─── CSV EXPORT ──────────────────────────────────────────
async function exportUsersCSV(){
  ldr(true);
  const users=Object.values(await fbGet('users')||{});ldr(false);
  const rows=[['Name','Phone','Balance','Status','VIP','Join Date','Refer Code','Referred By']];
  users.forEach(u=>rows.push([u.name,u.phone,u.balance||0,u.isActive?'Active':'Inactive',u.vipLevel||0,new Date(u.joinDate||0).toLocaleDateString(),u.referCode||'',u.referredBy||'']));
  const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='earnifybd_users_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
  URL.revokeObjectURL(url);snack('✅ Users CSV Downloaded!');
}

function renderBulkBonus(){
  document.getElementById('bb-preview').style.display='none';
  document.getElementById('bb-send-btn').style.display='none';
}
let _bbUsers=[];
async function previewBulkBonus(){
  const target=document.getElementById('bb-target').value;
  const amt=parseInt(document.getElementById('bb-amt').value)||0;
  const note=document.getElementById('bb-note').value.trim();
  if(!amt||amt<1){snack('Amount দিন');return;}
  if(!note){snack('Note দিন');return;}
  ldr(true);
  const users=Object.values(await fbGet('users')||{}).filter(u=>u.isActive&&!u.closed);ldr(false);
  _bbUsers=target==='all'?users:users.filter(u=>(u.vipLevel||0)===parseInt(target));
  const total=_bbUsers.length*amt;
  const prev=document.getElementById('bb-preview');
  prev.style.display='block';
  prev.className='notice ng';
  prev.innerHTML=`<strong>✅ Preview</strong>${_bbUsers.length} জন user পাবেন × ${fmtN(amt)} = মোট <strong>${fmtN(total)}</strong><br>Note: "${note}"`;
  document.getElementById('bb-send-btn').style.display='block';
}
async function sendBulkBonus(){
  const amt=parseInt(document.getElementById('bb-amt').value)||0;
  const note=document.getElementById('bb-note').value.trim();
  if(!_bbUsers.length){snack('আগে Preview করুন');return;}
  if(!confirm(`${_bbUsers.length} জন user কে ${fmtN(amt)} bonus পাঠাবেন?`))return;
  ldr(true);
  try{
    for(const u of _bbUsers){
      await fbUpd(`users/${u.uid}`,{balance:(u.balance||0)+amt});
      await fbPush('txns',{userId:u.uid,amount:amt,type:'admin_add',status:'approved',note:note,createdAt:Date.now()});
    }
    snack(`✅ ${_bbUsers.length} জন user কে ${fmtN(amt)} bonus পাঠানো হয়েছে!`);
    document.getElementById('bb-preview').style.display='none';
    document.getElementById('bb-send-btn').style.display='none';
    _bbUsers=[];
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

// ─── MONTHLY REPORT ──────────────────────────────────────
let _mrData=null,_mrMonth='';
function renderMonthlyReport(){
  const m=document.getElementById('mr-month');
  if(!m.value){const d=new Date();m.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
  document.getElementById('mr-content').innerHTML='';
  document.getElementById('mr-csv-btn').style.display='none';
}
async function loadMonthlyReport(){
  const m=document.getElementById('mr-month').value;if(!m){snack('মাস বেছে নিন');return;}
  _mrMonth=m;ldr(true);
  const [users,txns]=await Promise.all([fbGet('users'),fbGet('txns')]);ldr(false);
  const tA=Object.values(txns||{}).filter(t=>new Date(t.createdAt).toISOString().slice(0,7)===m);
  const totalDep=tA.filter(t=>t.status==='approved'&&['deposit','activation'].includes(t.type)).reduce((s,t)=>s+t.amount,0);
  const totalWd=tA.filter(t=>t.status==='approved'&&t.type==='withdraw').reduce((s,t)=>s+t.amount,0);
  const taskPay=tA.filter(t=>t.status==='approved'&&t.type==='task_earning').reduce((s,t)=>s+t.amount,0);
  const referPay=tA.filter(t=>t.status==='approved'&&t.type==='refer_bonus').reduce((s,t)=>s+t.amount,0);
  const bonusPay=tA.filter(t=>t.status==='approved'&&t.type==='admin_add').reduce((s,t)=>s+t.amount,0);
  const newUsers=Object.values(users||{}).filter(u=>new Date(u.joinDate||0).toISOString().slice(0,7)===m);
  _mrData={m,totalDep,totalWd,taskPay,referPay,bonusPay,newUsers:newUsers.length,txns:tA};
  document.getElementById('mr-content').innerHTML=`
    <div class="grid2">
      <div class="stat-card"><div class="stat-num" style="color:var(--g)">${fmtN(totalDep)}</div><div class="stat-lbl">Total Deposit ⬇️</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--red)">${fmtN(totalWd)}</div><div class="stat-lbl">Total Withdraw ⬆️</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--blue,#2563eb)">${fmtN(taskPay)}</div><div class="stat-lbl">Task Paid 📋</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--gold)">${fmtN(referPay)}</div><div class="stat-lbl">Refer Bonus 🔗</div></div>
      <div class="stat-card"><div class="stat-num">${newUsers.length}</div><div class="stat-lbl">New Users 👤</div></div>
      <div class="stat-card"><div class="stat-num">${fmtN(bonusPay)}</div><div class="stat-lbl">Admin Bonus 🎁</div></div>
    </div>
    <div class="card"><div style="font-weight:800;margin-bottom:10px">💰 Net P&L</div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--grayl);font-size:13px"><span>Total Received</span><span style="font-weight:800;color:var(--g)">${fmtN(totalDep)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--grayl);font-size:13px"><span>Total Paid Out</span><span style="font-weight:800;color:var(--red)">${fmtN(totalWd+taskPay+referPay+bonusPay)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:800"><span>Net</span><span style="color:${totalDep-(totalWd+taskPay+referPay+bonusPay)>=0?'var(--g)':'var(--red)'}">${fmtN(totalDep-(totalWd+taskPay+referPay+bonusPay))}</span></div>
    </div>`;
  document.getElementById('mr-csv-btn').style.display='block';
}
function exportMonthCSV(){
  if(!_mrData)return;
  const rows=[['Date','Type','User ID','Amount','Status','Method','Note']];
  _mrData.txns.forEach(t=>rows.push([new Date(t.createdAt).toLocaleDateString(),t.type,t.userId,t.amount,t.status,t.method||'',t.note||'']));
  const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`earnifybd_report_${_mrMonth}.csv`;a.click();
  URL.revokeObjectURL(url);snack('✅ Report CSV Downloaded!');
}

// ─── MINI GAME ADMIN MONITOR ─────────────────────────────
const MINI_GAME_ADMIN={};
let _mgAdmTimer=null;
function miniAdmInfo(){const now=Math.floor(Date.now()/1000),period=Math.floor(now/60)+1,sec=now%60;return{period,sec,remaining:59-sec,betting:sec<48}}
function miniAdmLabel(t,p){const d=new Date();return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${t.slice(0,2).toUpperCase()}${String(p).padStart(7,'0')}`}
async function renderMiniGamesAdmin(){if(_mgAdmTimer)clearInterval(_mgAdmTimer);await updateMiniGamesAdmin(true);_mgAdmTimer=setInterval(()=>updateMiniGamesAdmin(false),1000);_offs.push(()=>{clearInterval(_mgAdmTimer);_mgAdmTimer=null;});}
async function updateMiniGamesAdmin(rebuild){const el=document.getElementById('adm-mini-games');if(!el)return;const types=Object.keys(MINI_GAME_ADMIN);if(rebuild||!el.dataset.ready){let h='';for(const t of types){h+=`<div class="mgadm-card" data-mgadm="${t}"><div class="mgadm-top"><div><div class="mgadm-title">🎮 ${MINI_GAME_ADMIN[t]}</div><div class="mgadm-period" data-period>—</div></div><span class="wg-adm-phase betting" data-phase>OPEN</span></div><div class="mgadm-grid"><div class="mgadm-box"><span>LIVE BETS</span><b data-bets>0</b></div><div class="mgadm-box"><span>STATUS</span><b data-status>OPEN</b></div><div class="mgadm-box"><span>CLOSES IN</span><b data-close>—</b></div><div class="mgadm-box"><span>RECENT RESULT</span><b data-result>—</b></div></div><div class="mgadm-future"><div style="font-size:10px;font-weight:900;margin-bottom:5px">NEXT 5 PERIODS</div><div data-future></div></div></div>`}el.innerHTML=h;el.dataset.ready='1'}
for(const t of types){const card=el.querySelector(`[data-mgadm="${t}"]`);if(!card)continue;const x=miniAdmInfo(),bets=await fbGet(`miniGameBets_${t}`)||{},rounds=await fbGet(`miniGameRounds_${t}`)||{};const count=Object.values(bets).filter(b=>Number(b.period)===x.period&&!b.settled).length;const latest=Object.entries(rounds).filter(([,r])=>r?.result).sort((a,b)=>Number(b[0])-Number(a[0]))[0];card.querySelector('[data-period]').textContent=miniAdmLabel(t,x.period);card.querySelector('[data-phase]').textContent=x.betting?`🟢 OPEN • ${x.remaining}s`:'🟠 LOCKED';card.querySelector('[data-bets]').textContent=count;card.querySelector('[data-status]').textContent=x.betting?'OPEN':'LOCKED';card.querySelector('[data-close]').textContent=x.remaining+'s';card.querySelector('[data-result]').textContent=latest?.[1]?.result?String(latest[1].result).toUpperCase():'—';const fu=card.querySelector('[data-future]');let fh='';for(let i=1;i<=5;i++){const p=x.period+i,r=rounds[p];fh+=`<div class="mgadm-frow"><span>${miniAdmLabel(t,p)}</span><span class="mgadm-muted">${r?.result?'FINALIZED':'AUTO • RESULT AT CLOSE'}</span></div>`}fu.innerHTML=fh}}

// ─── WINGO ADMIN — ORIGINAL ADMIN PRESERVED + MULTI TIME MONITOR ───
const WINGO_MODES={
  '30s':{label:'30 Seconds',seconds:30},'1m':{label:'1 Minute',seconds:60},'3m':{label:'3 Minutes',seconds:180},'5m':{label:'5 Minutes',seconds:300}
};
let _wgAdmTimer=null;
function admWgPeriodLabel(mode,period){try{const d=WINGO_MODES[mode]?.seconds||30;const startMs=(Number(period)-1)*d*1000;const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(new Date(startMs));const get=k=>Number((parts.find(p=>p.type===k)||{}).value||0);const h=get('hour')%24,m=get('minute'),sec=get('second'),seq=Math.floor((h*3600+m*60+sec)/d)+1;const code=mode==='30s'?'30s':mode==='1m'?'1m':mode==='3m'?'3m':'5m';return `${String(get('day')).padStart(2,'0')}/${String(get('month')).padStart(2,'0')}/${String(get('year')).slice(-2)} • ${code} • #${String(seq).padStart(4,'0')}`;}catch(_){const code=mode==='30s'?'30s':mode==='1m'?'1m':mode==='3m'?'3m':'5m';return `${code} • #${String(Number(period)).padStart(4,'0')}`;}}

function admWgSec(){return Math.floor(Date.now()/1000);}
function admWgKey(mode){return mode==='30s'?'':String(mode).replace(/[^a-z0-9]/gi,'_');}
function admWgPeriods(mode){return mode==='30s'?'wingoPeriods':`wingoPeriods_${admWgKey(mode)}`;}
function admWgBets(mode){return mode==='30s'?'wingoBets':`wingoBets_${admWgKey(mode)}`;}
function admWgInfo(mode){const d=WINGO_MODES[mode].seconds,now=admWgSec(),period=Math.floor(now/d)+1,sec=now%d,bet=Math.max(1,d-15),rs=d-3;let phase,remaining;if(sec<bet){phase='betting';remaining=bet-1-sec}else if(sec<rs){phase='countdown';remaining=rs-1-sec}else{phase='result';remaining=d-1-sec}return{period,phase,remaining};}
async function admEnsureResult(mode,period){
  const p=`${admWgPeriods(mode)}/${period}`,old=await fbGet(p);
  if(old?.result)return old;
  const result=(()=>{try{const a=new Uint32Array(1);crypto.getRandomValues(a);return (a[0]>>>0)<0x80000000?'big':'small';}catch(e){return Math.random()<.5?'big':'small';}})();
  try{const tx=await db.ref(p).transaction(cur=>cur?.result?cur:{...(cur||{}),result,type:'auto-fair',settled:false,settledAt:Date.now()});return tx?.snapshot?.val()||await fbGet(p);}catch(e){return await fbGet(p);}
}
async function admEnsureUpcoming(mode,current){return true;}
function admWgPlanButton(){return ''; }
async function setWingoAdminPlan(mode,period,result){snack('ℹ️ Wingo future outcomes are not manually settable. Results are generated automatically.');}
async function clearWingoAdminPlan(mode,period){snack('ℹ️ Wingo future outcomes are automatic.');}
async function admUpcomingHtml(mode,current){
  let h='';
  for(let i=1;i<=5;i++){const p=current+i;h+=`<div class="wg-adm-plan"><div class="wg-adm-plan-info"><div class="wg-adm-plan-period">${admWgPeriodLabel(mode,p)}</div><div class="wg-adm-plan-meta">AUTO • RESULT AT CLOSE</div></div><span class="wg-adm-auto-badge">🔒 FAIR</span></div>`;}
  return h;
}
// Result engine runs for every mode. It uses the stable five-period preview when a
// period is reached, otherwise the stored auto result is created transactionally.
async function wingoAutoEngine(){if(window._wingoAutoStarted)return;window._wingoAutoStarted=true;setInterval(async()=>{for(const mode of Object.keys(WINGO_MODES)){const x=admWgInfo(mode);if(x.phase==='result')await admEnsureResult(mode,x.period-1);}},500);}
// Keep legacy function names available so other original admin code does not break.
function wingoSignalForecast(mode,period,recent){
  let override='';
  try{const o=JSON.parse(localStorage.getItem('earnifybd_admin_preview_v2__wg')||'{}');override=o[(mode||'')+'_'+period]||'';}catch(e){}
  if(override==='big'||override==='small')return override.toUpperCase();
  let nonce=0;try{nonce=(JSON.parse(localStorage.getItem('earnifybd_admin_preview_v2')||'{}')||{}).nonce||0;}catch(e){}
  const arr=(recent||[]).map(x=>x?.result).filter(Boolean).slice(-12);
  let score=0;
  arr.forEach((r,i)=>{const w=i+1;score+=(String(r).toLowerCase()==='big'?1:-1)*w;});
  let seed=((Number(period)||0)*2654435761 + (mode==='30s'?31:mode==='1m'?61:mode==='3m'?181:301) + Number(nonce))>>>0;
  seed^=seed>>>16; seed=Math.imul(seed,2246822519)>>>0;
  if(score===0)score=(seed&1)?1:-1;
  else score += ((seed%5)-2)*0.15;
  return score>=0?'BIG':'SMALL';
}
async function renderWingoAdmin(){
  const host=document.getElementById('adm-wg-modes');if(!host)return;
  if(_wgAdmTimer){clearInterval(_wgAdmTimer);_wgAdmTimer=null;}
  host.innerHTML='';
  for(const mode of Object.keys(WINGO_MODES)){
    const x=admWgInfo(mode);
    const card=document.createElement('div');card.className='card wg-adm-card';card.innerHTML=`<div class="wg-adm-top"><div><div class="wg-adm-title">🎯 ${WINGO_MODES[mode].label}</div><div class="wg-adm-period" data-period>—</div></div><span class="wg-adm-phase betting" data-phase>OPEN</span></div><div class="wg-adm-stats"><div><span>CURRENT PERIOD</span><b data-cur>—</b></div><div><span>CLOSES IN</span><b data-close>—</b></div><div><span>RECENT RESULT</span><b data-result>—</b></div><div><span>NEXT SIGNAL</span><b data-signal>—</b></div></div><div class="wg-forecast-wrap"><div class="wg-forecast-head"><div class="wg-forecast-title">NEXT 5 PERIOD SIGNAL PREVIEW</div><div class="wg-forecast-note">Display-only preview • does not change result</div></div><div class="wg-forecast-grid" data-grid></div><div style="margin-top:9px;display:flex;gap:6px;align-items:center"><span style="font-size:9px;color:#94a3b8">Preview display:</span><select data-preview class="fsel" style="flex:1;padding:6px 8px;font-size:10px"><option value="auto">Auto preview</option><option value="big">Show BIG</option><option value="small">Show SMALL</option></select></div></div><div class="wg-adm-list" data-list></div>`;
    host.appendChild(card);
    card.dataset.mode=mode;
  }
  const tick=async()=>{
    const nowModes=Array.from(host.children);
    for(const card of nowModes){
      const mode=card.dataset.mode,x=admWgInfo(mode);const periods=await fbGet(admWgPeriods(mode))||{};
      const rows=Object.entries(periods).filter(([,r])=>r?.result).sort((a,b)=>Number(a[0])-Number(b[0]));
      const recent=rows.slice(-12).map(([,r])=>r);
      const signal=wingoSignalForecast(mode,x.period+1,recent);
      card.querySelector('[data-period]').textContent=admWgPeriodLabel(mode,x.period);
      card.querySelector('[data-cur]').textContent=admWgPeriodLabel(mode,x.period);
      card.querySelector('[data-close]').textContent=String(x.remaining).padStart(2,'0')+'s';
      card.querySelector('[data-phase]').textContent=x.phase==='betting'?`🟢 BETTING • ${x.remaining}s`:x.phase==='countdown'?`🟠 LOCKED • ${x.remaining}s`:`🔴 RESULT • ${x.remaining}s`;
      const last=recent.at(-1)?.result;const re=card.querySelector('[data-result]');if(re){re.textContent=last?String(last).toUpperCase():'—';re.className=last==='big'?'big':'small';}
      const se=card.querySelector('[data-signal]');if(se){se.textContent=signal;se.style.color=signal==='BIG'?'#fb7185':'#60a5fa';}
      const grid=card.querySelector('[data-grid]'); if(grid){let gh='';for(let i=1;i<=5;i++){const p=x.period+i,s=wingoSignalForecast(mode,p,recent);gh+=`<div class="wg-fc"><div class="wg-fc-p">${admWgPeriodLabel(mode,p)}</div><div class="wg-fc-s ${s.toLowerCase()}">${s}</div><div class="wg-fc-c">auto preview</div></div>`}grid.innerHTML=gh;}
      const pv=card.querySelector('[data-preview]'); if(pv&&!pv.dataset.bound){pv.dataset.bound='1';pv.onchange=()=>{const g=card.querySelector('[data-grid]');const first=g?.querySelector('.wg-fc');const chosen=pv.value;if(first&&chosen!=='auto'){const se=first.querySelector('.wg-fc-s');if(se){se.textContent=chosen.toUpperCase();se.className='wg-fc-s '+chosen;}} else if(first){const ptxt=first.querySelector('.wg-fc-p')?.textContent||'';const pm=String(ptxt).replace(/[^0-9]/g,'');const auto=wingoSignalForecast(mode,Number(String(pm).slice(-7))||x.period+1,recent);const se=first.querySelector('.wg-fc-s');if(se){se.textContent=auto;se.className='wg-fc-s '+auto.toLowerCase();}} if(chosen==='auto')snack('✅ Auto preview restored — official result remains automatic.');else snack('ℹ️ Admin display preview changed only; official Wingo result is unchanged.');};}
      const list=card.querySelector('[data-list]'); if(list){const tail=recent.slice(-6).reverse();list.innerHTML=tail.length?tail.map(r=>`<div class="wg-adm-row"><strong>${r.result==='big'?'BIG':'SMALL'}</strong><span>FINAL</span><small>${r.createdAt?fmtD(r.createdAt):''}</small></div>`).join(''):'<div class="wg-adm-empty">No finalized results yet</div>';}
    }
  };
  await tick();_wgAdmTimer=setInterval(tick,1000);_offs.push(()=>{if(_wgAdmTimer){clearInterval(_wgAdmTimer);_wgAdmTimer=null;}});
}
function renderWingoAdminPredictions(){return renderWingoAdmin();}
async function saveWingoPredictions(){snack('ℹ️ Wingo forecast is informational; results remain automatic.');}
async function renderWingoAdminResults(){return renderWingoAdmin();}
// ─── SECURITY ────────────────────────────────────────────
const RATE={attempts:0,lockUntil:0};
function rateCheck(){
  if(Date.now()<RATE.lockUntil){snack(`⛔ ${Math.ceil((RATE.lockUntil-Date.now())/1000)}s পরে আবার চেষ্টা করুন`);return false;}
  RATE.attempts++;
  if(RATE.attempts>=5){RATE.lockUntil=Date.now()+60000;RATE.attempts=0;snack('⛔ ৫বার ভুল — ১ মিনিট wait করুন');return false;}
  return true;
}
function sanitize(s){return String(s||'').replace(/[<>"'&]/g,'').trim().slice(0,500);}

// ─── WINGO TOGGLE ────────────────────────────────────────
let _wingoOn=true;
async function loadWingoToggle(){
  const cfg=await getCfg();
  _wingoOn=cfg.wingoEnabled!==false;
  updateWingoToggleUI();
}
function updateWingoToggleUI(){
  const toggle=document.getElementById('wingo-toggle');
  const knob=document.getElementById('wingo-knob');
  if(!toggle||!knob)return;
  toggle.style.background=_wingoOn?'var(--g)':'#555';
  knob.style.transform=_wingoOn?'translateX(26px)':'translateX(0)';
}
async function toggleWingo(){
  _wingoOn=!_wingoOn;
  updateWingoToggleUI();
  snack(_wingoOn?'✅ Wingo Game চালু করা হয়েছে':'⛔ Wingo Game বন্ধ করা হয়েছে');
}

// ─── LOGIN TABS ─────────────────────────────────────────
let _loginRole='admin';
function loginTab(role){
  _loginRole=role;
  document.getElementById('ltab-admin').classList.toggle('active',role==='admin');
  document.getElementById('ltab-sub').classList.toggle('active',role==='sub');
  document.getElementById('ltab-admin').style.color=role==='admin'?'var(--g)':'var(--text2)';
  document.getElementById('ltab-admin').style.background=role==='admin'?'#fff':'transparent';
  document.getElementById('ltab-sub').style.color=role==='sub'?'var(--g)':'var(--text2)';
  document.getElementById('ltab-sub').style.background=role==='sub'?'#fff':'transparent';
  document.getElementById('adm-pw').value='';
  document.getElementById('adm-pw').placeholder=role==='admin'?'Admin password':'Sub-admin password';
}


// Remove unwanted old Max Win notice/notification from Firebase when rules allow it.
function isBlockedNotice(n){
  const txt=((n&&n.title)||'')+' '+((n&&n.body)||'')+' '+((n&&n.msg)||'');
  const clean=txt.replace(/\s+/g,' ').trim().toLowerCase();
  if(!clean)return false;
  if(clean.includes('max win')||clean.includes('platform name max win')||clean.includes('max win-vip'))return true;
  if(/^[.\s]+$/.test(txt))return true;
  return false;
}
async function cleanupBlockedNotices(){
  try{
    const [notices,notifications]=await Promise.all([fbGet('notices'),fbGet('notifications')]);
    Object.entries(notices||{}).forEach(([k,n])=>{if(isBlockedNotice(n))fbDel('notices/'+k).catch(()=>{});});
    Object.entries(notifications||{}).forEach(([k,n])=>{if(isBlockedNotice(n))fbDel('notifications/'+k).catch(()=>{});});
  }catch(e){console.warn('Notice cleanup skipped:',e&&e.message?e.message:e);}
}

// ─── SESSION ─────────────────────────────────────────────
const ASK='eb_adm_role';
function setRole(r){localStorage.setItem(ASK,r);}
function getRole(){return localStorage.getItem(ASK)||'admin';}
function isSubAdmin(){return getRole()==='sub';}


// ─── LIVE CHAT ────────────────────────────────────────────
let _chatUID=null;
async function renderLiveChat(){
  const users=await fbGet('users')||{};
  const el=document.getElementById('chat-user-list');
  const uArr=Object.values(users);
  if(!uArr.length){el.innerHTML='<div style="color:var(--text2);text-align:center;padding:36px">কোনো user নেই</div>';return;}
  // Get last message for each user
  el.innerHTML='<div style="font-size:15px;font-weight:800;margin-bottom:12px">Users</div>';
  const chatData=await fbGet('chats')||{};
  el.innerHTML+=uArr.map(u=>{
    const msgs=chatData[u.uid]?Object.values(chatData[u.uid]).sort((a,b)=>b.ts-a.ts):[];
    const last=msgs[0];
    const unread=msgs.filter(m=>m.from==='user'&&!m.read).length;
    return `<div class="adm-card" onclick="openChatDetail('${u.uid}')" style="cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;background:var(--g);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;position:relative">
          👤${unread>0?`<span style="position:absolute;top:-4px;right:-4px;background:var(--red);color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">${unread}</span>`:''}
        </div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">${esc(u.name)}</div>
          <div style="font-size:12px;color:var(--text2)">${u.phone}</div>
          ${last?`<div style="font-size:12px;color:var(--text2);margin-top:2px">${esc(String(last.msg).slice(0,40))}</div>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
  // Realtime badge
  onDB('chats',all=>{
    const total=Object.values(all||{}).reduce((s,uc)=>s+Object.values(uc||{}).filter(m=>m.from==='user'&&!m.read).length,0);
    setBadge('chat-cnt',total);
  });
}

async function openChatDetail(uid){
  _chatUID=uid;
  const user=await fbGet(`users/${uid}`);
  document.getElementById('chat-detail-name').textContent=(user?.name||'User')+' — Chat';
  go('chat-detail');
  renderChatMsgs(uid);
  // Mark all as read
  const msgs=await fbGet(`chats/${uid}`)||{};
  for(const[k,m] of Object.entries(msgs)){
    if(m.from==='user'&&!m.read) await fbUpd(`chats/${uid}/${k}`,{read:true});
  }
}

function renderChatMsgs(uid){
  const el=document.getElementById('chat-msgs');
  onDB(`chats/${uid}`,msgs=>{
    const arr=Object.values(msgs||{}).sort((a,b)=>a.ts-b.ts);
    if(!arr.length){el.innerHTML='<div style="color:var(--text2);text-align:center;padding:30px;font-size:13px;background:var(--grayl);border-radius:14px">কোনো message নেই</div>';return;}
    el.innerHTML=arr.map(m=>{
      const isAdmin=m.from==='admin';
      return`<div style="display:flex;justify-content:${isAdmin?'flex-end':'flex-start'};margin-bottom:12px;align-items:flex-end;gap:6px">
        ${isAdmin?`<button onclick="deleteChatMsg('${uid}','${m.id}')" style="background:var(--redl);border:none;cursor:pointer;font-size:12px;color:var(--red);padding:4px 6px;border-radius:8px;flex-shrink:0;font-weight:700" title="Delete">🗑</button>`:''}
        <div style="max-width:75%">
          <div style="background:${isAdmin?'linear-gradient(135deg,var(--g),var(--gm))':'var(--grayl)'};color:${isAdmin?'#fff':'var(--text)'};padding:11px 15px;border-radius:${isAdmin?'18px 18px 4px 18px':'18px 18px 18px 4px'};font-size:14px;line-height:1.55;word-break:break-word;box-shadow:${isAdmin?'0 2px 10px rgba(20,105,63,.25)':'0 2px 6px rgba(0,0,0,.06)'}">
            ${!isAdmin?`<div style="font-size:10px;font-weight:800;color:var(--g);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">User</div>`:''}
            ${esc(m.msg)}
            <div style="font-size:10px;opacity:.6;margin-top:4px">${fmtD(m.ts)}</div>
          </div>
        </div>
        ${!isAdmin?`<button onclick="deleteChatMsg('${uid}','${m.id}')" style="background:var(--redl);border:none;cursor:pointer;font-size:12px;color:var(--red);padding:4px 6px;border-radius:8px;flex-shrink:0;font-weight:700" title="Delete">🗑</button>`:''}
      </div>`;
    }).join('');
    setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'end'}),100);
  });
}

async function deleteChatMsg(uid,msgId){
  if(!confirm('এই message মুছে ফেলবেন?'))return;
  await fbDel(`chats/${uid}/${msgId}`);
  snack('🗑 Message মুছে গেছে');
}

async function sendAdminChat(){
  if(!_chatUID)return;
  const inp=document.getElementById('chat-reply-inp');
  const msg=inp.value.trim();
  if(!msg)return;
  // Push message with read:false so user's float badge shows
  await fbPush(`chats/${_chatUID}`,{from:'admin',msg,ts:Date.now(),read:false});
  inp.value='';
  // Also push to notifications node so user notification badge updates
  await fbPush('notifications',{type:'chat',msg:'Admin replied: '+msg.slice(0,50),userId:_chatUID,createdAt:Date.now(),read:false});
  snack('✅ Reply পাঠানো হয়েছে');
}

async function clearAllChat(){
  if(!_chatUID)return;
  if(!confirm('এই User এর সব Chat মুছে ফেলবেন?'))return;
  await fbDel(`chats/${_chatUID}`);
  snack('🗑 সব Chat মুছে গেছে');
}

// ─── WINGO ADMIN RESULTS (admin only - remove from renderWingoAdmin) ──────────
async function renderWingoAdminResults(){return;}

// ─── PLANS ADMIN ──────────────────────────────────
const DEF_PLANS_ADMIN=[
  {id:'p1',name:'Starter',price:100,durationDays:5,dailyBonus:5,extraTasks:1,commission:0,active:true},
  {id:'p2',name:'Basic',price:200,durationDays:8,dailyBonus:12,extraTasks:2,commission:0,active:true},
  {id:'p3',name:'Bronze',price:300,durationDays:12,dailyBonus:20,extraTasks:3,commission:0,active:true},
  {id:'p4',name:'Silver',price:400,durationDays:15,dailyBonus:30,extraTasks:4,commission:0,active:true},
  {id:'p5',name:'Gold',price:500,durationDays:19,dailyBonus:45,extraTasks:5,commission:0,active:true},
  {id:'p6',name:'Platinum',price:600,durationDays:22,dailyBonus:60,extraTasks:6,commission:0,active:true},
  {id:'p7',name:'Diamond',price:700,durationDays:28,dailyBonus:80,extraTasks:7,commission:0,active:true},
  {id:'p8',name:'Elite',price:800,durationDays:30,dailyBonus:100,extraTasks:8,commission:0,active:true},
  {id:'p9',name:'Supreme',price:900,durationDays:30,dailyBonus:130,extraTasks:9,commission:0,active:true},
  {id:'p10',name:'Ultimate',price:1000,durationDays:30,dailyBonus:170,extraTasks:10,commission:0,active:true}
];

let _adminPlans=[];

async function renderPlansAdmin(){
  ldr(true);
  try{
    const saved=await fbGet('config/plans');
    _adminPlans=saved&&saved.length?saved:JSON.parse(JSON.stringify(DEF_PLANS_ADMIN));
    renderAdminPlansList();
  }finally{ldr(false);}
}

function getPlanDaysAdmin(price){
  price=parseInt(price)||0;
  const map={100:5,200:8,300:12,400:15,500:19,600:22,700:28,800:30,900:30,1000:30};
  if(map[price]) return map[price];
  const tiers=[1000,900,800,700,600,500,400,300,200,100];
  for(let i=0;i<tiers.length;i++){if(price>=tiers[i])return map[tiers[i]];}
  return 5;
}

function renderAdminPlansList(){
  const el=document.getElementById('admin-plans-list');
  if(!el)return;
  el.innerHTML=_adminPlans.map((plan,i)=>`
    <div class="card" style="margin-bottom:12px;padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:15px;font-weight:800">📦 Plan ${i+1}</div>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700">
          <input type="checkbox" id="pa-active-${i}" ${plan.active!==false?'checked':''} onchange="_adminPlans[${i}].active=this.checked"> Active
        </label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label class="flbl">Plan Name</label><input class="fi" id="pa-name-${i}" value="${esc(plan.name)}" placeholder="Plan Name" style="font-size:13px" onchange="_adminPlans[${i}].name=this.value"></div>
        <div><label class="flbl">Price (৳)</label><input class="fi" id="pa-price-${i}" type="number" value="${plan.price}" min="0" style="font-size:13px" onchange="_adminPlans[${i}].price=parseInt(this.value)||0"></div>
        <div><label class="flbl">Daily Bonus (৳)</label><input class="fi" id="pa-bonus-${i}" type="number" value="${plan.dailyBonus}" min="0" style="font-size:13px" onchange="_adminPlans[${i}].dailyBonus=parseInt(this.value)||0"></div>
        <div><label class="flbl">Instant Commission</label><input class="fi" id="pa-comm-${i}" type="number" value="0" min="0" disabled style="font-size:13px;background:var(--grayl);color:var(--text2)" title="Plan কিনলে instant commission বন্ধ"></div>
        <div><label class="flbl">Extra Tasks</label><input class="fi" id="pa-tasks-${i}" type="number" value="${plan.extraTasks||0}" min="0" style="font-size:13px" onchange="_adminPlans[${i}].extraTasks=parseInt(this.value)||0"></div>
        <div><label class="flbl">Duration (Days)</label><input class="fi" id="pa-duration-${i}" type="number" value="${plan.durationDays||getPlanDaysAdmin(plan.price)}" min="1" style="font-size:13px;font-weight:800;color:var(--g)" onchange="_adminPlans[${i}].durationDays=parseInt(this.value)||1"></div>
      </div>
    </div>`).join('');
}

async function saveAllPlans(){
  // Collect values from inputs
  _adminPlans=_adminPlans.map((p,i)=>({
    ...p,
    name:document.getElementById(`pa-name-${i}`)?.value||p.name,
    price:parseInt(document.getElementById(`pa-price-${i}`)?.value)||p.price,
    durationDays:parseInt(document.getElementById(`pa-duration-${i}`)?.value)||p.durationDays||getPlanDaysAdmin(parseInt(document.getElementById(`pa-price-${i}`)?.value)||p.price),
    dailyBonus:parseInt(document.getElementById(`pa-bonus-${i}`)?.value)||p.dailyBonus,
    commission:0,
    extraTasks:parseInt(document.getElementById(`pa-tasks-${i}`)?.value)||p.extraTasks||0,
    active:document.getElementById(`pa-active-${i}`)?.checked!==false
  }));
  ldr(true);
  try{
    await fbSet('config/plans',_adminPlans);
    snack('✅ Plans save হয়েছে!');
  }catch(e){snack('Error: '+e.message);}finally{ldr(false);}
}

async function boot(){
  ldr(true);
  try{
    const cfg=await getCfg();
    document.body.classList.toggle('anim-on',cfg.animationEnabled!==false);
    document.documentElement.style.setProperty('--g',cfg.themePrimary||'#14693f');
    document.documentElement.style.setProperty('--gm',cfg.themeSecondary||'#1e8f57');
    const sub=document.getElementById('adm-site-sub'); if(sub) sub.textContent=cfg.siteName||'EarnifyBD';
    if(isAuth()){
      go('admin-dash');
      Promise.resolve(loadWingoToggle()).catch(e=>console.warn('Wingo toggle load skipped:',e.message));
      setTimeout(async()=>{try{const c=await getCfg();if(c.marketApiEnabled&&c.marketApiUrl&&marketApiKey())startMarketApiSync();}catch(e){console.warn('Market API bridge start skipped:',e.message);}},700);
    }else{showLogin();}
    setTimeout(async()=>{
      try{
        const existing=await fbGet('config/settings');
        if(!existing) await fbSet('config/settings',DEF);
        const tasks=await fbGet('tasks');
        if(!tasks){
          await fbPush('tasks',{platform:'Facebook',title:'Like & Follow Page',description:'নিচের পেজে যান:\nhttps://facebook.com/example\n\n👉 পেজটি Follow করুন\n👉 সর্বশেষ পোস্টে Like দিন\n📸 Screenshot সাবমিট করুন',link:'https://facebook.com',reward:50,isActive:true,createdAt:Date.now()});
          await fbPush('tasks',{platform:'YouTube',title:'Watch & Subscribe Channel',description:'ভিডিওটি ৩ মিনিট দেখুন:\nhttps://youtube.com\n\n👉 চ্যানেলটি Subscribe করুন\n📸 Screenshot সাবমিট করুন',link:'https://youtube.com',reward:30,isActive:true,createdAt:Date.now()});
        }
      }catch(e){console.warn('Background Firebase setup skipped:',e.message);}
    },50);
    try{wingoAutoEngine();}catch(e){console.warn('Wingo engine start skipped:',e.message);}
  }catch(e){console.error(e);showLogin();}
  finally{ldr(false);}
}

// ────────────────────────────────────────────────
// GEMINI AI WINGO RESULT ENGINE (ADMIN-ONLY KEY)
// Gemini is used only as an AI-assisted generator. It is not a real market feed.
let _geminiTimer=null,_geminiBusy=false,_geminiRun=false;
function geminiKey(){return localStorage.getItem('earnifybd_gemini_key')||'';}
function geminiCfg(){return {model:byId('s-gemini-model')?.value.trim()||'gemini-3.8-flash',interval:Math.max(3000,parseInt(byId('s-gemini-interval')?.value)||5000),modes:(byId('s-gemini-modes')?.value.trim()||'30s,1m,3m,5m').split(',').map(x=>x.trim()).filter(Boolean)};}
function geminiPeriodInfo(mode){const sec=mode==='30s'?30:mode==='1m'?60:mode==='3m'?180:300;const now=Math.floor(Date.now()/1000);return {period:Math.floor(now/sec)+1,remaining:sec-(now%sec),sec};}
function updateGeminiWingoStatus(ok,txt){const e=byId('gemini-wingo-status');if(!e)return;if(txt){e.textContent=txt;return;} e.textContent=_geminiRun?'🟢 Gemini Wingo running — Firebase results are being prepared for index.html.':(ok?'✅ Gemini settings saved — ready to run.':'⚪ Gemini Wingo idle — API key paste করে Save Gemini দিন.');}
async function callGeminiResult(mode,period){
  const key=geminiKey();if(!key)throw new Error('Gemini API key নেই');
  const cfg=geminiCfg();
  const prompt=`Return exactly one JSON object with result BIG or SMALL. This is an AI-assisted game result engine, not a financial-market prediction. Mode: ${mode}. Period: ${period}. Choose one result only.`;
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`;
  const body={contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{result:{type:'STRING',enum:['BIG','SMALL']}},required:['result']},maxOutputTokens:32}};
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),cache:'no-store'});
  if(!r.ok){let t='';try{t=await r.text()}catch{}throw new Error(`Gemini ${r.status} ${t.slice(0,160)}`);}
  const d=await r.json();
  const text=(d?.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('').trim();
  let parsed=null;try{parsed=JSON.parse(text)}catch(e){const m=text.match(/\{[\s\S]*\}/);if(m)try{parsed=JSON.parse(m[0])}catch{}}
  const result=String(parsed?.result||'').toUpperCase();
  if(result!=='BIG'&&result!=='SMALL')throw new Error('Gemini result parse failed');
  return result==='BIG'?'big':'small';
}
async function writeGeminiWingoResult(mode,period,manual=false){
  const path=(mode==='30s'?'wingoPeriods':`wingoPeriods_${mode}`)+`/${period}`;const old=await fbGet(path);if(old?.result)return old.result;
  const result=await callGeminiResult(mode,period);
  await fbSet(path,{result,type:'gemini-ai',source:'gemini',model:geminiCfg().model,createdAt:Date.now(),settled:false});
  updateGeminiWingoStatus(true,`🟢 Gemini result written • ${mode} #${period} • ${result.toUpperCase()}`);return result;
}
async function geminiTick(){
  if(!_geminiRun||_geminiBusy)return;
  const key=geminiKey();
  if(!key){updateGeminiWingoStatus(false,'🔴 Gemini API key নেই');return;}
  _geminiBusy=true;
  try{
    // Fair auto-result: never publish the current/future period while betting is open.
    // Generate only the period that has already ended.
    for(const mode of geminiCfg().modes){
      const x=geminiPeriodInfo(mode),endedPeriod=x.period-1;
      if(endedPeriod<1)continue;
      try{await writeGeminiWingoResult(mode,endedPeriod);}
      catch(e){console.warn('Gemini mode error',mode,e);updateGeminiWingoStatus(false,'🔴 '+e.message);}
    }
  }finally{_geminiBusy=false;}
}
async function saveGeminiSettings(){const key=byId('s-gemini-key')?.value||'';if(key)localStorage.setItem('earnifybd_gemini_key',key);else localStorage.removeItem('earnifybd_gemini_key');const cur=await getCfg();const patch={geminiModel:geminiCfg().model,geminiInterval:geminiCfg().interval,geminiModes:geminiCfg().modes.join(',')};await fbSet('config/settings',{...cur,...patch});_cfg={...cur,...patch};snack('✅ Gemini settings save হয়েছে');updateGeminiWingoStatus(true);return patch;}
async function testGeminiNow(){try{const key=byId('s-gemini-key')?.value||geminiKey();if(key)localStorage.setItem('earnifybd_gemini_key',key);const result=await callGeminiResult('1m',geminiPeriodInfo('1m').period);updateGeminiWingoStatus(true,`✅ Gemini test OK • ${result.toUpperCase()}`);snack('✅ Gemini API connected');}catch(e){updateGeminiWingoStatus(false,'🔴 '+e.message);snack('❌ Gemini test failed: '+e.message);}}
async function toggleGeminiWingo(){
  const cfg=await getCfg();
  if(_geminiRun){_geminiRun=false;if(_geminiTimer){clearInterval(_geminiTimer);_geminiTimer=null;}await fbUpd('config/settings',{geminiEnabled:false});_cfg={...cfg,geminiEnabled:false};const b=byId('gemini-wingo-btn');if(b)b.textContent='▶ Start AI Wingo';updateGeminiWingoStatus(false);return;}
  const key=byId('s-gemini-key')?.value||geminiKey();if(!key){snack('আগে Gemini API key দিন');return;}localStorage.setItem('earnifybd_gemini_key',key);await saveGeminiSettings();await fbUpd('config/settings',{geminiEnabled:true});_cfg={...cfg,geminiEnabled:true,...geminiCfg()};_geminiRun=true;const c=geminiCfg();const b=byId('gemini-wingo-btn');if(b)b.textContent='⏹ Stop AI Wingo';updateGeminiWingoStatus(true,'🟢 Gemini Wingo starting…');geminiTick();_geminiTimer=setInterval(geminiTick,c.interval);
}


function updateLmFutureMonitor(){
  try{
    const cur=document.getElementById('lmfm-current'), next=document.getElementById('lmfm-next'), cl=document.getElementById('lmfm-close'), dir=document.getElementById('lmfm-dir'), bars=document.getElementById('lmfm-bars'), body=document.getElementById('lmfm-candle-body'), label=document.getElementById('lmfm-proj-label'), sub=document.getElementById('lmfm-proj-sub'), projPeriod=document.getElementById('lmfm-proj-period'), projBias=document.getElementById('lmfm-proj-bias'), grid=document.getElementById('lmfm-future-grid');
    if(!cur||!next||!cl||!dir)return;
    const now=Date.now(),minute=Math.floor(now/60000),sec=Math.floor(now/1000)%60,remaining=60-sec;
    cur.textContent=String(minute); next.textContent=String(minute+1); cl.textContent=String(remaining).padStart(2,'0')+'s';
    let candles=[];
    const lf=window._lastMarketFeed&&Array.isArray(window._lastMarketFeed.candles)?window._lastMarketFeed.candles:[];
    const hist=Array.isArray(window._marketAdminHistory)?window._marketAdminHistory:[];
    if(lf.length)candles=lf.filter(Boolean).slice(-20); else if(hist.length)candles=hist.filter(Boolean).slice(-20);
    const ticks=(Array.isArray(window._marketAdminTicks)?window._marketAdminTicks:[]).filter(x=>x&&Number.isFinite(Number(x.price)));
    const live=Number.isFinite(Number(window._lastMarketFeed&&window._lastMarketFeed.price))||candles.length>0||ticks.length>1;
    const sourceLabel=live?'LIVE FEED':'LOCAL PREVIEW';
    let score=0,weight=0;
    for(let i=Math.max(0,candles.length-10);i<candles.length;i++){const o=Number(candles[i]?.o),c=Number(candles[i]?.c);if(!Number.isFinite(o)||!Number.isFinite(c))continue;const w=i-Math.max(0,candles.length-10)+1;score+=(c-o)*w;weight+=Math.abs(c-o)*w;}
    for(let i=Math.max(1,ticks.length-14);i<ticks.length;i++){const a=Number(ticks[i-1].price),b=Number(ticks[i].price);if(!Number.isFinite(a)||!Number.isFinite(b))continue;const w=i-Math.max(1,ticks.length-14)+1;score+=(b-a)*w*2;weight+=Math.abs(b-a)*w*2;}
    const baseUp=Math.abs(score)>1e-12?score>0:(((minute*1664525+1013904223)>>>0)&1)!==0;
    const dirs=[];let seed=(minute*1103515245+12345)>>>0;
    for(let i=1;i<=5;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed%7)-3;const bias=(score>0?1:-1);const up=score!==0?((bias+noise)>=0):((seed&1)!==0);dirs.push(up);}
    dirs[0]=baseUp;
    if(dirs.filter(Boolean).length===5)dirs[4]=false;
    if(!dirs.filter(Boolean).length)dirs[4]=true;
    const cls=baseUp?'up':'down';dir.textContent=baseUp?'GREEN ↑':'RED ↓';dir.className='lmfm-dir '+cls;if(body)body.className='lmfm-candle-body '+cls;if(label)label.textContent='NEXT CANDLE • '+(baseUp?'GREEN ↑':'RED ↓');if(sub)sub.textContent=live?'1-minute trend preview • directional estimate':'LOCAL PREVIEW • directional estimate';if(projPeriod)projPeriod.textContent=String(minute+1);if(projBias)projBias.textContent=baseUp?'GREEN ↑':'RED ↓';
    if(bars){let src=candles.slice(-10);if(!src.length&&ticks.length>1)src=ticks.slice(-10).map((x,i,a)=>({o:Number(i?a[i-1].price:x.price),c:Number(x.price)}));if(!src.length){let ps=1000;src=Array.from({length:10},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;const step=((seed/4294967296)-.5)*7,o=ps,c=o+step;ps=c;return{o,c};});}bars.innerHTML=src.map(c=>{const d=Number(c.c)-Number(c.o),k=d>0?'up':d<0?'down':'flat',ht=Math.max(14,Math.min(52,18+Math.round(Math.min(30,Math.abs(d)*6))));return '<div class="lmfm-bar '+k+'" style="height:'+ht+'px"></div>';}).join('');}
    if(grid){let gh='';for(let i=0;i<5;i++){const p=minute+1+i,up=dirs[i];gh+=`<div class="lmfm-future-card"><div class="lmfm-future-period">#${p}</div><div class="lmfm-future-candle"><div class="lmfm-future-body ${up?'up':'down'}"></div></div><div class="lmfm-future-label ${up?'up':'down'}">${up?'GREEN ↑':'RED ↓'}</div><div class="lmfm-future-src">preview only</div></div>`;}grid.innerHTML=gh;}
    const pill=document.querySelector('.lmfm-pill');if(pill){pill.textContent=sourceLabel;pill.style.color=live?'#4ade80':'#fbbf24';pill.style.borderColor=live?'rgba(34,197,94,.25)':'rgba(245,158,11,.25)';pill.style.background=live?'rgba(34,197,94,.10)':'rgba(245,158,11,.10)';}
  }catch(e){console.warn('future monitor',e);}
}
function startLmFutureMonitor(){
  updateLmFutureMonitor();
  if(window._lmFutureMonitorTimer)clearInterval(window._lmFutureMonitorTimer);
  window._lmFutureMonitorTimer=setInterval(updateLmFutureMonitor,1000);
}

window._marketAdminHistory=Array.isArray(window._marketAdminHistory)?window._marketAdminHistory:[];
window._marketAdminTicks=Array.isArray(window._marketAdminTicks)?window._marketAdminTicks:[];
window._lastMarketFeed=window._lastMarketFeed||null;
(function(){try{const href=firebase.database().ref('marketFeed/history');const hcb=s=>{window._marketAdminHistory=s.val()||[];updateLmFutureMonitor();};href.on('value',hcb);window._lmAdminHistoryOff=()=>href.off('value',hcb);const tref=firebase.database().ref('marketFeed/ticks');const tcb=s=>{window._marketAdminTicks=s.val()||[];if(!Array.isArray(window._marketTickHistory)||window._marketTickHistory.length<2)window._marketTickHistory=window._marketAdminTicks;updateLmFutureMonitor();};tref.on('value',tcb);window._lmAdminTicksOff=()=>tref.off('value',tcb);const ref=firebase.database().ref('marketFeed/live');const cb=s=>{window._lastMarketFeed=s.val()||null;updateLmFutureMonitor();};ref.on('value',cb);window._lmAdminFeedOff=()=>ref.off('value',cb);}catch(e){}})();
startLmFutureMonitor();window.addEventListener('load',startLmFutureMonitor);document.addEventListener('DOMContentLoaded',startLmFutureMonitor);

firebase.database().ref('.info/connected').on('value',s=>{if(s.val()===false)snack('⚠️ Internet নেই...');});
boot();


(function(){
function byId(id){return document.getElementById(id)}
function addFullControls(){
 const themeBox=document.querySelector('.addon-box'); if(themeBox&&!byId('s-loader-style')){
   themeBox.insertAdjacentHTML('beforeend',`<div class="divider"></div><div class="addon-box" style="margin-top:12px"><div class="addon-title">📡 Live Market API Bridge</div><div style="font-size:12px;color:var(--text2);margin:-4px 0 12px">Admin browser API থেকে quote নিয়ে Firebase-এ sanitized live price পাঠাবে। API key Firebase-এ save হবে না; শুধু এই admin browser-এর local storage-এ থাকবে.</div><div class="fg"><label class="flbl">API Endpoint</label><input class="fi" id="s-market-api-url" placeholder="https://provider.example/quote" type="url" autocomplete="off"></div><div class="grid2"><div class="fg"><label class="flbl">Symbol</label><input class="fi" id="s-market-api-symbol" value="GBPNZD" placeholder="GBPNZD"></div><div class="fg"><label class="flbl">Interval (ms)</label><input class="fi" id="s-market-api-interval" type="number" min="2000" step="1000" value="5000"></div></div><div class="grid2"><div class="fg"><label class="flbl">Auth Mode</label><select class="fsel" id="s-market-api-auth"><option value="none">No Auth</option><option value="bearer">Bearer Header</option><option value="header">Custom Header</option><option value="query">Query Parameter</option></select></div><div class="fg"><label class="flbl">Header Name</label><input class="fi" id="s-market-api-header" value="Authorization" placeholder="Authorization / x-api-key"></div></div><div class="fg"><label class="flbl">Query Key (for Query Auth)</label><input class="fi" id="s-market-api-query" value="apikey" placeholder="apikey"></div><div class="fg"><label class="flbl">API Key / Secret</label><input class="fi" id="s-market-api-key" type="password" autocomplete="off" placeholder="Admin browser-এ paste করুন"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-g" type="button" onclick="saveMarketApiSettings()">💾 Save API Config</button><button class="btn btn-ghost" type="button" onclick="testMarketApiNow()">🧪 Test API</button><button class="btn btn-gold" type="button" onclick="toggleMarketApiSync()" id="market-api-sync-btn">▶ Start Sync</button></div><div id="market-api-status" style="margin-top:10px;font-size:12px;padding:10px;border-radius:10px;background:var(--grayl);color:var(--text2)">API bridge idle — config save করে Start Sync দিন.</div></div><div class="divider"></div><div class="addon-box" style="margin-top:12px"><div class="addon-title">🤖 Gemini AI Wingo Result Engine</div><div style="font-size:12px;color:var(--text2);margin:-4px 0 12px;line-height:1.6">Gemini এখানে ফলাফল <b>predict</b> করে না; এটি একটি AI-assisted result generator। Admin browser Gemini-তে request পাঠাবে এবং নির্বাচিত BIG/SMALL result Firebase-এ লিখবে। API key Firebase-এ save হবে না।</div><div class="fg"><label class="flbl">Gemini API Key</label><input class="fi" id="s-gemini-key" type="password" autocomplete="off" placeholder="Google AI Studio Gemini API key paste করুন"></div><div class="grid2"><div class="fg"><label class="flbl">Gemini Model</label><input class="fi" id="s-gemini-model" value="gemini-3.8-flash" placeholder="gemini-3.8-flash"></div><div class="fg"><label class="flbl">Generate Interval (ms)</label><input class="fi" id="s-gemini-interval" type="number" min="3000" step="1000" value="5000"></div></div><div class="fg"><label class="flbl">Modes</label><input class="fi" id="s-gemini-modes" value="30s,1m,3m,5m" placeholder="30s,1m,3m,5m"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-g" type="button" onclick="saveGeminiSettings()">💾 Save Gemini</button><button class="btn btn-ghost" type="button" onclick="testGeminiNow()">🧪 Test Gemini</button><button class="btn btn-gold" type="button" onclick="toggleGeminiWingo()" id="gemini-wingo-btn">▶ Start AI Wingo</button></div><div id="wingo-fairness-note" style="margin-top:10px;font-size:11px;line-height:1.55;color:var(--text2);padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--grayl)">🔒 Fair-result mode: user betting window closes first; result is generated/published only after the period ends.\</div><div id="gemini-wingo-status" style="margin-top:10px;font-size:12px;padding:10px;border-radius:10px;background:var(--grayl);color:var(--text2)">Gemini Wingo idle — API key paste করে Save Gemini দিন.</div></div><div class="fg"><label class="flbl">Splash / Loader Design</label><select class="fsel" id="s-loader-style"><option value="modern">Modern Light</option><option value="minimal">Minimal</option><option value="premium">Premium Dark</option></select></div><div class="fg"><label class="flbl">Plan Badge Text</label><input class="fi" id="s-plan-badge" placeholder="যেমন: Daily Income Plan"></div><div class="fg"><label class="flbl">Popup Style</label><select class="fsel" id="s-popup-style"><option value="center">Center Popup</option><option value="toast">Toast Style</option></select></div>`);
 }
}
setTimeout(addFullControls,500);
const oldRenderSettings=window.renderSettings;
window.renderSettings=async function(){ await oldRenderSettings(); addFullControls(); const cfg=await getCfg(); if(byId('s-loader-style'))byId('s-loader-style').value=cfg.loaderStyle||'modern'; if(byId('s-plan-badge'))byId('s-plan-badge').value=cfg.planBadgeText||'Daily Income Plan'; if(byId('s-popup-style'))byId('s-popup-style').value=cfg.popupStyle||'center'; if(cfg.marketApiEnabled&&cfg.marketApiUrl&&marketApiKey()) setTimeout(()=>startMarketApiSync(),250); if(cfg.geminiEnabled&&geminiKey()) setTimeout(()=>{if(!_geminiRun){toggleGeminiWingo().catch(()=>{});}},350); };
window._marketApiTimer=null;
function marketApiKey(){return localStorage.getItem('earnifybd_market_api_key')||'';}
function updateMarketApiStatus(on,txt){
 const e=byId('market-api-status');if(!e)return;
 const run=on===true||window._marketApiTimer;
 e.textContent=txt||(run?'🟢 API bridge running — index.html will read live feed from Firebase.':'⚪ API bridge idle');
 e.style.background=run?'var(--gl)':'var(--grayl)';
}
function marketApiBuildUrl(url,symbol,auth,key,query){
 const sep=url.includes('?')?'&':'?';
 return auth==='query'&&key?url+sep+encodeURIComponent(query||'apikey')+'='+encodeURIComponent(key)+'&symbol='+encodeURIComponent(symbol):url+sep+'symbol='+encodeURIComponent(symbol);
}
function marketApiExtract(d){
 const price=Number(d?.price??d?.close??d?.last??d?.quote?.close??d?.quote?.price??d?.data?.price??d?.data?.close);
 const arr=d?.candles||d?.data?.candles||d?.results?.candles||null;
 let candles=null;
 if(Array.isArray(arr)) candles=arr.map(x=>({
   t:Number(x.t??x.time??x.timestamp??x[0])*1000||Date.now(),
   o:Number(x.o??x.open??x[1]),h:Number(x.h??x.high??x[2]),l:Number(x.l??x.low??x[3]),c:Number(x.c??x.close??x[4])
 })).filter(x=>[x.o,x.h,x.l,x.c].every(Number.isFinite));
 return {price,candles};
}
async function callMarketApi(){
 const url=byId('s-market-api-url')?.value.trim()||'';
 const symbol=(byId('s-market-api-symbol')?.value.trim()||'GBPNZD').toUpperCase();
 const auth=byId('s-market-api-auth')?.value||'bearer';
 const header=byId('s-market-api-header')?.value.trim()||'Authorization';
 const query=byId('s-market-api-query')?.value.trim()||'apikey';
 const key=byId('s-market-api-key')?.value||marketApiKey();
 if(!url)throw new Error('API Endpoint দিন');
 if((auth!=='none')&&!key)throw new Error('API Key দিন');
 const finalUrl=marketApiBuildUrl(url,symbol,auth,key,query);
 const headers={accept:'application/json'};
 if(auth==='bearer')headers['Authorization']='Bearer '+key;
 else if(auth==='header')headers[header]=key;
 const r=await fetch(finalUrl,{headers,cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
 const d=await r.json();const out=marketApiExtract(d);if(!Number.isFinite(out.price))throw new Error('price/close field পাওয়া যায়নি');
 return {...out,symbol,ts:Date.now()};
}
let _marketCandleState=null;let _marketCandleHistory=[];let _marketTickHistory=[];
async function recordMarketCandle(price,ts){
 const p=Math.floor(Number(ts||Date.now())/60000);price=Number(price);if(!Number.isFinite(price))return;
 _marketTickHistory.push({p,price,ts:Number(ts||Date.now())});_marketTickHistory=_marketTickHistory.slice(-120);try{await fbSet('marketFeed/ticks',_marketTickHistory);}catch(e){}
 if(!_marketCandleState||Number(_marketCandleState._period)!==p){
   if(_marketCandleState&&Number.isFinite(_marketCandleState.c)) _marketCandleHistory.push({..._marketCandleState});
   _marketCandleState={_period:p,o:price,h:price,l:price,c:price};
 }else{_marketCandleState.c=price;_marketCandleState.h=Math.max(_marketCandleState.h,price);_marketCandleState.l=Math.min(_marketCandleState.l,price);}
 _marketCandleHistory=_marketCandleHistory.slice(-59);
 const candles=[..._marketCandleHistory,_marketCandleState];
 window._lastMarketFeed={...(window._lastMarketFeed||{}),candles};
 try{await fbSet('marketFeed/history',candles);}catch(e){}
 return candles;
}
async function publishMarketApiQuote(showToast=false){
 try{
   const out=await callMarketApi();
   const liveCandles=await recordMarketCandle(out.price,out.ts);
   const providerCandles=Array.isArray(out.candles)&&out.candles.length?out.candles:liveCandles;
   window._lastMarketFeed={price:out.price,symbol:out.symbol,ts:out.ts,source:'admin-api',candles:providerCandles||null}; await fbSet('marketFeed/live',{price:out.price,symbol:out.symbol,ts:out.ts,source:'admin-api',candles:providerCandles||null});
   updateMarketApiStatus(true,'🟢 Live API connected — ৳/quote '+out.price+' • '+new Date(out.ts).toLocaleTimeString('en-BD'));
   if(showToast)snack('✅ API connected: '+out.price);
   return out;
 }catch(e){
   updateMarketApiStatus(false,'🔴 API error: '+(e?.message||e));
   if(showToast)snack('❌ API error: '+(e?.message||e));
   return null;
 }
}
window.saveMarketApiSettings=async function(){
 const key=byId('s-market-api-key')?.value||'';
 if(key)localStorage.setItem('earnifybd_market_api_key',key);else localStorage.removeItem('earnifybd_market_api_key');
 const cur=await getCfg();
 const patch={marketApiEnabled:!!(byId('s-market-api-url')?.value.trim()),marketApiUrl:byId('s-market-api-url')?.value.trim()||'',marketApiSymbol:(byId('s-market-api-symbol')?.value.trim()||'GBPNZD').toUpperCase(),marketApiAuth:byId('s-market-api-auth')?.value||'bearer',marketApiHeader:byId('s-market-api-header')?.value.trim()||'Authorization',marketApiQuery:byId('s-market-api-query')?.value.trim()||'apikey',marketApiInterval:Math.max(2000,parseInt(byId('s-market-api-interval')?.value)||5000)};
 await fbUpd('config/settings',patch);_cfg={...cur,...patch};
 if(window._marketApiTimer)stopMarketApiSync();
 snack('✅ Market API config saved');
}
window.testMarketApiNow=async function(){
 const key=byId('s-market-api-key')?.value||marketApiKey();if(key)localStorage.setItem('earnifybd_market_api_key',key);
 await publishMarketApiQuote(true);
}
window.startMarketApiSync=function(){
 if(window._marketApiTimer)clearInterval(window._marketApiTimer);
 const interval=Math.max(2000,parseInt(byId('s-market-api-interval')?.value)||5000);
 window._marketApiTimer=setInterval(()=>publishMarketApiQuote(false),interval);
 publishMarketApiQuote(false);
 const b=byId('market-api-sync-btn');if(b)b.textContent='⏹ Stop Sync';
 updateMarketApiStatus(true);
}
window.stopMarketApiSync=function(){if(window._marketApiTimer){clearInterval(window._marketApiTimer);window._marketApiTimer=null;}const b=byId('market-api-sync-btn');if(b)b.textContent='▶ Start Sync';updateMarketApiStatus(false);}
window.toggleMarketApiSync=async function(){
 const key=byId('s-market-api-key')?.value||marketApiKey();if(key)localStorage.setItem('earnifybd_market_api_key',key);
 if(window._marketApiTimer){stopMarketApiSync();return;}
 const url=byId('s-market-api-url')?.value.trim();if(!url){snack('আগে API Endpoint দিন');return;}
 startMarketApiSync();
}
const oldSaveSettings=window.saveSettings;
window.saveSettings=async function(){
 await oldSaveSettings();
 const apiPatch={marketApiUrl:byId('s-market-api-url')?.value.trim()||'',marketApiSymbol:(byId('s-market-api-symbol')?.value.trim()||'GBPNZD').toUpperCase(),marketApiAuth:byId('s-market-api-auth')?.value||'bearer',marketApiHeader:byId('s-market-api-header')?.value.trim()||'Authorization',marketApiQuery:byId('s-market-api-query')?.value.trim()||'apikey',marketApiInterval:Math.max(2000,parseInt(byId('s-market-api-interval')?.value)||5000)};
 const patch={loaderStyle:byId('s-loader-style')?.value||'modern',planBadgeText:byId('s-plan-badge')?.value||'Daily Income Plan',popupStyle:byId('s-popup-style')?.value||'center',...apiPatch};
 await fbUpd('config/settings',patch);
 const key=byId('s-market-api-key')?.value||''; if(key)localStorage.setItem('earnifybd_market_api_key',key);
 snack('✅ Extra UI controls saved');
};
const oldOpenUser=window.openUser;
window.openUser=async function(uid){ await oldOpenUser(uid); addSuspendControls(uid); };
window.addSuspendControls=async function(uid){
 const cont=byId('s-user-detail')?.querySelector('.content'); if(!cont||byId('suspend-box'))return; const u=await fbGet(`users/${uid}`)||{};
 const box=document.createElement('div'); box.id='suspend-box'; box.className='suspend-box'; box.innerHTML=`<div style="font-weight:900;margin-bottom:10px;color:var(--red)">🚫 Ban / Suspend Control</div><div class="fg"><label class="flbl">Suspend/Ban Reason</label><input class="fi" id="sus-reason" value="${esc(u.suspendReason||'')}" placeholder="Reason লিখুন"></div><div class="btn-row"><button class="btn btn-red btn-sm" style="flex:1" onclick="suspendUser('${uid}')">🚫 Suspend</button><button class="btn btn-g btn-sm" style="flex:1" onclick="unsuspendUser('${uid}')">✅ Unsuspend</button></div><div style="font-size:12px;color:var(--text2)">Current: ${u.suspended?'Suspended':'Normal'} ${u.suspendReason?'— '+esc(u.suspendReason):''}</div>`;
 cont.insertBefore(box,cont.children[1]||null);
};
window.suspendUser=async function(uid){const reason=byId('sus-reason')?.value.trim()||'Admin suspended this account'; await fbUpd(`users/${uid}`,{suspended:true,suspendReason:reason,isActive:false}); await fbPush('notifications',{userId:uid,type:'danger',title:'🚫 Account Suspended',body:reason,createdAt:Date.now()}); snack('🚫 User suspended'); byId('suspend-box')?.remove(); openUser(uid);};
window.unsuspendUser=async function(uid){await fbUpd(`users/${uid}`,{suspended:false,suspendReason:''}); await fbPush('notifications',{userId:uid,type:'success',title:'✅ Account Unsuspended',body:'আপনার account আবার চালু করা হয়েছে।',createdAt:Date.now()}); snack('✅ User unsuspended'); byId('suspend-box')?.remove(); openUser(uid);};
const oldApproveDeposit=window.approveDeposit;
window.approveDeposit=async function(id){const txn=await fbGet(`txns/${id}`); await oldApproveDeposit(id); if(txn){await fbPush('notifications',{userId:txn.userId,type:'deposit',title:txn.type==='activation'?'✅ Account Activated':'✅ Deposit Approved',body:`${fmtN(txn.amount)} approved হয়েছে।`,createdAt:Date.now()});}};
const oldApproveWd=window.approveWd;
window.approveWd=async function(id){const txn=await fbGet(`txns/${id}`); await oldApproveWd(id); if(txn){await fbPush('notifications',{userId:txn.userId,type:'withdraw',title:'⬆️ Withdraw Approved',body:`${fmtN(txn.amount)} sent/approved হয়েছে।`,createdAt:Date.now()});}};
const oldRejectTxn=window.rejectTxn;
window.rejectTxn=async function(id,type){const txn=await fbGet(`txns/${id}`); let reason=prompt('Reject reason লিখুন (optional):','')||''; await oldRejectTxn(id,type); if(txn){await fbUpd(`txns/${id}`,{adminNote:reason}); await fbPush('notifications',{userId:txn.userId,type:'danger',title:type==='wd'?'❌ Withdraw Rejected':'❌ Deposit Rejected',body:reason||'Admin request reject করেছেন।',createdAt:Date.now()});}};
const oldApproveProof=window.approveProof;
window.approveProof=async function(id){const sub=await fbGet(`subs/${id}`); await oldApproveProof(id); if(sub){await fbPush('notifications',{userId:sub.userId,type:'success',title:'✅ Task Approved',body:'Task reward balance এ যোগ হয়েছে।',createdAt:Date.now()});}};
const oldRejectProof=window.rejectProof;
window.rejectProof=async function(id){const sub=await fbGet(`subs/${id}`); let reason=prompt('Task reject reason লিখুন (optional):','')||''; await oldRejectProof(id); if(sub){await fbPush('notifications',{userId:sub.userId,type:'danger',title:'❌ Task Rejected',body:reason||'Task proof reject হয়েছে।',createdAt:Date.now()});}};
})();


setTimeout(()=>{try{ldr(false);if(!isAuth())showLogin();}catch(e){const x=document.getElementById('loader');if(x)x.classList.add('h');}},9000);


(function(){
  'use strict';
  const PVKEY='earnifybd_admin_preview_v3';
  const OVKEY=PVKEY+'__lm';
  const $=id=>document.getElementById(id);
  const safeRead=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const safeWrite=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const hash32=s=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0};

  // Same smooth candle boundary formula used by the member-side simulated
  // Live Market. Each candle opens at the previous candle close, so the chart
  // reads as one continuous price series instead of disconnected candles.
  function syntheticBoundaryPrice(period){
    const p=Number(period)||0;
    const v=1.90920
      +Math.sin(p*0.173)*0.00034
      +Math.sin(p*0.071+1.70)*0.00023
      +Math.sin(p*0.019+0.55)*0.00046
      +Math.sin(p*0.0041+2.10)*0.00078;
    return Number(v.toFixed(5));
  }
  function simulatedDirection(period){
    return syntheticBoundaryPrice(period)>=syntheticBoundaryPrice(Number(period)-1)?'GREEN':'RED';
  }

  function getLmOverrides(){return safeRead(OVKEY,{})||{}}
  function setLmOverride(period,val){const o=getLmOverrides();if(val==='AUTO')delete o[period];else o[period]=val;safeWrite(OVKEY,o);return o;}
  function currentSource(){
    const f=window._lastMarketFeed;
    const ts=Number(f?.ts||0);
    const fresh=!!ts && (Date.now()-ts)<12000;
    const source=String(f?.source||'').toLowerCase();
    const hasLive=!!(fresh && (source==='admin-api' || source==='provider' || source==='live-api') && Number.isFinite(Number(f?.price)));
    return hasLive?'LIVE FEED':'SIMULATED';
  }
  function getInputs(){
    const now=Date.now(), period=Math.floor(now/60000)+1, sec=Math.floor(now/1000)%60, remaining=60-sec;
    const lf=Array.isArray(window._lastMarketFeed?.candles)?window._lastMarketFeed.candles:[];
    const hist=Array.isArray(window._marketAdminHistory)?window._marketAdminHistory:[];
    const ticks=Array.isArray(window._marketAdminTicks)?window._marketAdminTicks:[];
    const candles=(lf.length?lf:hist).filter(Boolean).slice(-20);
    return {now,period,sec,remaining,candles,ticks};
  }
  function serverSignal(period){
    const f=window._lastMarketFeed||{};
    const maps=[f.nextSignals,f.signals,f.directionByPeriod,f.nextDirectionByPeriod];
    for(const map of maps){
      if(map&&map[period]!=null){const v=String(map[period]).toUpperCase();if(v.includes('GREEN')||v==='UP')return'GREEN';if(v.includes('RED')||v==='DOWN')return'RED';}
    }
    const n=f.nextSignal??f.nextDirection;
    if(n!=null){const v=String(n).toUpperCase();if(v.includes('GREEN')||v==='UP')return'GREEN';if(v.includes('RED')||v==='DOWN')return'RED';}
    return '';
  }
  function autoDirection(period,input){
    // The admin monitor is read-only. In LIVE FEED mode it never invents a
    // future direction that the member market does not also receive. In the
    // built-in simulated mode both sides use the same deterministic period
    // seed, so the preview cannot disagree with the member chart.
    const live=currentSource()==='LIVE FEED';
    if(live){return 'WAITING';}
    return simulatedDirection(period);
  }
  function ensureGridCards(period){
    const grid=$('lmfm-future-grid');if(!grid)return;
    const key=String(period);
    if(grid.dataset.minute===key&&grid.querySelector('.lmfm-preview-btn'))return;
    let html='';
    for(let i=0;i<5;i++){
      const p=period+1+i;
      html+=`<div class="lmfm-future-card" data-lm-period="${p}">
        <div class="lmfm-future-period">#${p}</div>
        <div class="lmfm-future-candle"><div class="lmfm-future-body flat" data-role="body"></div></div>
        <div class="lmfm-future-label" data-role="label">WAITING</div>
        <div class="lmfm-future-src" data-role="src">SYNC PENDING</div>
        <div class="lmfm-future-controls">
          <button type="button" class="lmfm-preview-btn" data-lm-control="1" data-v="AUTO">AUTO</button>
          <button type="button" class="lmfm-preview-btn" data-lm-control="1" data-v="GREEN">GREEN</button>
          <button type="button" class="lmfm-preview-btn" data-lm-control="1" data-v="RED">RED</button>
        </div>
        <div class="lmfm-control-note">display preview only</div>
      </div>`;
    }
    grid.innerHTML=html;grid.dataset.minute=key;
  }
  function paintCard(card,dir,manual){
    const body=card.querySelector('[data-role="body"]');
    const label=card.querySelector('[data-role="label"]');
    const src=card.querySelector('[data-role="src"]');
    const waiting=dir==='WAITING';
    if(body)body.className='lmfm-future-body '+(waiting?'flat':(dir==='GREEN'?'up':'down'));
    if(label){label.textContent=waiting?'WAITING':(dir==='GREEN'?'GREEN ↑':'RED ↓');label.className='lmfm-future-label '+(waiting?'':(dir==='GREEN'?'up':'down'));}
    if(src)src.textContent=manual?'MANUAL PREVIEW':(waiting?'SYNC PENDING':'SYNCED PREVIEW');
    card.querySelectorAll('.lmfm-preview-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===dir&&(manual||dir==='AUTO')));
  }
  function refreshCards(input){
    const grid=$('lmfm-future-grid');if(!grid)return;
    ensureGridCards(input.period);
    const ov=getLmOverrides();
    Array.from(grid.querySelectorAll('.lmfm-future-card')).forEach(card=>{
      const p=Number(card.dataset.lmPeriod);
      const manual=Object.prototype.hasOwnProperty.call(ov,p);
      const auto=autoDirection(p,input);
      paintCard(card,manual?ov[p]:auto,manual);
    });
  }
  window.updateLmFutureMonitor=function(){
    try{
      const input=getInputs();
      const cur=$('lmfm-current'),next=$('lmfm-next'),cl=$('lmfm-close'),dir=$('lmfm-dir'),body=$('lmfm-candle-body'),label=$('lmfm-proj-label'),sub=$('lmfm-proj-sub'),pp=$('lmfm-proj-period'),pb=$('lmfm-proj-bias');
      if(cur)cur.textContent=String(input.period);
      if(next)next.textContent=String(input.period+1);
      if(cl)cl.textContent=String(input.remaining).padStart(2,'0')+'s';
      const ov=getLmOverrides();
      const nextPeriod=input.period+1;
      // Main monitor always reflects the actual synchronized market source.
      // Local GREEN/RED buttons are test-preview controls only and must never
      // be allowed to change the signal shown as the live market outcome.
      const nextDir=autoDirection(nextPeriod,input);
      if(nextDir==='WAITING'){
        if(dir){dir.textContent='SYNC WAIT';dir.className='lmfm-dir neutral'}
        if(body)body.className='lmfm-candle-body flat';
        if(label)label.textContent='NEXT CANDLE • SYNC WAIT';
        if(sub)sub.textContent='Server feed has not published a next-candle signal';
        if(pp)pp.textContent=String(nextPeriod);if(pb)pb.textContent='—';
      }else{
        if(dir){dir.textContent=nextDir==='GREEN'?'GREEN ↑':'RED ↓';dir.className='lmfm-dir '+(nextDir==='GREEN'?'up':'down')}
        if(body)body.className='lmfm-candle-body '+(nextDir==='GREEN'?'up':'down');
        if(label)label.textContent='NEXT CANDLE • '+(nextDir==='GREEN'?'GREEN ↑':'RED ↓');
        if(sub)sub.textContent=currentSource()==='LIVE FEED'?'Server-supplied next-candle signal • synchronized':'Simulated next-candle signal • synchronized';
        if(pp)pp.textContent=String(nextPeriod);if(pb)pb.textContent=nextDir==='GREEN'?'GREEN ↑':'RED ↓';
      }
      const bars=$('lmfm-bars');
      if(bars){
        let src=input.candles.slice(-10);
        if(!src.length&&input.ticks.length>1)src=input.ticks.slice(-10).map((x,i,a)=>({o:Number(i?a[i-1].price:x.price),c:Number(x.price)}));
        bars.innerHTML=src.map(c=>{const d=Number(c.c)-Number(c.o),k=d>0?'up':d<0?'down':'flat',ht=Math.max(14,Math.min(52,18+Math.round(Math.min(30,Math.abs(d)*6))));return '<div class="lmfm-bar '+k+'" style="height:'+ht+'px"></div>'}).join('');
      }
      const pill=document.querySelector('#lm-future-monitor .lmfm-pill');
      const live=currentSource()==='LIVE FEED';
      if(pill){pill.textContent=live?'LIVE FEED':'SIMULATED • SYNCED';pill.style.color=live?'#4ade80':'#60a5fa';pill.style.borderColor=live?'rgba(34,197,94,.25)':'rgba(96,165,250,.25)';pill.style.background=live?'rgba(34,197,94,.10)':'rgba(96,165,250,.10)'}
      refreshCards(input);
    }catch(e){console.warn('Live Market admin preview fix',e)}
  };
  if(window._lmFutureMonitorTimer)clearInterval(window._lmFutureMonitorTimer);
  window._lmFutureMonitorTimer=setInterval(window.updateLmFutureMonitor,1000);
  const grid=$('lmfm-future-grid');
  if(grid&&!grid.dataset.bound){
    grid.dataset.bound='1';
    grid.addEventListener('click',ev=>{
      const btn=ev.target.closest('[data-lm-control]');if(!btn)return;
      const card=btn.closest('.lmfm-future-card');if(!card)return;
      ev.preventDefault();
      const p=Number(card.dataset.lmPeriod),v=btn.dataset.v||'AUTO';
      setLmOverride(p,v);
      const input=getInputs(),ov=getLmOverrides();
      const actual=v==='AUTO'?autoDirection(p,input):v;
      paintCard(card,actual,v!=='AUTO');
      snack('✅ Period #'+p+' '+(v==='AUTO'?'AUTO • synchronized preview':('MANUAL • '+v+' display preview'))+' saved');
    });
  }
  window.refreshAdminPreviews=function(){
    try{safeWrite(PVKEY,{nonce:Date.now()});window.updateLmFutureMonitor();snack('✅ Preview refreshed');if(typeof renderWingoAdmin==='function')renderWingoAdmin();}catch(e){snack('Preview refresh failed')}
  };
  document.addEventListener('DOMContentLoaded',()=>setTimeout(window.updateLmFutureMonitor,120));
  window.addEventListener('load',()=>setTimeout(window.updateLmFutureMonitor,120));
  setTimeout(window.updateLmFutureMonitor,50);
})();


(function(){
  'use strict';
  const AV={roundSec:15,betSec:7,minBet:1,maxBet:10000,maxMult:100,floor:1.01};
  const byId=id=>document.getElementById(id);
  const periodNow=()=>Math.floor(Date.now()/1000/AV.roundSec);
  const cryptoUnit=()=>{try{const a=new Uint32Array(1);crypto.getRandomValues(a);return(a[0]+1)/4294967297}catch(_){return Math.random()}};
  const makeCrash=()=>{const u=cryptoUnit();let x=AV.floor+(-Math.log(1-u))*2;if(u<.025)x=AV.floor+u*2.2;return Math.max(AV.floor,Math.min(AV.maxMult,Number(x.toFixed(2))))};
  async function getOrCommit(period){
    const path='aviatorRounds/'+period;
    let r=await fbGet(path);
    if(r?.crashAt)return{...r,committed:true};
    const candidate={period,crashAt:makeCrash(),createdAt:Date.now(),bettingOpenAt:period*AV.roundSec*1000,bettingCloseAt:period*AV.roundSec*1000+AV.betSec*1000,type:'committed-demo-round',rules:{roundSec:AV.roundSec,bettingSec:AV.betSec,minBet:AV.minBet,maxBet:AV.maxBet,maxSlots:2,minAuto:1.01,maxMultiplier:AV.maxMult}};
    try{const tx=await firebase.database().ref(path).transaction(cur=>cur?.crashAt?cur:candidate);r=tx?.snapshot?.val()||await fbGet(path);}catch(e){r=await fbGet(path)}
    return r?.crashAt?{...r,committed:true}:{...candidate,committed:false};
  }
  function render(current,next){
    const sec=Math.floor((Date.now()/1000)%AV.roundSec);
    const phase=sec<AV.betSec?'BETTING':'FLYING';
    if(byId('ava-current'))byId('ava-current').textContent=String(current?.period??periodNow());
    if(byId('ava-phase'))byId('ava-phase').textContent=phase;
    if(byId('ava-close'))byId('ava-close').textContent=phase==='BETTING'?String(Math.max(0,AV.betSec-sec))+'s':'Closed';
    if(byId('ava-next-period'))byId('ava-next-period').textContent=String(next?.period??(periodNow()+1));
    const x=byId('ava-next-x'),st=byId('ava-next-status'),pill=byId('ava-pill');
    if(next?.committed&&next.crashAt){if(x)x.textContent=Number(next.crashAt).toFixed(2)+'x';if(st)st.textContent='Pre-committed in Firebase • read-only audit';if(pill){pill.textContent='COMMITTED';pill.style.color='#6ee7a1'}}
    else{if(x)x.textContent='—';if(st)st.textContent='Could not verify a Firebase commit yet';if(pill){pill.textContent='UNVERIFIED';pill.style.color='#fbbf24'}}
  }
  let busy=false;
  window.refreshAviatorAdminMonitor=async function(){
    if(busy)return;busy=true;
    try{const p=periodNow();const [cur,next]=await Promise.all([getOrCommit(p),getOrCommit(p+1)]);render(cur,next);}catch(e){console.warn('Aviator admin audit',e);if(byId('ava-next-status'))byId('ava-next-status').textContent='Firebase audit read failed';}finally{busy=false}
  };
  function start(){window.refreshAviatorAdminMonitor();if(window._avaAdminTimer)clearInterval(window._avaAdminTimer);window._avaAdminTimer=setInterval(window.refreshAviatorAdminMonitor,1000)}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(start,350));
  window.addEventListener('load',()=>setTimeout(start,350));
})();


(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function periodInfo(){const now=Math.floor(Date.now()/1000),p=Math.floor(now/60)+1,sec=now%60;return{period:p,sec,remaining:60-sec};}
  function direction(period){
    const f=window._lastMarketFeed||{},maps=[f.nextSignals,f.signals,f.directionByPeriod,f.nextDirectionByPeriod];
    for(const map of maps){if(map&&map[period]!=null){const v=String(map[period]).toUpperCase();if(v.includes('GREEN')||v==='UP')return'GREEN';if(v.includes('RED')||v==='DOWN')return'RED';}}
    const n=f.nextSignal??f.nextDirection;if(n!=null){const v=String(n).toUpperCase();if(v.includes('GREEN')||v==='UP')return'GREEN';if(v.includes('RED')||v==='DOWN')return'RED';}
    const source=String(f.source||'').toLowerCase(),ts=Number(f.ts||0),fresh=ts>0&&(Date.now()-ts<12000),live=fresh&&(source==='admin-api'||source==='provider'||source==='live-api')&&Number.isFinite(Number(f.price));
    if(live)return'WAITING';
    const p=Number(period)||0;
    const priceNow=1.90920+Math.sin(p*0.173)*0.00034+Math.sin(p*0.071+1.70)*0.00023+Math.sin(p*0.019+0.55)*0.00046+Math.sin(p*0.0041+2.10)*0.00078;
    const q=p-1;
    const pricePrev=1.90920+Math.sin(q*0.173)*0.00034+Math.sin(q*0.071+1.70)*0.00023+Math.sin(q*0.019+0.55)*0.00046+Math.sin(q*0.0041+2.10)*0.00078;
    return priceNow>=pricePrev?'GREEN':'RED';
  }
  function sourceLabel(){const f=window._lastMarketFeed||{},source=String(f.source||'').toLowerCase(),ts=Number(f.ts||0),fresh=ts>0&&(Date.now()-ts<12000);return(fresh&&(source==='admin-api'||source==='provider'||source==='live-api'))?'LIVE FEED':'SIMULATED • SYNCED';}
  function paint(){
    try{
      const x=periodInfo(),cur=x.period,next=x.period+1,dir=direction(next);
      if($('lmfm-current'))$('lmfm-current').textContent=String(cur);
      if($('lmfm-next'))$('lmfm-next').textContent=String(next);
      if($('lmfm-close'))$('lmfm-close').textContent=String(x.remaining).padStart(2,'0')+'s';
      if($('lmfm-proj-period'))$('lmfm-proj-period').textContent=String(next);
      const de=$('lmfm-dir'),body=$('lmfm-candle-body'),lab=$('lmfm-proj-label'),sub=$('lmfm-proj-sub'),bias=$('lmfm-proj-bias');
      if(dir==='WAITING'){
        if(de){de.textContent='SYNC WAIT';de.className='lmfm-dir neutral'}
        if(body)body.className='lmfm-candle-body flat';
        if(lab)lab.textContent='NEXT CANDLE • SYNC WAIT';
        if(sub)sub.textContent='No authoritative next-candle signal has been published';
        if(bias)bias.textContent='—';
      }else{
        const up=dir==='GREEN';
        if(de){de.textContent=up?'GREEN ↑':'RED ↓';de.className='lmfm-dir '+(up?'up':'down')}
        if(body)body.className='lmfm-candle-body '+(up?'up':'down');
        if(lab)lab.textContent='NEXT CANDLE • '+(up?'GREEN ↑':'RED ↓');
        if(sub)sub.textContent=sourceLabel()==='SIMULATED • SYNCED'?'Same period-seeded signal used by member market':'Provider-supplied next-candle signal';
        if(bias)bias.textContent=up?'GREEN ↑':'RED ↓';
      }
      const pill=document.querySelector('#lm-future-monitor .lmfm-pill');if(pill){const live=sourceLabel()==='LIVE FEED';pill.textContent=sourceLabel();pill.style.color=live?'#4ade80':'#60a5fa';pill.style.borderColor=live?'rgba(34,197,94,.25)':'rgba(96,165,250,.25)';pill.style.background=live?'rgba(34,197,94,.10)':'rgba(96,165,250,.10)'}
      const grid=$('lmfm-future-grid');if(grid){Array.from(grid.querySelectorAll('.lmfm-future-card')).forEach((card,i)=>{const p=next+i,d=direction(p),lbl=card.querySelector('[data-role="label"]'),bd=card.querySelector('[data-role="body"]'),src=card.querySelector('[data-role="src"]');const ovKey='earnifybd_admin_preview_v3__lm';let manual='';try{const o=JSON.parse(localStorage.getItem(ovKey)||'{}');manual=o[p]||''}catch(_){}const showDir=manual||d;if(lbl){lbl.textContent=showDir==='WAITING'?'WAITING':(showDir==='GREEN'?'GREEN ↑':'RED ↓');lbl.className='lmfm-future-label '+(showDir==='GREEN'?'up':showDir==='RED'?'down':'')}if(bd)bd.className='lmfm-future-body '+(showDir==='GREEN'?'up':showDir==='RED'?'down':'flat');if(src)src.textContent=manual?'MANUAL PREVIEW':(d==='WAITING'?'SYNC PENDING':'SYNCED WITH MEMBER')});}
    }catch(e){console.warn('authoritative market monitor',e)}
  }
  if(window._lmFutureMonitorTimer)clearInterval(window._lmFutureMonitorTimer);
  window.updateLmFutureMonitor=paint;window._lmFutureMonitorTimer=setInterval(paint,1000);setTimeout(paint,50);
})();
