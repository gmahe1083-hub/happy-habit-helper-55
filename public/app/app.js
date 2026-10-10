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
function render(){window.scrollTo(0,0);const vw=$('view');vw.classList.remove('pf','pb');void vw.offsetWidth;vw.classList.add(dir>0?'pf':'pb');$('shell').style.display='block';document.querySelectorAll('.trk').forEach(f=>f.classList.remove('on'));$('title').textContent=T[cur.p];$('back').style.visibility=cur.p==='main'?'hidden':'visible';({main:vMain,customers:vCust,customer:vCustD,reports:vRep,expenses:vExp,custlist:vCustL,expl:vExpL})[cur.p]()}
function go(p,arg){dir=1;ens();stack.push(cur);cur={p,arg};render()}
let busy=false;
async function openIn(k,code,page){if(busy)return;busy=true;ens();stack.push(cur);document.body.classList.add('loading');try{await freshOne(k)}catch(e){stack.pop();document.body.classList.remove('loading');busy=false;showErr(e);return}const f=$('f_'+k),w=f.contentWindow;w.__fromMain=true;w.__modalMain=!page;try{if(code)w.eval(code)}catch(e){console.error(e)}cur={p:'t',k};document.querySelectorAll('.trk').forEach(x=>x.classList.remove('on'));f.classList.add('on');document.body.classList.remove('loading');busy=false;setTimeout(()=>{if(cur.p==='t')$('shell').style.display='none'},320)}
function back(){if(!$('sheet').classList.contains('hidden')){sheetBack();return true}
 if(cur.p==='t'){const w=$('f_'+cur.k).contentWindow;if(w.__shellBack&&w.__shellBack())return true}
 if(stack.length){dir=-1;cur=stack.pop();render();if(cur.reopen){const k=cur.reopen;cur.reopen=null;if(k==='expenses')setTimeout(()=>exp(cur.rarg),0)}return true}return false}
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
 const typeCard=(k,n)=>{const c=tc(k);return `<div class="type-card" onclick="Shell.dev('showAllDevices()')">${DevIcons.chip(k,'t-'+k,1)}<b>${n}</b><div class="tcl"><span class="d av"></span>${c[0]} Available</div><div class="tcl"><span class="d rn"></span>${c[1]} On rental</div><div class="tcl"><span class="d sd"></span>${c[2]} Sold</div></div>`};
 const n=D.eval('totalDeviceCount()'),rn=R.eval('activeRentals().length'),pu=D.eval('totalPurchased()'),so=D.eval('totalSold()'),rv=R.eval('totalRentalIncome()'),ex=D.eval('totalExpenses()')+R.eval("state.rentals.reduce((s,r)=>s+Number(r.oneTimeExpense||0),0)");
 const st=(c,x,l,f)=>`<div class="stat ${c}" onclick="${f}"><div class="num">${x}</div><div class="label">${l}</div></div>`;
 v.innerHTML=`<div class="dashboard-grid dashboard-main">${st('income',n,'Available Devices',"Shell.dev('showAllDevices()')")}${st('rented',rn,'Rentals',"Shell.ren('showRentalValue()')")}${st('income',money(pu),'Total Purchased Value',"Shell.dev('showPurchased()')")}${st('rented',money(so),'Total Sold Value',"Shell.dev('showValue()')")}${st('value',money(rv),'Total Rental Value',"Shell.ren('showIncome()')")}${st('due',money(ex),'Total Expenses',"Shell.exp()")}</div>
 <h2 class="section-title">Our Devices</h2><div class="types">${typeCard('cpap','CPAP')}${typeCard('bipap','BiPAP')}${typeCard('o2','Oxygen Conc.')}</div>
 <h2 class="section-title">Quick Actions</h2><div class="quick three"><button onclick="Shell.addMenu()"><span class="qi"><svg class="tki" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><circle class="dot" cx="24" cy="24" r="19" fill="#fff" fill-opacity=".95"/><path d="M24 14v20M14 24h20" stroke="#0f968d" stroke-width="5" stroke-linecap="round"/></svg></span>ADD</button><button onclick="Shell.tracker('device')"><span class="qi"><svg class="tki" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><rect x="4" y="11" width="40" height="26" rx="8" fill="#fff" fill-opacity=".95"/><circle cx="13" cy="24" r="4.2" fill="#0f968d"/><path class="ecg" d="M21 25h5l2.2-7 3.4 13 3-6h4.4" fill="none" stroke="#e11d48" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="44"/></svg></span>DEVICE TRACKER</button><button onclick="Shell.tracker('rental')"><span class="qi"><svg class="tki" viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><g class="spin" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"><path d="M39 22a15 15 0 0 0-27-6"/><path d="M11 9v8h8"/><path d="M9 26a15 15 0 0 0 27 6"/><path d="M37 39v-8h-8"/></g><circle class="dot" cx="24" cy="24" r="5.5" fill="#fde047"/></svg></span>RENTAL TRACKER</button></div>
 <h2 class="section-title">⏰ Due / Renewal Alerts${alN?`<span class="sec-badge">${alN}</span>`:''}</h2><div class="alert-list">${alH||'<div class="empty">No due or renewal alerts in the next 3 days. 🎉</div>'}</div>
 <h2 class="section-title">Manage</h2><div class="manage"><div class="tile" onclick="Shell.dev('showAllDevices()')"><span class="emoji">⚙️</span>Devices</div><div class="tile" onclick="Shell.dev('showMasks()')"><span class="emoji">😷</span>Masks</div><div class="tile" onclick="Shell.dev('navigate(\\'suppliers\\');historyStack.length=0',1)"><span class="emoji">🏢</span>Suppliers</div><div class="tile" onclick="Shell.go('customers')"><span class="emoji">👥</span>Customers</div><div class="tile" onclick="Shell.go('reports')"><span class="emoji">📊</span>Reports</div></div>`}
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
 $('mb').innerHTML=(r.map(x=>`<div class="card stc-${x.k==='device'?'sold':'rental'}" onclick="Shell.expOpen('${x.k}','${x.id}')"><div class="row"><div><strong>${fmt(x.date)}</strong><div class="device-title">${esc(x.title)}</div><div class="muted">${esc(x.sub)}</div></div><strong>${money(x.amt)}</strong></div></div>`).join('')||'<div class="empty">No expenses yet.</div>')
 +`<div class="expense-summary"><div class="row"><span>DEVICE SALE EXPENSES</span><strong>${money(dv)}</strong></div><div class="row"><span>RENTAL EXPENSES</span><strong>${money(rn)}</strong></div><div class="row grand"><span>TOTAL EXPENSES</span><strong>${money(tot)}</strong></div></div>`;
 $('sheet').classList.remove('hidden')}
function expOpen(k,id){closeSheet();cur.reopen='expenses';if(k==='device')openIn('device',`openSale('${id}')`);else openIn('rental',`openRental('${id}')`)}
function vExp(){const r=S.expenses();$('view').innerHTML=r.map(x=>`<div class="card" onclick="Shell.${x.k==='device'?'dev':'ren2'}('${x.k==='device'?'openSale':'openRental'}(\\'${x.id}\\')')"><div class="row"><div><strong>${fmt(x.date)}</strong><div class="device-title">${esc(x.title)}</div><div class="muted">${esc(x.sub)}</div></div><strong>${money(x.amt)}</strong></div></div>`).join('')||'<div class="empty">No expenses.</div>';$('view').insertAdjacentHTML('beforeend',`<div class="total-bar"><span>TOTAL EXPENSES</span><span>${money(r.reduce((a,x)=>a+x.amt,0))}</span></div>`)}
window.Shell={dlAll,exp,expSub,sheetBack,expOpen,back,main,ens,go,addMenu,closeSheet,add,rep,dev:(c,p)=>openIn('device',c,p),ren:(c,p)=>openIn('rental',c,p),dev2:c=>openIn('rental',c),ren2:c=>openIn('rental',c),tracker:k=>openIn(k,'',1),
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
const xc2=x=>`<div class="card stc-${x.k==='device'?'sold':'rental'}" onclick="Shell.expOpen('${x.k}','${x.id}')"><div class="row"><div><strong>${fmt(x.date)}</strong><div class="device-title">${esc(x.title)}</div><div class="muted">${esc(x.sub)}</div></div><strong>${money(x.amt)}</strong></div></div>`;
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
const xcard=x=>`<div class="card stc-${x.k==='device'?'sold':'rental'}" onclick="Shell.${x.k==='device'?'dev':'ren2'}('${x.k==='device'?'openSale':'openRental'}(\\'${x.id}\\')')"><div class="row"><div><strong>${fmt(x.date)}</strong><div class="device-title">${esc(x.title)}</div><div class="muted">${esc(x.sub)}</div></div><strong>${money(x.amt)}</strong></div></div>`;
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
