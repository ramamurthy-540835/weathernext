import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '../../../lib/bigquery';
import { DEFAULT_INIT_DATE, FORECAST_CONFIG } from '../../../lib/constants';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const lat = parseFloat(searchParams.get('lat') || '25.2');
  const lon = parseFloat(searchParams.get('lon') || '55.27');
  const initDate = searchParams.get('initDate') || process.env.WEATHERNEXT_INIT_DATE || DEFAULT_INIT_DATE;
  const initHour = parseInt(searchParams.get('initHour') || '0', 10);
  // Support extended 15-day forecast for alerts
  const maxHours = Math.min(
    parseInt(searchParams.get('maxHours') || '360', 10),
    FORECAST_CONFIG.MAX_LEAD_HOURS
  );

  const latMin = lat - 0.15;
  const latMax = lat + 0.15;
  const lonMin = lon - 0.15;
  const lonMax = lon + 0.15;

  try {
    const sql = `
      SELECT
        f.hours,
        f.time AS forecast_time,
        AVG(e.2m_temperature) - 273.15 AS temp_c,
        MAX(e.2m_temperature) - 273.15 AS temp_c_max,
        AVG(e.total_precipitation_6hr) * 1000 AS rain_mm,
        MAX(e.total_precipitation_6hr) * 1000 AS rain_mm_max,
        AVG(SQRT(POW(e.10m_u_component_of_wind,2)+POW(e.10m_v_component_of_wind,2))) AS wind_ms,
        MAX(SQRT(POW(e.10m_u_component_of_wind,2)+POW(e.10m_v_component_of_wind,2))) AS wind_ms_max,
        AVG(e.mean_sea_level_pressure)/100 AS pressure_hpa,
        MIN(e.mean_sea_level_pressure)/100 AS pressure_hpa_min,
        COUNT(CASE WHEN e.total_precipitation_6hr*1000 > 50 THEN 1 END) AS heavy_rain_members,
        COUNT(CASE WHEN e.total_precipitation_6hr*1000 > 100 THEN 1 END) AS extreme_rain_members,
        COUNT(CASE WHEN SQRT(POW(e.10m_u_component_of_wind,2)+POW(e.10m_v_component_of_wind,2)) > 17 THEN 1 END) AS strong_wind_members,
        COUNT(CASE WHEN e.2m_temperature-273.15 > 50 THEN 1 END) AS extreme_heat_members,
        COUNT(CASE WHEN e.2m_temperature-273.15 > 48 THEN 1 END) AS heat_stress_members,
        COUNT(*) AS total_members
      FROM \`ctoteam.weathernext_2.weathernext_2_0_0\`,
           UNNEST(forecast) AS f, UNNEST(f.ensemble) AS e
      WHERE init_time = TIMESTAMP('${initDate} ${String(initHour).padStart(2, '0')}:00:00')
        AND ST_Y(geography) BETWEEN ${latMin} AND ${latMax}
        AND ST_X(geography) BETWEEN ${lonMin} AND ${lonMax}
        AND f.hours <= ${maxHours}
      GROUP BY 1, 2
      ORDER BY f.hours
    `;

    const rows = await runQuery<any>(sql);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    const alerts = [];

    // Calculate forecast confidence based on lead time
    const getConfidenceNote = (hours: number): string => {
      if (hours <= 72) return '(HIGH confidence — Days 1-3)';
      if (hours <= 120) return '(MODERATE confidence — Days 4-5)';
      if (hours <= 240) return '(LOW-MODERATE confidence — Days 6-10)';
      return '(LOW confidence — Days 11-15)';
    };

    // Find peak values across all timesteps
    const peakRain = Math.max(...rows.map(r => r.rain_mm_max));
    const peakWind = Math.max(...rows.map(r => r.wind_ms_max));
    const peakTemp = Math.max(...rows.map(r => r.temp_c_max));
    const minPressure = Math.min(...rows.map(r => r.pressure_hpa_min));
    const maxHeavyRainProb = Math.max(...rows.map(r => r.heavy_rain_members / r.total_members));
    const maxExtremeRainProb = Math.max(...rows.map(r => r.extreme_rain_members / r.total_members));
    const maxWindProb = Math.max(...rows.map(r => r.strong_wind_members / r.total_members));
    const maxExtremeHeatProb = Math.max(...rows.map(r => r.extreme_heat_members / r.total_members));
    const maxHeatProb = Math.max(...rows.map(r => r.heat_stress_members / r.total_members));

    const peakRainRow = rows.find(r => r.rain_mm_max === peakRain);
    const peakWindRow = rows.find(r => r.wind_ms_max === peakWind);
    const peakTempRow = rows.find(r => r.temp_c_max === peakTemp);

    // HEAVY RAIN alert
    if (peakRain > 20) {
      alerts.push({
        variable: 'rain',
        severity: peakRain > 100 ? 'DANGER' : peakRain > 50 ? 'WARNING' : 'INFO',
        label: peakRain > 100 ? 'Extreme Rainfall' : peakRain > 50 ? 'Heavy Rainfall' : 'Moderate Rain',
        peakValue: Math.round(peakRain * 10) / 10,
        peakTime: peakRainRow?.forecast_time?.value || peakRainRow?.forecast_time,
        peakHours: peakRainRow?.hours,
        probability: Math.round((peakRain > 100 ? maxExtremeRainProb : maxHeavyRainProb) * 100),
        unit: 'mm/6hr',
        recommendation: peakRain > 100 
          ? 'Activate flood emergency protocols. Evacuate low-lying areas.'
          : peakRain > 50 
          ? 'Pre-position flood response teams. Monitor river levels.'
          : 'Monitor rainfall. Standard drainage checks recommended.'
      });
    }

    // STRONG WIND alert
    if (peakWind > 10) {
      alerts.push({
        variable: 'wind',
        severity: peakWind > 28 ? 'DANGER' : peakWind > 17 ? 'WARNING' : 'INFO',
        label: peakWind > 28 ? 'Severe Wind' : peakWind > 17 ? 'Strong Wind' : 'Moderate Wind',
        peakValue: Math.round(peakWind * 10) / 10,
        peakTime: peakWindRow?.forecast_time?.value || peakWindRow?.forecast_time,
        peakHours: peakWindRow?.hours,
        probability: Math.round(maxWindProb * 100),
        unit: 'm/s',
        recommendation: peakWind > 28
          ? 'Suspend outdoor operations. Secure structures.'
          : 'Caution for outdoor activities. Check scaffolding.'
      });
    }

    // HEAT STRESS alert
    if (peakTemp > 37) {
      alerts.push({
        variable: 'temperature',
        severity: peakTemp > 45 ? 'DANGER' : peakTemp > 40 ? 'WARNING' : 'INFO',
        label: peakTemp > 45 ? 'Extreme Heat' : peakTemp > 40 ? 'Severe Heat Stress' : 'Heat Advisory',
        peakValue: Math.round(peakTemp * 10) / 10,
        peakTime: peakTempRow?.forecast_time?.value || peakTempRow?.forecast_time,
        peakHours: peakTempRow?.hours,
        probability: Math.round(maxHeatProb * 100),
        unit: '°C',
        recommendation: peakTemp > 40
          ? 'Implement heat emergency plan. Limit outdoor exposure.'
          : 'Issue heat advisory. Ensure hydration stations.'
      });
    }

    // LOW PRESSURE / CYCLONE RISK alert
    if (minPressure < 1000) {
      alerts.push({
        variable: 'pressure',
        severity: minPressure < 990 ? 'DANGER' : minPressure < 1000 ? 'WARNING' : 'INFO',
        label: minPressure < 990 ? 'Deep Low Pressure — Cyclone Risk' : 'Low Pressure System',
        peakValue: Math.round(minPressure),
        peakTime: rows.find(r => r.pressure_hpa_min === minPressure)?.forecast_time?.value || rows.find(r => r.pressure_hpa_min === minPressure)?.forecast_time,
        probability: 85,
        unit: 'hPa',
        recommendation: 'Monitor for cyclone development. Issue marine warnings.'
      });
    }

    // If no alerts
    if (alerts.length === 0) {
      alerts.push({
        variable: 'general',
        severity: 'INFO',
        label: 'No significant weather alerts',
        peakValue: 0,
        probability: 95,
        unit: '',
        recommendation: 'Normal weather conditions. No special actions required.'
      });
    }

    const response = NextResponse.json({ alerts, queryMeta: { rows: rows.length, cached: false, timestamp: new Date().toISOString() } });
    // Aggressive caching: 30min (server) + 5min (browser)
    response.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=300, stale-while-revalidate=3600');
    return response;
  } catch (error) {
    console.error('Alerts API Error:', error);
    // Return cached response on error (stale-while-revalidate)
    return NextResponse.json({ error: 'Failed to fetch alerts data', alerts: [] }, {
      status: 500,
      headers: { 'Cache-Control': 'public, max-age=60' }
    });
  }
}
