import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { message, weatherContext } = await req.json();
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-3.1-pro-preview',
      systemInstruction: `You are WeatherNext AI, a senior meteorologist using Google DeepMind 
WeatherNext 2 real ensemble forecast data from BigQuery.

FORECAST DATA: ${JSON.stringify(weatherContext)}

RULES:
- Start risk answers with YES / NO / POSSIBLY
- Always cite exact numbers from the data
- Always mention ensemble probability e.g. "47 of 64 members (73%)"  
- Always give UTC timing e.g. "+36h = Apr 9 06:00 UTC"
- State confidence: High/Moderate/Low based on ensemble spread
- End with ONE specific action for a decision maker
- Max 120 words unless asked for more detail
- Be direct — no "based on the data" phrases`
    });

    const prompt = `User Question: ${message}\n\nWeather Context: ${JSON.stringify(weatherContext)}`;
    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          controller.enqueue(new TextEncoder().encode(chunk.text()));
        }
        controller.close();
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate chat response' }, { status: 500 });
  }
}
