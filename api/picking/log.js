// /api/picking/log.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  try {
    const base = process.env.FLOW_PICK_LOG_URL; // URL del Flow POST_LOG
    if (!base) return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Falta FLOW_PICK_LOG_URL' });

    const r = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept':'application/json' },
      body: JSON.stringify(req.body || {})
    });

    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return res.status(r.status).send(typeof data === 'string' ? data : JSON.stringify(data));
  } catch (e) {
    return res.status(500).json({ error: 'proxy_error', message: e?.message || 'Error' });
  }
}
