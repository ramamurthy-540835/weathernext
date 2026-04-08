import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '../../../lib/bigquery';
import { buildEnsembleQuery } from '../../../lib/queryBuilder';
import { DEFAULT_INIT_DATE } from '../../../lib/constants';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  
  const lat = parseFloat(searchParams.get('lat') || '13.0');
  const lon = parseFloat(searchParams.get('lon') || '80.25');
  const radius = parseFloat(searchParams.get('radius') || '0.15');
  const initDate = searchParams.get('initDate') || process.env.WEATHERNEXT_INIT_DATE || DEFAULT_INIT_DATE;
  const initHour = parseInt(searchParams.get('initHour') || '0', 10);
  const maxHours = parseInt(searchParams.get('maxHours') || '120', 10);

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
        tempC: row.temp_c,
        rainMm: row.rain_mm,
        windSpeed: row.wind_speed,
        pressureHpa: row.pressure_hpa
      });
    });

    const response = NextResponse.json({
      members: Array.from(membersMap.values())
    });

    response.headers.set('Cache-Control', 's-maxage=1800');
    return response;
  } catch (error) {
    console.error('Ensemble API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch ensemble data' }, { status: 500 });
  }
}
