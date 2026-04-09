import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [quakeRes, alertRes] = await Promise.allSettled([
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson'),
      fetch('https://api.weather.gov/alerts/active?status=actual&severity=Extreme,Severe&limit=20'),
    ]);

    const earthquakes = quakeRes.status === 'fulfilled'
      ? (await quakeRes.value.json()).features.map((f: any) => ({
          id: f.id,
          type: 'earthquake',
          magnitude: f.properties.mag,
          place: f.properties.place,
          time: new Date(f.properties.time).toISOString(),
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          depth: f.geometry.coordinates[2],
          tsunami: f.properties.tsunami === 1,
          alert: f.properties.alert,
          url: f.properties.url,
          severity: f.properties.mag >= 7 ? 'DANGER' :
                    f.properties.mag >= 6 ? 'WARNING' : 'INFO',
          color: f.properties.mag >= 7 ? '#ef4444' :
                 f.properties.mag >= 6 ? '#f97316' :
                 f.properties.mag >= 5 ? '#eab308' : '#94a3b8',
          recommendation: f.properties.tsunami === 1
            ? 'Tsunami warning active. Coastal evacuation required.'
            : `M${f.properties.mag} earthquake near ${f.properties.place}.`,
        }))
      : [];

    const weatherAlerts: any[] = [];
    if (alertRes.status === 'fulfilled') {
      try {
        const data = await alertRes.value.json();
        data.features?.slice(0, 20).forEach((f: any) => {
          weatherAlerts.push({
            id: f.properties.id,
            type: 'weather_alert',
            event: f.properties.event,
            headline: f.properties.headline,
            severity: f.properties.severity === 'Extreme' ? 'DANGER' : 'WARNING',
            area: f.properties.areaDesc,
            onset: f.properties.onset,
          });
        });
      } catch (e) {}
    }

    return NextResponse.json({
      earthquakes,
      wildfires: [],
      weatherAlerts,
      allHazards: [...earthquakes, ...weatherAlerts],
      counts: {
        earthquakes: earthquakes.length,
        wildfires: 0,
        weatherAlerts: weatherAlerts.length,
        danger: earthquakes.filter((e: any) => e.severity === 'DANGER').length,
        warning: earthquakes.filter((e: any) => e.severity === 'WARNING').length,
      },
      lastUpdated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 's-maxage=900' }
    });
  } catch (error) {
    console.error('[Hazards API]', error);
    return NextResponse.json({ 
      earthquakes: [], wildfires: [], weatherAlerts: [],
      allHazards: [], counts: { earthquakes: 0, wildfires: 0, danger: 0, warning: 0 },
      error: String(error)
    });
  }
}
