export default async function handler(req, res) {
  try {
    const base = process.env.FLOW_BASE_ETIQUETAS_URL;
    if (!base) return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Falta FLOW_BASE_ETIQUETAS_URL' });

    const url = `${base}&_ts=${Date.now()}`;
    const r = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return res.status(r.status).send(Array.isArray(data) ? JSON.stringify(data) : text);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_error', message: e?.message || 'Error' });
  }
}
