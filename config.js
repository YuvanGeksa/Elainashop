/**
 * Elaina - Store LITE (Pterodactyl/Termux)
 * - No website
 * - No MongoDB
 * - Uses Telegram LONG POLLING (getUpdates)
 *   -> IMPORTANT: deleteWebhook first if you previously set a webhook.
 */
const config = {
  app: {
    botName: "Elaina - Store",
    developerName: "YourNameHere",
    currencyPrefix: "Rp ",
  },

  telegram: {
    botToken: "8377663450:AAFXbsEUxvNmR_tALQZv-jQaRTyWrtSabYE",    // Optional: isi dengan Telegram user ID owner (angka), contoh: [123456789]
    ownerIds: [8218627647],
  },

  pakasir: {
    slug: "newproject",
    apiKey: "AsyIISrYJ67r9M8ZAAE33n5XvWaI9Fa9",
  },

  pricing: {
    buyPanel: 22000,
    buyAdminPanel: 50000,
    buyReseller: 15000,
    buyScriptDefault: 12000,
  },

  reseller: {
    groupLink: "https://t.me/your_group_invite",
  },

  // Optional: auto create user/server in your Pterodactyl panel
  // If you don't want automation, set enabled=false and bot will deliver "manual processing" message.
  pterodactyl: {
    enabled: false,
    panelUrl: "https://hostingjaya.thohirofficial.my.id",
    ptla: "ptla_UvqWdOBvmUnOAVLhm9GZoNVIBYftEO2qnGRD7HfNXU6",
    ptlc: "ptlc_LZpbGMFjQHC09X65rXFhrxg9Uh91tM6QN1cVjiT8dfs",

    // required IDs if enabled=true
    locationId: 1,
    eggJsId: 1,
    eggPyId: 2,
    allocationId: 1,

    // Defaults for server (only used when enabled=true and buyPanel)
    defaultServer: {
      memory: 1024,
      disk: 10240,
      cpu: 100,
      io: 500,
      swap: 0,
      databases: 0,
      allocations: 1,
      backups: 0,
    }
  },

  payment: {
    pollIntervalSec: 8,
    maxWaitMinutes: 30,
  },

  assets: {
    thumbnail: "./image/thumbnail.jpg",
    thumb1: "./image/thumb1.jpg",
    server: "./image/server.jpg",
    pending: "./image/pending.jpg",
    success: "./image/success.jpg",
    fail: "./image/fail.jpg",
  },

  ramPlans: [
  { label: "1gb", memory: 1024, price: 1000 },
  { label: "2gb", memory: 2048, price: 2000 },
  { label: "3gb", memory: 3072, price: 3000 },
  { label: "4gb", memory: 4096, price: 4000 },
  { label: "5gb", memory: 5120, price: 5000 },
  { label: "6gb", memory: 6144, price: 6000 },
  { label: "7gb", memory: 7168, price: 7000 },
  { label: "8gb", memory: 8192, price: 8000 },
  { label: "9gb", memory: 9216, price: 9000 },
  { label: "10gb", memory: 10240, price: 10000 },
  { label: "Unlimited", memory: 0, price: 11000 }
],

  ui: {
    replyButtons: {
      buyPanel: "🛒 Buy Panel",
      buyAdmin: "👑 Buy Admin Panel",
      buyReseller: "🤝 Buy Reseller",
      buyScript: "📦 Buy Script",
    }
  },

  storage: {
    dataDir: "./data",
    scriptsDir: "./script",
  }
};

export default config;
