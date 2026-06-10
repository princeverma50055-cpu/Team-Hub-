/* ============================================================
   TEAM HUB — script.js
   Supabase backend + Password protection + Full CRUD
   ============================================================ */

// ===== SUPABASE CONFIG =====
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

// ===== PASSWORD CONFIG =====
const ADMIN_PASSWORD   = '@@PRINCE6392@@';
const UNLOCK_DURATION  = 5 * 60 * 1000; // 5 minutes
let unlockExpiry       = 0;
let pendingAction      = null; // function to call after unlock

// ===== STATE =====
let employees = [];
let founder   = null;
let editingEmpId = null;
let deletingEmpId = null;
let founderImgBase64 = null;
let empImgBase64 = null;

// ===== SUPABASE HELPERS =====
async function sbGet(url, query = '') {
  const res = await fetch(url + query, {
    headers: { ...HEADERS, 'Prefer': '' }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbPatch(url, match, body) {
  const res = await fetch(`${url}?${match}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbDelete(url, match) {
  const res = await fetch(`${url}?${match}`, {
    method: 'DELETE',
    headers: { ...HEADERS, 'Prefer': '' }
  });
  if (!res.ok) throw new Error(await res.text());
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  t.classList.remove('hidden');
  setTimeout(() => { t.classList.add('hidden'); t.classList.remove('show'); }, 3000);
}

// ===== PASSWORD SYSTEM =====
function isUnlocked() {
  return Date.now() < unlockExpiry;
}

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
    document.getElementById('pwError').classList.add('hidden');
    showToast('✅ Unlocked for 5 minutes', 'success');
    if (pendingAction) { pendingAction(); pendingAction = null; }
  } else {
    document.getElementById('pwError').classList.remove('hidden');
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
});

document.getElementById('passwordInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('pwSubmit').click();
});

document.getElementById('pwCancel').addEventListener('click', () => {
  document.getElementById('passwordModal').classList.add('hidden');
  pendingAction = null;
});

document.getElementById('pwToggle').addEventListener('click', () => {
  const inp = document.getElementById('passwordInput');
  const icon = document.getElementById('pwToggle').querySelector('i');
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
});

// ===== THEME =====
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  localStorage.setItem('th_theme', theme);
}

document.getElementById('themeToggleBtn').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

// ===== LOAD DATA =====
async function loadAll() {
  try {
    // Load founder
    const fRows = await sbGet(FOUND_URL, '?order=id.asc&limit=1');
    founder = fRows[0] || null;
    renderFounder();

    // Load employees
    const eRows = await sbGet(EMP_URL, '?order=id.asc');
    employees = eRows || [];
    renderAll();
  } catch (err) {
    console.error('Load error:', err);
    showToast('⚠️ Could not load data. Check Supabase.', 'error');
    // fallback to localStorage
    const lf = localStorage.getItem('th_founder');
    if (lf) { founder = JSON.parse(lf); renderFounder(); }
    const le = localStorage.getItem('th_employees');
    if (le) { employees = JSON.parse(le); renderAll(); }
  }
}

// ===== RENDER FOUNDER =====
function renderFounder() {
  if (!founder) return;
  const f = founder;

  // Image
  const img = document.getElementById('founderCardImg');
  const ph  = document.getElementById('founderCardPlaceholder');
  if (f.image) { img.src = f.image; img.classList.remove('hidden'); ph.classList.add('hidden'); }
  else { img.classList.add('hidden'); ph.classList.remove('hidden'); }

  document.getElementById('founderCardName').textContent = f.name || 'Prince Verma';
  document.getElementById('founderCardPos').textContent  = f.position || 'Founder & CEO';
  document.getElementById('founderCardDesc').textContent = f.description || '';
  document.getElementById('founderCardCerts').textContent = f.certificates || '50';

  // Skills
  const skillsEl = document.getElementById('founderCardSkills');
  skillsEl.innerHTML = '';
  const skills = parseSkills(f.skills);
  skills.forEach(s => {
    const b = document.createElement('span');
    b.className = 'skill-badge';
    b.textContent = s;
    skillsEl.appendChild(b);
  });

  // Socials
  const socialsEl = document.getElementById('founderCardSocials');
  socialsEl.innerHTML = '';
  if (f.linkedin)  socialsEl.innerHTML += `<a href="${f.linkedin}"  target="_blank" class="social-btn" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a>`;
  if (f.twitter)   socialsEl.innerHTML += `<a href="${f.twitter}"   target="_blank" class="social-btn" title="Twitter"><i class="fab fa-twitter"></i></a>`;
  if (f.instagram) socialsEl.innerHTML += `<a href="${f.instagram}" target="_blank" class="social-btn" title="Instagram"><i class="fab fa-instagram"></i></a>`;
}

// ===== RENDER ALL =====
function renderAll() {
  renderCards(employees);
  updateStats();
  updateFilters();
  renderOrgChart();
}

// ===== PARSE SKILLS =====
function parseSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(s => s.trim()).filter(Boolean);
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// ===== RENDER CARDS =====
function renderCards(list) {
  const grid = document.getElementById('cardsGrid');
  const empty = document.getElementById('noEmployees');
  grid.innerHTML = '';
  if (!list || list.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.forEach((emp, i) => {
    const card = buildCard(emp, i);
    grid.appendChild(card);
  });
}

function buildCard(emp, i) {
  const div = document.createElement('div');
  div.className = 'emp-card';
  div.style.animationDelay = `${i * 0.06}s`;

  const skills = parseSkills(emp.skills);
  const visibleSkills = skills.slice(0, 3);
  const extraCount = skills.length - 3;
  const joinDate = emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }) : '';

  div.innerHTML = `
    <div class="card-header">
      <div class="card-img-wrap">
        ${emp.image
          ? `<img src="${emp.image}" alt="${emp.name}" class="card-img"/>`
          : `<div class="card-img-placeholder"><i class="fas fa-user"></i></div>`}
      </div>
      <div class="card-basic">
        <div class="card-name">${emp.name || '—'}</div>
        <div class="card-position">${emp.position || ''}</div>
        <span class="card-dept">${emp.department || ''}</span>
      </div>
    </div>
    ${emp.description ? `<div class="card-desc">${emp.description}</div>` : ''}
    ${visibleSkills.length ? `
    <div class="card-skills">
      ${visibleSkills.map(s => `<span class="card-skill">${s}</span>`).join('')}
      ${extraCount > 0 ? `<span class="more-skills">+${extraCount} more</span>` : ''}
    </div>` : ''}
    <div class="card-meta">
      ${emp.certificates ? `<div class="card-meta-item"><i class="fas fa-certificate"></i> ${emp.certificates} Certs</div>` : ''}
      ${joinDate ? `<div class="card-meta-item"><i class="fas fa-calendar"></i> ${joinDate}</div>` : ''}
    </div>
    <div class="card-actions">
      <button class="btn-view" data-id="${emp.id}"><i class="fas fa-eye"></i> View Details</button>
      <button class="btn-edit-card" data-id="${emp.id}" title="Edit"><i class="fas fa-pen"></i></button>
      <button class="btn-del-card"  data-id="${emp.id}" title="Delete"><i class="fas fa-trash"></i></button>
    </div>
  `;

  div.querySelector('.btn-view').addEventListener('click', () => openViewModal(emp));
  div.querySelector('.btn-edit-card').addEventListener('click', () => requirePassword(() => openEditModal(emp)));
  div.querySelector('.btn-del-card').addEventListener('click', () => requirePassword(() => openDeleteModal(emp)));

  return div;
}

// ===== STATS =====
function updateStats() {
  animateCounter('statEmployees', employees.length);
  const depts = new Set(employees.map(e => e.department).filter(Boolean));
  animateCounter('statDepts', depts.size);
  const skills = new Set();
  employees.forEach(e => parseSkills(e.skills).forEach(s => skills.add(s.toLowerCase())));
  animateCounter('statSkills', skills.size);
  const certs = employees.reduce((a, e) => a + (parseInt(e.certificates) || 0), 0)
              + (parseInt(founder?.certificates) || 0);
  animateCounter('statCerts', certs);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const timer = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(timer);
  }, 30);
}

// ===== FILTERS =====
function updateFilters() {
  const deptSel = document.getElementById('deptFilter');
  const posSel  = document.getElementById('posFilter');
  const curDept = deptSel.value;
  const curPos  = posSel.value;

  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  const poss  = [...new Set(employees.map(e => e.position).filter(Boolean))].sort();

  deptSel.innerHTML = '<option value="">All Departments</option>';
  depts.forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; if (d === curDept) o.selected = true; deptSel.appendChild(o); });

  posSel.innerHTML = '<option value="">All Positions</option>';
  poss.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; if (p === curPos) o.selected = true; posSel.appendChild(o); });
}

// ===== SEARCH & FILTER =====
function getFiltered() {
  const q    = document.getElementById('searchInput').value.trim().toLowerCase();
  const dept = document.getElementById('deptFilter').value;
  const pos  = document.getElementById('posFilter').value;

  return employees.filter(e => {
    const skills = parseSkills(e.skills).join(' ').toLowerCase();
    const matchQ = !q ||
      (e.name       || '').toLowerCase().includes(q) ||
      (e.position   || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q) ||
      skills.includes(q);
    const matchDept = !dept || e.department === dept;
    const matchPos  = !pos  || e.position  === pos;
    return matchQ && matchDept && matchPos;
  });
}

document.getElementById('searchInput').addEventListener('input', e => {
  document.getElementById('clearSearch').classList.toggle('hidden', !e.target.value);
  renderCards(getFiltered());
});
document.getElementById('clearSearch').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('clearSearch').classList.add('hidden');
  renderCards(employees);
});
document.getElementById('deptFilter').addEventListener('change', () => renderCards(getFiltered()));
document.getElementById('posFilter').addEventListener('change',  () => renderCards(getFiltered()));

// ===== ORG CHART =====
function renderOrgChart() {
  const el = document.getElementById('orgChart');
  el.innerHTML = '';

  const founderName = founder?.name || 'Prince Verma';
  const founderPos  = founder?.position || 'Founder & CEO';

  el.innerHTML = `
    <div class="org-founder-node">${founderName} — ${founderPos}</div>
    <div class="org-connector"></div>
  `;

  const depts = {};
  employees.forEach(e => {
    const d = e.department || 'General';
    if (!depts[d]) depts[d] = 0;
    depts[d]++;
  });

  if (Object.keys(depts).length === 0) return;

  const row = document.createElement('div');
  row.className = 'org-dept-row';
  Object.entries(depts).forEach(([dept, count]) => {
    const node = document.createElement('div');
    node.className = 'org-dept-node';
    node.innerHTML = `<div class="org-dept-name">${dept}</div><div class="org-dept-count">${count} member${count>1?'s':''}</div>`;
    row.appendChild(node);
  });
  el.appendChild(row);
}

// ===== VIEW MODAL =====
function openViewModal(emp) {
  const skills = parseSkills(emp.skills);
  const joinDate = emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : '—';

  document.getElementById('viewModalBody').innerHTML = `
    <div class="view-profile">
      ${emp.image
        ? `<img src="${emp.image}" class="view-img" alt="${emp.name}"/>`
        : `<div class="view-img-placeholder"><i class="fas fa-user"></i></div>`}
      <div>
        <div class="view-name">${emp.name || '—'}</div>
        <div class="view-pos">${emp.position || '—'}</div>
        <div class="view-dept">${emp.department || '—'}</div>
      </div>
    </div>
    ${emp.description ? `<div class="view-section"><label>About</label><p>${emp.description}</p></div>` : ''}
    ${skills.length ? `<div class="view-section"><label>Skills</label><div class="view-skills">${skills.map(s=>`<span class="skill-badge">${s}</span>`).join('')}</div></div>` : ''}
    <div class="view-section" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      ${emp.email    ? `<div><label>Email</label><p>${emp.email}</p></div>` : ''}
      ${emp.phone    ? `<div><label>Phone</label><p>${emp.phone}</p></div>` : ''}
      ${emp.certificates ? `<div><label>Certificates</label><p>${emp.certificates}</p></div>` : ''}
      <div><label>Joined</label><p>${joinDate}</p></div>
    </div>
  `;
  document.getElementById('viewModal').classList.remove('hidden');
}
document.getElementById('viewModalClose').addEventListener('click', () => document.getElementById('viewModal').classList.add('hidden'));
document.getElementById('viewModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

// ===== ADD EMPLOYEE =====
document.getElementById('addEmpBtn').addEventListener('click', () => {
  requirePassword(() => openAddModal());
});

function openAddModal() {
  editingEmpId = null;
  empImgBase64 = null;
  document.getElementById('empModalTitle').textContent = 'Add New Employee';
  clearEmpForm();
  document.getElementById('empModal').classList.remove('hidden');
}

function openEditModal(emp) {
  editingEmpId = emp.id;
  empImgBase64 = emp.image || null;
  document.getElementById('empModalTitle').textContent = 'Edit Employee';

  document.getElementById('empName').value      = emp.name || '';
  document.getElementById('empPosition').value  = emp.position || '';
  document.getElementById('empDept').value      = emp.department || '';
  document.getElementById('empEmail').value     = emp.email || '';
  document.getElementById('empPhone').value     = emp.phone || '';
  document.getElementById('empJoinDate').value  = emp.joining_date || '';
  document.getElementById('empDesc').value      = emp.description || '';
  document.getElementById('empSkills').value    = Array.isArray(emp.skills) ? emp.skills.join(', ') : (emp.skills || '');
  document.getElementById('empCerts').value     = emp.certificates || '';

  const previewImg = document.getElementById('empImgPreviewImg');
  const placeholder = document.getElementById('empImgPlaceholder');
  if (emp.image) {
    previewImg.src = emp.image;
    previewImg.classList.remove('hidden');
    placeholder.classList.add('hidden');
  } else {
    previewImg.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }

  document.getElementById('empModal').classList.remove('hidden');
}

function clearEmpForm() {
  ['empName','empPosition','empDept','empEmail','empPhone','empJoinDate','empDesc','empSkills','empCerts']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('empImgPreviewImg').classList.add('hidden');
  document.getElementById('empImgPlaceholder').classList.remove('hidden');
  document.getElementById('empImageInput').value = '';
}

document.getElementById('empUploadBtn').addEventListener('click', () => document.getElementById('empImageInput').click());
document.getElementById('empImageInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    empImgBase64 = ev.target.result;
    const img = document.getElementById('empImgPreviewImg');
    img.src = empImgBase64;
    img.classList.remove('hidden');
    document.getElementById('empImgPlaceholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

document.getElementById('empCancelBtn').addEventListener('click', () => document.getElementById('empModal').classList.add('hidden'));
document.getElementById('empModalClose').addEventListener('click', () => document.getElementById('empModal').classList.add('hidden'));
document.getElementById('empModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

document.getElementById('empSaveBtn').addEventListener('click', async () => {
  const name = document.getElementById('empName').value.trim();
  const pos  = document.getElementById('empPosition').value.trim();
  const dept = document.getElementById('empDept').value.trim();

  if (!name || !pos || !dept) {
    showToast('⚠️ Name, Position & Department are required', 'error');
    return;
  }

  const skillsRaw = document.getElementById('empSkills').value.trim();

  const payload = {
    name,
    position:     pos,
    department:   dept,
    email:        document.getElementById('empEmail').value.trim(),
    phone:        document.getElementById('empPhone').value.trim(),
    joining_date: document.getElementById('empJoinDate').value || null,
    description:  document.getElementById('empDesc').value.trim(),
    skills:       skillsRaw,
    certificates: parseInt(document.getElementById('empCerts').value) || 0,
    image:        empImgBase64 || null
  };

  const btn = document.getElementById('empSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    if (editingEmpId) {
      const updated = await sbPatch(EMP_URL, `id=eq.${editingEmpId}`, payload);
      const idx = employees.findIndex(e => e.id === editingEmpId);
      if (idx !== -1) employees[idx] = updated[0] || { ...payload, id: editingEmpId };
      showToast('✅ Employee updated!', 'success');
    } else {
      const created = await sbPost(EMP_URL, payload);
      employees.push(created[0] || payload);
      showToast('✅ Employee added!', 'success');
    }
    localStorage.setItem('th_employees', JSON.stringify(employees));
    document.getElementById('empModal').classList.add('hidden');
    renderAll();
  } catch (err) {
    console.error(err);
    showToast('❌ Save failed. Check Supabase table columns.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Employee <i class="fas fa-save"></i>';
  }
});

// ===== DELETE =====
function openDeleteModal(emp) {
  deletingEmpId = emp.id;
  document.getElementById('deleteConfirmText').textContent = `Delete "${emp.name}"? This cannot be undone.`;
  document.getElementById('deleteModal').classList.remove('hidden');
}

document.getElementById('deleteCancelBtn').addEventListener('click', () => document.getElementById('deleteModal').classList.add('hidden'));
document.getElementById('deleteModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
  if (!deletingEmpId) return;
  const btn = document.getElementById('deleteConfirmBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
  try {
    await sbDelete(EMP_URL, `id=eq.${deletingEmpId}`);
    employees = employees.filter(e => e.id !== deletingEmpId);
    localStorage.setItem('th_employees', JSON.stringify(employees));
    document.getElementById('deleteModal').classList.add('hidden');
    showToast('🗑️ Employee deleted', 'info');
    renderAll();
  } catch (err) {
    console.error(err);
    showToast('❌ Delete failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Delete <i class="fas fa-trash"></i>';
  }
});

// ===== FOUNDER EDIT =====
document.getElementById('founderEditBtn').addEventListener('click', () => {
  requirePassword(() => openFounderModal());
});

function openFounderModal() {
  founderImgBase64 = founder?.image || null;
  document.getElementById('founderName').value     = founder?.name || 'Prince Verma';
  document.getElementById('founderPosition').value = founder?.position || 'Founder & CEO';
  document.getElementById('founderDesc').value     = founder?.description || '';
  document.getElementById('founderSkills').value   = Array.isArray(founder?.skills) ? founder.skills.join(', ') : (founder?.skills || '');
  document.getElementById('founderCerts').value    = founder?.certificates || 50;
  document.getElementById('founderLinkedin').value = founder?.linkedin || '';
  document.getElementById('founderTwitter').value  = founder?.twitter || '';
  document.getElementById('founderInstagram').value= founder?.instagram || '';

  const img = document.getElementById('founderImgPreviewImg');
  const ph  = document.getElementById('founderImgPlaceholder');
  if (founderImgBase64) { img.src = founderImgBase64; img.classList.remove('hidden'); ph.classList.add('hidden'); }
  else { img.classList.add('hidden'); ph.classList.remove('hidden'); }

  document.getElementById('founderModal').classList.remove('hidden');
}

document.getElementById('founderUploadBtn').addEventListener('click', () => document.getElementById('founderImageInput').click());
document.getElementById('founderImageInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    founderImgBase64 = ev.target.result;
    const img = document.getElementById('founderImgPreviewImg');
    img.src = founderImgBase64;
    img.classList.remove('hidden');
    document.getElementById('founderImgPlaceholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

document.getElementById('founderRemoveImg').addEventListener('click', () => {
  founderImgBase64 = null;
  document.getElementById('founderImgPreviewImg').classList.add('hidden');
  document.getElementById('founderImgPlaceholder').classList.remove('hidden');
  document.getElementById('founderImageInput').value = '';
});

document.getElementById('founderCancelBtn').addEventListener('click', () => document.getElementById('founderModal').classList.add('hidden'));
document.getElementById('founderModalClose').addEventListener('click', () => document.getElementById('founderModal').classList.add('hidden'));
document.getElementById('founderModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

document.getElementById('founderSaveBtn').addEventListener('click', async () => {
  const payload = {
    name:         document.getElementById('founderName').value.trim(),
    position:     document.getElementById('founderPosition').value.trim(),
    description:  document.getElementById('founderDesc').value.trim(),
    skills:       document.getElementById('founderSkills').value.trim(),
    certificates: parseInt(document.getElementById('founderCerts').value) || 50,
    linkedin:     document.getElementById('founderLinkedin').value.trim(),
    twitter:      document.getElementById('founderTwitter').value.trim(),
    instagram:    document.getElementById('founderInstagram').value.trim(),
    image:        founderImgBase64 || null
  };

  const btn = document.getElementById('founderSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    if (founder?.id) {
      const updated = await sbPatch(FOUND_URL, `id=eq.${founder.id}`, payload);
      founder = updated[0] || { ...payload, id: founder.id };
    } else {
      const created = await sbPost(FOUND_URL, payload);
      founder = created[0] || payload;
    }
    localStorage.setItem('th_founder', JSON.stringify(founder));
    document.getElementById('founderModal').classList.add('hidden');
    renderFounder();
    renderOrgChart();
    showToast('✅ Founder profile updated!', 'success');
  } catch (err) {
    console.error(err);
    showToast('❌ Save failed. Check Supabase.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Changes <i class="fas fa-save"></i>';
  }
});

// ===== EXPORT =====
document.getElementById('exportBtn').addEventListener('click', () => {
  const data = { founder, employees, exported_at: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `teamhub_export_${Date.now()}.json`;
  a.click();
  showToast('📥 Data exported!', 'success');
});

// ===== IMPORT =====
document.getElementById('importInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.employees && Array.isArray(data.employees)) {
        for (const emp of data.employees) {
          const { id, ...rest } = emp;
          await sbPost(EMP_URL, rest);
        }
      }
      showToast('✅ Import done! Reloading...', 'success');
      setTimeout(loadAll, 1000);
    } catch (err) {
      showToast('❌ Import failed', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ===== INIT =====
(function init() {
  // Theme
  const savedTheme = localStorage.getItem('th_theme') || 'dark';
  applyTheme(savedTheme);

  // Load
  loadAll();
})();
