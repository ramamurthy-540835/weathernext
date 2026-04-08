import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '../../../lib/bigquery';
import { buildForecastQuery } from '../../../lib/queryBuilder';
import { DEFAULT_INIT_DATE } from '../../../lib/constants';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  
  const lat = parseFloat(searchParams.get('lat') || process.env.WEATHERNEXT_LAT_MIN || '13.0');
  const lon = parseFloat(searchParams.get('lon') || process.env.WEATHERNEXT_LON_MIN || '80.25');
  const radius = parseFloat(searchParams.get('radius') || '0.15');
  const initDate = searchParams.get('initDate') || process.env.WEATHERNEXT_INIT_DATE || DEFAULT_INIT_DATE;
  const initHour = parseInt(searchParams.get('initHour') || '0', 10);
  const maxHours = parseInt(searchParams.get('maxHours') || '120', 10);

  try {
    const sql = buildForecastQuery({ lat, lon, radius, initDate, initHour, maxHours });
    const rows = await runQuery<any>(sql);

    const timeseries = rows.map(row => ({
      forecastTime: row.forecast_time?.value || row.forecast_time,
      hours: row.hours,
      tempC: { mean: row.temp_c_mean, spread: row.temp_c_spread },
      rainMm: { mean: row.rain_mm_mean, p90: row.rain_mm_p90 },
      windSpeed: { mean: row.wind_speed_mean, max: row.wind_speed_max },
      pressureHpa: row.pressure_hpa
    }));

    const response = NextResponse.json({
      location: { lat, lon },
      initDate,
      initHour,
      timeseries,
      meta: { bytesProcessed: 0 } // BigQuery bytes processed logged in console
    });

    response.headers.set('Cache-Control', 's-maxage=1800');
    return response;
  } catch (error) {
    console.error('Forecast API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch forecast data' }, { status: 500 });
  }
}
