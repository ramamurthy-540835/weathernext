import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { message, weatherContext } = await req.json();
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash',
      systemInstruction: "You are WeatherNext AI assistant powered by Google DeepMind WeatherNext 2 data. Answer weather questions based on the forecast context. Be concise, accurate, and mention ensemble probability when relevant."
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
