import type { APIRoute } from 'astro';

// Cache en memoria para no llamar la API en cada request del mismo proceso
let cached: { rate: number; date: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

export const GET: APIRoute = async () => {
  try {
    const now = Date.now();

    // Usa cache si es reciente
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ rate: cached.rate, date: cached.date, source: 'cache' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Llama a open.er-api.com (gratuito, sin clave, soporta COP)
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'User-Agent': 'OsbordInteriorismo/1.0' },
    });

    if (!res.ok) {
      throw new Error(`ExchangeRate API error: ${res.status}`);
    }

    const data = await res.json();

    if (data.result !== 'success' || !data.rates?.COP) {
      throw new Error('Respuesta inválida de la API de tipo de cambio');
    }

    const rate = data.rates.COP as number;
    const date = data.time_last_update_utc as string;

    // Actualiza cache
    cached = { rate, date, fetchedAt: now };

    return new Response(
      JSON.stringify({ rate, date, source: 'live' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Permite que el cliente y CDN cacheen 6 horas
          'Cache-Control': 'public, max-age=21600, s-maxage=21600',
        },
      }
    );
  } catch (err: any) {
    console.error('[tipo-cambio] Error obteniendo tasa USD/COP:', err?.message);

    // Si hay cache viejo, úsalo como fallback
    if (cached) {
      return new Response(
        JSON.stringify({ rate: cached.rate, date: cached.date, source: 'stale-cache' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: tasa aproximada hardcoded
    return new Response(
      JSON.stringify({ rate: 4100, date: 'N/A', source: 'fallback' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
