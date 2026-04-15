import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '../../../lib/bigquery';
import { buildEnsembleQuery } from '../../../lib/queryBuilder';
import { DEFAULT_INIT_DATE, FORECAST_CONFIG } from '../../../lib/constants';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const lat = parseFloat(searchParams.get('lat') || '25.2');
  const lon = parseFloat(searchParams.get('lon') || '55.27');
  const radius = parseFloat(searchParams.get('radius') || '0.15');
  const initDate = searchParams.get('initDate') || process.env.WEATHERNEXT_INIT_DATE || DEFAULT_INIT_DATE;
  const initHour = parseInt(searchParams.get('initHour') || '0', 10);
  // Support 15-day (360h) ensemble forecasts
  const maxHours = Math.min(
    parseInt(searchParams.get('maxHours') || '360', 10),
    FORECAST_CONFIG.MAX_LEAD_HOURS
  );

  try {
    const sql = buildEnsembleQuery({ lat, lon, radius, initDate, initHour, maxHours });
    const rows = await runQuery<any>(sql);

    const membersMap = new Map<number, any>();

    rows.forEach(row => {
      const memberId = row.ensemble_member;
      if (!membersMap.has(memberId)) {
        membersMap.set(memberId, { id: memberId, timeseries: [] });
      }
      membersMap.get(memberId).timeseries.push({
        hours: row.hours,
        forecastDay: Math.ceil(row.hours / 24),
        tempC: row.temp_c,
        rainMm: row.rain_mm,
        windSpeed: row.wind_speed,
        pressureHpa: row.pressure_hpa
      });
    });

    const members = Array.from(membersMap.values());

    // Calculate ensemble statistics
    const calculateStats = () => {
      if (members.length === 0) return null;
      const allHours = new Set<number>();
      members.forEach(m => m.timeseries.forEach((t: any) => allHours.add(t.hours)));

      const stats: any = {};
      allHours.forEach(hours => {
        const temps = members
          .map(m => m.timeseries.find((t: any) => t.hours === hours)?.tempC)
          .filter(v => v !== undefined)
          .sort((a, b) => a - b);

        if (temps.length > 0) {
          stats[hours] = {
            mean: temps.reduce((a, b) => a + b) / temps.length,
            min: temps[0],
            p10: temps[Math.floor(temps.length * 0.1)],
            p90: temps[Math.floor(temps.length * 0.9)],
            max: temps[temps.length - 1],
            spread: temps[temps.length - 1] - temps[0]
          };
        }
      });
      return stats;
    };

    const response = NextResponse.json({
      location: { lat, lon },
      initDate,
      initHour,
      ensembleConfig: {
        totalMembers: FORECAST_CONFIG.ENSEMBLE_MEMBERS,
        membersReturned: members.length,
        maxLeadDays: Math.floor(maxHours / 24),
        maxLeadHours: maxHours,
        model: 'WeatherNext 2.0 (Google DeepMind)'
      },
      members,
      statistics: calculateStats(),
      meta: {
        recordsReturned: rows.length,
        ensembleNote: 'Full 64-member probabilistic ensemble. Spread indicates forecast uncertainty.'
      }
    });

    // Aggressive caching: 30min (server) + 5min (browser) + 1hr stale-while-revalidate
    response.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=300, stale-while-revalidate=3600');
    return response;
  } catch (error) {
    console.error('Ensemble API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch ensemble data' }, {
      status: 500,
      headers: { 'Cache-Control': 'public, max-age=60' }
    });
  }
}
