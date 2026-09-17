// ============================================================
// KONFIGURASI SUPABASE
// ============================================================
const SUPABASE_URL = 'https://jfkppzlitrjvirlqgdgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impma3BwemxpdHJqdmlybHFnZGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDIzNTgsImV4cCI6MjEwNTIxODM1OH0.yGpVwdPFlMy2SCfkuShagC-5KZ_ZMV_BhSjOQu0AJdE';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// STATE
// ============================================================
let games = [];
let currentGame = null;
let currentProduk = null;
let currentMetode = null;
let currentOrderCode = null;
let selectedFile = null;

const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

// ============================================================
// LOAD GAMES
// ============================================================
async function loadGames() {
  const box = document.getElementById('games');
  const { data, error } = await db
    .from('games')
    .select('*')
    .eq('aktif', true)
    .order('urutan', { ascending: true });

  if (error) {
    box.innerHTML = `<div class="loading" style="color:#dc2626;">Gagal memuat game: ${error.message}</div>`;
    return;
  }

  games = data || [];
  renderGames(games);
}

function renderGames(list) {
  const box = document.getElementById('games');
  if (!list.length) {
    box.innerHTML = '<div class="loading">Tidak ada game ditemukan.</div>';
    return;
  }
  box.innerHTML = list.map((g, i) => `
    <div class="game" onclick="openTopup('${g.id}')">
      <div class="game-icon">${g.emoji || '🎮'}</div>
      <div class="game-name">${g.nama}</div>
      <div class="game-tag">${g.butuh_zone ? 'Butuh ' + g.label_zone : 'Instan'}</div>
    </div>
  `).join('');
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderGames(games.filter(g => g.nama.toLowerCase().includes(q)));
});

// ============================================================
// BUKA MODAL TOP UP
// ============================================================
async function openTopup(gameId) {
  currentGame = games.find(g => g.id === gameId);
  currentProduk = null;
  currentMetode = null;

  document.getElementById('mGameIcon').textContent = currentGame.emoji || '🎮';
  document.getElementById('mGameName').textContent = currentGame.nama;
  document.getElementById('mGameSub').textContent = currentGame.butuh_zone
    ? 'Masukkan ' + currentGame.label_zone : 'Masukkan User ID';

  // Zone field
  const zoneGroup = document.getElementById('zoneGroup');
  if (currentGame.butuh_zone) {
    zoneGroup.style.display = 'block';
    document.getElementById('zoneLabel').innerHTML =
      `${currentGame.label_zone} <span>*</span>`;
  } else {
    zoneGroup.style.display = 'none';
  }

  // Reset
  document.getElementById('inUserId').value = '';
  document.getElementById('inZone').value = '';
  document.getElementById('inKontak').value = '';
  document.querySelectorAll('input[name="metode"]').forEach(r => r.checked = false);
  document.querySelectorAll('.metode-item').forEach(m => m.classList.remove('selected'));
  document.getElementById('orderAlert').classList.remove('show');
  updateTotal();

  // Load produk
  const pl = document.getElementById('produkList');
  pl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#7a86a8;padding:10px;">Memuat...</div>';

  openModal('modalTopup');

  const { data, error } = await db
    .from('produk')
    .select('*')
    .eq('game_id', gameId)
    .eq('aktif', true)
    .order('urutan', { ascending: true });

  if (error) {
    pl.innerHTML = `<div style="grid-column:1/-1;color:#dc2626;padding:10px;">${error.message}</div>`;
    return;
  }

  if (!data || !data.length) {
    pl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#7a86a8;padding:10px;">Belum ada nominal.</div>';
    return;
  }

  pl.innerHTML = data.map(p => `
    <div class="produk-item"
         data-id="${p.id}"
         data-nama="${p.nama}"
         data-harga="${p.harga}"
         onclick="pilihProduk(this)">
      <div class="produk-nama">${p.nama}</div>
      <div class="produk-harga">${formatRp(p.harga)}</div>
    </div>
  `).join('');
}

function pilihProduk(el) {
  document.querySelectorAll('.produk-item').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  currentProduk = {
    id: el.dataset.id,
    nama: el.dataset.nama,
    harga: parseInt(el.dataset.harga)
  };
  updateTotal();
}

document.querySelectorAll('input[name="metode"]').forEach(r => {
  r.addEventListener('change', (e) => {
    document.querySelectorAll('.metode-item').forEach(m => m.classList.remove('selected'));
    e.target.closest('.metode-item').classList.add('selected');
    currentMetode = {
      nama: e.target.value,
      info: e.target.dataset.info
    };
    updateTotal();
  });
});

['inUserId', 'inZone', 'inKontak'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateTotal);
});

function updateTotal() {
  const total = currentProduk ? currentProduk.harga : 0;
  document.getElementById('mTotal').textContent = formatRp(total);

  const uid = document.getElementById('inUserId').value.trim();
  const kontak = document.getElementById('inKontak').value.trim();
  const zone = document.getElementById('inZone').value.trim();
  const butuhZone = currentGame && currentGame.butuh_zone;

  const valid = uid && kontak && currentProduk && currentMetode && (!butuhZone || zone);
  document.getElementById('btnOrder').disabled = !valid;
}

// ============================================================
// SUBMIT ORDER
// ============================================================
function generateKode() {
  const d = new Date();
  const ymd = d.getFullYear().toString().slice(-2)
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${ymd}-${rand}`;
}

document.getElementById('btnOrder').addEventListener('click', async () => {
  const btn = document.getElementById('btnOrder');
  const alertEl = document.getElementById('orderAlert');
  alertEl.classList.remove('show');

  btn.disabled = true;
  btn.textContent = 'Memproses...';

  const kode = generateKode();
  const payload = {
    kode_pesanan: kode,
    game_id: currentGame.id,
    produk_id: currentProduk.id,
    nama_game: currentGame.nama,
    nama_produk: currentProduk.nama,
    user_id_game: document.getElementById('inUserId').value.trim(),
    zone_id: document.getElementById('inZone').value.trim() || null,
    kontak: document.getElementById('inKontak').value.trim(),
    harga: currentProduk.harga,
    metode_bayar: currentMetode.nama
  };

  const { error } = await db.from('pesanan').insert([payload]);

  if (error) {
    alertEl.textContent = 'Gagal: ' + error.message;
    alertEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Lanjut ke Pembayaran';
    return;
  }

  currentOrderCode = kode;
  document.getElementById('pKode').textContent = kode;
  document.getElementById('pTotal').textContent = formatRp(currentProduk.harga);
  document.getElementById('pMetode').textContent = currentMetode.nama;
  document.getElementById('pTujuan').textContent = currentMetode.info;

  closeModal('modalTopup');
  openModal('modalPay');

  btn.disabled = false;
  btn.textContent = 'Lanjut ke Pembayaran';
});

// ============================================================
// UPLOAD BUKTI
// ============================================================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewImg = document.getElementById('previewImg');
const btnUpload = document.getElementById('btnUpload');
const uploadAlert = document.getElementById('uploadAlert');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
  uploadAlert.classList.remove('show');

  if (!file.type.startsWith('image/')) {
    uploadAlert.textContent = 'File harus gambar (JPG/PNG)';
    uploadAlert.classList.add('show');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    uploadAlert.textContent = 'Maksimal 5MB';
    uploadAlert.classList.add('show');
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    previewImg.hidden = false;
  };
  reader.readAsDataURL(file);

  btnUpload.disabled = false;
}

btnUpload.addEventListener('click', async () => {
  if (!selectedFile || !currentOrderCode) return;

  btnUpload.disabled = true;
  btnUpload.textContent = 'Mengupload...';
  uploadAlert.classList.remove('show');

  try {
    const ext = selectedFile.name.split('.').pop();
    const fileName = `${currentOrderCode}-${Date.now()}.${ext}`;

    const { error: upErr } = await db.storage
      .from('bukti-transfer')
      .upload(fileName, selectedFile);

    if (upErr) throw upErr;

    const { data: urlData } = db.storage
      .from('bukti-transfer')
      .getPublicUrl(fileName);

    const { data: rpcData, error: rpcErr } = await db.rpc('submit_bukti', {
      p_kode: currentOrderCode,
      p_bukti_url: urlData.publicUrl
    });

    if (rpcErr) throw rpcErr;
    if (rpcData && rpcData.ok === false) throw new Error(rpcData.message);

    document.getElementById('sKode').textContent = currentOrderCode;
    closeModal('modalPay');
    openModal('modalSuccess');

  } catch (err) {
    uploadAlert.textContent = 'Gagal: ' + err.message;
    uploadAlert.classList.add('show');
    btnUpload.disabled = false;
    btnUpload.textContent = 'Kirim Bukti';
  }
});

// ============================================================
// MODAL HELPER
// ============================================================
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('show');
  });
});

// ============================================================
// INIT
// ============================================================
loadGames();
