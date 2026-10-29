const $=i=>document.getElementById(i),S=Shared;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const fmt=v=>v?new Date(v+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'-';
const T={main:'Main Dashboard',customers:'Customers',customer:'Customer',reports:'Reports',expenses:'Expense Report'};
const BD={available:['available','Available'],assigned:['paid','Assigned'],disabled:['due','Disabled']};
let cur={p:'main'},stack=[];
const doc=(k,tok)=>{const t=TRK[k];return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><style>'+t.css+'</style></head><body>'+t.body+'<script>'+TRK.pre+'<\/script><script>'+t.app+'<\/script><script>'+t.ext+'<\/script><script>window.__ready="'+tok+'"<\/script></body></html>'};
let tokN=0;
const load=k=>new Promise((res,rej)=>{const f=$('f_'+k),tok='t'+(++tokN)+'_'+Date.now(),t0=Date.now();f.srcdoc=doc(k,tok);
 const iv=setInterval(()=>{let w=null;try{w=f.contentWindow}catch(e){}
  if(w&&w.__ready===tok){clearInterval(iv);res(w)}
  else if(Date.now()-t0>10000){clearInterval(iv);rej(new Error(k+' tracker did not start'+(w&&w.__err?' ('+w.__err+')':'')))}},25)});
const showErr=e=>{$('shell').style.display='block';document.querySelectorAll('.trk').forEach(f=>f.classList.remove('on'));$('view').innerHTML='<div class="card"><strong>Could not start</strong><div class="muted" style="margin-top:6px">'+esc(e&&e.message||e)+'</div><div class="actions"><button class="primary-btn" onclick="location.reload()">RELOAD</button></div></div>'};
const fresh=()=>{S.reconcile();return Promise.all([load('device'),load('rental')])};
const freshOne=k=>{S.reconcile();return load(k)};
let dir=1;
function render(){window.scrollTo(0,0);const vw=$('view');vw.classList.remove('pf','pb');void vw.offsetWidth;vw.classList.add(dir>0?'pf':'pb');$('shell').style.display='block';document.querySelectorAll('.trk').forEach(f=>f.classList.remove('on'));$('title').textContent=T[cur.p];if(cur.p==='main')navOn(0);$('back').style.visibility=cur.p==='main'?'hidden':'visible';({main:vMain,customers:vCust,customer:vCustD,reports:vRep,expenses:vExp,custlist:vCustL,expl:vExpL})[cur.p]()}
function go(p,arg){dir=1;ens();stack.push(cur);cur={p,arg};render()}
let busy=false;
window.bharatSyncIdle=()=>!busy&&cur.p!=='t'&&$("sheet").classList.contains("hidden")&&!document.getElementById("lockscreen")&&!document.body.classList.contains("loading");
async function openIn(k,code,page){if(busy)return;busy=true;ens();stack.push(cur);document.body.classList.add('loading');try{await freshOne(k)}catch(e){stack.pop();document.body.classList.remove('loading');busy=false;showErr(e);return}const f=$('f_'+k),w=f.contentWindow;w.__fromMain=true;w.__modalMain=!page;try{if(code)w.eval(code)}catch(e){console.error(e)}cur={p:'t',k};document.querySelectorAll('.trk').forEach(x=>x.classList.remove('on'));f.classList.add('on');document.body.classList.remove('loading');busy=false;setTimeout(()=>{if(cur.p==='t')$('shell').style.display='none'},320)}
function back(){if(!$('sheet').classList.contains('hidden')){sheetBack();return true}
 if(cur.p==='t'){const w=$('f_'+cur.k).contentWindow;if(w.__shellBack&&w.__shellBack())return true}
 if(stack.length){dir=-1;cur=stack.pop();if(cur.p==='t'){if(cur.fresh){cur.fresh=0;const kk=cur.k;freshOne(kk).then(()=>{if(cur.p==='t'&&cur.k===kk)showTrk(kk)})}else showTrk(cur.k)}else render();if(cur.reopen){const k=cur.reopen;cur.reopen=null;if(k==='expenses')setTimeout(()=>exp(cur.rarg),0)}return true}return false}
function showTrk(k){document.querySelectorAll('.trk').forEach(f=>f.classList.remove('on'));$('shell').style.display='none';$('f_'+k).classList.add('on')}
function main(){stack=[];cur={p:'main'};render()}
function ens(){if(history.state&&history.state.s===0)history.pushState({s:1},'')}
function addMenu(){$('mt').textContent='Add';$('mb').innerHTML=[['device','📦 ADD DEVICE'],['mask','😷 ADD MASK'],['supplier','🏢 ADD SUPPLIER'],['customer','👥 ADD CUSTOMER']].map(([a,b])=>`<button class="${a==='device'?'primary-btn':'secondary-btn'}" style="width:100%;margin-bottom:10px" onclick="Shell.add('${a}')">${b}</button>`).join('');$('sheet').classList.remove('hidden')}
function closeSheet(){$('sheet').classList.add('hidden')}
function add(k){closeSheet();({device:()=>openIn('device','openPurchase()'),mask:()=>openIn('device','openMaskForm()'),supplier:()=>openIn('device','openSupplierForm()'),customer:()=>openIn('rental','openCustomerForm()')})[k]()}
function rep(k){const sc=c=>`navigate('reports');historyStack.length=0;setTimeout(()=>document.querySelector('${c}').scrollIntoView(),80)`;
 ({purchased:()=>openIn('device',sc('.purchased-label'),1),sold:()=>openIn('device',sc('.sold-label'),1),mask:()=>openIn('device',sc('.mask-label'),1),rental:()=>openIn('rental',"navigate('reports');historyStack.length=0",1),extra:()=>openIn('rental','showExtras()'),expense:()=>go('expenses')})[k]()}
async function vMain(){try{await vMain2()}catch(e){console.error(e);showErr(e)}}
async function vMain2(){const v=$('view');v.innerHTML='<div class="empty">Loading…</div>';await fresh();if(cur.p!=='main')return;
 const D=$('f_device').contentWindow,R=$('f_rental').contentWindow;
 let alN=0,alH='';try{alN=R.eval('alerts().length');alH=R.eval("alerts().map(alertCard).join('')").replace(/onclick="openRental\('([^']+)'\)"/g,(m,id)=>`onclick="Shell.ren('openRental(\\'${id}\\')')"`)}catch(e){console.error(e)}
 let ds=[];try{ds=JSON.parse(D.eval("JSON.stringify(state.devices.map(d=>[d.type,d.status]))"))}catch(e){}
 const tc=k=>{const l=ds.filter(x=>DevIcons.kind(x[0])===k);return [l.filter(x=>x[1]==='purchased'||x[1]==='lent').length,l.filter(x=>x[1]==='rental').length,l.filter(x=>x[1]==='sold').length]};
 const typeCard=(k,n)=>{const c=tc(k);return `<div class="type-card tk-${k}" onclick="Shell.dev('showAllDevices()')"><b>${n}</b><div class="tcl"><span class="d av"></span>${c[0]} Available</div><div class="tcl"><span class="d rn"></span>${c[1]} Rental</div><div class="tcl"><span class="d sd"></span>${c[2]} Sold</div></div>`};
 const n=D.eval('totalDeviceCount()'),rn=R.eval('activeRentals().length'),pu=D.eval('totalPurchased()'),so=D.eval('totalSold()'),rv=R.eval('totalRentalIncome()'),due=R.eval('activeRentals().reduce((s,r)=>s+currentStatus(r).due,0)'),mx=R.eval('state.rentals.reduce((s,r)=>s+Number(r.oneTimeExtra||0),0)'),ex=D.eval('totalExpenses()')+R.eval("state.rentals.reduce((s,r)=>s+Number(r.oneTimeExpense||0),0)");
 const st=(c,x,l,f,sb)=>`<div class="stat ${c}" onclick="${f}"><div class="num">${x}</div><div class="label">${l}</div>${sb?`<div class="sub">${sb}</div>`:''}</div>`;
 const dAv=ds.filter(x=>x[1]==='purchased'||x[1]==='lent').length,dRn=ds.filter(x=>x[1]==='rental').length,dSd=ds.filter(x=>x[1]==='sold').length;
 let rTot=0,rAv=0,rDn=0,mRent=0;try{rTot=R.eval('state.rentals.length');rDn=R.eval("state.rentals.filter(r=>r.status!=='active').length");rAv=R.eval("state.equipment.filter(e=>e.status!=='rented'&&!e.forSale&&!e.sold&&!e.notWorking).length");mRent=R.eval("(()=>{const ym=isoDate(new Date()).slice(0,7);return state.payments.filter(p=>String(p.date).slice(0,7)===ym).reduce((s,p)=>s+Number(paymentRentalAmount(p)||0),0)})()")}catch(e){console.error(e)}
 const mLab=new Date().toLocaleDateString('en-IN',{month:'short',year:'numeric'});
 v.innerHTML=`<div class="monthbar" onclick="Shell.ren('showIncome()')"><span class="mb-m">${mLab}</span><span class="mb-r">Rental ${money(mRent)}</span><span class="mb-d">Due ${money(due)}</span></div><div class="dashboard-grid dashboard-main">${st('income',dAv,'Available Devices',"Shell.dev('showAllDevices()')",['Total '+ds.length,'Available '+dAv,'Rental '+dRn,'Sold '+dSd].map(x=>'<span>'+x+'</span>').join(''))}${st('rented',rn,'Running Rentals',"Shell.ren('showRentalValue()')",['Total '+rTot,'Available '+rAv,'Completed '+rDn].map(x=>'<span>'+x+'</span>').join(''))}${st('income',money(pu),'Total Purchased Value',"Shell.dev('showPurchased()')")}${st('rented',money(so),'Total Sold Value',"Shell.dev('showValue()')")}${st('value',money(rv),'Total Rental Value',"Shell.ren('showIncome()')")}${st('due',money(due),'Total Rental Due',"Shell.ren('showDue()')")}${st('extra',money(mx),'Mask / Extra',"Shell.ren('showExtras()')")}${st('due',money(ex),'Total Expenses',"Shell.exp()")}</div>
 <h2 class="section-title">Our Devices</h2><div class="types">${typeCard('cpap','CPAP')}${typeCard('bipap','BiPAP')}${typeCard('o2','Oxygen Conc.')}</div>
 <h2 class="section-title">Quick Actions</h2><div class="quick three"><button onclick="Shell.addMenu()"><span class="qi"><svg class="tki" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><circle class="dot" cx="24" cy="24" r="19" fill="#fff" fill-opacity=".95"/><path d="M24 14v20M14 24h20" stroke="#0f968d" stroke-width="5" stroke-linecap="round"/></svg></span>ADD</button><button onclick="Shell.tracker('device')"><span class="qi"><svg class="tki" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><rect x="4" y="11" width="40" height="26" rx="8" fill="#fff" fill-opacity=".95"/><circle cx="13" cy="24" r="4.2" fill="#0f968d"/><path class="ecg" d="M21 25h5l2.2-7 3.4 13 3-6h4.4" fill="none" stroke="#e11d48" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="44"/></svg></span>DEVICE TRACKER</button><button onclick="Shell.tracker('rental')"><span class="qi"><svg class="tki" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><g class="spin" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"><path d="M39 22a15 15 0 0 0-27-6"/><path d="M11 9v8h8"/><path d="M9 26a15 15 0 0 0 27 6"/><path d="M37 39v-8h-8"/></g><circle class="dot" cx="24" cy="24" r="5.5" fill="#fde047"/></svg></span>RENTAL TRACKER</button></div>
 <h2 class="section-title">⏰ Due / Renewal Alerts${alN?`<span class="sec-badge">${alN}</span>`:''}</h2><div class="alert-list">${alH||'<div class="empty">No due or renewal alerts in the next 3 days. 🎉</div>'}</div>`}
function vCust(){const cs=S.customers();$('view').innerHTML=`<div class="row"><h2 class="section-title" style="margin:0">Customers</h2><button class="small-icon-btn" onclick="Shell.add('customer')">＋</button></div><input class="list-search" placeholder="Search customers" oninput="Shell.filt(this.value)"><div id="cl">${cs.map(c=>{const h=S.hist(c.id),b=S.custStatus(c.id);return `<div class="card" data-search="${esc((c.name+' '+c.phone).toLowerCase())}" onclick="Shell.go('customer','${c.id}')"><div class="row"><strong>${esc(c.name||'Unnamed')}</strong><span class="muted">${esc(c.phone||'')}</span></div><div class="small muted">${esc(c.address||'No address')}</div><div class="row small" style="margin-top:7px"><span>${h.rentals.length} rental(s) · ${h.sales.length} sale(s)</span><span class="badge ${b.cls}">Status - ${b.label}</span></div></div>`}).join('')||'<div class="empty">No customers yet.</div>'}</div>`}
function vCustD(){const c=S.get(cur.arg);if(!c){back();return}const h=S.hist(c.id),b=S.custStatus(c.id);
 let pf=[];try{pf=$('f_rental').contentWindow.eval("((state.customers.find(c=>c.id==='"+c.id+"')||{}).idProofs||[]).map(p=>p.name||'Attachment')")}catch(e){}
 const paid=h.rentals.reduce((a,x)=>a+Number(x.paid||0),0),net=h.sales.reduce((a,x)=>a+Number(x.net||0),0),act=h.rentals.filter(x=>x.status==='active').length;
 const tel=String(c.phone||'').replace(/[^\d+]/g,'');
 $('view').innerHTML=`<div class="card"><div class="row"><h2 style="margin:0">👤 ${esc(c.name)}</h2><span class="badge ${b.cls}">Status - ${b.label}</span></div>
 <div style="margin-top:8px">📞 Phone: <strong>${esc(c.phone||'-')}</strong>${tel?` <a class="loc-btn copy" style="text-decoration:none;display:inline-block;margin-left:6px" href="tel:${tel}">Call</a>`:''}</div>
 <div>🏠 Address: <strong>${esc(c.address||'-')}</strong></div><div>📍 Location: ${Maps.btns(c.mapLink,c.address)}</div><div>📝 Notes: <strong>${esc(c.notes||'-')}</strong></div>
 <div style="margin-top:10px"><strong>📎 ID Proofs / Attachments</strong><div class="doc-list">${pf.length?pf.map((n,i)=>`<button class="doc-chip" type="button" onclick="Shell.ren('openProof(\\'${c.id}\\',${i})')">📄 <span>${esc(n)}</span></button>`).join(''):'<span class="muted small">None attached — tap Edit to add.</span>'}</div></div>
 <div class="actions"><button class="secondary-btn" onclick="Shell.edit('${c.id}')">EDIT / ID PROOFS</button>${c.status==='disabled'?`<button class="primary-btn" onclick="Shell.enable('${c.id}')">ENABLE / REASSIGN</button>`:''}</div></div>
 <div class="types" style="margin-top:12px"><div class="type-card"><b>${h.rentals.length}</b><div class="tcl">Rentals (${act} active)</div></div><div class="type-card"><b>${money(paid)}</b><div class="tcl">Rent paid</div></div><div class="type-card"><b>${h.sales.length} · ${money(net)}</b><div class="tcl">Device sales</div></div></div>
 <h2 class="section-title">Rental History</h2>${h.rentals.map(x=>`<div class="card stc-${x.status==='active'?'rental':'done'}" onclick="Shell.dev2('openRental(\\'${x.id}\\')')"><div class="row"><strong>${esc(x.device)}</strong><span class="badge ${x.status==='active'?'b-rental':'b-nw'}">${x.status==='active'?'🔄 Active':'Completed'}</span></div><div class="small muted">${fmt(x.start)} – ${x.status==='active'?'Present':fmt(x.end)} · Paid ${money(x.paid)}</div></div>`).join('')||'<div class="empty">No rentals.</div>'}
 <h2 class="section-title">Sale History</h2>${h.sales.map(x=>`<div class="card stc-sold" onclick="Shell.dev('openSale(\\'${x.id}\\')')"><div class="row"><strong>${esc(x.device)}</strong><strong>${money(x.net)}</strong></div><div class="small muted">${fmt(x.date)}</div></div>`).join('')||'<div class="empty">No sales.</div>'}`}
function vRep(){const _h='<button class="dl-all" onclick="Shell.dlAll()">⬇ DOWNLOAD ALL REPORTS</button><div class="dl-note">One Excel-ready file with every report: purchases, sales, masks, rentals, payments, expenses and customers.</div>';const L=[['purchased','🛒 Purchased Report','Devices purchased'],['sold','💰 Sold Report','Device sales and mask sales (direct + against rentals)'],['mask','😷 Mask Report','Mask stock, purchases and sales'],['rental','🔄 Rental Report','All rentals, totals and dues'],['extra','✨ Mask / Extra Report','One-time mask / extra on rentals'],['expense','🧾 Expense Report','Sale and rental expenses']];$('view').innerHTML=_h+L.map(x=>`<div class="card" onclick="Shell.rep('${x[0]}')"><strong>${x[1]}</strong><div class="muted">${x[2]}</div></div>`).join('')}
function exp(){const r=S.expenses(),tot=r.reduce((a,x)=>a+x.amt,0),dv=r.filter(x=>x.k==='device').reduce((a,x)=>a+x.amt,0),rn=tot-dv;
 $('mt').textContent='Total Expenses';
 $('mb').innerHTML=(r.map(x=>`<div class="card stc-${x.k==='device'?'sold':'rental'}" onclick="Shell.expOpen('${x.k}','${x.id}')"><div class="row"><div><strong>${fmt(x.date)}</strong><div class="device-title">${esc(x.title)}</div>${x.cust?`<div class="small muted">${esc(x.cust)}</div>`:''}<div class="muted">${esc(x.sub)}</div></div><strong>${money(x.amt)}</strong></div></div>`).join('')||'<div class="empty">No expenses yet.</div>')
 +`<div class="expense-summary"><div class="row"><span>DEVICE SALE EXPENSES</span><strong>${money(dv)}</strong></div><div class="row"><span>RENTAL EXPENSES</span><strong>${money(rn)}</strong></div><div class="row grand"><span>TOTAL EXPENSES</span><strong>${money(tot)}</strong></div></div>`;
 $('sheet').classList.remove('hidden')}
function expOpen(k,id){closeSheet();cur.reopen='expenses';if(k==='device')openIn('device',`openSale('${id}')`);else openIn('rental',`openRental('${id}')`)}
function vExp(){const r=S.expenses();$('view').innerHTML=r.map(x=>`<div class="card" onclick="Shell.${x.k==='device'?'dev':'ren2'}('${x.k==='device'?'openSale':'openRental'}(\\'${x.id}\\')')"><div class="row"><div><strong>${fmt(x.date)}</strong><div class="device-title">${esc(x.title)}</div>${x.cust?`<div class="small muted">${esc(x.cust)}</div>`:''}<div class="muted">${esc(x.sub)}</div></div><strong>${money(x.amt)}</strong></div></div>`).join('')||'<div class="empty">No expenses.</div>';$('view').insertAdjacentHTML('beforeend',`<div class="total-bar"><span>TOTAL EXPENSES</span><span>${money(r.reduce((a,x)=>a+x.amt,0))}</span></div>`)}
window.Shell={dlAll,exp,expSub,sheetBack,expOpen,back,main,ens,go,addMenu,closeSheet,add,rep,dev:(c,p)=>openIn('device',c,p),ren:(c,p)=>openIn('rental',c,p),rentOut:id=>{S.reconcile();const e=S.eqOf(id);if(!e)return alert('Could not prepare this device for rental.');cur.fresh=1;openIn('rental',"openCheckout('"+e+"')")},dev2:c=>openIn('rental',c),ren2:c=>openIn('rental',c),tracker:k=>openIn(k,'',1),
 filt:q=>{q=q.toLowerCase();document.querySelectorAll('#cl .card').forEach(x=>x.style.display=(x.dataset.search||'').includes(q)?'block':'none')},
 edit:id=>openIn('rental',`openCustomerEdit('${id}')`),enable:id=>{S.setStatus(id,'available');render()}};
history.replaceState({s:0},'');history.pushState({s:1},'');
addEventListener('popstate',()=>{if(back())history.pushState({s:1},'')});
/* ===== v5 hubs (shell) ===== */
T.custlist='Customers';T.expl='Expenses';
const hIco=e=>'<span class="hub-ico">'+e+'</span>';
const hBtn=(c,ico,t,s,fn,n)=>'<button class="sold-btn '+c+'" type="button" onclick="'+fn+'">'+ico+'<span class="sb-tx"><b>'+t+'</b><small>'+s+'</small></span><strong>'+n+'</strong><span class="sb-go">›</span></button>';
const hSum=a=>'<div class="card section-tint"><div class="sum4">'+a.map(x=>'<div><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join('')+'</div></div>';
const ccat=c=>{const st=c.status||'available';if(st==='available')return'idle';if(st==='assigned')return'run';const h=S.hist(c.id);return h.sales.length&&!h.rentals.length?'sold':'done'};
const CATS=[['idle','Idle','🙂','sb-av','Available · ready for a rental or sale'],['run','Running','🔄','sb-run','Has a rental running now'],['sold','Sold','🏷️','sb-sd','Bought a device'],['done','Completed','✅','sb-done','Rental completed']];
const cgroups=()=>{const g={idle:[],run:[],sold:[],done:[]};S.customers().slice().reverse().forEach(c=>g[ccat(c)].push(c));return g};
const ccard=c=>{const h=S.hist(c.id),b=S.custStatus(c.id);return `<div class="card" data-search="${esc((c.name+' '+c.phone).toLowerCase())}" onclick="Shell.go('customer','${c.id}')"><div class="row"><strong>${esc(c.name||'Unnamed')}</strong><span class="muted">${esc(c.phone||'')}</span></div><div class="small muted">${esc(c.address||'No address')}</div><div class="row small" style="margin-top:7px"><span>${h.rentals.length} rental(s) · ${h.sales.length} sale(s)</span><span class="badge ${b.cls}">Status - ${b.label}</span></div></div>`};
function vCust(){const g=cgroups(),n=S.customers().length;
 $('view').innerHTML=`<div class="row"><h2 class="section-title" style="margin:0">Customers</h2><button class="small-icon-btn" onclick="Shell.add('customer')">＋</button></div>`
 +hSum([['Total',n]].concat(CATS.map(c=>[c[1],g[c[0]].length])))
 +CATS.map(c=>hBtn(c[3],hIco(c[2]),c[1]+' Customers',c[4],`Shell.go('custlist','${c[0]}')`,g[c[0]].length)).join('')
 +`<input class="list-search" placeholder="Search customers" oninput="Shell.filt(this.value)"><div id="cl">`
 +CATS.map(c=>`<h3 class="grp-h g-${c[0]}"><span>${c[2]} ${c[1]}</span><b>${g[c[0]].length}</b></h3>`+(g[c[0]].map(ccard).join('')||'<div class="empty">None</div>')).join('')+`</div>`}
function vCustL(){const k=cur.arg,c=CATS.find(x=>x[0]===k)||CATS[0],l=cgroups()[c[0]];
 $('view').innerHTML=`<div class="row"><h2 class="section-title" style="margin:0">${c[2]} ${c[1]} Customers</h2><button class="small-icon-btn" onclick="Shell.add('customer')">＋</button></div><div class="card section-tint"><div class="row"><strong>${c[1].toUpperCase()}</strong><strong>${l.length}</strong></div><div class="tx-line">${c[4]} · newest first.</div></div><input class="list-search" placeholder="Search customers" oninput="Shell.filt(this.value)"><div id="cl">${l.map(ccard).join('')||'<div class="empty">No customers here.</div>'}</div>`}
const sst=[];let scur=null;
function sheet(t,h,sub){const open=!$('sheet').classList.contains('hidden');if(scur&&open)sst.push(scur);scur={t,h,sub};$('mt').textContent=t;$('mb').innerHTML=h;$('sheet').classList.remove('hidden');$('mb').scrollTop=0}
function sheetBack(){if(sst.length){scur=sst.pop();$('mt').textContent=scur.t;$('mb').innerHTML=scur.h;$('mb').scrollTop=0;return true}closeSheet();return true}
function closeSheet(){$('sheet').classList.add('hidden');sst.length=0;scur=null}
const xc2=x=>`<div class="card stc-${x.k==='device'?'sold':'rental'}" onclick="Shell.expOpen('${x.k}','${x.id}')"><div class="row"><div><strong>${fmt(x.date)}</strong><div class="device-title">${esc(x.title)}</div>${x.cust?`<div class="small muted">${esc(x.cust)}</div>`:''}<div class="muted">${esc(x.sub)}</div></div><strong>${money(x.amt)}</strong></div></div>`;
const xsm=l=>l.reduce((a,x)=>a+x.amt,0);
function exp(sub){const r=S.expenses(),dv=r.filter(x=>x.k==='device'),rn=r.filter(x=>x.k!=='device');
 sheet('Total Expenses',`<div class="card section-tint"><div class="row"><strong>TOTAL EXPENSES</strong><strong>${money(xsm(r))}</strong></div><div class="tx-line">Device sale expenses + rental expenses.</div></div>`
 +hBtn('sb-sd',hIco('💰'),'Device Sale Expenses',dv.length+' entr'+(dv.length==1?'y':'ies')+' · vendor + other',`Shell.expSub('device')`,money(xsm(dv)))
 +hBtn('sb-rn',hIco('🔄'),'Rental Expenses',rn.length+' entr'+(rn.length==1?'y':'ies')+' · one-time expense',`Shell.expSub('rental')`,money(xsm(rn)))
 +`<h2 class="section-title" style="margin:18px 2px 0">All expenses</h2>`+(r.map(xc2).join('')||'<div class="empty">No expenses yet.</div>'));
 if(sub)expSub(sub)}
function expSub(k){const dv=k==='device',l=S.expenses().filter(x=>dv?x.k==='device':x.k!=='device');
 sheet(dv?'Device Sale Expenses':'Rental Expenses',`<div class="card section-tint"><div class="row"><strong>${dv?'DEVICE SALE EXPENSES':'RENTAL EXPENSES'}</strong><strong>${money(xsm(l))}</strong></div><div class="tx-line">${l.length} entr${l.length==1?'y':'ies'} · latest first. Tap one to open the full entry.</div></div>${l.map(xc2).join('')||'<div class="empty">No expenses here.</div>'}`,k)}
function expOpen(k,id){const sub=scur&&scur.sub;closeSheet();cur.reopen='expenses';cur.rarg=sub;if(k==='device')openIn('device',`openSale('${id}')`);else openIn('rental',`openRental('${id}')`)}
const xcard=x=>`<div class="card stc-${x.k==='device'?'sold':'rental'}" onclick="Shell.${x.k==='device'?'dev':'ren2'}('${x.k==='device'?'openSale':'openRental'}(\\'${x.id}\\')')"><div class="row"><div><strong>${fmt(x.date)}</strong><div class="device-title">${esc(x.title)}</div>${x.cust?`<div class="small muted">${esc(x.cust)}</div>`:''}<div class="muted">${esc(x.sub)}</div></div><strong>${money(x.amt)}</strong></div></div>`;
function vExp(){const r=S.expenses(),dv=r.filter(x=>x.k==='device'),rn=r.filter(x=>x.k!=='device'),sm=l=>l.reduce((a,x)=>a+x.amt,0);
 $('view').innerHTML=`<div class="card section-tint"><div class="row"><strong>TOTAL EXPENSES</strong><strong>${money(sm(r))}</strong></div><div class="tx-line">Device sale expenses + rental expenses.</div></div>`
 +hBtn('sb-sd',hIco('💰'),'Device Sale Expenses',dv.length+' entr'+(dv.length==1?'y':'ies')+' · vendor + other',`Shell.go('expl','device')`,money(sm(dv)))
 +hBtn('sb-rn',hIco('🔄'),'Rental Expenses',rn.length+' entr'+(rn.length==1?'y':'ies')+' · one-time expense',`Shell.go('expl','rental')`,money(sm(rn)))
 +`<h2 class="section-title" style="margin:18px 2px 0">All expenses</h2>`+(r.map(xcard).join('')||'<div class="empty">No expenses yet.</div>')}
function vExpL(){const dv=cur.arg==='device',r=S.expenses().filter(x=>dv?x.k==='device':x.k!=='device'),t=r.reduce((a,x)=>a+x.amt,0);
 $('view').innerHTML=`<div class="card section-tint"><div class="row"><strong>${dv?'DEVICE SALE EXPENSES':'RENTAL EXPENSES'}</strong><strong>${money(t)}</strong></div><div class="tx-line">${r.length} entr${r.length==1?'y':'ies'} · latest first. Tap one to see the full entry.</div></div>${r.map(xcard).join('')||'<div class="empty">No expenses here.</div>'}<div class="total-bar"><span>TOTAL</span><span>${money(t)}</span></div>`}

async function dlAll(){
 try{await fresh()}catch(e){showErr(e);return}
 const D=$('f_device').contentWindow,R=$('f_rental').contentWindow,J=(w,c)=>JSON.parse(w.eval('JSON.stringify('+c+')'));
 const dev=J(D,"{p:state.devices.map(d=>[fmt(d.purchaseDate),d.name,d.type,d.serial,supplierName(d.supplierId),d.purchasedType==='lent'?'Lent':'Purchased',d.purchasedType==='purchased'?d.price:0,d.paymentType||'',d.status==='sold'?'Sold':d.status==='rental'?'Used for Rental':'Available']),s:state.sales.map(x=>{const d=device(x.deviceId)||{};return[fmt(x.sellDate),d.name||'',d.type||'',d.serial||'',x.customerName||'',x.customerPhone||'',x.devicePrice,x.maskName||'',x.maskQty||0,x.maskPrice,x.vendorExpense,x.otherExpense,saleNet(x),x.receivedType||'']}),m:state.masks.map(m=>[m.name,m.type,m.vendorName,m.date,m.price,maskQty(m),maskSoldQty(m)])}");
 const ren=J(R,"{r:state.rentals.map(r=>{const e=equipment(r.equipmentId)||{};let due=0;try{due=r.status==='active'?currentStatus(r).due:0}catch(x){}return[customerName(r.customerId),e.name||'',e.serial||'',fmt(r.startDate),r.status==='active'?'Active':'Completed',r.checkInDate?fmt(r.checkInDate):'',r.monthly,r.oneTimeExtra||0,r.oneTimeExpense||0,rentalPaid(r),due,r.notes||'']}),p:state.payments.map(p=>{const r=state.rentals.find(x=>x.id===p.rentalId)||{};return[fmt(p.date),customerName(r.customerId),(equipment(r.equipmentId)||{}).name||'',p.amount,p.method||'',fmt(p.periodFrom),fmt(p.periodDue)]})}");
 let ms=[];try{ms=(JSON.parse(localStorage.getItem('bharat_shared_v1')||'{}').maskSales)||[]}catch(e){}
 const sum=(rows,i)=>rows.reduce((t,r)=>t+Number(r[i]||0),0),sec=(t,h,rows,tot)=>[[t],h,...rows,...(tot?[tot]:[]),[]];
 const ex=S.expenses();
 const rows=[['BHARAT SURGICALS - ALL REPORTS'],['Generated',fmt(new Date().toISOString().slice(0,10))],[],
  ...sec('PURCHASED DEVICES',['Date','Device','Type','Serial','Supplier','Purchased/Lent','Purchase Value','Payment','Status'],dev.p,['','','','','','Total',sum(dev.p,6)]),
  ...sec('SOLD DEVICES',['Sell Date','Device','Type','Serial','Customer','Phone','Device Price','Mask','Mask Qty','Mask Price','Vendor Expense','Other Expense','Net Sold','Received Type'],dev.s,['','','','','','Total','','','','','','',sum(dev.s,12)]),
  ...sec('MASK STOCK',['Mask','Type','Vendor','Date','Unit Price','Available Qty','Sold Qty'],dev.m),
  ...sec('MASK SALES (DIRECT + AGAINST RENTALS)',['Date','Mask','Qty','Price','Sold Against'],ms.map(x=>[fmt(x.date),x.maskName||'',x.qty||0,x.price||0,x.rentalId?'Rental':'Direct']),['','Total','','',sum(ms.map(x=>[0,0,0,x.price]),3)]),
  ...sec('RENTALS',['Customer','Device','Serial','Start','Status','Checked In','Monthly Rent','Mask / Extra','Expense','Paid (all time)','Due Now','Notes'],ren.r),
  ...sec('RENTAL PAYMENTS',['Date','Customer','Device','Amount','Method','Period From','Period To'],ren.p,['','','Total',sum(ren.p,3)]),
  ...sec('MASK / EXTRA ON RENTALS',['Customer','Device','Start','Mask / Extra'],ren.r.filter(x=>Number(x[7])>0).map(x=>[x[0],x[1],x[3],x[7]])),
  ...sec('EXPENSES',['Date','Item','Details','Amount'],ex.map(x=>[fmt(x.date),x.title,x.sub,x.amt]),['','','Total',ex.reduce((t,x)=>t+x.amt,0)]),
  ...sec('CUSTOMERS',['Name','Phone','Address','Status'],S.customers().map(c=>[c.name,c.phone,c.address,c.status]))];
 const ce=v=>{let s=String(v==null?'':v);if(/^[=@]/.test(s))s="'"+s;return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
 const csv='\uFEFF'+rows.map(r=>r.map(ce).join(',')).join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='Bharat_Surgicals_All_Reports_'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
render();


/* ===== v9 colour-coded buttons ===== */
(function(){
const R=[[/DELETE|REMOVE/,'del'],[/EDIT|CHANGE/,'edit'],[/SELL|SOLD/,'sell'],[/CHECK\s?IN|RETURN/,'in'],[/CHECK\s?OUT|RENT/,'rent'],[/EXTEND|PAY|RECORD/,'pay'],[/DETAIL|VIEW|OPEN/,'view'],[/ADD|＋|SAVE|CREATE|ENABLE|\+/,'add']];
const SEL='button.primary-btn,button.secondary-btn,button.danger-btn,button.details-btn';
function paint(){document.querySelectorAll(SEL).forEach(function(b){if(b.dataset.bt)return;if(b.closest('.sold-btn,.quick,.dtabs'))return;const t=(b.textContent||'').toUpperCase();let k='';for(let i=0;i<R.length;i++){if(R[i][0].test(t)){k=R[i][1];break}}b.dataset.bt=k||'x';if(k)b.classList.add('bt-'+k)})}
paint();let tm;new MutationObserver(function(){clearTimeout(tm);tm=setTimeout(paint,20)}).observe(document.body,{childList:true,subtree:true});
})();

/* ===== v34 receipts (image / PDF) ===== */
const RX={logo:null,canvas:null,data:null};
const rcLogo=()=>new Promise(res=>{if(RX.logo&&RX.logo.complete)return res(RX.logo);const i=new Image();i.onload=()=>{RX.logo=i;res(i)};i.onerror=()=>res(null);i.src='bharat-logo.png'});
const RF='Inter, "Segoe UI", Roboto, Arial, sans-serif';
function rcRR(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function rcWrap(c,t,mw){const out=[];String(t).split('\n').forEach(p=>{let l='';p.split(/\s+/).forEach(w=>{const n=l?l+' '+w:w;if(c.measureText(n).width>mw&&l){out.push(l);l=w}else l=n});out.push(l)});return out}
const rcM=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const rcD=v=>v?new Date(v+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'-';
function rcDraw(c,d,kind,draw){
 const W=720,M=28,P=28,IW=W-2*M-2*P,full=kind==='full';
 const rent=Number(d.rent||0),mask=Number(d.mask||0),exp=Number(d.expense||0),paid=rent+mask+(full?exp:0);
 const secs=[];
 const rows=a=>a.filter(x=>x[2]||x[1]!=='');
 const rentalRows=full&&d.notes?[['Check-out notes',d.notes]]:[];
 secs.push({t:'Rental',bg:'#ffeed9',tc:'#b45309',lc:'#e08a12',lb:'#8a5a1f',rental:true,rows:rentalRows});
 secs.push({t:'Customer',bg:'#e6f0fd',tc:'#1d4f9e',lc:'#1d4f9e',lb:'#4b6a96',rows:(full?[['Name',d.customer.name],['Phone',d.customer.phone],['Address',d.customer.address],['Notes',d.customer.notes]]:[['Name',d.customer.name],['Address',d.customer.address]]).filter(x=>x[1])});
 secs.push({t:'Device',bg:'#ece8fb',tc:'#5b3fc4',lc:'#6d4fd0',lb:'#6a5aa8',rows:[['Name',d.device.name],['Type',d.device.type],['Serial number',d.device.serial]].concat(full?[['Notes',d.device.notes]]:[]).filter(x=>x[1])});
 const pr=[['Rent',rcM(rent)],['Mask / Extra',rcM(mask)]];if(d.maskType)pr.push(['Mask type',d.maskType]);if(full)pr.push(['Expense',rcM(exp)]);pr.push(['Total paid',rcM(paid),'hl']);pr.push(['Balance due',rcM(d.bal)]);
 secs.push({t:'Payment',bg:'#e0f3e6',tc:'#166534',lc:'#2a9d5b',lb:'#4d7a5f',rows:pr,lines:true});
 // header
 c.textBaseline='alphabetic';
 let y=0;
 if(draw){const g=c.createLinearGradient(0,0,0,360);g.addColorStop(0,'#d3e4f8');g.addColorStop(1,'#ffffff');c.fillStyle='#fff';c.fillRect(0,0,W,3000);c.fillStyle=g;c.fillRect(0,0,W,360);
  c.save();c.shadowColor='rgba(30,70,140,.25)';c.shadowBlur=24;c.shadowOffsetY=8;c.fillStyle='#fff';rcRR(c,W/2-65,40,130,130,34);c.fill();c.restore();
  if(RX.logo){const lw=106,r=RX.logo.width/RX.logo.height;let w=lw,h=lw/r;if(h>lw){h=lw;w=lw*r}c.drawImage(RX.logo,W/2-w/2,52+(106-h)/2,w,h)}
  c.textAlign='center';c.fillStyle='#0f4c9a';c.font='800 40px '+RF;c.fillText('Bharat Surgicals',W/2,228);
  c.fillStyle='#4a78b8';c.font='500 22px '+RF;c.fillText(full?'Full rental receipt':'Rental receipt',W/2,262);
  c.font='700 24px '+RF;const dt=rcD(d.today),pw=c.measureText(dt).width+56;c.fillStyle='#fff';rcRR(c,W/2-pw/2,282,pw,50,25);c.fill();c.strokeStyle='#b9c9e4';c.lineWidth=2;c.stroke();c.fillStyle='#0f3d82';c.fillText(dt,W/2,316)}
 y=360;
 secs.forEach(sc=>{
  const top=y;let h=84;
  c.font='700 25px '+RF;
  const prep=sc.rows.map(r=>{const mw=IW-(r[0].length>12?250:190);const ls=rcWrap(c,r[1],mw);return {r,ls,h:Math.max(r[2]?56:46,ls.length*32+14)}});
  if(sc.rental)h+=130;
  prep.forEach(p=>h+=p.h);h+=P-8;
  if(draw){c.fillStyle=sc.bg;rcRR(c,M,top,W-2*M,h,36);c.fill();
   c.textAlign='center';c.fillStyle=sc.tc;c.font='800 27px '+RF;c.fillText(sc.t,W/2,top+46);c.fillStyle=sc.lc;c.fillRect(M+P,top+62,IW,3)}
  let yy=top+84;
  if(sc.rental){
   if(draw){const x0=M+P,x1=M+P+IW,act=d.status==='active';
    c.textAlign='left';c.fillStyle=sc.lb;c.font='500 22px '+RF;c.fillText('Rented start',x0,yy+16);c.textAlign='right';c.fillText(act?'Due date':'Check-in date',x1,yy+16);
    c.fillStyle='#1b2333';c.font='800 28px '+RF;c.textAlign='left';c.fillText(rcD(d.start),x0,yy+52);c.textAlign='right';c.fillText(rcD(act?d.due:d.checkIn),x1,yy+52);
    const by=yy+76,bh=12;c.fillStyle='#eadcc4';rcRR(c,x0,by,IW,bh,6);c.fill();
    let fr=1,lab='Rental completed';
    if(act){const day=86400000,a=new Date(d.from+'T00:00:00'),b=new Date(d.due+'T00:00:00'),t=new Date(d.today+'T00:00:00');const tot=Math.max(1,Math.round((b-a)/day)+1),el=Math.min(tot,Math.max(1,Math.round((t-a)/day)+1));fr=el/tot;lab='Today, '+el+' of '+tot+' days'}
    const fw=Math.max(bh,IW*fr);c.fillStyle='#e08a12';rcRR(c,x0,by,fw,bh,6);c.fill();
    if(act){c.fillStyle='#fff';c.beginPath();c.arc(x0+fw,by+bh/2,13,0,7);c.fill();c.strokeStyle='#e08a12';c.lineWidth=5;c.stroke()}
    c.fillStyle=sc.lb;c.font='500 21px '+RF;c.textAlign='right';c.fillText(lab,Math.min(x1,x0+fw+40),by+44)}
   yy+=130}
  prep.forEach((p,i)=>{
   if(draw){const x0=M+P,x1=M+P+IW;
    if(p.r[2]){c.fillStyle='#c3e8cf';rcRR(c,x0-14,yy+2,IW+28,50,18);c.fill()}
    c.textAlign='left';c.fillStyle=p.r[2]?'#166534':sc.lb;c.font=(p.r[2]?'800 25px ':'500 24px ')+RF;c.fillText(p.r[0],p.r[2]?x0+4:x0,yy+(p.r[2]?36:32));
    c.textAlign='right';c.fillStyle=p.r[2]?'#166534':'#1b2333';c.font='700 25px '+RF;p.ls.forEach((l,k)=>c.fillText(l,p.r[2]?x1-4:x1,yy+(p.r[2]?36:32)+k*32));
    if(sc.lines&&i<prep.length-1&&!p.r[2]&&!(prep[i+1]&&prep[i+1].r[2])){c.fillStyle='rgba(60,110,80,.18)';c.fillRect(x0,yy+p.h-4,IW,1.5)}}
   yy+=p.h});
  y=top+h+18});
 y+=14;
 if(draw){const g=c.createLinearGradient(0,y,W,y+120);g.addColorStop(0,'#0a66c2');g.addColorStop(1,'#0b4a96');c.fillStyle=g;c.fillRect(0,y,W,120);
  c.textAlign='left';c.fillStyle='rgba(255,255,255,.85)';c.font='600 24px '+RF;if(c.letterSpacing!==undefined)c.letterSpacing='3px';c.fillText('CURRENT RENT',44,y+72);if(c.letterSpacing!==undefined)c.letterSpacing='0px';
  c.textAlign='right';c.fillStyle='#fff';c.font='800 58px '+RF;c.fillText(rcM(rent),W-44,y+82)}
 return y+120}
async function rcBuild(d,kind){await rcLogo();const S2=2,W=720;const m=document.createElement('canvas').getContext('2d');const H=rcDraw(m,d,kind,false);const cv=document.createElement('canvas');cv.width=W*S2;cv.height=Math.ceil(H)*S2;const c=cv.getContext('2d');c.scale(S2,S2);rcDraw(c,d,kind,true);RX.canvas=cv;return cv}
function rcName(ext){const d=RX.data||{};return 'Receipt_'+String((d.customer&&d.customer.name)||'customer').replace(/[^\w]+/g,'_')+'_'+(d.today||'')+'.'+ext}
function rcDl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function rcPdf(jpg,w,h){const enc=s=>{const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i)&255;return a};const pw=420,ph=Math.round(420*h/w),parts=[],offs=[];let len=0;const push=b=>{if(typeof b==='string')b=enc(b);parts.push(b);len+=b.length};const obj=(n,b)=>{offs[n]=len;push(n+' 0 obj\n'+b+'\nendobj\n')};
 push('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw+' '+ph+'] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
 offs[4]=len;push('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+w+' /Height '+h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpg.length+' >>\nstream\n');push(jpg);push('\nendstream\nendobj\n');
 const cs='q '+pw+' 0 0 '+ph+' 0 0 cm /Im0 Do Q';obj(5,'<< /Length '+cs.length+' >>\nstream\n'+cs+'\nendstream');
 const x=len;push('xref\n0 6\n0000000000 65535 f \n'+[1,2,3,4,5].map(n=>String(offs[n]).padStart(10,'0')+' 00000 n \n').join(''));push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+x+'\n%%EOF');
 const out=new Uint8Array(len);let p=0;parts.forEach(b=>{out.set(b,p);p+=b.length});return out}
function rcSave(f){const cv=RX.canvas;if(!cv)return;
 if(f==='png')cv.toBlob(b=>rcDl(b,rcName('png')),'image/png');
 else{const u=cv.toDataURL('image/jpeg',0.92),bin=atob(u.split(',')[1]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);rcDl(new Blob([rcPdf(a,cv.width,cv.height)],{type:'application/pdf'}),rcName('pdf'))}}
function rcShare(){const cv=RX.canvas;if(!cv)return;cv.toBlob(b=>{const f=new File([b],rcName('png'),{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:'Receipt'}).catch(()=>{});else rcDl(b,rcName('png'))},'image/png')}
function receipt(json){try{RX.data=typeof json==='string'?JSON.parse(json):json}catch(e){return}if(!RX.data)return;
 sheet('Receipt','<div class="muted" style="margin-bottom:10px">Choose which receipt to create. You can save it as an image or a PDF.</div><div class="actions" style="flex-direction:column"><button class="primary-btn" onclick="Shell.rcShow(\'full\')">📄 FULL RECEIPT <small style="font-weight:600">· for you</small></button><button class="secondary-btn" onclick="Shell.rcShow(\'cust\')">🧾 CUSTOMER RECEIPT <small style="font-weight:600">· to share</small></button></div>')}
async function rcShow(kind){const cv=await rcBuild(RX.data,kind),canShare=!!(navigator.canShare&&navigator.share);
 sheet(kind==='full'?'Full receipt':'Customer receipt','<div class="actions rc-act"><button class="primary-btn" onclick="Shell.rcSave(\'png\')">SAVE AS IMAGE</button><button class="secondary-btn" onclick="Shell.rcSave(\'pdf\')">SAVE AS PDF</button>'+(canShare?'<button class="secondary-btn" onclick="Shell.rcShare()">SHARE</button>':'')+'</div><img class="rc-prev" style="margin-top:14px" src="'+cv.toDataURL('image/png')+'" alt="Receipt">')}
async function deviceReceipt(did){const h=S.eqHist(did);if(!h.length)return alert('No rental found for this device.');const x=h.find(v=>v.status==='active')||h.slice().sort((a,b)=>String(b.start).localeCompare(String(a.start)))[0];
 try{const w=await freshOne('rental');const d=w.receiptData(x.id);if(d)receipt(JSON.stringify(d))}catch(e){alert('Could not create the receipt.')}}
Object.assign(Shell,{receipt,rcShow,rcSave,rcShare,deviceReceipt});

/* ===== v35 floating menu everywhere ===== */
function navOn(i){document.querySelectorAll('#fnav button').forEach((b,k)=>b.classList.toggle('on',k===i))}
$('fnav').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const l=[...document.querySelectorAll('#fnav button')];navOn(l.indexOf(b))});
function navVis(){let hide=false;try{if(!$('sheet').classList.contains('hidden')&&$('mt').textContent==='Add')hide=true;
 if(cur.p==='t'){const d=$('f_'+cur.k).contentWindow.document;if(d.querySelector('#modal:not(.hidden) form')||d.querySelector('.pop-layer'))hide=true}}catch(e){}
 const n=$('fnav'),v=hide?'none':'flex';if(n.style.display!==v)n.style.display=v}
setInterval(navVis,250);navVis();
