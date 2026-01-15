function apiBase(panelUrl) {
  return panelUrl.replace(/\/$/, "") + "/api/application";
}

async function pteroCall(cfg, path, method, body) {
  const url = apiBase(cfg.pterodactyl.panelUrl) + path;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "Application/vnd.pterodactyl.v1+json",
      "Authorization": `Bearer ${cfg.pterodactyl.ptla || cfg.pterodactyl.appApiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Ptero API ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

export function randomPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createUser(cfg, { username, email, password, isAdmin }) {
  const body = {
    email,
    username,
    first_name: "Elaina",
    last_name: "Store",
    password,
    root_admin: Boolean(isAdmin),
  };
  const json = await pteroCall(cfg, "/users", "POST", body);
  return json?.attributes;
}

export async function createServer(cfg, { userId, eggId, name, memoryOverride }) {
  const def = cfg.pterodactyl.defaultServer;

  const body = {
    name: name || "Elaina Server",
    user: userId,
    egg: eggId,
    docker_image: "ghcr.io/pterodactyl/yolks:nodejs_20",
    startup: "",
    environment: {},
    limits: {
      memory: (typeof memoryOverride === "number" && memoryOverride > 0) ? memoryOverride : def.memory,
      swap: def.swap,
      disk: def.disk,
      io: def.io,
      cpu: def.cpu,
      threads: null,
    },
    feature_limits: {
      databases: def.databases,
      allocations: def.allocations,
      backups: def.backups,
    },
    allocation: { default: cfg.pterodactyl.allocationId },
    deploy: {
      locations: [cfg.pterodactyl.locationId],
      dedicated_ip: false,
      port_range: [],
    },
  };

  const json = await pteroCall(cfg, "/servers", "POST", body);
  return json?.attributes;
}
