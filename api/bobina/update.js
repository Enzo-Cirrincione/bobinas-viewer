export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  try {
    const base = process.env.FLOW_BOBINAS_UPDATE_URL; // URL del Flow POST Update
    const clientKey = process.env.UPDATE_CLIENT_KEY;   // mismo secreto que el Flow
    if (!base || !clientKey) {
      return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Faltan env vars' });
    }

    const body = await new Promise((resolve) => {
      let data = ''; req.on('data', c => data += c); req.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
      });
    });

    if (!body.id) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: "Campo 'id' es requerido" });
    }

    const payload = { ...body, api_key: clientKey };

    const r = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_error', message: e?.message || 'Error' });
  }
}
