/* EarnifyBD Aviator-style crash game.
 * Fairness/production note: round outcomes are committed to Firebase before betting.
 * This client-side implementation is for UI/testing. Real-money deployment should move
 * round generation + settlement to a trusted server function and expose only audit data.
 */
(function(){
  'use strict';

  const RULES=Object.freeze({
    roundSec:15,
    bettingSec:7,
    minBet:1,
    maxBet:10000,
    maxSlots:2,
    minAuto:1.01,
    maxMultiplier:100,
    crashFloor:1.01,
    refreshMs:100
  });

  const state={
    round:null, phase:'betting', countdown:RULES.bettingSec, multiplier:1, crashAt:2,
    timer:0, toast:0, lastBalRead:0, initialized:false, history:[], lastPeriod:null, historyOff:null,
    flyingSoundAt:0, audioCtx:null, audioEnabled:true,
    slots:[0,1].map(()=>({amount:RULES.minBet,bet:false,cashout:false,auto:null,payout:0,pending:false}))
  };

  const $=id=>document.getElementById(id);
  const bridge=()=>window.EarnifyBridge||{};
  const uid=()=>bridge().myUID?.();
  const money=v=>Math.max(0,Number(bridge().parseMoney?.(v)||0));
  const show=m=>{const el=$('av-toast');if(!el)return;el.textContent=m;el.classList.add('show');clearTimeout(state.toast);state.toast=setTimeout(()=>el.classList.remove('show'),1800)};
  const roundInfo=()=>{const now=Math.floor(Date.now()/1000);const period=Math.floor(now/RULES.roundSec);const sec=now%RULES.roundSec;return{period,sec}};
  const cryptoUnit=()=>{try{const a=new Uint32Array(1);crypto.getRandomValues(a);return (a[0]+1)/4294967297}catch(_){return Math.random()}};
  const makeCrash=()=>{
    const u=cryptoUnit();
    // Right-skewed crash distribution with a bounded demo maximum.
    let x=RULES.crashFloor+(-Math.log(1-u))*2.0;
    if(u<.025)x=RULES.crashFloor+u*2.2;
    return Math.max(RULES.crashFloor,Math.min(RULES.maxMultiplier,Number(x.toFixed(2))));
  };

  async function ensureRound(period){
    const path=`aviatorRounds/${period}`;
    let r=await bridge().fbGet?.(path);
    if(r?.crashAt)return r;
    const candidate={
      period,
      crashAt:makeCrash(),
      createdAt:Date.now(),
      bettingOpenAt:period*RULES.roundSec*1000,
      bettingCloseAt:period*RULES.roundSec*1000+RULES.bettingSec*1000,
      type:'committed-demo-round',
      rules:{...RULES}
    };
    try{
      const tx=await window.firebase?.database?.().ref(path).transaction(cur=>cur?.crashAt?cur:candidate);
      r=tx?.snapshot?.val()||await bridge().fbGet?.(path);
    }catch(_){r=await bridge().fbGet?.(path);}
    return r||candidate;
  }

  function audioOn(){
    if(localStorage.getItem('earnifybd_av_sound')==='0')state.audioEnabled=false;
    else state.audioEnabled=true;
    const b=$('av-sound');if(b)b.textContent=state.audioEnabled?'🔊':'🔇';
  }
  function audioContext(){
    if(!state.audioEnabled)return null;
    try{
      if(!state.audioCtx)state.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      if(state.audioCtx.state==='suspended')state.audioCtx.resume().catch(()=>{});
      return state.audioCtx;
    }catch(_){return null}
  }
  function tone(freq=440,duration=.08,type='sine',gain=.035,when=0,slide=0){
    const ctx=audioContext();if(!ctx)return;
    try{
      const o=ctx.createOscillator(),g=ctx.createGain();
      const t=ctx.currentTime+when;
      o.type=type;o.frequency.setValueAtTime(freq,t);
      if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+duration);
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.012);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);
      o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+duration+.02);
    }catch(_){ }
  }
  const soundBank={takeoff:new Audio('assets/aviator-takeoff.wav'),crash:new Audio('assets/aviator-crash.wav'),tick:new Audio('assets/aviator-tick.wav')};
  Object.values(soundBank).forEach(a=>{a.preload='auto';a.volume=.42});
  function playSound(name,volume=.42){if(!state.audioEnabled)return;const a=soundBank[name];if(!a)return;try{a.currentTime=0;a.volume=volume;a.play().catch(()=>{})}catch(_){} }
  function soundTakeoff(){playSound('takeoff',.5)}
  function soundTick(){playSound('tick',.18)}
  function soundCrash(){playSound('crash',.58)}
  function toggleSound(){state.audioEnabled=!state.audioEnabled;localStorage.setItem('earnifybd_av_sound',state.audioEnabled?'1':'0');if(state.audioEnabled){audioContext();tone(520,.07,'triangle',.02)}audioOn()}

  function haptic(){try{navigator.vibrate?.(20)}catch(_){} }

  async function resetRound(period){
    clearInterval(state.timer);
    state.round=await ensureRound(period);
    state.phase='betting';state.countdown=RULES.bettingSec;state.multiplier=1;state.crashAt=Number(state.round?.crashAt||2);state.lastPeriod=period;
    state.slots.forEach(s=>{s.bet=false;s.pending=false;s.cashout=false;s.payout=0});
    const cr=$('av-crash');if(cr)cr.style.display='none';
    const plane=$('av-plane');if(plane){plane.classList.remove('crashed');plane.style.opacity='1'}
    updateUI();
    state.timer=setInterval(tick,RULES.refreshMs);
  }

  function current(){return roundInfo()}

  async function tick(){
    const x=current();
    if(!state.round||Number(state.round.period)!==x.period){await resetRound(x.period);return;}
    if(x.sec<RULES.bettingSec){
      state.phase='betting';state.countdown=RULES.bettingSec-x.sec;state.multiplier=1;
      if(Math.floor(Date.now()/1000)!==state.flyingSoundAt){soundTick();state.flyingSoundAt=Math.floor(Date.now()/1000)}
    }else{
      if(state.phase==='betting')soundTakeoff();
      state.phase='flying';
      const elapsed=Math.max(0,Math.min(RULES.roundSec-RULES.bettingSec,x.sec-RULES.bettingSec+((Date.now()%1000)/1000)));
      const flightDur=RULES.roundSec-RULES.bettingSec;
      const progress=Math.min(1,elapsed/flightDur);
      state.multiplier=Math.min(state.crashAt,Math.exp(Math.log(Math.max(1.01,state.crashAt))*progress));
      state.multiplier=Number(state.multiplier.toFixed(4));
      if(Date.now()-state.flyingSoundAt>1300){soundTick();state.flyingSoundAt=Date.now()}
      for(const [i,s] of state.slots.entries()){
        const auto=Number(s.auto);
        if(s.bet&&!s.cashout&&Number.isFinite(auto)&&auto>=RULES.minAuto&&state.multiplier>=auto)await cashout(i,true);
      }
      if(state.multiplier>=state.crashAt){state.multiplier=state.crashAt;await crashRound();return;}
    }
    updateUI();
  }

  async function crashRound(){
    if(state.phase==='crashed')return;
    state.phase='crashed';soundCrash();haptic();
    for(const s of state.slots){if(s.bet&&!s.cashout)s.bet=false;}
    const cr=$('av-crash');if(cr){cr.style.display='flex';$('av-crash-value').textContent=state.crashAt.toFixed(2)+'x';}
    const plane=$('av-plane');if(plane){plane.classList.add('crashed');plane.style.opacity='1'}
    try{await bridge().fbUpd?.(`aviatorRounds/${state.round.period}`,{status:'crashed',crashedAt:Date.now(),revealedCrashAt:Number(state.crashAt.toFixed(2))});}catch(_){ }
    pushHistory(state.crashAt);
    updateUI();clearInterval(state.timer);
    setTimeout(async()=>{const x=current();await resetRound(x.period===state.round.period?x.period+1:x.period)},720);
  }

  function validAmount(v){const n=Number(v);return Math.max(RULES.minBet,Math.min(RULES.maxBet,Number.isFinite(n)?Math.round(n):RULES.minBet))}

  async function placeBet(slot){
    const s=state.slots[slot];if(!s||s.bet||s.pending)return;
    if(state.phase!=='betting'){show('Betting বন্ধ — পরের round-এ bet করুন');return}
    const id=uid();if(!id){show('আগে Login করুন');return}
    const amt=validAmount(s.amount);
    s.pending=true;updateUI();
    try{
      const user=await bridge().fbGet?.(`users/${id}`);const bal=money(user?.balance);
      if(!user||!user.isActive){show('Account Activate করুন');return}
      if(bal+0.0001<amt){show('Balance কম — Deposit করুন');return}
      const newBal=await bridge().balanceDelta?.(id,-amt,0);
      if(newBal===null||newBal===undefined){show('Balance update হয়নি');return}
      try{
        await bridge().fbSet?.(`aviatorBets/${state.round.period}/${id}_${slot}`,{
          uid:id,period:state.round.period,slot,amount:amt,settled:false,cashout:null,payout:0,auto:Number(s.auto)||null,createdAt:Date.now()
        });
      }catch(e){await bridge().balanceDelta?.(id,amt,0);show('Bet save হয়নি — টাকা ফেরত দেওয়া হয়েছে');return}
      s.amount=amt;s.bet=true;s.cashout=false;s.payout=0;show(`৳${amt.toFixed(2)} Bet placed`);haptic();
    }finally{s.pending=false;updateUI()}
  }

  async function cashout(slot,automatic){
    const s=state.slots[slot];if(!s?.bet||s.cashout||s.pending||state.phase!=='flying')return;
    const m=Number(state.multiplier.toFixed(2));if(m>=state.crashAt)return;
    const payout=Number((s.amount*m).toFixed(2));const id=uid();if(!id)return;
    s.pending=true;updateUI();
    try{
      const newBal=await bridge().balanceDelta?.(id,payout,0);
      if(newBal===null||newBal===undefined){show('Cash Out balance update failed');return}
      s.cashout=true;s.payout=payout;s.bet=true;
      await bridge().fbUpd?.(`aviatorBets/${state.round.period}/${id}_${slot}`,{settled:true,cashout:m,payout,settledAt:Date.now(),auto:!!automatic});
      show(`${automatic?'Auto ':''}Cash Out ${m.toFixed(2)}x • ৳${payout.toFixed(2)}`);haptic();tone(960,.10,'triangle',.035);
    }finally{s.pending=false;updateUI()}
  }

  function action(slot){const s=state.slots[slot];if(!s)return;if(s.bet&&!s.cashout)cashout(slot,false);else placeBet(slot)}
  function setAmt(slot,v){state.slots[slot].amount=validAmount(v);updateUI()}
  function step(slot,d){setAmt(slot,state.slots[slot].amount+d)}
  function setAuto(slot,v){const n=Number(v);state.slots[slot].auto=Number.isFinite(n)&&n>=RULES.minAuto&&n<=RULES.maxMultiplier?n:null;}

  function updateCurve(){
    const line=$('av-line'),fill=$('av-fill'),plane=$('av-plane');if(!line||!fill||!plane)return;
    const x=current();
    const flightDur=RULES.roundSec-RULES.bettingSec;
    const elapsed=state.phase==='betting'?0:Math.max(0,Math.min(flightDur,x.sec-RULES.bettingSec+((Date.now()%1000)/1000)));
    const progress=state.phase==='betting'?Math.min(.08,x.sec/RULES.bettingSec*.08):Math.min(1,elapsed/flightDur);

    // Purely decorative central flight path. The plane position never encodes crashAt.
    const visualT=.04 + progress*.48;
    const endX=90+470*visualT,endY=470-270*visualT;
    const c1x=165+80*visualT,c1y=468-12*visualT;
    const c2x=280+110*visualT,c2y=450-96*visualT;
    const d=`M0,500 C${c1x.toFixed(0)},${c1y.toFixed(0)} ${c2x.toFixed(0)},${c2y.toFixed(0)} ${endX.toFixed(0)},${endY.toFixed(0)}`;
    line.setAttribute('d',d);
    // Stop the red fill well before the right edge so the chart does not visually advertise a crash point.
    fill.setAttribute('d',d+' L540,500 L0,500 Z');

    const px=endX,py=endY;
    const xPct=20 + progress*32;
    const yPct=26 + progress*28;
    const bob=Math.sin(Date.now()/270)*1.8;
    const tilt=-7+10*progress;
    plane.style.left=Math.max(18,Math.min(55,xPct))+'%';
    plane.style.bottom=Math.max(24,Math.min(58,yPct))+'%';
    plane.style.transform=`translate(-50%,50%) rotate(${tilt}deg) translateY(${bob}px)`;
  }

  function historyHtml(){return state.history.map(v=>`<span class="${Number(v)>=10?'high':Number(v)>=2?'mid':'low'}">${Number(v).toFixed(2)}x</span>`).join('') || '<span class="av-history-empty">No crashes yet</span>';}
  function setHistoryFromRounds(all){
    const cur=current().period;
    state.history=Object.values(all||{})
      .filter(r=>r&&r.crashAt&&(r.crashedAt||Number(r.period)<cur))
      .sort((a,b)=>Number(b.period)-Number(a.period))
      .slice(0,14).map(r=>Number(r.revealedCrashAt??r.crashAt).toFixed(2));
    updateUI();
  }
  function stopHistoryWatch(){if(state.historyOff){try{state.historyOff()}catch(_){ }state.historyOff=null}}
  function watchHistory(){
    stopHistoryWatch();
    try{
      const ref=window.firebase?.database?.().ref('aviatorRounds');
      if(!ref)return;
      const handler=snap=>setHistoryFromRounds(snap.val()||{});
      ref.on('value',handler);state.historyOff=()=>ref.off('value',handler);
    }catch(_){ }
  }
  async function loadHistory(){
    try{const all=await bridge().fbGet?.('aviatorRounds')||{};setHistoryFromRounds(all);}catch(_){}}

  function bindOneTime(){
    if(state.initialized)return;state.initialized=true;audioOn();
    document.addEventListener('pointerdown',()=>{if(state.audioEnabled)audioContext()},{passive:true});
    const logo=$('av-logo');if(logo)logo.addEventListener('error',()=>{logo.style.display='none'});
  }

  function render(){
    if(!uid()){show('Login করুন');return}
    bindOneTime();watchHistory();loadHistory();const x=current();resetRound(x.period);
  }

  window.aviatorCleanup=()=>{clearInterval(state.timer);state.timer=0;stopHistoryWatch();Object.values(soundBank).forEach(a=>{try{a.pause();a.currentTime=0}catch(_){}});if(state.audioCtx){try{state.audioCtx.close()}catch(_){}}state.audioCtx=null};
  window.openAviator=()=>{go('aviator')};
  window.renderAviator=render;
  window.aviatorAction=action;
  window.aviatorSetAmt=setAmt;
  window.aviatorStep=step;
  window.aviatorSetAuto=setAuto;
  window.aviatorToggleSound=toggleSound;
  window.aviatorRules=RULES;
})();
