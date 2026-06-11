/* ============================================================
   TEAM HUB — script.js  (column-exact version)
   Founder  : founder_name, position, description, skills,
              certificate_count, linkedin_url, twitter_url,
              instagram_url, image
   Employees: Full Name, Position, Department, Email, Phone,
              Joining Date, Description, Skills,
              Certificates Count, image
   ============================================================ */

const SUPA_URL  = 'https://yciefqskumwsnbzhlzqt.supabase.co';
const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaWVmcXNrdW13c25iemhsenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzMxODcsImV4cCI6MjA5NjE0OTE4N30.4HQQ12eIgzfT3ozWOoHygVZyZPlGbVEaXpOKCPAwqhw';
const EMP_URL   = `${SUPA_URL}/rest/v1/Employees`;
const FOUND_URL = `${SUPA_URL}/rest/v1/Founder`;

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPA_KEY,
  'Authorization': `Bearer ${SUPA_KEY}`,
  'Prefer': 'return=representation'
};

// ===== PASSWORD =====
const ADMIN_PASSWORD  = '@@PRINCE6392@@';
const UNLOCK_DURATION = 5 * 60 * 1000;
let unlockExpiry  = 0;
let pendingAction = null;

// ===== STATE =====
let employees     = [];
let founder       = null;
let editingEmpId  = null;
let deletingEmpId = null;
let founderImgB64 = null;
let empImgB64     = null;

// ===== SUPABASE HELPERS =====
async function sbGet(url, q = '') {
  const res = await fetch(url + q, { headers: { ...HEADERS, 'Prefer': '' } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbPost(url, body) {
  const res = await fetch(url, { method:'POST', headers: HEADERS, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbPatch(url, match, body) {
  const res = await fetch(`${url}?${match}`, { method:'PATCH', headers: HEADERS, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbDelete(url, match) {
  const res = await fetch(`${url}?${match}`, { method:'DELETE', headers: { ...HEADERS, 'Prefer':'' } });
  if (!res.ok) throw new Error(await res.text());
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  t.classList.remove('hidden');
  setTimeout(() => { t.classList.add('hidden'); }, 3000);
}

// ===== PASSWORD SYSTEM =====
function isUnlocked() { return Date.now() < unlockExpiry; }

function requirePassword(action) {
  if (isUnlocked()) { action(); return; }
  pendingAction = action;
  document.getElementById('passwordInput').value = '';
  document.getElementById('pwError').classList.add('hidden');
  document.getElementById('passwordModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('passwordInput').focus(), 100);
}

document.getElementById('pwSubmit').addEventListener('click', () => {
  const val = document.getElementById('passwordInput').value;
  if (val === ADMIN_PASSWORD) {
    unlockExpiry = Date.now() + UNLOCK_DURATION;
    document.getElementById('passwordModal').classList.add('hidden');
    showToast('✅ Unlocked for 5 minutes', 'success');
    if (pendingAction) { pendingAction(); pendingAction = null; }
  } else {
    document.getElementById('pwError').classList.remove('hidden');
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
});
document.getElementById('passwordInput').addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('pwSubmit').click(); });
document.getElementById('pwCancel').addEventListener('click', () => { document.getElementById('passwordModal').classList.add('hidden'); pendingAction = null; });
document.getElementById('pwToggle').addEventListener('click', () => {
  const inp = document.getElementById('passwordInput');
  const icon = document.getElementById('pwToggle').querySelector('i');
  if (inp.type==='password') { inp.type='text'; icon.className='fas fa-eye-slash'; }
  else { inp.type='password'; icon.className='fas fa-eye'; }
});

// ===== THEME =====
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').className = theme==='dark' ? 'fas fa-moon' : 'fas fa-sun';
  localStorage.setItem('th_theme', theme);
}
document.getElementById('themeToggleBtn').addEventListener('click', () => {
  applyTheme(document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark');
});

// ===== LOAD =====
async function loadAll() {
  try {
    const fRows = await sbGet(FOUND_URL, '?order=id.asc&limit=1');
    founder = fRows[0] || null;
    renderFounder();
    const eRows = await sbGet(EMP_URL, '?order=id.asc');
    employees = eRows || [];
    renderAll();
  } catch(err) {
    console.error('Load error:', err);
    showToast('⚠️ Could not load data', 'error');
  }
}

// ===== FOUNDER HELPERS =====
// Read from exact Supabase column names
function fVal(f, key) {
  const map = {
    name:         f['founder_name']      || '',
    position:     f['position']          || '',
    description:  f['description']       || '',
    skills:       f['skills']            || '',
    certificates: f['certificate_count'] || 0,
    linkedin:     f['linkedin_url']      || '',
    twitter:      f['twitter_url']       || '',
    instagram:    f['instagram_url']     || '',
    image:        f['image']             || ''
  };
  return map[key] !== undefined ? map[key] : '';
}

// ===== RENDER FOUNDER =====
function renderFounder() {
  if (!founder) return;
  const img = document.getElementById('founderCardImg');
  const ph  = document.getElementById('founderCardPlaceholder');
  const imgVal = fVal(founder,'image');
  if (imgVal) { img.src=imgVal; img.classList.remove('hidden'); ph.classList.add('hidden'); }
  else        { img.classList.add('hidden'); ph.classList.remove('hidden'); }

  document.getElementById('founderCardName').textContent  = fVal(founder,'name')         || 'Prince Verma';
  document.getElementById('founderCardPos').textContent   = fVal(founder,'position')      || 'Founder & CEO';
  document.getElementById('founderCardDesc').textContent  = fVal(founder,'description')   || '';
  document.getElementById('founderCardCerts').textContent = fVal(founder,'certificates')  || '50';

  const skillsEl = document.getElementById('founderCardSkills');
  skillsEl.innerHTML = '';
  parseSkills(fVal(founder,'skills')).forEach(s => {
    const b = document.createElement('span'); b.className='skill-badge'; b.textContent=s; skillsEl.appendChild(b);
  });

  const socialsEl = document.getElementById('founderCardSocials');
  socialsEl.innerHTML = '';
  if (fVal(founder,'linkedin'))  socialsEl.innerHTML += `<a href="${fVal(founder,'linkedin')}"  target="_blank" class="social-btn"><i class="fab fa-linkedin-in"></i></a>`;
  if (fVal(founder,'twitter'))   socialsEl.innerHTML += `<a href="${fVal(founder,'twitter')}"   target="_blank" class="social-btn"><i class="fab fa-twitter"></i></a>`;
  if (fVal(founder,'instagram')) socialsEl.innerHTML += `<a href="${fVal(founder,'instagram')}" target="_blank" class="social-btn"><i class="fab fa-instagram"></i></a>`;
}

// ===== RENDER ALL =====
function renderAll() { renderCards(employees); updateStats(); updateFilters(); renderOrgChart(); }

// ===== PARSE SKILLS =====
function parseSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(s=>s.trim()).filter(Boolean);
  return raw.split(',').map(s=>s.trim()).filter(Boolean);
}

// ===== RENDER CARDS =====
function renderCards(list) {
  const grid  = document.getElementById('cardsGrid');
  const empty = document.getElementById('noEmployees');
  grid.innerHTML = '';
  if (!list || list.length===0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.forEach((emp,i) => grid.appendChild(buildCard(emp,i)));
}

function buildCard(emp, i) {
  const div = document.createElement('div');
  div.className = 'emp-card';
  div.style.animationDelay = `${i*0.06}s`;

  // Exact column names from Employees table
  const name     = emp['Full Name']         || '—';
  const pos      = emp['Position']          || '';
  const dept     = emp['Department']        || '';
  const desc     = emp['Description']       || '';
  const skills   = parseSkills(emp['Skills'] || '');
  const certs    = emp['Certificates Count']|| '';
  const joinRaw  = emp['Joining Date']      || '';
  const image    = emp['image']             || '';
  const joinDate = joinRaw ? new Date(joinRaw).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'}) : '';

  const vis   = skills.slice(0,3);
  const extra = skills.length - 3;

  div.innerHTML = `
    <div class="card-header">
      <div class="card-img-wrap">
        ${image ? `<img src="${image}" alt="${name}" class="card-img"/>` : `<div class="card-img-placeholder"><i class="fas fa-user"></i></div>`}
      </div>
      <div class="card-basic">
        <div class="card-name">${name}</div>
        <div class="card-position">${pos}</div>
        <span class="card-dept">${dept}</span>
      </div>
    </div>
    ${desc ? `<div class="card-desc">${desc}</div>` : ''}
    ${vis.length ? `<div class="card-skills">${vis.map(s=>`<span class="card-skill">${s}</span>`).join('')}${extra>0?`<span class="more-skills">+${extra} more</span>`:''}</div>` : ''}
    <div class="card-meta">
      ${certs ? `<div class="card-meta-item"><i class="fas fa-certificate"></i> ${certs} Certs</div>` : ''}
      ${joinDate ? `<div class="card-meta-item"><i class="fas fa-calendar"></i> ${joinDate}</div>` : ''}
    </div>
    <div class="card-actions">
      <button class="btn-view"     data-id="${emp.id}"><i class="fas fa-eye"></i> View Details</button>
      <button class="btn-edit-card" data-id="${emp.id}" title="Edit"><i class="fas fa-pen"></i></button>
      <button class="btn-del-card"  data-id="${emp.id}" title="Delete"><i class="fas fa-trash"></i></button>
    </div>`;

  div.querySelector('.btn-view').addEventListener('click',      () => openViewModal(emp));
  div.querySelector('.btn-edit-card').addEventListener('click', () => requirePassword(() => openEditModal(emp)));
  div.querySelector('.btn-del-card').addEventListener('click',  () => requirePassword(() => openDeleteModal(emp)));
  return div;
}

// ===== STATS =====
function updateStats() {
  animateCounter('statEmployees', employees.length);
  const depts = new Set(employees.map(e=>e['Department']).filter(Boolean));
  animateCounter('statDepts', depts.size);
  const skills = new Set();
  employees.forEach(e => parseSkills(e['Skills']||'').forEach(s=>skills.add(s.toLowerCase())));
  animateCounter('statSkills', skills.size);
  const certs = employees.reduce((a,e)=>a+(parseInt(e['Certificates Count'])||0),0)
              + (parseInt(fVal(founder||{},'certificates'))||0);
  animateCounter('statCerts', certs);
}

function animateCounter(id, target) {
  const el = document.getElementById(id); if (!el) return;
  let cur=0; const step=Math.max(1,Math.ceil(target/40));
  const t=setInterval(()=>{ cur=Math.min(cur+step,target); el.textContent=cur; if(cur>=target) clearInterval(t); },30);
}

// ===== FILTERS =====
function updateFilters() {
  const deptSel = document.getElementById('deptFilter');
  const posSel  = document.getElementById('posFilter');
  const cd = deptSel.value, cp = posSel.value;
  const depts = [...new Set(employees.map(e=>e['Department']).filter(Boolean))].sort();
  const poss  = [...new Set(employees.map(e=>e['Position']).filter(Boolean))].sort();
  deptSel.innerHTML = '<option value="">All Departments</option>';
  depts.forEach(d=>{ const o=document.createElement('option'); o.value=d; o.textContent=d; if(d===cd)o.selected=true; deptSel.appendChild(o); });
  posSel.innerHTML = '<option value="">All Positions</option>';
  poss.forEach(p=>{ const o=document.createElement('option'); o.value=p; o.textContent=p; if(p===cp)o.selected=true; posSel.appendChild(o); });
}

// ===== SEARCH =====
function getFiltered() {
  const q    = document.getElementById('searchInput').value.trim().toLowerCase();
  const dept = document.getElementById('deptFilter').value;
  const pos  = document.getElementById('posFilter').value;
  return employees.filter(e=>{
    const sk = parseSkills(e['Skills']||'').join(' ').toLowerCase();
    const mq = !q || (e['Full Name']||'').toLowerCase().includes(q) || (e['Position']||'').toLowerCase().includes(q) || (e['Department']||'').toLowerCase().includes(q) || sk.includes(q);
    return mq && (!dept||e['Department']===dept) && (!pos||e['Position']===pos);
  });
}
document.getElementById('searchInput').addEventListener('input', e=>{
  document.getElementById('clearSearch').classList.toggle('hidden',!e.target.value);
  renderCards(getFiltered());
});
document.getElementById('clearSearch').addEventListener('click', ()=>{
  document.getElementById('searchInput').value='';
  document.getElementById('clearSearch').classList.add('hidden');
  renderCards(employees);
});
document.getElementById('deptFilter').addEventListener('change', ()=>renderCards(getFiltered()));
document.getElementById('posFilter').addEventListener('change',  ()=>renderCards(getFiltered()));

// ===== ORG CHART =====
function renderOrgChart() {
  const el = document.getElementById('orgChart');
  el.innerHTML = `<div class="org-founder-node">${fVal(founder||{},'name')||'Prince Verma'} — ${fVal(founder||{},'position')||'Founder & CEO'}</div><div class="org-connector"></div>`;
  const depts = {};
  employees.forEach(e=>{ const d=e['Department']||'General'; depts[d]=(depts[d]||0)+1; });
  if (!Object.keys(depts).length) return;
  const row = document.createElement('div'); row.className='org-dept-row';
  Object.entries(depts).forEach(([d,c])=>{
    const n=document.createElement('div'); n.className='org-dept-node';
    n.innerHTML=`<div class="org-dept-name">${d}</div><div class="org-dept-count">${c} member${c>1?'s':''}</div>`;
    row.appendChild(n);
  });
  el.appendChild(row);
}

// ===== VIEW MODAL =====
function openViewModal(emp) {
  const name    = emp['Full Name']          || '—';
  const pos     = emp['Position']           || '—';
  const dept    = emp['Department']         || '—';
  const desc    = emp['Description']        || '';
  const skills  = parseSkills(emp['Skills']||'');
  const email   = emp['Email']              || '';
  const phone   = emp['Phone']              || '';
  const certs   = emp['Certificates Count'] || '';
  const image   = emp['image']              || '';
  const joinRaw = emp['Joining Date']       || '';
  const joinDate= joinRaw ? new Date(joinRaw).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'}) : '—';

  document.getElementById('viewModalBody').innerHTML = `
    <div class="view-profile">
      ${image ? `<img src="${image}" class="view-img" alt="${name}"/>` : `<div class="view-img-placeholder"><i class="fas fa-user"></i></div>`}
      <div><div class="view-name">${name}</div><div class="view-pos">${pos}</div><div class="view-dept">${dept}</div></div>
    </div>
    ${desc?`<div class="view-section"><label>About</label><p>${desc}</p></div>`:''}
    ${skills.length?`<div class="view-section"><label>Skills</label><div class="view-skills">${skills.map(s=>`<span class="skill-badge">${s}</span>`).join('')}</div></div>`:''}
    <div class="view-section" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      ${email?`<div><label>Email</label><p>${email}</p></div>`:''}
      ${phone?`<div><label>Phone</label><p>${phone}</p></div>`:''}
      ${certs?`<div><label>Certificates</label><p>${certs}</p></div>`:''}
      <div><label>Joined</label><p>${joinDate}</p></div>
    </div>`;
  document.getElementById('viewModal').classList.remove('hidden');
}
document.getElementById('viewModalClose').addEventListener('click', ()=>document.getElementById('viewModal').classList.add('hidden'));
document.getElementById('viewModal').addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });

// ===== ADD EMPLOYEE =====
document.getElementById('addEmpBtn').addEventListener('click', ()=>requirePassword(()=>openAddModal()));

function openAddModal() {
  editingEmpId = null; empImgB64 = null;
  document.getElementById('empModalTitle').textContent = 'Add New Employee';
  clearEmpForm();
  document.getElementById('empModal').classList.remove('hidden');
}

function openEditModal(emp) {
  editingEmpId = emp.id;
  empImgB64    = emp['image'] || null;
  document.getElementById('empModalTitle').textContent = 'Edit Employee';
  document.getElementById('empName').value     = emp['Full Name']          || '';
  document.getElementById('empPosition').value = emp['Position']           || '';
  document.getElementById('empDept').value     = emp['Department']         || '';
  document.getElementById('empEmail').value    = emp['Email']              || '';
  document.getElementById('empPhone').value    = emp['Phone']              || '';
  document.getElementById('empJoinDate').value = emp['Joining Date']       || '';
  document.getElementById('empDesc').value     = emp['Description']        || '';
  document.getElementById('empSkills').value   = emp['Skills']             || '';
  document.getElementById('empCerts').value    = emp['Certificates Count'] || '';

  const pi = document.getElementById('empImgPreviewImg');
  const pp = document.getElementById('empImgPlaceholder');
  if (empImgB64) { pi.src=empImgB64; pi.classList.remove('hidden'); pp.classList.add('hidden'); }
  else           { pi.classList.add('hidden'); pp.classList.remove('hidden'); }
  document.getElementById('empModal').classList.remove('hidden');
}

function clearEmpForm() {
  ['empName','empPosition','empDept','empEmail','empPhone','empJoinDate','empDesc','empSkills','empCerts'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('empImgPreviewImg').classList.add('hidden');
  document.getElementById('empImgPlaceholder').classList.remove('hidden');
  document.getElementById('empImageInput').value='';
}

document.getElementById('empUploadBtn').addEventListener('click', ()=>document.getElementById('empImageInput').click());
document.getElementById('empImageInput').addEventListener('change', e=>{
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=ev=>{ empImgB64=ev.target.result; const i=document.getElementById('empImgPreviewImg'); i.src=empImgB64; i.classList.remove('hidden'); document.getElementById('empImgPlaceholder').classList.add('hidden'); };
  r.readAsDataURL(file);
});
document.getElementById('empCancelBtn').addEventListener('click',  ()=>document.getElementById('empModal').classList.add('hidden'));
document.getElementById('empModalClose').addEventListener('click', ()=>document.getElementById('empModal').classList.add('hidden'));
document.getElementById('empModal').addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });

document.getElementById('empSaveBtn').addEventListener('click', async ()=>{
  const name = document.getElementById('empName').value.trim();
  const pos  = document.getElementById('empPosition').value.trim();
  const dept = document.getElementById('empDept').value.trim();
  if (!name||!pos||!dept) { showToast('⚠️ Name, Position & Department required','error'); return; }

  // Exact column names matching Supabase Employees table
  const payload = {
    'Full Name':          name,
    'Position':           pos,
    'Department':         dept,
    'Email':              document.getElementById('empEmail').value.trim(),
    'Phone':              document.getElementById('empPhone').value.trim(),
    'Joining Date':       document.getElementById('empJoinDate').value || null,
    'Description':        document.getElementById('empDesc').value.trim(),
    'Skills':             document.getElementById('empSkills').value.trim(),
    'Certificates Count': parseInt(document.getElementById('empCerts').value)||0,
    'image':              empImgB64 || null
  };

  const btn=document.getElementById('empSaveBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...';
  try {
    if (editingEmpId) {
      const updated = await sbPatch(EMP_URL,`id=eq.${editingEmpId}`,payload);
      const idx=employees.findIndex(e=>e.id===editingEmpId);
      if(idx!==-1) employees[idx]=updated[0]||{...payload,id:editingEmpId};
      showToast('✅ Employee updated!','success');
    } else {
      const created=await sbPost(EMP_URL,payload);
      employees.push(created[0]||payload);
      showToast('✅ Employee added!','success');
    }
    document.getElementById('empModal').classList.add('hidden');
    renderAll();
  } catch(err) {
    console.error(err);
    showToast('❌ Save failed: '+err.message,'error');
  } finally {
    btn.disabled=false; btn.innerHTML='Save Employee <i class="fas fa-save"></i>';
  }
});

// ===== DELETE =====
function openDeleteModal(emp) {
  deletingEmpId=emp.id;
  document.getElementById('deleteConfirmText').textContent=`Delete "${emp['Full Name']}"? This cannot be undone.`;
  document.getElementById('deleteModal').classList.remove('hidden');
}
document.getElementById('deleteCancelBtn').addEventListener('click', ()=>document.getElementById('deleteModal').classList.add('hidden'));
document.getElementById('deleteModal').addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });
document.getElementById('deleteConfirmBtn').addEventListener('click', async ()=>{
  if(!deletingEmpId) return;
  const btn=document.getElementById('deleteConfirmBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Deleting...';
  try {
    await sbDelete(EMP_URL,`id=eq.${deletingEmpId}`);
    employees=employees.filter(e=>e.id!==deletingEmpId);
    document.getElementById('deleteModal').classList.add('hidden');
    showToast('🗑️ Employee deleted','info');
    renderAll();
  } catch(err) { showToast('❌ Delete failed','error'); }
  finally { btn.disabled=false; btn.innerHTML='Delete <i class="fas fa-trash"></i>'; }
});

// ===== FOUNDER EDIT =====
document.getElementById('founderEditBtn').addEventListener('click', ()=>requirePassword(()=>openFounderModal()));

function openFounderModal() {
  founderImgB64=founder ? fVal(founder,'image') : null;
  document.getElementById('founderName').value      = founder ? fVal(founder,'name')         : 'Prince Verma';
  document.getElementById('founderPosition').value  = founder ? fVal(founder,'position')      : 'Founder & CEO';
  document.getElementById('founderDesc').value      = founder ? fVal(founder,'description')   : '';
  const sk = founder ? fVal(founder,'skills') : '';
  document.getElementById('founderSkills').value    = Array.isArray(sk) ? sk.join(', ') : (sk||'');
  document.getElementById('founderCerts').value     = founder ? fVal(founder,'certificates')  : 50;
  document.getElementById('founderLinkedin').value  = founder ? fVal(founder,'linkedin')      : '';
  document.getElementById('founderTwitter').value   = founder ? fVal(founder,'twitter')       : '';
  document.getElementById('founderInstagram').value = founder ? fVal(founder,'instagram')     : '';

  const pi=document.getElementById('founderImgPreviewImg'), pp=document.getElementById('founderImgPlaceholder');
  if(founderImgB64){ pi.src=founderImgB64; pi.classList.remove('hidden'); pp.classList.add('hidden'); }
  else             { pi.classList.add('hidden'); pp.classList.remove('hidden'); }
  document.getElementById('founderModal').classList.remove('hidden');
}

document.getElementById('founderUploadBtn').addEventListener('click', ()=>document.getElementById('founderImageInput').click());
document.getElementById('founderImageInput').addEventListener('change', e=>{
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=ev=>{ founderImgB64=ev.target.result; const i=document.getElementById('founderImgPreviewImg'); i.src=founderImgB64; i.classList.remove('hidden'); document.getElementById('founderImgPlaceholder').classList.add('hidden'); };
  r.readAsDataURL(file);
});
document.getElementById('founderRemoveImg').addEventListener('click', ()=>{
  founderImgB64=null;
  document.getElementById('founderImgPreviewImg').classList.add('hidden');
  document.getElementById('founderImgPlaceholder').classList.remove('hidden');
  document.getElementById('founderImageInput').value='';
});
document.getElementById('founderCancelBtn').addEventListener('click',  ()=>document.getElementById('founderModal').classList.add('hidden'));
document.getElementById('founderModalClose').addEventListener('click', ()=>document.getElementById('founderModal').classList.add('hidden'));
document.getElementById('founderModal').addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });

document.getElementById('founderSaveBtn').addEventListener('click', async ()=>{
  // Exact Founder table column names
  const payload = {
    'founder_name':      document.getElementById('founderName').value.trim(),
    'position':          document.getElementById('founderPosition').value.trim(),
    'description':       document.getElementById('founderDesc').value.trim(),
    'skills':            document.getElementById('founderSkills').value.trim(),
    'certificate_count': parseInt(document.getElementById('founderCerts').value)||50,
    'linkedin_url':      document.getElementById('founderLinkedin').value.trim(),
    'twitter_url':       document.getElementById('founderTwitter').value.trim(),
    'instagram_url':     document.getElementById('founderInstagram').value.trim(),
    'image':             founderImgB64||null
  };
  const btn=document.getElementById('founderSaveBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...';
  try {
    if(founder?.id){
      const u=await sbPatch(FOUND_URL,`id=eq.${founder.id}`,payload);
      founder=u[0]||{...payload,id:founder.id};
    } else {
      const c=await sbPost(FOUND_URL,payload);
      founder=c[0]||payload;
    }
    document.getElementById('founderModal').classList.add('hidden');
    renderFounder(); renderOrgChart();
    showToast('✅ Founder updated!','success');
  } catch(err) {
    console.error(err);
    showToast('❌ Save failed: '+err.message,'error');
  } finally {
    btn.disabled=false; btn.innerHTML='Save Changes <i class="fas fa-save"></i>';
  }
});

// ===== EXPORT =====
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const data={founder,employees,exported_at:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`teamhub_${Date.now()}.json`; a.click();
  showToast('📥 Exported!','success');
});

document.getElementById('importInput').addEventListener('change', e=>{
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=async ev=>{
    try {
      const data=JSON.parse(ev.target.result);
      if(data.employees && Array.isArray(data.employees)){
        for(const emp of data.employees){ const {id,...rest}=emp; await sbPost(EMP_URL,rest); }
      }
      showToast('✅ Import done! Reloading...','success');
      setTimeout(loadAll,1000);
    } catch(err){ showToast('❌ Import failed','error'); }
  };
  r.readAsText(file); e.target.value='';
});

// ===== INIT =====
(function init(){
  applyTheme(localStorage.getItem('th_theme')||'dark');
  loadAll();
})();
