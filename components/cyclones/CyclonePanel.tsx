'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { useWeatherStore } from '../../store/useWeatherStore';

export default function CyclonePanel() {
  const { initDate, initHour, leadHours, setLocation } = useWeatherStore();
  const [cyclones, setCyclones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStorm, setSelectedStorm] = useState<any>(null);

  useEffect(() => {
    const fetchCyclones = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cyclones?initDate=${initDate}&initHour=${initHour}`);
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        setCyclones(data.storms || []);
        // Do not auto-select, show list first
        setSelectedStorm(null);
      } catch (e) {
        console.error('Cyclone fetch error:', e);
        setCyclones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCyclones();
  }, [initDate, initHour]);

  if (loading) {
    return <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  }

  if (!selectedStorm) {
    if (cyclones.length === 0) {
      return (
        <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌀</div>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            No storm systems detected
          </p>
          <p style={{ fontSize: 11, marginTop: 6 }}>
            Scanning for pressure below 1005 hPa
            and wind above 34 knots
          </p>
        </div>
      );
    }

    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
          {cyclones.length} storm system{cyclones.length > 1 ? 's' : ''} detected
          · Init: {initDate} {String(initHour).padStart(2, '0')}:00 UTC
        </div>
        
        {cyclones.map(storm => (
          <div key={storm.id} style={{
            background: '#0f172a', border: '1px solid #1e3a5f',
            borderRadius: 10, padding: 14, marginBottom: 10,
            cursor: 'pointer'
          }}
          onClick={() => {
            setSelectedStorm(storm);
            setLocation(storm.currentLat, storm.currentLon);
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 16, marginRight: 8 }}>🌀</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                  {storm.name}
                </span>
                <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>
                  {storm.type}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px',
                borderRadius: 20, background: '#1e3a5f', color: '#93c5fd'
              }}>
                {storm.category}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 8, fontSize: 12 }}>
              <div>
                <div style={{ color: '#64748b' }}>Pressure</div>
                <div style={{ color: 'white', fontWeight: 500 }}>
                  {storm.currentPressure} hPa
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Max wind</div>
                <div style={{ color: 'white', fontWeight: 500 }}>
                  {storm.currentWindKnots?.toFixed(0)} knots
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Position</div>
                <div style={{ color: 'white', fontWeight: 500 }}>
                  {Math.abs(storm.currentLat).toFixed(1)}°
                  {storm.currentLat < 0 ? 'S' : 'N'} · 
                  {Math.abs(storm.currentLon).toFixed(1)}°
                  {storm.currentLon < 0 ? 'W' : 'E'}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b' }}>Ensemble</div>
                <div style={{ color: '#22c55e', fontWeight: 500 }}>
                  {storm.ensembleProbability}% agreement
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 10, fontSize: 11,
              color: '#60a5fa', textAlign: 'right' }}>
              Click to view track →
            </div>
          </div>
        ))}
      </div>
    );
  }

  const chartData = selectedStorm.track.map((t: any) => {
    const date = new Date(t.forecastTime);
    return {
      ...t,
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      band: [Math.max(0, t.windKnots - 15), t.windKnotsMax]
    };
  });

  return (
    <div style={{ padding: '16px', color: 'white' }}>
      <button 
        onClick={() => setSelectedStorm(null)}
        style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        ← Back to storms
      </button>

      {/* Header */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600 }}>{selectedStorm.name}</h2>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {selectedStorm.currentLat.toFixed(1)}°N, {selectedStorm.currentLon.toFixed(1)}°E
            </div>
          </div>
          <div style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
            {selectedStorm.peakCategory}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Min Pressure</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedStorm.currentPressure} hPa</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Max Wind</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedStorm.peakWindKnots} kts</div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
          Ensemble Agreement: {selectedStorm.ensembleProbability}%
        </div>
      </div>

      {/* Chart 1: Max Wind Speed */}
      <h3 style={{ fontSize: 13, color: '#60a5fa', fontStyle: 'italic', marginBottom: 8 }}>Max Wind Speed (knots)</h3>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 16px 16px 0', height: 250, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="displayDate" stroke="#64748b" fontSize={10} tickMargin={10} />
            <YAxis stroke="#64748b" fontSize={10} domain={[0, 160]} orientation="right" />
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: 'white', fontSize: 12 }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <ReferenceLine y={34} stroke="#475569" strokeDasharray="3 3" label={{ value: 'TS', position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
            <ReferenceLine y={64} stroke="#475569" strokeDasharray="3 3" label={{ value: 'Cat 1', position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
            <ReferenceLine y={83} stroke="#475569" strokeDasharray="3 3" label={{ value: 'Cat 2', position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
            <ReferenceLine y={96} stroke="#475569" strokeDasharray="3 3" label={{ value: 'Cat 3', position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
            <ReferenceLine y={113} stroke="#475569" strokeDasharray="3 3" label={{ value: 'Cat 4', position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
            <ReferenceLine y={137} stroke="#475569" strokeDasharray="3 3" label={{ value: 'Cat 5', position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
            <ReferenceLine x={chartData.find((d: any) => d.hours === leadHours)?.displayDate} stroke="#2563eb" strokeWidth={2} />
            <Area type="monotone" dataKey="band" fill="#93c5fd" fillOpacity={0.25} stroke="none" />
            <Line type="monotone" dataKey="windKnots" name="Mean Wind" stroke="#2563eb" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
