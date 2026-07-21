/**
 * Netlify Scheduled Function: actualiza el tipo de cambio USD→COP diariamente.
 *
 * El schedule se define aquí via `export const config` (Netlify Functions v2).
 * Corre todos los días a las 6:00 AM UTC (1:00 AM hora Colombia).
 */

export const config = {
  schedule: '0 6 * * *',
};

export default async function handler(): Promise<Response> {
  console.log('[cron/actualizar-tasa] Ejecutando actualización diaria de tipo de cambio USD/COP...');

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'User-Agent': 'OsbordInteriorismo-Cron/1.0' },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} de ExchangeRate API`);
    }

    const data = await res.json();
    const rate = data.rates?.COP;
    const date = data.time_last_update_utc;

    if (!rate) {
      throw new Error('COP no encontrado en la respuesta');
    }

    console.log(`[cron/actualizar-tasa] ✅ Tasa verificada: 1 USD = ${rate} COP (${date})`);

    return new Response(
      JSON.stringify({ success: true, rate, date }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[cron/actualizar-tasa] ❌ Error:', err?.message);
    return new Response(
      JSON.stringify({ success: false, error: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
