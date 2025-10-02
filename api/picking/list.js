// /api/picking/list.js
//
// Endpoint serverless en Vercel que proxya al Flow GET_PICKING.
// Lee los query params recibidos (?fecha, ?wo, ?linea), los reenvía
// al Flow (cuya URL pones en FLOW_PICKING_URL) y devuelve la respuesta.
// Ordena el array por ORDEN por si el Flow lo devolviera desordenado.
// Aplica headers no-cache para evitar respuestas viejas.

export default async function handler(req, res) {
  try {
    // 1) Leemos la URL del Flow desde variables de entorno de Vercel.
    //    Configurala en: Project Settings → Environment Variables
    //    Nombre: FLOW_PICKING_URL  |  Valor: URL del trigger GET de Power Automate
    const base = process.env.FLOW_PICKING_URL;
    if (!base) {
      return res.status(500).json({
        error: 'CONFIG_ERROR',
        message: 'Falta la env var FLOW_PICKING_URL en Vercel',
      });
    }

    // 2) Leemos los parámetros del request que llegan a este endpoint.
    //    Soportamos: ?fecha=YYYY-MM-DD  |  ?wo=WO123  |  ?linea=L1
    const { fecha, wo, linea } = req.query || {};

    // 3) Construimos la query string a enviar al Flow.
    //    Agregamos _ts (timestamp) para evitar cache en la ruta del Flow.
    const qs = new URLSearchParams();
    if (fecha) qs.set('fecha', String(fecha));
    if (wo) qs.set('wo', String(wo));
    if (linea) qs.set('linea', String(linea));
    qs.set('_ts', Date.now().toString());

    // 4) Armamos la URL final al Flow.
    const url = `${base}&${qs.toString()}`;

    // 5) Llamamos al Flow (GET) y pedimos siempre contenido JSON fresco.
    const r = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    // 6) Intentamos parsear a JSON.
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Si el Flow devolviera algo que no es JSON, lo pasamos tal cual.
      data = text;
    }

    // 7) Si llegó un array, lo ordenamos por ORDEN (ascendente) por seguridad.
    if (Array.isArray(data)) {
      data.sort((a, b) => {
        const x = Number(a?.ORDEN ?? 0);
        const y = Number(b?.ORDEN ?? 0);
        return x === y ? 0 : x < y ? -1 : 1;
      });
    }

    // 8) Devolvemos respuesta con headers no-cache.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');

    // Si data es array, lo stringifyeamos; si no, devolvemos el texto tal cual.
    return res.status(r.status).send(Array.isArray(data) ? JSON.stringify(data) : text);
  } catch (e) {
    // 9) Errores controlados del proxy.
    return res.status(500).json({
      error: 'proxy_error',
      message: e?.message || 'Error inesperado en /api/picking/list',
    });
  }
}
