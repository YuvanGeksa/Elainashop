export async function pakasirCreateQris(cfg, orderId, amount) {
  const url = "https://app.pakasir.com/api/transactioncreate/qris";
  const body = {
    project: cfg.pakasir.slug,
    order_id: orderId,
    amount: Number(amount),
    api_key: cfg.pakasir.apiKey,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.payment?.payment_number) {
    throw new Error(`Pakasir create error: ${JSON.stringify(json)}`);
  }
  return json.payment;
}

export async function pakasirTransactionDetail(cfg, orderId, amount) {
  const qs = new URLSearchParams({
    project: cfg.pakasir.slug,
    amount: String(amount),
    order_id: orderId,
    api_key: cfg.pakasir.apiKey,
  });
  const url = `https://app.pakasir.com/api/transactiondetail?${qs.toString()}`;

  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.transaction?.status) {
    throw new Error(`Pakasir detail error: ${JSON.stringify(json)}`);
  }
  return json.transaction;
}


export async function pakasirCancelTransaction(cfg, orderId, amount) {
  const url = "https://app.pakasir.com/api/transactioncancel";
  const body = {
    project: cfg.pakasir.slug,
    order_id: orderId,
    amount: Number(amount),
    api_key: cfg.pakasir.apiKey,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Pakasir cancel error: ${JSON.stringify(json)}`);
  }
  return json;
}
