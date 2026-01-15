export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function formatIDR(n) {
  try { return Number(n).toLocaleString("id-ID"); }
  catch { return String(n); }
}

export function startCaption(cfg) {
  return `<b>✨ ${escapeHtml(cfg.app.botName)} ✨</b>
<i>Auto Buy • Fast Delivery • Aman & Terpercaya</i>

Selamat datang di <b>${escapeHtml(cfg.app.botName)}</b>.
Pilih produk via tombol menu di bawah.

<b>📦 Layanan:</b>
• <b>Server Panel</b> (JS/Python)
• <b>Admin Panel</b>
• <b>Reseller</b>
• <b>Script Bot (ZIP)</b>

<b>👨‍💻 Developer:</b> <code>${escapeHtml(cfg.app.developerName)}</code>`;
}

export function buyPanelIntroCaption() {
  return `<b>🛒 Buy Server Panel</b>

Pilih <b>Egg</b> yang kamu mau:
• <b>Node.js</b> (JavaScript)
• <b>Python</b>

<i>Setelah itu kamu pilih RAM, lalu masukkan username.</i>`;
}

export function chooseRamCaption(eggLabel) {
  return `<b>🧠 Pilih RAM Server</b>

<b>Egg:</b> <code>${escapeHtml(eggLabel)}</code>

Pilih kapasitas RAM server kamu di tombol bawah.
<i>Setelah pilih RAM, bot akan minta username panel.</i>`;
}

export function payPendingLongCaption() {
  return `<b>⏳ Menyiapkan Pembayaran</b>

Mohon tunggu sebentar ya…
Setelah ini bot mengirim QRIS.

<i>Tip:</i> Kalau kamu salah pilih produk, kamu bisa tekan <b>Cancel</b> setelah QRIS muncul.`;
}

export function qrisCaptionWithButtons(orderId, amount) {
  return `<b>📲 Pembayaran QRIS</b>

Silakan scan QRIS di bawah ini.

<b>🧾 Detail Pesanan:</b>
• <b>Order ID:</b> <code>${escapeHtml(orderId)}</code>
• <b>Total Bayar:</b> <code>Rp ${formatIDR(amount)}</code>

<b>📌 Petunjuk:</b>
1. Scan pakai e-wallet / m-banking
2. Pastikan nominal sesuai
3. Selesaikan sampai status <b>BERHASIL</b>

<b>🔁 Tombol:</b>
• <b>Refresh</b> untuk cek status manual
• <b>Cancel</b> untuk batalkan pesanan ini

<i>⚡ Setelah sukses, produk dikirim otomatis.</i>`;
}

export function chooseEggCaption() {
  return `<b>🛒 Buy Server Panel</b>

Pilih bahasa panel kamu:
• <b>JavaScript</b> — bot Node.js
• <b>Python</b> — bot/automation Python

<i>Setelah memilih, bot minta username lalu kirim QRIS.</i>`;
}

export function askPanelUsernameCaption() {
  return `<b>✍️ Masukkan Username Panel</b>

<b>Ketentuan:</b>
• Tanpa spasi
• Huruf/angka/underscore
• 3–24 karakter

<i>Contoh:</i> <code>elaina_panel</code>`;
}

export function askAdminUsernameCaption() {
  return `<b>👑 Buy Admin Panel</b>

Ketik username admin yang kamu mau (tanpa spasi).
<i>Contoh:</i> <code>admin_elaina</code>`;
}

export function scriptsCaption() {
  return `<b>📦 Buy Script Bot</b>

Pilih script yang tersedia di bawah ini.
File yang dikirim adalah <b>ZIP</b> setelah pembayaran sukses.`;
}

export function pendingCaption() {
  return `<b>⏳ Menyiapkan Pembayaran</b>
QRIS akan dikirim setelah ini…`;
}

export function qrisCaption(orderId, amount) {
  return `<b>📲 Pembayaran QRIS</b>

Silakan scan QRIS di bawah ini.

<b>🧾 Detail Pesanan:</b>
• <b>Order ID:</b> <code>${escapeHtml(orderId)}</code>
• <b>Total Bayar:</b> <code>Rp ${formatIDR(amount)}</code>

<b>📌 Petunjuk:</b>
1. Scan pakai e-wallet / m-banking
2. Pastikan nominal sesuai
3. Selesaikan sampai status <b>BERHASIL</b>

<i>⚡ Setelah sukses, produk dikirim otomatis.</i>`;
}

export function successCaption() {
  return `<b>✅ Pembayaran Berhasil</b>
Terima kasih! Produk akan dikirim sekarang…`;
}

export function failCaption() {
  return `<b>❌ Pembayaran Gagal</b>
QRIS expired / dibatalkan / gagal.

Silakan pesan ulang lewat menu.`;
}

export function resellerDeliverCaption(link) {
  return `<b>🤝 Reseller Access</b>
Join grup reseller di sini:
<a href="${escapeHtml(link)}">Klik untuk join grup</a>`;
}

export function panelDeliverCaption(cfg, d) {
  return `<b>🎉 Panel Berhasil</b>

<b>🌐 URL:</b> <a href="${escapeHtml(cfg.pterodactyl.panelUrl)}">${escapeHtml(cfg.pterodactyl.panelUrl)}</a>
<b>👤 Username:</b> <code>${escapeHtml(d.username)}</code>
<b>🔑 Password:</b> <code>${escapeHtml(d.password)}</code>
<b>🧩 Egg:</b> <code>${escapeHtml(d.eggName)}</code>

<i>Simpan data ini baik-baik.</i>`;
}

export function adminDeliverCaption(cfg, d) {
  return `<b>👑 Admin Panel Aktif</b>

<b>🌐 URL:</b> <a href="${escapeHtml(cfg.pterodactyl.panelUrl)}">${escapeHtml(cfg.pterodactyl.panelUrl)}</a>
<b>👤 Username:</b> <code>${escapeHtml(d.username)}</code>
<b>🔑 Password:</b> <code>${escapeHtml(d.password)}</code>

<i>Saran:</i> Setelah login, ganti password.`;
}

export function manualProcessCaption() {
  return `<b>✅ Pembayaran Berhasil</b>
Pesanan kamu masuk. Admin akan proses manual & kirim data secepatnya.`;
}


export function qrisRefreshInfoCaption(trx) {
  return `<b>🔄 Status Pembayaran</b>

<b>Status:</b> <code>${escapeHtml(trx.status || "-")}</code>
<b>Jumlah:</b> <code>Rp ${formatIDR(trx.amount || 0)}</code>
<b>Kadaluarsa:</b> <code>${escapeHtml(trx.expired_at || "-")}</code>

<i>Jika sudah bayar, tunggu sebentar atau tekan Refresh lagi.</i>`;
}
