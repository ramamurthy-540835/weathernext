'use client';

import React, { useState } from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { Loader2, Send } from 'lucide-react';

export default function TalkToData() {
  const { selectedLat, selectedLon, initDate, initHour } = useWeatherStore();
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const starterQuestions = [
    "What is the flood risk this week?",
    "Is there a cyclone forming?",
    "Best time to fly from Chennai?",
    "Will it rain tomorrow?",
    "What does the pressure drop mean?"
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      let context = {};
      if (selectedLat && selectedLon) {
        const res = await fetch(`/api/forecast?lat=${selectedLat}&lon=${selectedLon}&initDate=${initDate}&initHour=${initHour}`);
        if (res.ok) context = await res.json();
      }

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, weatherContext: context })
      });

      if (!chatRes.body) throw new Error('No response');
      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      setMessages(prev => [...prev, { role: 'ai', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = aiText;
          return newMsgs;
        });
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111827', color: 'white', padding: 16 }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
            Ask WeatherNext AI about the forecast...
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              {starterQuestions.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)} style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 16, padding: '6px 12px', color: '#d1d5db', fontSize: 12, cursor: 'pointer' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#2563eb' : '#1f2937', padding: '8px 12px', borderRadius: 8, maxWidth: '85%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', background: '#1f2937', padding: '8px 12px', borderRadius: 8 }}><Loader2 className="w-4 h-4 animate-spin" /></div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend(input)} placeholder="Ask about the weather..." style={{ flex: 1, background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '10px 12px', color: 'white', outline: 'none', fontSize: 13 }} />
        <button onClick={() => handleSend(input)} disabled={loading || !input.trim()} style={{ background: '#2563eb', border: 'none', borderRadius: 8, padding: '0 16px', color: 'white', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
