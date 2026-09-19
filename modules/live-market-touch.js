/* EarnifyBD Live Market touch companion. The host page owns the single gesture binding. */
(function(){
  'use strict';
  function ready(){
    if(typeof window.lmBindChart==='function'){
      try{ window.lmBindChart(); }catch(e){ console.warn('Live Market touch init',e); }
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready,{once:true});
  else setTimeout(ready,0);
})();
