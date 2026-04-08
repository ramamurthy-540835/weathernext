import { NextResponse } from 'next/server';
import { runQuery } from '../../../lib/bigquery';

export async function GET() {
  try {
    const sql = `
      SELECT MAX(init_time) AS latest_init
      FROM \`ctoteam.weathernext_2.weathernext_2_0_0\`
      WHERE init_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 48 HOUR)
        AND ST_Y(geography) BETWEEN 12.90 AND 13.10
        AND ST_X(geography) BETWEEN 80.20 AND 80.30
    `;
    const rows = await runQuery<{ latest_init: string }>(sql);
    const latest = rows[0]?.latest_init;
    
    if (!latest) {
      return NextResponse.json(
        { error: 'No data found' }, 
        { status: 404 }
      );
    }

    const dt = new Date(latest);
    const latestDate = dt.toISOString().split('T')[0];
    const latestHour = Math.floor(dt.getUTCHours() / 6) * 6;

    return NextResponse.json(
      { latestDate, latestHour, latestTimestamp: latest },
      { headers: { 'Cache-Control': 's-maxage=1800' } }
    );
  } catch (error) {
    console.error('[available-dates]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
