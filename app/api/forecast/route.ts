import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '../../../lib/bigquery';
import { buildForecastQuery } from '../../../lib/queryBuilder';
import { DEFAULT_INIT_DATE, FORECAST_CONFIG } from '../../../lib/constants';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const lat = parseFloat(searchParams.get('lat') || process.env.WEATHERNEXT_LAT_MIN || '25.2');
  const lon = parseFloat(searchParams.get('lon') || process.env.WEATHERNEXT_LON_MIN || '55.27');
  const radius = parseFloat(searchParams.get('radius') || '0.15');
  const initDate = searchParams.get('initDate') || process.env.WEATHERNEXT_INIT_DATE || DEFAULT_INIT_DATE;
  const initHour = parseInt(searchParams.get('initHour') || '0', 10);
  // Support 15-day (360h) forecasts by default, allow override via query param
  const maxHours = Math.min(
    parseInt(searchParams.get('maxHours') || '360', 10),
    FORECAST_CONFIG.MAX_LEAD_HOURS
  );

  try {
    const sql = buildForecastQuery({ lat, lon, radius, initDate, initHour, maxHours });
    const rows = await runQuery<any>(sql);

    // Calculate confidence level based on lead time
    const getConfidenceLevel = (hours: number): string => {
      if (hours <= 72) return 'HIGH';
      if (hours <= 120) return 'MODERATE';
      if (hours <= 240) return 'LOW-MODERATE';
      return 'LOW';
    };

    const timeseries = rows.map(row => ({
      forecastTime: row.forecast_time?.value || row.forecast_time,
      hours: row.hours,
      forecastDay: Math.ceil(row.hours / 24),
      confidenceLevel: getConfidenceLevel(row.hours),
      tempC: { mean: row.temp_c_mean, spread: row.temp_c_spread },
      rainMm: { mean: row.rain_mm_mean, p90: row.rain_mm_p90 },
      windSpeed: { mean: row.wind_speed_mean, max: row.wind_speed_max },
      pressureHpa: row.pressure_hpa
    }));

    const response = NextResponse.json({
      location: { lat, lon },
      initDate,
      initHour,
      forecastConfig: {
        maxLeadDays: Math.floor(maxHours / 24),
        maxLeadHours: maxHours,
        ensembleMembers: FORECAST_CONFIG.ENSEMBLE_MEMBERS,
        model: 'WeatherNext 2.0 (Google DeepMind)'
      },
      timeseries,
      meta: {
        bytesProcessed: 0,
        recordsReturned: rows.length,
        confidenceNote: 'HIGH: Days 1-3 | MODERATE: Days 4-5 | LOW-MODERATE: Days 6-10 | LOW: Days 11-15'
      }
    });

    // Aggressive caching: 30min (server) + 5min (browser) + 1hr stale-while-revalidate
    response.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=300, stale-while-revalidate=3600');
    return response;
  } catch (error) {
    console.error('Forecast API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch forecast data' }, {
      status: 500,
      headers: { 'Cache-Control': 'public, max-age=60' }
    });
  }
}
