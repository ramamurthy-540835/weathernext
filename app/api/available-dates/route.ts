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
    const rows = await runQuery<{ latest_init: any }>(sql);
    const raw = rows[0]?.latest_init;

    // BigQuery returns timestamps in different formats
    // Handle: string, Date object, {value: string}, BigQuery DatetimeValue
    let latest: Date | null = null;
    
    if (!raw) {
      // No data — use known fallback
      return NextResponse.json(
        { latestDate: '2026-04-07', latestHour: 18 },
        { headers: { 'Cache-Control': 's-maxage=1800' } }
      );
    }
    
    if (raw instanceof Date) {
      latest = raw;
    } else if (typeof raw === 'string') {
      latest = new Date(raw);
    } else if (raw?.value) {
      latest = new Date(raw.value);
    } else {
      latest = new Date(String(raw));
    }

    // Validate the date
    if (!latest || isNaN(latest.getTime())) {
      console.warn('[available-dates] Could not parse date:', raw);
      return NextResponse.json(
        { latestDate: '2026-04-07', latestHour: 18 },
        { headers: { 'Cache-Control': 's-maxage=1800' } }
      );
    }

    const latestDate = latest.toISOString().split('T')[0];
    const latestHour = Math.floor(latest.getUTCHours() / 6) * 6;

    console.log('[available-dates] Latest:', latestDate, latestHour);
    return NextResponse.json(
      { latestDate, latestHour, raw: String(raw) },
      { headers: { 'Cache-Control': 's-maxage=1800' } }
    );
  } catch (error) {
    console.error('[available-dates]', error);
    // Always return fallback — never crash
    return NextResponse.json(
      { latestDate: '2026-04-07', latestHour: 18 },
      { headers: { 'Cache-Control': 's-maxage=1800' } }
    );
  }
}
