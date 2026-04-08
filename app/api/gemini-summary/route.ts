import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lon, forecastData, sector } = body;

    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL_NAME || 'gemini-3.1-pro-preview',
      systemInstruction: "You are a professional meteorologist. Write a concise 3-paragraph forecast briefing for emergency management officials based on this WeatherNext AI ensemble forecast data. Return ONLY a valid JSON object with no markdown, no code blocks, no ```json wrapper. Just the raw JSON starting with { and ending with }.\nStructure:\n{\n  \"summary\": \"three paragraph briefing text here\",\n  \"keyRisks\": [\"risk 1\", \"risk 2\"],\n  \"confidence\": \"High\" or \"Moderate\" or \"Low\",\n  \"recommendedActions\": [\"action 1\", \"action 2\", \"action 3\"]\n}"
    });

    const prompt = `
      Location: Lat ${lat}, Lon ${lon}
      Sector: ${sector || 'general'}
      Forecast Data: ${JSON.stringify(forecastData).substring(0, 10000)}
    `;

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
