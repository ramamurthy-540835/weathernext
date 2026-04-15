import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const bigquery = new BigQuery();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const eventId = searchParams.get('eventId') || 'uae_rain_apr2024';

  // This is the core Federated Query demonstrating the Hybrid Architecture.
  // It joins Google Cloud native data (WeatherNext AI) with On-Premise data (BigLake).
  const query = `
    WITH ai_forecast AS (
      -- 1. Get the AI Probabilistic Forecast from Google Cloud BigQuery
      SELECT 
        forecast_time,
        AVG(2m_temperature) - 273.15 as predicted_temp,
        MAX(total_precipitation_6hr) * 1000 as predicted_rain_p90
      FROM \`ctoteam.weathernext_2.weathernext_2_0_0\`
      WHERE event_id = @eventId
      GROUP BY forecast_time
    ),
    onprem_actuals AS (
      -- 2. THIS IS THE BIGLAKE CONNECTION
      -- Querying an external table that points directly to NCM's on-premise storage
      -- Data never leaves the client's environment until query execution
      SELECT 
        observation_time,
        actual_temp,
        actual_rain
      FROM \`ctoteam.ncm_onprem_ext.historical_station_data\`
      WHERE event_id = @eventId
    )
    -- 3. Calculate Accuracy Benchmarks
    SELECT 
      f.forecast_time as time,
      f.predicted_temp,
      a.actual_temp,
      f.predicted_rain_p90,
      a.actual_rain,
      ABS(f.predicted_temp - a.actual_temp) as temp_error,
      ABS(f.predicted_rain_p90 - a.actual_rain) as rain_error
    FROM ai_forecast f
    JOIN onprem_actuals a ON f.forecast_time = a.observation_time
    ORDER BY f.forecast_time ASC
  `;

  try {
    // In a production environment with the BigLake connection established, you would run:
    // const [rows] = await bigquery.query({ query, params: { eventId } });
    
    // For the immediate demo, we return the structured mock data that the UI expects
    // while the physical BigLake connection to NCM's on-premise servers is being provisioned.
    const mockData = {
      event: eventId,
      metrics: {
        accuracy: "94%",
        timingOffset: "±2 Hours",
        peakPredicted: "245mm",
        peakActual: "254mm"
      },
      findings: {
        summary: "Highest recorded rainfall in the UAE in 75 years. The AI ensemble successfully predicted the P90 tail-risk scenario 4 days in advance.",
        infrastructureImpact: [
          "DXB Airport: Operations suspended for 48 hours due to runway flooding.",
          "Major Highways: Severe waterlogging on Sheikh Zayed Road (E11) and Emirates Road (E611).",
          "Urban Areas: Significant drainage overflow in Al Ain and Dubai residential districts."
        ]
      },
      regionalOutlook: {
        pastWeek: "Stable high-pressure system. Minor early morning fog in the western region (Al Dhafra) reducing visibility to 1000m, clearing by 09:00 GST.",
        futurePredictions: "High confidence (85% ensemble agreement) of dry, stable conditions for the next 10 days. Gradual temperature increase of 2-3°C expected across coastal areas."
      },
      timeseries: [
        { time: "2024-04-15T12:00:00Z", predicted_rain: 10, actual_rain: 12 },
        { time: "2024-04-15T18:00:00Z", predicted_rain: 85, actual_rain: 90 },
        { time: "2024-04-16T00:00:00Z", predicted_rain: 150, actual_rain: 152 },
        { time: "2024-04-16T06:00:00Z", predicted_rain: 245, actual_rain: 254 },
        { time: "2024-04-16T12:00:00Z", predicted_rain: 60, actual_rain: 55 },
      ]
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('BigLake Query Error:', error);
    return NextResponse.json({ error: 'Failed to fetch historical validation data via BigLake' }, { status: 500 });
  }
}
