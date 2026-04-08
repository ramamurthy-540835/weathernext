import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '../../../lib/bigquery';
import { DEFAULT_INIT_DATE } from '../../../lib/constants';

function getCategory(windKnots: number) {
  if (windKnots < 34) return 'TD';
  if (windKnots <= 63) return 'TS';
  if (windKnots <= 82) return 'Cat 1';
  if (windKnots <= 95) return 'Cat 2';
  if (windKnots <= 112) return 'Cat 3';
  if (windKnots <= 136) return 'Cat 4';
  return 'Cat 5';
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const initDate = searchParams.get('initDate') || process.env.WEATHERNEXT_INIT_DATE || DEFAULT_INIT_DATE;
  const initHour = parseInt(searchParams.get('initHour') || '0', 10);

  try {
    const sql = `
      SELECT 
        lat, lon, hours, forecast_time,
        ROUND(pressure_hpa,1) AS pressure_hpa,
        ROUND(wind_knots,1) AS wind_knots,
        ROUND(wind_knots_max,1) AS wind_knots_max,
        ROUND(pressure_min,1) AS pressure_min,
        cyclone_members,
        total_members,
        ROUND(cyclone_members/total_members*100,0) AS ensemble_probability
      FROM \`ctoteam.weathernext_derived.cyclone_candidates\`
      WHERE wind_knots > 34
        AND init_time = TIMESTAMP('${initDate} ${String(initHour).padStart(2, '0')}:00:00')
      ORDER BY pressure_hpa ASC, hours ASC
    `;

    const rows = await runQuery<any>(sql);

    // Simple clustering: group points within 3 degrees of each other
    const storms: any[] = [];
    
    rows.forEach(row => {
      let foundStorm = storms.find(s => 
        Math.abs(s.currentLat - row.lat) < 3 && 
        Math.abs(s.currentLon - row.lon) < 3
      );

      const trackPoint = {
        hours: row.hours,
        lat: row.lat,
        lon: row.lon,
        pressureHpa: row.pressure_hpa,
        windKnots: row.wind_knots,
        windKnotsMax: row.wind_knots_max,
        category: getCategory(row.wind_knots_max),
        ensembleProbability: row.ensemble_probability,
        forecastTime: row.forecast_time?.value || row.forecast_time
      };

      if (foundStorm) {
        foundStorm.track.push(trackPoint);
        if (row.wind_knots_max > foundStorm.peakWindKnots) {
          foundStorm.peakWindKnots = row.wind_knots_max;
          foundStorm.peakCategory = getCategory(row.wind_knots_max);
        }
        // Update current position to the latest hours
        if (row.hours > foundStorm.track[foundStorm.track.length - 1].hours) {
          foundStorm.currentLat = row.lat;
          foundStorm.currentLon = row.lon;
          foundStorm.currentPressure = row.pressure_hpa;
          foundStorm.currentWindKnots = row.wind_knots;
        }
      } else {
        storms.push({
          id: `storm-${storms.length + 1}`,
          name: `System ${storms.length + 1}`,
          category: getCategory(row.wind_knots_max),
          ensembleProbability: row.ensemble_probability,
          currentLat: row.lat,
          currentLon: row.lon,
          currentPressure: row.pressure_hpa,
          currentWindKnots: row.wind_knots,
          peakWindKnots: row.wind_knots_max,
          peakCategory: getCategory(row.wind_knots_max),
          track: [trackPoint]
        });
      }
    });

    // Sort tracks by hours
    storms.forEach(s => s.track.sort((a: any, b: any) => a.hours - b.hours));

    const response = NextResponse.json({ storms });
    response.headers.set('Cache-Control', 's-maxage=1800');
    return response;
  } catch (error) {
    console.error('Cyclones API Error:', error);
    return NextResponse.json({ storms: [] });
  }
}
