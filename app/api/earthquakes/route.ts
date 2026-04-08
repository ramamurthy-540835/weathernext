import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson', {
      next: { revalidate: 900 } // Cache for 15 minutes
    });
    const data = await res.json();

    const earthquakes = data.features.map((f: any) => ({
      id: f.id,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: new Date(f.properties.time).toISOString(),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
      tsunami: f.properties.tsunami === 1,
      severity: f.properties.mag >= 7 ? 'MAJOR' :
                f.properties.mag >= 6 ? 'STRONG' :
                f.properties.mag >= 5 ? 'MODERATE' : 'MINOR',
      url: f.properties.url
    }));

    return NextResponse.json({ earthquakes });
  } catch (error) {
    console.error('Earthquakes API Error:', error);
    return NextResponse.json({ earthquakes: [] });
  }
}
