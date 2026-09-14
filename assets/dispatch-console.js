/* Shine Time Dispatch Console — additive operational control layer. */
(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const route=()=>location.hash.replace(/^#/,'');
  const page=()=>document.querySelector('#page');
  const toast=(m,type='')=>window.toast?.(m,type);
  const openJob=id=>{
    if(typeof window.openJob==='function')return window.openJob(id);
    if(typeof window.viewJob==='function')return window.viewJob(id);
    toast(`Job ${id} selected`,'success');
  };
  const rows=()=>window.__shineTimeDispatchRows||[];
  function render(){
    if(!['admin/live','admin/jobs','admin/tomorrow'].includes(route()))return;
    const p=page();if(!p||p.querySelector('.st-dispatch-console'))return;
    const el=document.createElement('section');el.className='st-dispatch-console';
    el.innerHTML=`<div class="st-dispatch-head"><div><div class="st-eyebrow">DISPATCH CONTROL</div><h2>Live assignment desk</h2><p>Turn operational signals into the next action.</p></div><div class="st-dispatch-actions"><button class="st-dispatch-btn" data-action="refresh">↻ Recalculate</button><button class="st-dispatch-btn danger" data-action="rescue">⚡ Rescue queue</button></div></div><div class="st-dispatch-metrics"><div><span>Open</span><strong data-m="open">—</strong></div><div><span>Unassigned</span><strong data-m="unassigned">—</strong></div><div><span>Rebalance</span><strong data-m="rebalance">—</strong></div><div><span>Urgent</span><strong data-m="urgent">—</strong></div></div><div class="st-dispatch-body"><div class="st-dispatch-list" data-list><div class="st-dispatch-empty">Calculating dispatch recommendations…</div></div><aside class="st-dispatch-side"><strong>Operator checklist</strong><button data-quick="unassigned">Review unassigned</button><button data-quick="risk">Review at-risk</button><button data-quick="rescue">Open rescue candidates</button><button data-quick="all">Show full board</button></aside></div>`;
    p.prepend(el);
    el.querySelector('[data-action="refresh"]').onclick=()=>{window.render?.();setTimeout(render,80);};
    el.querySelector('[data-action="rescue"]').onclick=()=>{document.querySelector('[data-filter="rescue"]')?.click()||toast('Rescue queue filter is ready on the board','success');};
    el.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{const target=document.querySelector(`[data-filter="${b.dataset.quick}"]`);if(target)target.click();else if(b.dataset.quick==='all')document.querySelector('[data-filter="all"]')?.click();});
    paint(el);
  }
  function paint(el){
    const data=rows();
    const open=data.filter(x=>!['COMPLETED','CANCELLED'].includes(String(x.job?.status||'').toUpperCase()));
    const unassigned=data.filter(x=>x.needsAssignment);
    const rebalance=data.filter(x=>x.needsReassignment);
    const urgent=data.filter(x=>Number(x.priority)>=85);
    el.querySelector('[data-m="open"]').textContent=open.length;
    el.querySelector('[data-m="unassigned"]').textContent=unassigned.length;
    el.querySelector('[data-m="rebalance"]').textContent=rebalance.length;
    el.querySelector('[data-m="urgent"]').textContent=urgent.length;
    const list=el.querySelector('[data-list]');
    const items=data.slice(0,8).map(x=>{const j=x.job||{},r=x.recommended;const action=x.needsAssignment?'ASSIGN':x.needsReassignment?'REBALANCE':Number(x.priority)>=85?'WATCH':'OK';return `<button class="st-dispatch-row" data-job="${esc(j.id||'')}"><span class="st-dispatch-priority p-${action.toLowerCase()}">${action}</span><span class="st-dispatch-job"><strong>${esc(j.title||j.id||'Job')}</strong><small>${esc(j.address||j.objectName||j.date||'No location')} · ${r?`→ ${esc(r.cleanerId)} · ${esc(r.eta?.minutes??'—')} min`:'No eligible cleaner'}</small></span><span class="st-dispatch-score">${Number(x.priority||0)}</span></button>`}).join('');
    list.innerHTML=items||'<div class="st-dispatch-empty">No dispatch recommendations yet.</div>';
    list.querySelectorAll('[data-job]').forEach(b=>b.onclick=()=>openJob(b.dataset.job));
  }
  function collect(){
    const p=page();if(!p)return[];
    const trs=[...p.querySelectorAll('tbody tr')];
    return trs.map((tr,i)=>{const cells=[...tr.children].map(x=>x.innerText.trim());return {job:{id:tr.dataset.jobId||cells[0]||String(i+1),title:cells[0]||`Job ${i+1}`,status:cells.join(' ')}}});
  }
  function init(){render();setInterval(()=>{const p=page();if(!p)return;if(!p.querySelector('.st-dispatch-console'))render();const el=p.querySelector('.st-dispatch-console');if(el)paint(el)},1500);}
  window.ShineTimeDispatchConsole={render,paint,collect};
  window.addEventListener('shine:dispatch',e=>{window.__shineTimeDispatchRows=e.detail?.rows||[];const el=page()?.querySelector('.st-dispatch-console');if(el)paint(el)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
