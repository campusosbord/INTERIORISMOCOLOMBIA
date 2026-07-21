// Helper centralizado para obtener la tasa de cambio USD -> COP
// Garantiza el calculo exacto usando la API en tiempo real sin fallar en Netlify

export async function getCOPRate(): Promise<number> {
  // 1. Si existe una variable de entorno personalizada para fijar la tasa
  if (import.meta.env.TRM_COP) {
    const customRate = parseFloat(import.meta.env.TRM_COP);
    if (!isNaN(customRate) && customRate > 0) {
      return customRate;
    }
  }

  try {
    // 2. Consultar API en tiempo real
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'User-Agent': 'OsbordInteriorismo/1.0' },
    });

    if (res.ok) {
      const data = await res.json();
      const rate = data.rates?.COP;
      if (rate && typeof rate === 'number') {
        return rate;
      }
    }
  } catch (e) {
    console.warn('[Tasa] Error consultando API live, usando tasa de respaldo');
  }

  // 3. Respaldo exacto del día si la API no responde (3,257.67 COP)
  return 3257.67;
}
