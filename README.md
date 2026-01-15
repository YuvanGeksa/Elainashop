# Elaina - Store LITE (Pterodactyl / Termux)

Versi ini **tanpa website** dan **tanpa MongoDB**.
Data order & state disimpan di file lokal `./data/`.

## 0) Penting: Pakai LONG POLLING
Kalau kamu sebelumnya pernah set webhook Telegram, **wajib deleteWebhook** dulu, biar polling tidak conflict:

```
https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook?drop_pending_updates=true
```

## 1) Edit config.js
Isi minimal:
- telegram.botToken
- pakasir.slug
- pakasir.apiKey

Opsional (kalau mau auto create akun/server pterodactyl):
- set `pterodactyl.enabled = true` dan isi panelUrl + appApiKey + ID-ID yang dibutuhkan.

## 2) Run di Termux
```bash
pkg update -y
pkg install -y nodejs git
npm install
npm start
```

## 3) Run di Pterodactyl
- Pilih egg Node.js 18/20
- Upload project
- Install dependencies sekali: `npm install`
- Startup command: `npm start`

## 4) Script ZIP
Taruh file `.zip` ke folder:
- `./scripts/`

Bot akan otomatis bikin button sesuai nama file ZIP.

## Catatan
- Payment status dicek berkala via pakasir `transactiondetail` (tanpa webhook).
- Pending order akan otomatis lanjut polling lagi setelah restart selama belum lewat `maxWaitMinutes`.


## Harga per RAM
Edit di `config.js` bagian `ramPlans`:
- `price` dipakai untuk total pembayaran QRIS saat buy panel.

## Pterodactyl API Key
Di `config.js` bagian `pterodactyl`:
- `ptla` = Application API Key (PTLA)
- `ptlc` = Client API Key (PTLC)
