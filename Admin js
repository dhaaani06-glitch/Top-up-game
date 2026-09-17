// ============================================================
// KONFIGURASI (sama dengan script.js customer)
// ============================================================
const SUPABASE_URL = 'https://jfkppzlitrjvirlqgdgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impma3BwemxpdHJqdmlybHFnZGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDIzNTgsImV4cCI6MjEwNTIxODM1OH0.yGpVwdPFlMy2SCfkuShagC-5KZ_ZMV_BhSjOQu0AJdE';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// STATE
// ============================================================
let allOrders = [];
let currentFilter = 'all';
let currentDetail = null;

const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

const formatWaktu = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// ============================================================
// CEK SESSION SAAT LOAD
// ============================================================
(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    await checkAdminAndShow(session);
  }
})();

// ============================================================
// LOGIN
// ============================================================
document.getElementById('btnLogin').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const alertEl = document.getElementById('loginAlert');
  const btn = document.getElementById('btnLogin');

  alertEl.classList.remove('show');

  if (!email || !password) {
    alertEl.textContent = 'Email dan password wajib diisi';
    alertEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Memproses...';

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    alertEl.textContent = 'Login gagal: ' + error.message;
    alertEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Masuk';
    return;
  }

  const ok = await checkAdminAndShow(data.session);

  if (!ok) {
    await db.auth.signOut();
    alertEl.textContent = 'Akun ini bukan admin. Hubungi pemilik sistem.';
    alertEl.classList.add('show');
  }

  btn.disabled = false;
  btn.textContent = 'Masuk';
});

// Submit dengan Enter
['loginEmail', 'loginPassword'].forEach(id => {
  document.getElementById(id).addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnLogin').click();
  });
});

// ============================================================
// CEK APAKAH USER ADALAH ADMIN
// ============================================================
async function checkAdminAndShow(session) {
  const { data, error } = await db
    .from('admins')
    .select('nama')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !data) return false;

  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').classList.add('show');
  document.getElementById('topbarUser').textContent =
    (data.nama || 'Admin') + ' • ' + session.user.email;

  await loadOrders();
  return true;
}

// ============================================================
// LOGOUT
// ============================================================
document.getElementById('btnLogout').addEventListener('click', async () => {
  await db.auth.signOut();
  location.reload();
});

// ============================================================
// LOAD ORDERS
// ============================================================
async function loadOrders() {
  const container = document.getElementById('orders');
  container.innerHTML = '<div class="loading-spinner"></div>';

  const { data, error } = await db
    .from('pesanan')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>Gagal memuat: ${error.message}</div>`;
    return;
  }

  allOrders = data || [];

  updateStats();
  renderOrders();
}

// ============================================================
// STATS
// ============================================================
function updateStats() {
  const total = allOrders.length;
  const menunggu = allOrders.filter(o => o.status === 'menunggu_verifikasi').length;
  const verified = allOrders.filter(o => o.status === 'verified').length;
  const pending = allOrders.filter(o => o.status === 'pending').length;
  const ditolak = allOrders.filter(o => o.status === 'ditolak').length;

  const revenue = allOrders
    .filter(o => o.status === 'verified')
    .reduce((sum, o) => sum + (o.harga || 0), 0);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = menunggu;
  document.getElementById('statVerified').textContent = verified;
  document.getElementById('statRevenue').textContent = formatRp(revenue);

  document.getElementById('cntMenunggu').textContent = menunggu;
  document.getElementById('cntVerified').textContent = verified;
  document.getElementById('cntPending').textContent = pending;
  document.getElementById('cntDitolak').textContent = ditolak;
}

// ============================================================
// FILTER
// ============================================================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderOrders();
  });
});

// ============================================================
// RENDER ORDERS
// ============================================================
function renderOrders() {
  const container = document.getElementById('orders');
  const filtered = currentFilter === 'all'
    ? allOrders
    : allOrders.filter(o => o.status === currentFilter);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📭</div>
        <div>Belum ada pesanan${currentFilter !== 'all' ? ' di kategori ini' : ''}</div>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(o => `
    <div class="order-card" onclick="openDetail('${o.id}')">
      <div class="order-top">
        <span class="order-kode">${o.kode_pesanan}</span>
        <span class="status-badge status-${o.status}">${statusLabel(o.status)}</span>
      </div>
      <div class="order-game">${o.nama_game || '-'} — ${o.nama_produk || '-'}</div>
      <div class="order-info">
        <span>ID: <strong>${o.user_id_game}</strong>${o.zone_id ? ' (' + o.zone_id + ')' : ''}</span>
        <span class="order-price">${formatRp(o.harga)}</span>
      </div>
      <div class="order-info" style="margin-top:6px;">
        <span>${o.metode_bayar || '-'}</span>
        <span>${formatWaktu(o.created_at)}</span>
      </div>
    </div>
  `).join('');
}

function statusLabel(s) {
  return {
    'pending': 'Pending',
    'menunggu_verifikasi': 'Menunggu',
    'verified': 'Verified',
    'ditolak': 'Ditolak'
  }[s] || s;
}

// ============================================================
// DETAIL MODAL
// ============================================================
function openDetail(id) {
  const o = allOrders.find(x => x.id === id);
  if (!o) return;

  currentDetail = o;

  document.getElementById('dKode').textContent = o.kode_pesanan;
  const statusEl = document.getElementById('dStatus');
  statusEl.textContent = statusLabel(o.status);
  statusEl.className = 'status-badge status-' + o.status;

  document.getElementById('dGame').textContent = o.nama_game || '—';
  document.getElementById('dProduk').textContent = o.nama_produk || '—';
  document.getElementById('dUserId').textContent = o.user_id_game || '—';

  if (o.zone_id) {
    document.getElementById('dZoneRow').style.display = 'flex';
    document.getElementById('dZone').textContent = o.zone_id;
  } else {
    document.getElementById('dZoneRow').style.display = 'none';
  }

  document.getElementById('dKontak').textContent = o.kontak || '—';
  document.getElementById('dHarga').textContent = formatRp(o.harga);
  document.getElementById('dMetode').textContent = o.metode_bayar || '—';
  document.getElementById('dWaktu').textContent = formatWaktu(o.created_at);

  // Bukti
  const buktiContainer = document.getElementById('dBuktiContainer');
  if (o.bukti_url) {
    buktiContainer.innerHTML = `
      <img src="${o.bukti_url}" class="bukti-img" onclick="openZoom('${o.bukti_url}')" alt="Bukti transfer">
      <div style="font-size:0.75rem; color:var(--muted); margin-top:8px; text-align:center;">
        Tap gambar untuk memperbesar
      </div>`;
  } else {
    buktiContainer.innerHTML = '<div class="bukti-none">Belum upload bukti transfer</div>';
  }

  // Catatan
  document.getElementById('dCatatan').value = o.catatan_admin || '';

  // Tampilkan tombol aksi hanya kalau status menunggu_verifikasi
  const actionRow = document.getElementById('actionRow');
  if (o.status === 'menunggu_verifikasi') {
    actionRow.style.display = 'grid';
  } else {
    actionRow.style.display = 'none';
  }

  document.getElementById('detailModal').classList.add('show');
}

function closeDetail() {
  document.getElementById('detailModal').classList.remove('show');
  currentDetail = null;
}

document.getElementById('detailModal').addEventListener('click', (e) => {
  if (e.target.id === 'detailModal') closeDetail();
});

// ============================================================
// VERIFY / REJECT
// ============================================================
document.getElementById('btnVerify').addEventListener('click', () => updateStatus('verified'));
document.getElementById('btnReject').addEventListener('click', () => updateStatus('ditolak'));

async function updateStatus(newStatus) {
  if (!currentDetail) return;

  const btnV = document.getElementById('btnVerify');
  const btnR = document.getElementById('btnReject');

  btnV.disabled = true;
  btnR.disabled = true;

  const catatan = document.getElementById('dCatatan').value.trim();

  const { error } = await db
    .from('pesanan')
    .update({
      status: newStatus,
      catatan_admin: catatan || null
    })
    .eq('id', currentDetail.id);

  btnV.disabled = false;
  btnR.disabled = false;

  if (error) {
    showToast('Gagal: ' + error.message, 'error');
    return;
  }

  showToast(
    newStatus === 'verified'
      ? '✓ Pesanan diverifikasi!'
      : '✕ Pesanan ditolak',
    'success'
  );

  closeDetail();
  await loadOrders();
}

// ============================================================
// ZOOM IMAGE
// ============================================================
function openZoom(url) {
  document.getElementById('zoomImg').src = url;
  document.getElementById('zoom').classList.add('show');
}

function closeZoom() {
  document.getElementById('zoom').classList.remove('show');
}

// ============================================================
// TOAST
// ============================================================
let toastTimer = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
  }, 2500);
}
