import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { locationName = 'Unknown', lat, lon, initDate = 'Unknown', initHour = '00', forecastData, alerts = [] } = body;

    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL_NAME || 'gemini-3.1-pro-preview',
    });

    const prompt = `You are generating a decision-ready weather briefing using
Google DeepMind WeatherNext 2 ensemble forecast data.

LOCATION: ${locationName} (${lat}°N, ${lon}°E)
INIT TIME: ${initDate} ${initHour}:00 UTC  
MODEL: WeatherNext 2 · 64-member ensemble · ctoteam BigQuery

FORECAST DATA: ${JSON.stringify(forecastData)}
ALERTS: ${JSON.stringify(alerts)}

Generate ONLY this JSON (no markdown, no code blocks):
{
  "summary": "Paragraph 1: Next 24h with ensemble mean + P90 values and member counts. Paragraph 2: Days 2-5 with probability language and timing. Paragraph 3: Key uncertainties - where spread is wide and confidence is low.",
  "keyRisks": [
    "Format: [X of 64 members (Y%)] show [condition] at [+Nh = Date UTC]",
    "Format: P90 [variable] reaches [value] vs mean [value] — [spread level] spread"
  ],
  "recommendedActions": [
    "Format: [Action] before [specific UTC time] — triggered if [threshold]",
    "Format: Monitor [variable] at next init [date time UTC]"
  ],
  "confidence": "High (ensemble spread <2°C/<10mm) OR Moderate OR Low (spread >5°C/>30mm)",
  "nextUpdateRecommended": "Check updated forecast at: [next init date time UTC]"
}

Use REAL numbers from the data. Every risk needs member count and probability.
Every action needs specific UTC timing. Return ONLY the JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Strip any accidental markdown wrapper
    const clean = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
      
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
