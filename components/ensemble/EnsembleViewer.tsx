'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, ReferenceArea, ReferenceLine
} from 'recharts';
import { useWeatherStore } from '../../store/useWeatherStore';
import { WeatherVariable } from '../../types/weather';
import { VARIABLE_COLORS, VARIABLE_LABELS, VARIABLE_UNITS } from '../../lib/constants';
import { Loader2, Activity } from 'lucide-react';

interface EnsembleMember {
  id: number;
  timeseries: Array<{
    hours: number;
    tempC: number;
    rainMm: number;
    windSpeed: number;
    pressureHpa: number;
  }>;
}

interface EnsembleData {
  members: EnsembleMember[];
}

export default function EnsembleViewer() {
  const { selectedLat, selectedLon, initDate, initHour, leadHours } = useWeatherStore();
  
  const [data, setData] = useState<EnsembleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeVar, setActiveVar] = useState<WeatherVariable>(WeatherVariable.TEMPERATURE);
  const [highlightedMember, setHighlightedMember] = useState<number | null>(null);
  const [showExtremes, setShowExtremes] = useState(false);

  useEffect(() => {
    if (selectedLat === null || selectedLon === null) return;

    const fetchEnsemble = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ensemble?lat=${selectedLat}&lon=${selectedLon}&initDate=${initDate}&initHour=${initHour}`);
        if (!res.ok) throw new Error('Failed to fetch ensemble');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnsemble();
  }, [selectedLat, selectedLon, initDate, initHour]);

  const getVarKey = (v: WeatherVariable) => {
    switch (v) {
      case WeatherVariable.TEMPERATURE: return 'tempC';
      case WeatherVariable.RAIN: return 'rainMm';
      case WeatherVariable.WIND: return 'windSpeed';
      case WeatherVariable.PRESSURE: return 'pressureHpa';
    }
  };

  const varKey = getVarKey(activeVar);
  const color = VARIABLE_COLORS[activeVar];

  const chartData = useMemo(() => {
    if (!data || !data.members.length) return [];

    const hoursMap = new Map<number, any>();

    data.members.forEach(member => {
      member.timeseries.forEach(t => {
        if (!hoursMap.has(t.hours)) {
          hoursMap.set(t.hours, { hours: t.hours, values: [] });
        }
        const hourData = hoursMap.get(t.hours);
        hourData[`m${member.id}`] = t[varKey];
        hourData.values.push(t[varKey]);
      });
    });

    return Array.from(hoursMap.values()).map(d => {
      d.values.sort((a: number, b: number) => a - b);
      const len = d.values.length;
      const mean = d.values.reduce((a: number, b: number) => a + b, 0) / len;
      const p10 = d.values[Math.floor(len * 0.1)];
      const p90 = d.values[Math.floor(len * 0.9)];
      const min = d.values[0];
      const max = d.values[len - 1];
      
      const variance = d.values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / len;
      const stddev = Math.sqrt(variance);

      return { ...d, mean, p10, p90, min, max, stddev };
    }).sort((a, b) => a.hours - b.hours);
  }, [data, varKey]);

  const histogramData = useMemo(() => {
    if (!chartData.length) return [];
    const currentHourData = chartData.find(d => d.hours === leadHours) || chartData[0];
    if (!currentHourData) return [];

    const values = currentHourData.values;
    const min = currentHourData.min;
    const max = currentHourData.max;
    const range = max - min;
    
    const binCount = 10;
    const binSize = range === 0 ? 1 : range / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      binStart: min + i * binSize,
      binEnd: min + (i + 1) * binSize,
      count: 0,
      label: `${(min + i * binSize).toFixed(1)}`
    }));

    values.forEach((v: number) => {
      let binIdx = Math.floor((v - min) / binSize);
      if (binIdx >= binCount) binIdx = binCount - 1;
      bins[binIdx].count++;
    });

    return bins;
  }, [chartData, leadHours]);

  const summary = useMemo(() => {
    if (!chartData.length) return { spread: 0, range: 0, confidence: 'High' };
    
    const peakHour = chartData.reduce((prev, current) => (prev.mean > current.mean) ? prev : current);
    const spread = peakHour.stddev;
    const range = peakHour.p90 - peakHour.p10;
    
    let confidence = 'High';
    if (activeVar === WeatherVariable.TEMPERATURE) {
      if (spread > 5) confidence = 'Low';
      else if (spread > 2) confidence = 'Moderate';
    } else if (activeVar === WeatherVariable.RAIN) {
      if (spread > 30) confidence = 'Low';
      else if (spread > 10) confidence = 'Moderate';
    }

    return { spread, range, confidence };
  }, [chartData, activeVar]);

  if (selectedLat === null || selectedLon === null) return null;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={16} color="#60a5fa" />
        64-Member Ensemble Spread
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {Object.values(WeatherVariable).map(v => (
          <button
            key={v}
            onClick={() => setActiveVar(v)}
            style={activeVar === v 
              ? { padding: '5px 14px', borderRadius: '20px', border: 'none', background: '#1d4ed8', color: 'white', fontSize: '12px', cursor: 'pointer' }
              : { padding: '5px 14px', borderRadius: '20px', border: '1px solid #374151', background: 'transparent', color: '#9ca3af', fontSize: '12px', cursor: 'pointer' }
            }
          >
            {VARIABLE_LABELS[v].split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '10px', border: '1px solid #374151', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spread (Peak)</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginTop: '4px' }}>±{summary.spread.toFixed(1)} {VARIABLE_UNITS[activeVar]}</div>
            </div>
            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '10px', border: '1px solid #374151', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P10 – P90 Range</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginTop: '4px' }}>{summary.range.toFixed(1)} {VARIABLE_UNITS[activeVar]}</div>
            </div>
            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '10px', border: '1px solid #374151', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: summary.confidence === 'High' ? '#4ade80' : summary.confidence === 'Moderate' ? '#fbbf24' : '#f87171' }}>
                {summary.confidence}
              </div>
            </div>
          </div>

          <div style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid #374151', marginBottom: '12px', height: '250px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowExtremes(!showExtremes)}
                style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid', borderColor: showExtremes ? '#6b7280' : '#374151', background: showExtremes ? '#374151' : 'transparent', color: showExtremes ? 'white' : '#9ca3af', cursor: 'pointer' }}
              >
                Show Extremes
              </button>
              {highlightedMember !== null && (
                <div style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Member {highlightedMember}
                  <button onClick={() => setHighlightedMember(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>×</button>
                </div>
              )}
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="hours" stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `+${v}h`} />
                <YAxis stroke="#9ca3af" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: '12px' }}
                  labelFormatter={(l) => `+${l}h`}
                />
                
                <Area type="monotone" dataKey="p90" stroke="none" fill={color} fillOpacity={0.1} />
                <Area type="monotone" dataKey="p10" stroke="none" fill="#1f2937" fillOpacity={1} />
                
                {data.members.map(m => {
                  const isHighlighted = highlightedMember === m.id;
                  const isMin = showExtremes && m.id === data.members[0].id;
                  const isMax = showExtremes && m.id === data.members[data.members.length - 1].id;
                  
                  let strokeColor = color;
                  let strokeWidth = 1;
                  let opacity = 0.12;

                  if (isHighlighted) {
                    strokeColor = '#818cf8';
                    strokeWidth = 2;
                    opacity = 1;
                  } else if (isMin) {
                    strokeColor = '#3b82f6';
                    strokeWidth = 2;
                    opacity = 0.8;
                  } else if (isMax) {
                    strokeColor = '#ef4444';
                    strokeWidth = 2;
                    opacity = 0.8;
                  }

                  return (
                    <Line 
                      key={m.id} 
                      type="monotone" 
                      dataKey={`m${m.id}`} 
                      stroke={strokeColor} 
                      strokeWidth={strokeWidth} 
                      strokeOpacity={opacity} 
                      dot={false} 
                      activeDot={{ r: 4, onClick: () => setHighlightedMember(m.id) }}
                      isAnimationActive={false}
                    />
                  );
                })}

                <Line type="monotone" dataKey="mean" name="Ensemble Mean" stroke="#ffffff" strokeWidth={2} dot={false} />
                <ReferenceLine x={leadHours} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" label={{ value: `+${leadHours}h`, fill: '#60a5fa', fontSize: 10, position: 'top' }} />
                <ReferenceArea x1={leadHours - 1} x2={leadHours + 1} fill="#4b5563" fillOpacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid #374151', height: '150px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', textAlign: 'center' }}>Distribution at +{leadHours}h</div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" stroke="#9ca3af" fontSize={9} />
                  <Tooltip cursor={{ fill: '#374151' }} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', fontSize: '10px', color: 'white' }} />
                  <Bar dataKey="count" fill={color} radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
