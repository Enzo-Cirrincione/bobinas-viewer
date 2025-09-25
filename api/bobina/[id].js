export default async function handler(req, res) {
try {
const { id } = req.query;
if (!id) {
res.status(400).json({ error: 'BAD_REQUEST', message: "Parámetro 'id' es requerido" });
return;
}


const base = process.env.FLOW_BOBINAS_URL; // sin &id=
if (!base) {
res.status(500).json({ error: 'CONFIG_ERROR', message: 'Falta FLOW_BOBINAS_URL' });
return;
}


const url = `${base}&id=${encodeURIComponent(Array.isArray(id) ? id[0] : id)}`;
const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
const text = await r.text(); // puede venir JSON o texto


res.setHeader('Content-Type', 'application/json');
res.setHeader('Cache-Control', 'no-store');
res.status(r.status).send(text);
} catch (e) {
res.status(500).json({ error: 'proxy_error', message: e?.message || 'Error' });
}
}
