import TelegramBot from "node-telegram-bot-api";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";
import config from "./config.js";
import { readJson, writeJson, listFiles } from "./lib/fsdb.js";
import {
  startCaption,
  chooseEggCaption,
  buyPanelIntroCaption,
  chooseRamCaption,
  payPendingLongCaption,
  qrisCaptionWithButtons,
  qrisRefreshInfoCaption,
  askPanelUsernameCaption,
  askAdminUsernameCaption,
  scriptsCaption,
  pendingCaption,
  qrisCaption,
  successCaption,
  failCaption,
  resellerDeliverCaption,
  panelDeliverCaption,
  adminDeliverCaption,
  manualProcessCaption,
} from "./lib/captions.js";
import { pakasirCreateQris, pakasirTransactionDetail, pakasirCancelTransaction } from "./lib/pakasir.js";
import { createUser, createServer, randomPassword } from "./lib/ptero.js";
import { sleep, isValidUsername, nowIso } from "./lib/utils.js";

if (!config.telegram.botToken || config.telegram.botToken.includes("TELEGRAM_BOT_TOKEN_HERE")) {
  console.error("❌ Isi config.telegram.botToken dulu di config.js");
  process.exit(1);
}

const bot = new TelegramBot(config.telegram.botToken, { polling: true });

const dataDir = config.storage.dataDir;
const scriptsDir = config.storage.scriptsDir;
const ordersFile = path.join(dataDir, "orders.json");
const stateFile = path.join(dataDir, "user_state.json");
const scriptsMetaFile = path.join(dataDir, "scripts_meta.json");
const tmpDir = path.join(dataDir, "tmp");

await fs.mkdir(dataDir, { recursive: true });
await fs.mkdir(scriptsDir, { recursive: true });
await fs.mkdir(tmpDir, { recursive: true });

const activePollers = new Map(); // orderId -> true
const ownerIds = (() => {
  // priority: ENV OWNER_IDS="123,456" then config.telegram.ownerIds
  const env = String(process.env.OWNER_IDS || "").trim();
  const fromEnv = env ? env.split(",").map(s => Number(String(s).trim())).filter(n => Number.isFinite(n) && n > 0) : [];
  const fromCfg = Array.isArray(config.telegram?.ownerIds) ? config.telegram.ownerIds.map(n => Number(n)).filter(n => Number.isFinite(n) && n > 0) : [];
  return Array.from(new Set([...fromEnv, ...fromCfg]));
})();

function isOwner(userId) {
  return ownerIds.includes(Number(userId));
}

async function readScriptsMeta() {
  const meta = await readJson(scriptsMetaFile, {});
  return (meta && typeof meta === "object") ? meta : {};
}

async function writeScriptsMeta(meta) {
  await writeJson(scriptsMetaFile, meta);
}

function sanitizeScriptName(name) {
  return String(name || "")
    .replace(/[^a-zA-Z0-9 _.-]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
}

function ensureZipName(name) {
  const n = String(name || "").trim();
  if (!n) return "";
  return n.toLowerCase().endsWith(".zip") ? n : (n + ".zip");
}

async function downloadTelegramFile(bot, fileId, destPath) {
  const file = await bot.getFile(fileId);
  if (!file?.file_path) throw new Error("Tidak bisa mengambil file_path");
  const token = config.telegram.botToken;
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal download file: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
  return destPath;
}


function replyKeyboard() {
  const b = config.ui.replyButtons;
  return {
    keyboard: [
      [{ text: b.buyPanel }, { text: b.buyAdmin }],
      [{ text: b.buyReseller }, { text: b.buyScript }],
    ],
    resize_keyboard: true,
  };
}

function inlineKeyboard(rows) {
  return { inline_keyboard: rows };
}

async function getState(userId) {
  const all = await readJson(stateFile, {});
  return all[String(userId)] || null;
}

async function setState(userId, s) {
  const all = await readJson(stateFile, {});
  all[String(userId)] = s;
  await writeJson(stateFile, all);
}

async function clearState(userId) {
  const all = await readJson(stateFile, {});
  delete all[String(userId)];
  await writeJson(stateFile, all);
}

async function addOrder(order) {
  const all = await readJson(ordersFile, []);
  all.push(order);
  await writeJson(ordersFile, all);
}

async function updateOrder(orderId, patch) {
  const all = await readJson(ordersFile, []);
  const i = all.findIndex(o => o.orderId === orderId);
  if (i >= 0) {
    all[i] = { ...all[i], ...patch, updatedAt: nowIso() };
    await writeJson(ordersFile, all);
  }
}

async function getOrder(orderId) {
  const all = await readJson(ordersFile, []);
  return all.find(o => o.orderId === orderId) || null;
}

async function listPendingOrders() {
  const all = await readJson(ordersFile, []);
  return all.filter(o => o.status === "pending");
}

function newOrderId(userId) {
  return `TG${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function sendStart(chatId) {
  await bot.sendPhoto(chatId, config.assets.thumbnail, {
    caption: startCaption(config),
    parse_mode: "HTML",
    reply_markup: replyKeyboard(),
  });
}

bot.onText(/\/(start|menu)/, async (msg) => {
  try {
    await clearState(msg.from.id);
    await sendStart(msg.chat.id);
  } catch (e) {
    console.error(e);
  }
});

bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = (msg.text || "").trim();
    const b = config.ui.replyButtons;

    if (text.startsWith("/")) return;

    if (text === b.buyPanel) {
  await clearState(userId);
  await bot.sendPhoto(chatId, config.assets.thumb1, {
    caption: buyPanelIntroCaption(),
    parse_mode: "HTML",
    reply_markup: inlineKeyboard([
      [
        { text: "Node.js (JavaScript)", callback_data: "panel_egg:node" },
        { text: "Python", callback_data: "panel_egg:py" }
      ],
      [{ text: "⬅ Back", callback_data: "back:menu" }],
    ]),
  });
  return;
}

    if (text === b.buyAdmin) {
      await setState(userId, { step: "await_admin_username" });
      await bot.sendMessage(chatId, askAdminUsernameCaption(), { parse_mode: "HTML" });
      return;
    }

    if (text === b.buyReseller) {
      await clearState(userId);
      await startPayment({ chatId, userId, productCode: "buyreseller", amount: config.pricing.buyReseller, meta: {} });
      return;
    }

    if (text === b.buyScript) {
      await clearState(userId);
      const rows = [
        [
          { text: "🤖 Script Bot", callback_data: "scriptbot:list" },
          { text: "➕ Add Script", callback_data: "scriptbot:add" },
        ],
        [{ text: "⬅ Back", callback_data: "back:menu" }],
      ];
      await bot.sendPhoto(chatId, config.assets.thumbnail, {
        caption: scriptsCaption(),
        parse_mode: "HTML",
        reply_markup: inlineKeyboard(rows),
      });
      return;
    }

    const st = await getState(userId);
    // === ADD SCRIPT FLOW (Owner Only) ===
    if (st?.step === "await_script_zip") {
      if (!isOwner(userId)) {
        await clearState(userId);
        await bot.sendMessage(chatId, "<b>⛔ Khusus Owner</b>", { parse_mode: "HTML" });
        return;
      }

      const doc = msg.document;
      if (!doc) {
        await bot.sendMessage(chatId, "<b>Silakan kirim file ZIP (document) ya.</b>", { parse_mode: "HTML" });
        return;
      }

      const fileName = String(doc.file_name || "");
      if (!fileName.toLowerCase().endsWith(".zip")) {
        await bot.sendMessage(chatId, "<b>File harus .zip</b>", { parse_mode: "HTML" });
        return;
      }

      const tmpPath = path.join(tmpDir, `${doc.file_id}.zip`);
      try {
        await downloadTelegramFile(bot, doc.file_id, tmpPath);
      } catch (e) {
        console.error("download zip error:", e);
        await bot.sendMessage(chatId, "<b>Gagal download file ZIP. Coba kirim ulang.</b>", { parse_mode: "HTML" });
        return;
      }

      await setState(userId, { step: "await_script_name", tmpPath, originalFileName: fileName });
      await bot.sendMessage(chatId, "<b>✅ ZIP diterima.</b>\nSekarang kirim <b>nama script</b> (tanpa .zip juga boleh).", { parse_mode: "HTML" });
      return;
    }

    if (st?.step === "await_script_name") {
      if (!isOwner(userId)) {
        await clearState(userId);
        await bot.sendMessage(chatId, "<b>⛔ Khusus Owner</b>", { parse_mode: "HTML" });
        return;
      }

      const name = sanitizeScriptName(text);
      if (!name) {
        await bot.sendMessage(chatId, "<b>Nama script tidak boleh kosong.</b>", { parse_mode: "HTML" });
        return;
      }

      await setState(userId, { ...st, step: "await_script_price", scriptName: name });
      await bot.sendMessage(chatId, "<b>Masukkan harga script</b> (angka, contoh: <code>12000</code>).", { parse_mode: "HTML" });
      return;
    }

    if (st?.step === "await_script_price") {
      if (!isOwner(userId)) {
        await clearState(userId);
        await bot.sendMessage(chatId, "<b>⛔ Khusus Owner</b>", { parse_mode: "HTML" });
        return;
      }

      const price = Number(String(text).replace(/[^\d]/g, ""));
      if (!Number.isFinite(price) || price <= 0) {
        await bot.sendMessage(chatId, "<b>Harga tidak valid.</b>\nMasukkan angka, contoh: <code>12000</code>.", { parse_mode: "HTML" });
        return;
      }

      const fileName = ensureZipName(st.scriptName);
      const finalName = ensureZipName(fileName);
      const dest = path.join(scriptsDir, finalName);

      try {
        // replace if exists
        await fs.rename(st.tmpPath, dest).catch(async () => {
          // if rename fails (cross-device), copy then unlink
          const buf = await fs.readFile(st.tmpPath);
          await fs.writeFile(dest, buf);
          await fs.unlink(st.tmpPath).catch(() => {});
        });

        const meta = await readScriptsMeta();
        meta[finalName] = { price, addedAt: nowIso() };
        await writeScriptsMeta(meta);

        await clearState(userId);
        await bot.sendMessage(chatId, `<b>✅ Script berhasil ditambahkan</b>
• <b>File:</b> <code>${finalName}</code>
• <b>Harga:</b> <code>Rp ${price.toLocaleString("id-ID")}</code>`, { parse_mode: "HTML" });
      } catch (e) {
        console.error("save script error:", e);
        await bot.sendMessage(chatId, "<b>Gagal menyimpan script.</b>", { parse_mode: "HTML" });
      }
      return;
    }

    if (st?.step === "await_panel_username") {
      const username = text;
      if (!isValidUsername(username)) {
        await bot.sendMessage(chatId, "<b>Username tidak valid</b>\nGunakan huruf/angka/underscore, 3–24 karakter.\nContoh: <code>elaina_panel</code>", { parse_mode: "HTML" });
        return;
      }
      await clearState(userId);
      await startPayment({ chatId, userId, productCode: "buypanel", amount: (typeof st.ramPrice === "number" ? st.ramPrice : config.pricing.buyPanel), meta: { egg: st.egg, username, ramLabel: st.ramLabel || null, ramMemory: (typeof st.ramMemory === "number" ? st.ramMemory : null), ramPrice: (typeof st.ramPrice === "number" ? st.ramPrice : null) } });
      return;
    }

    if (st?.step === "await_admin_username") {
      const username = text;
      if (!isValidUsername(username)) {
        await bot.sendMessage(chatId, "<b>Username tidak valid</b>\nGunakan huruf/angka/underscore, 3–24 karakter.\nContoh: <code>admin_elaina</code>", { parse_mode: "HTML" });
        return;
      }
      await clearState(userId);
      await startPayment({ chatId, userId, productCode: "buyadminpanel", amount: config.pricing.buyAdminPanel, meta: { username } });
      return;
    }

  } catch (e) {
    console.error("message handler error:", e);
  }
});

bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const userId = q.from.id;
  const data = (q.data || "").trim();

  try { await bot.answerCallbackQuery(q.id); } catch {}

  try {
    if (data === "back:menu") {
      await clearState(userId);
      await sendStart(chatId);
      return;
    }

    // === PAYMENT BUTTONS ===
    if (data.startsWith("pay:refresh:")) {
      const orderId = data.slice("pay:refresh:".length);
      const order = await getOrder(orderId);
      if (!order || order.status !== "pending") {
        await bot.sendMessage(chatId, "<b>⚠️ Pesanan tidak ditemukan / sudah selesai.</b>", { parse_mode: "HTML" });
        return;
      }

      let trx;
      try {
        trx = await pakasirTransactionDetail(config, order.orderId, order.amount);
      } catch (e) {
        console.error("refresh trx error:", e);
        await bot.sendMessage(chatId, "<b>Gagal cek status. Coba lagi.</b>", { parse_mode: "HTML" });
        return;
      }

      const status = String(trx?.status || "").toLowerCase();

      // update caption with latest info
      try {
        const cap = `${qrisCaptionWithButtons(order.orderId, order.amount)}\n\n${qrisRefreshInfoCaption(trx)}`;
        await bot.editMessageCaption(cap, {
          chat_id: order.chatId,
          message_id: order.messageIds?.qris,
          parse_mode: "HTML",
          reply_markup: inlineKeyboard([
            [
              { text: "🔁 Refresh", callback_data: `pay:refresh:${order.orderId}` },
              { text: "✖ Cancel", callback_data: `pay:cancel:${order.orderId}` },
            ],
          ]),
        });
      } catch (e) {
        // ignore if can't edit (e.g., already deleted)
      }

      if (status === "completed") {
        await markPaidAndDeliver(order);
        return;
      }

      if (["expired", "canceled", "cancelled", "failed", "rejected"].includes(status)) {
        await markFailed(order, status);
        return;
      }

      return;
    }

    if (data.startsWith("pay:cancel:")) {
      const orderId = data.slice("pay:cancel:".length);
      const order = await getOrder(orderId);
      if (!order || order.status !== "pending") {
        await bot.sendMessage(chatId, "<b>⚠️ Pesanan tidak ditemukan / sudah selesai.</b>", { parse_mode: "HTML" });
        return;
      }

      try {
        await pakasirCancelTransaction(config, order.orderId, order.amount);
      } catch (e) {
        console.error("cancel trx error:", e);
        // even if cancel api fails, we still mark failed locally to stop poller
      }

      await updateOrder(order.orderId, { status: "canceled", failReason: "canceled" });
      await markFailed({ ...(order || {}), status: "canceled" }, "canceled");
      return;
    }

    // === SCRIPT MENU ===
    if (data === "scriptbot:add") {
      if (!isOwner(userId)) {
        await bot.sendMessage(chatId, "<b>⛔ Khusus Owner</b>", { parse_mode: "HTML" });
        return;
      }
      await setState(userId, { step: "await_script_zip" });
      await bot.sendMessage(chatId, "<b>➕ Add Script</b>\nSilakan kirim <b>file ZIP</b> (sebagai document).", { parse_mode: "HTML" });
      return;
    }

    if (data === "scriptbot:list") {
      const files = (await listFiles(scriptsDir)).filter(f => f.toLowerCase().endsWith(".zip"));
      if (!files.length) {
        await bot.sendMessage(chatId, "<b>📦 Script tidak ada</b>\nBelum ada file ZIP di folder <code>./script/</code>.", { parse_mode: "HTML" });
        return;
      }
      const meta = await readScriptsMeta();
      const rows = files.map(f => {
        const p = meta?.[f]?.price;
        const label = (typeof p === "number" && p > 0) ? `${f} (Rp ${Number(p).toLocaleString("id-ID")})` : f;
        return [{ text: label, callback_data: `script:${f}` }];
      });
      rows.push([{ text: "⬅ Back", callback_data: "back:menu" }]);
      await bot.sendPhoto(chatId, config.assets.thumbnail, { caption: scriptsCaption(), parse_mode: "HTML", reply_markup: inlineKeyboard(rows) });
      return;
    }

    if (data.startsWith("panel_egg:")) {
  const egg = data.split(":")[1];
  if (!["node", "py"].includes(egg)) return;

  const eggLabel = egg === "py" ? "Python" : "Node.js";
  await setState(userId, { step: "await_panel_ram", egg });

  const rows = [];
  const plans = Array.isArray(config.ramPlans) ? config.ramPlans : [];
  for (let i = 0; i < plans.length; i += 2) {
    const left = plans[i];
    const right = plans[i + 1];
    const row = [];
    if (left) row.push({ text: left.label, callback_data: `panel_ram:${left.label}` });
    if (right) row.push({ text: right.label, callback_data: `panel_ram:${right.label}` });
    rows.push(row);
  }
  rows.push([{ text: "⬅ Back", callback_data: "back:menu" }]);

  await bot.sendPhoto(chatId, config.assets.server, {
    caption: chooseRamCaption(eggLabel),
    parse_mode: "HTML",
    reply_markup: inlineKeyboard(rows),
  });
  return;
}


    if (data.startsWith("panel_ram:")) {
      const label = data.slice("panel_ram:".length);
      const st = await getState(userId);
      if (!st || st.step !== "await_panel_ram" || !st.egg) {
        await bot.sendMessage(chatId, "<b>⚠️ Session habis</b>\nKetik /start untuk mulai lagi.", { parse_mode: "HTML" });
        return;
      }

      const plan = (Array.isArray(config.ramPlans) ? config.ramPlans : []).find(
        p => String(p.label).toLowerCase() === String(label).toLowerCase()
      );

      if (!plan) {
        await bot.sendMessage(chatId, "<b>RAM tidak valid</b>", { parse_mode: "HTML" });
        return;
      }

      // next: ask username then go to payment
      await setState(userId, { step: "await_panel_username", egg: st.egg, ramLabel: plan.label, ramMemory: plan.memory, ramPrice: plan.price });
      await bot.sendMessage(chatId, askPanelUsernameCaption(), { parse_mode: "HTML" });
      return;
    }

if (data.startsWith("script:")) {
      const filename = data.slice("script:".length);
      const full = path.join(scriptsDir, filename);
      try { await fs.stat(full); } catch {
        await bot.sendMessage(chatId, "<b>Script tidak ditemukan</b>", { parse_mode: "HTML" });
        return;
      }

      const meta = await readScriptsMeta();
      const price = (meta?.[filename]?.price && Number(meta[filename].price) > 0)
        ? Number(meta[filename].price)
        : Number(config.pricing.buyScriptDefault);

      await startPayment({ chatId, userId, productCode: "buyscript", amount: price, meta: { filename, price } });
      return;
    }
  } catch (e) {
    console.error("callback handler error:", e);
  }
});

async function startPayment({ chatId, userId, productCode, amount, meta }) {
  const pendingMsg = await bot.sendPhoto(chatId, config.assets.pending, { caption: payPendingLongCaption(), parse_mode: "HTML" });

  const orderId = newOrderId(userId);
  const pay = await pakasirCreateQris(config, orderId, amount);

  const qrPng = await QRCode.toBuffer(pay.payment_number, { type: "png", errorCorrectionLevel: "M", margin: 1, scale: 8 });

  const qrisMsg = await bot.sendPhoto(chatId, qrPng, { caption: qrisCaptionWithButtons(orderId, amount), parse_mode: "HTML", reply_markup: inlineKeyboard([[{ text: "🔁 Refresh", callback_data: `pay:refresh:${orderId}` }, { text: "✖ Cancel", callback_data: `pay:cancel:${orderId}` }]]) });

  const createdAt = new Date();
  const maxWaitMs = config.payment.maxWaitMinutes * 60_000;
  const hardExpireAt = new Date(createdAt.getTime() + maxWaitMs);

  await addOrder({
    orderId,
    userId,
    chatId,
    productCode,
    amount: Number(amount),
    meta,
    status: "pending",
    pakasir: { payment_number: pay.payment_number, expired_at: pay.expired_at || null },
    messageIds: { pending: pendingMsg.message_id, qris: qrisMsg.message_id },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    hardExpireAt: hardExpireAt.toISOString(),
  });

  await startPoller(orderId);
}

async function startPoller(orderId) {
  if (activePollers.get(orderId)) return;
  activePollers.set(orderId, true);

  (async () => {
    try {
      while (true) {
        const order = await getOrder(orderId);
        if (!order || order.status !== "pending") break;

        if (order.hardExpireAt && new Date(order.hardExpireAt) < new Date()) {
          await markFailed(order, "timeout");
          break;
        }

        let trx;
        try {
          trx = await pakasirTransactionDetail(config, order.orderId, order.amount);
        } catch (e) {
          console.error("transactiondetail error:", e?.message || e);
        }

        const status = trx?.status;
        if (status === "completed") {
          await markPaidAndDeliver(order);
          break;
        }

        if (["expired", "canceled", "cancelled", "failed", "rejected"].includes(String(status || "").toLowerCase())) {
          await markFailed(order, status);
          break;
        }

        await sleep(config.payment.pollIntervalSec * 1000);
      }
    } finally {
      activePollers.delete(orderId);
    }
  })().catch(e => console.error("poller crash:", e));
}

async function markFailed(order, reason) {
  try { await bot.deleteMessage(order.chatId, order.messageIds?.qris); } catch {}
  try { await bot.deleteMessage(order.chatId, order.messageIds?.pending); } catch {}
  await bot.sendPhoto(order.chatId, config.assets.fail, { caption: failCaption(), parse_mode: "HTML", reply_markup: inlineKeyboard([[{ text: "back to menu↪️", callback_data: "back:menu" }]]) });
  await updateOrder(order.orderId, { status: "failed", failReason: String(reason || "failed") });
}

async function markPaidAndDeliver(order) {
  try { await bot.deleteMessage(order.chatId, order.messageIds?.qris); } catch {}
  try { await bot.deleteMessage(order.chatId, order.messageIds?.pending); } catch {}
  await bot.sendPhoto(order.chatId, config.assets.success, { caption: successCaption(), parse_mode: "HTML" });
  await updateOrder(order.orderId, { status: "paid" });

  await deliverProduct(order);
  await updateOrder(order.orderId, { status: "delivered", deliveredAt: nowIso() });
}

async function deliverProduct(order) {
  const chatId = order.chatId;

  if (order.productCode === "buyreseller") {
    await bot.sendMessage(chatId, resellerDeliverCaption(config.reseller.groupLink), { parse_mode: "HTML" });
    return;
  }

  if (order.productCode === "buyscript") {
    const filename = order.meta.filename;
    const full = path.join(scriptsDir, filename);
    await bot.sendDocument(chatId, full, {
      caption: `<b>📦 Script Siap</b>\nTerima kasih sudah membeli di <b>${config.app.botName}</b> ✨`,
      parse_mode: "HTML",
    });
    return;
  }

  if (order.productCode === "buypanel" || order.productCode === "buyadminpanel") {
    const isAdmin = order.productCode === "buyadminpanel";

    if (!config.pterodactyl.enabled) {
      await bot.sendMessage(chatId, manualProcessCaption(), { parse_mode: "HTML" });
      return;
    }

    const username = order.meta.username;
    const password = randomPassword(12);
    const email = `${username}@elaina.local`;

    const egg = order.meta.egg;
    const eggId = egg === "py" ? config.pterodactyl.eggPyId : config.pterodactyl.eggJsId;
    const eggName = egg === "py" ? "Python" : "JavaScript";

    try {
      const user = await createUser(config, { username, email, password, isAdmin });
      if (!user?.id) throw new Error("No user.id returned");

      if (!isAdmin) {
        await createServer(config, { userId: user.id, eggId, name: `${username}-server`, memoryOverride: (typeof order.meta.ramMemory === "number" ? order.meta.ramMemory : null) });
        await bot.sendMessage(chatId, panelDeliverCaption(config, { username, password, eggName }), { parse_mode: "HTML" });
      } else {
        await bot.sendMessage(chatId, adminDeliverCaption(config, { username, password }), { parse_mode: "HTML" });
      }

    } catch (e) {
      console.error("ptero deliver error:", e);
      await bot.sendMessage(chatId, `<b>⚠️ Provisioning Error</b>\nPembayaran sukses, tapi gagal bikin akun/server otomatis.\nAdmin akan proses manual.`, { parse_mode: "HTML" });
    }
    return;
  }

  await bot.sendMessage(chatId, "<b>⚠️ Produk tidak dikenali</b>", { parse_mode: "HTML" });
}

(async () => {
  const pending = await listPendingOrders();
  for (const o of pending) {
    if (!o.hardExpireAt || new Date(o.hardExpireAt) > new Date()) {
      startPoller(o.orderId);
    }
  }
  console.log(`✅ Bot running (polling). Pending resumed: ${pending.length}`);
})();

bot.on("polling_error", (err) => {
  console.error("polling_error:", err?.message || err);
  // If webhook still active, you'll see 409 conflict. Delete webhook:
  // https://api.telegram.org/bot<TOKEN>/deleteWebhook?drop_pending_updates=true
});