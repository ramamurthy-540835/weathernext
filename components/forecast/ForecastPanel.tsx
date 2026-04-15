'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Sparkles, Loader2, Download, ClipboardList } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea,
  ResponsiveContainer
} from 'recharts';
import { useWeatherStore } from '../../store/useWeatherStore';
import { getAccuracyLabel, getErrorBand } from '../../lib/accuracy';
import ForecastDays15 from '../ForecastDays15';

interface ForecastData {
  location: { lat: number; lon: number };
  initDate: string;
  timeseries: Array<{
    forecastTime: string;
    hours: number;
    tempC: { mean: number; spread: number };
    rainMm: { mean: number; p90: number };
    windSpeed: { mean: number; max: number };
    pressureHpa: number;
  }>;
}

export default function ForecastPanel() {
  const { selectedLat, selectedLon, initDate, initHour, setLeadHours, leadHours, activeVariable, isLatestInit, goToLatestInit } = useWeatherStore();
  
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showDownloadDrawer, setShowDownloadDrawer] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [briefing, setBriefing] = useState<any>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const fullTimeseries = useRef<any[]>([]);

  useEffect(() => {
    if (selectedLat === null || selectedLon === null) {
      setData(null);
      setAiSummary('');
      setBriefing(null);
      fullTimeseries.current = [];
      return;
    }

    const fetchForecast = async () => {
      setLoading(true);
      setAiSummary('');
      setBriefing(null);
      try {
        // Fetch 15-day forecast (360 hours)
        const res = await fetch(`/api/forecast?lat=${selectedLat}&lon=${selectedLon}&initDate=${initDate}&initHour=${initHour}&maxHours=360`);
        if (!res.ok) {
          console.error('Forecast API error:', res.status, res.statusText);
          throw new Error(`Failed to fetch forecast: ${res.status}`);
        }
        const json = await res.json();
        if (!json.timeseries || json.timeseries.length === 0) {
          throw new Error('No forecast data returned');
        }
        setData(json);
        fullTimeseries.current = json.timeseries.map((t: any) => ({
          ...t,
          tempMean: t.tempC.mean,
          tempMin: t.tempC.mean - t.tempC.spread,
          tempMax: t.tempC.mean + t.tempC.spread,
          rainMean: t.rainMm.mean,
          windMean: t.windSpeed.mean,
          windMax: t.windSpeed.max,
          pressure: t.pressureHpa
        }));
      } catch (error) {
        console.error('Forecast fetch error:', error);
        setData(null);
        // Optionally set error state to display to user
        if (error instanceof Error) {
          console.error('Details:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [selectedLat, selectedLon, initDate, initHour]);

  useEffect(() => {
    const chartMap: Record<string, string> = {
      temperature: 'chart-temp',
      rain: 'chart-rain', 
      wind: 'chart-wind',
      pressure: 'chart-pressure',
    };
    const el = document.getElementById(chartMap[activeVariable]);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeVariable]);

  const displayData = useMemo(() => {
    if (!fullTimeseries.current.length) return [];
    const windowStart = Math.max(0, leadHours - 24);
    const windowEnd = Math.min(120, leadHours + 24);
    return fullTimeseries.current.filter(
      d => d.hours >= windowStart && d.hours <= windowEnd
    );
  }, [leadHours, fullTimeseries.current]);

  const dailySummary = useMemo(() => {
    if (!data?.timeseries) return [];
    const days: any[] = [];
    for (let h = 24; h <= 120; h += 24) {
      const row = fullTimeseries.current.find((t: any) => t.hours === h);
      if (row) days.push({
        label: h === 24 ? 'Tomorrow' : 
               new Date(Date.now() + h * 3600000)
                 .toLocaleDateString('en-GB', { weekday: 'short' }),
        hours: h,
        temp: row.tempMean?.toFixed(0),
        rain: row.rainMean?.toFixed(1),
        wind: row.windMean?.toFixed(0),
        icon: row.rainMean > 5 ? '🌧️' : 
              row.rainMean > 1 ? '🌦️' :
              row.windMean > 15 ? '💨' :
              row.tempMean > 38 ? '🌡️' : '☀️',
      });
    }
    return days;
  }, [data]);

  const handleGenerateSummary = async () => {
    if (!data) return;
    setIsGeneratingAI(true);
    setAiSummary('');

    try {
      const res = await fetch('/api/gemini-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: selectedLat,
          lon: selectedLon,
          forecastData: data.timeseries
        })
      });

      const json = await res.json();
      setAiSummary(json.summary || 'No summary generated.');
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      setAiSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!data) return;
    setIsGeneratingBrief(true);
    setBriefing(null);

    try {
      const res = await fetch('/api/gemini-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: selectedLat,
          lon: selectedLon,
          forecastData: data.timeseries,
          sector: 'disaster_management'
        })
      });

      const json = await res.json();
      setBriefing(json);
    } catch (error) {
      console.error('Failed to generate brief:', error);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const locationName = `${selectedLat?.toFixed(2)}°N, ${selectedLon?.toFixed(2)}°E`;
  const getHeatStressScore = (temp: number) => Math.max(0, temp - 25); // Simple fallback

  const downloadCSV = () => {
    if (!data) return;
    const headers = [
      'forecast_time', 'lead_hours', 'temp_c_mean', 'temp_c_spread',
      'rain_mm_mean', 'rain_mm_p90', 'wind_speed_mean', 'wind_speed_max',
      'pressure_hpa', 'heat_stress_score', 'accuracy_score'
    ];
    
    const rows = data.timeseries.map(t => [
      t.forecastTime,
      t.hours,
      t.tempC?.mean?.toFixed(2),
      t.tempC?.spread?.toFixed(2),
      t.rainMm?.mean?.toFixed(2),
      t.rainMm?.p90?.toFixed(2),
      t.windSpeed?.mean?.toFixed(2),
      t.windSpeed?.max?.toFixed(2),
      t.pressureHpa?.toFixed(1),
      getHeatStressScore(t.tempC?.mean).toFixed(0),
      getAccuracyLabel(t.hours, 'temperature').score
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weathernext_${selectedLat}_${selectedLon}_${initDate}_${initHour}UTC.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!data) return;
    const exportData = {
      meta: {
        source: 'Google DeepMind WeatherNext 2',
        bigquery_table: 'ctoteam.weathernext_2.weathernext_2_0_0',
        init_time: `${initDate} ${initHour}:00 UTC`,
        location: { name: locationName, lat: selectedLat, lon: selectedLon },
        generated_at: new Date().toISOString(),
        license: 'CC BY 4.0 (historic data)',
        citation: 'WeatherNext 2, Google DeepMind, https://deepmind.google/science/weathernext/'
      },
      forecast: data.timeseries,
      ensemble: [], // Ensemble data would be fetched separately if needed
      alerts: [],
      climate_scores: {}
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weathernext_${selectedLat}_${selectedLon}_${initDate}.json`;
    a.click();
  };

  const downloadPDF = async () => {
    if (!data) return;
    if (!aiSummary) await handleGenerateSummary();
    
    const currentPoint = fullTimeseries.current.find(d => d.hours === leadHours) || fullTimeseries.current[0];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WeatherNext Forecast · ${locationName} · ${initDate}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #0f172a; font-size: 20px; }
          h2 { color: #1e40af; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin: 16px 0; }
          .metric { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #0f172a; }
          .metric-label { font-size: 11px; color: #64748b; margin-top: 4px; }
          .alert { padding: 10px; border-radius: 6px; margin: 6px 0; font-size: 13px; }
          .alert-danger { background: #fef2f2; border: 1px solid #fecaca; }
          .alert-warning { background: #fffbeb; border: 1px solid #fde68a; }
          .summary { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 12px 0; }
          th { background: #f1f5f9; padding: 6px 8px; text-align: left; }
          td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:center;margin-bottom:20px">
          <button onclick="window.print()" style="padding:10px 24px;background:#1d4ed8;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px">
            Print / Save as PDF
          </button>
        </div>
        
        <h1>WeatherNext AI Forecast Briefing</h1>
        <div class="meta">
          Location: ${locationName} |
          Init: ${initDate} ${initHour}:00 UTC |
          Model: WeatherNext 2 (Google DeepMind) |
          Generated: ${new Date().toISOString()}
        </div>

        <h2>Key Metrics at +${leadHours}h Lead Time</h2>
        <div class="grid">
          <div class="metric">
            <div class="metric-value">${currentPoint?.tempMean?.toFixed(1)}°C</div>
            <div class="metric-label">Temperature</div>
          </div>
          <div class="metric">
            <div class="metric-value">${currentPoint?.rainMean?.toFixed(1)}mm</div>
            <div class="metric-label">Precipitation</div>
          </div>
          <div class="metric">
            <div class="metric-value">${currentPoint?.windMean?.toFixed(1)} m/s</div>
            <div class="metric-label">Wind Speed</div>
          </div>
          <div class="metric">
            <div class="metric-value">${currentPoint?.pressure?.toFixed(0)} hPa</div>
            <div class="metric-label">Pressure</div>
          </div>
        </div>

        <h2>AI Forecast Summary</h2>
        <div class="summary">${aiSummary || 'No summary generated'}</div>

        <h2>5-Day Forecast Table</h2>
        <table>
          <thead>
            <tr>
              <th>Time (UTC)</th><th>Lead</th><th>Temp (°C)</th>
              <th>Rain (mm)</th><th>Wind (m/s)</th><th>Pressure (hPa)</th><th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            ${data.timeseries?.filter((_,i) => i % 2 === 0).map(t => `
              <tr>
                <td>${new Date(t.forecastTime).toLocaleString()}</td>
                <td>+${t.hours}h</td>
                <td>${t.tempC?.mean?.toFixed(1)} ±${t.tempC?.spread?.toFixed(1)}</td>
                <td>${t.rainMm?.mean?.toFixed(1)}</td>
                <td>${t.windSpeed?.mean?.toFixed(1)}</td>
                <td>${t.pressureHpa?.toFixed(0)}</td>
                <td>${getAccuracyLabel(t.hours, 'temperature').label}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Data source: Google DeepMind WeatherNext 2 · BigQuery: ctoteam.weathernext_2.weathernext_2_0_0
          <br/>License: CC BY 4.0 (historic forecasts) · GDM Real-Time Terms (recent forecasts)
          <br/>Citation: WeatherNext 2, Google DeepMind, https://deepmind.google/science/weathernext/
          <br/>Generated by WeatherNext Dashboard
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyShareLink = () => {
    const params = new URLSearchParams({
      lat: String(selectedLat),
      lon: String(selectedLon),
      initDate,
      initHour: String(initHour),
      leadHours: String(leadHours),
      variable: activeVariable,
      location: locationName
    });
    const url = `${window.location.origin}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const downloadBriefingPDF = () => window.print();
  
  const copyBriefingText = () => {
    if (!briefing) return;
    const text = `WeatherNext AI Briefing\n${initDate} ${initHour}:00 UTC\n\n${briefing.summary}\n\nKey Risks:\n${briefing.keyRisks?.join('\n')}\n\nActions:\n${briefing.recommendedActions?.join('\n')}`;
    navigator.clipboard.writeText(text);
  };
  
  const shareToWhatsApp = () => {
    if (!briefing) return;
    const text = encodeURIComponent(`🌤️ WeatherNext AI Alert\n${initDate}\n\n${briefing.summary?.split('\n\n')[0]}\n\nKey risks: ${briefing.keyRisks?.join(', ')}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (selectedLat === null || selectedLon === null) return null;

  const currentPoint = fullTimeseries.current.find(d => d.hours === leadHours) || fullTimeseries.current[0];

  const handleChartClick = (e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      setLeadHours(e.activePayload[0].payload.hours);
    }
  };

  const CustomTooltip = ({ active, payload, label, variable, unit }: any) => {
    if (active && payload && payload.length) {
      const { rmse } = getErrorBand(label, variable, 0);
      return (
        <div style={{ background: '#1f2937', border: '1px solid #374151', padding: '8px', borderRadius: '4px', color: 'white', fontSize: '12px', zIndex: 100 }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>+{label}h</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color, margin: '2px 0' }}>
              {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            </p>
          ))}
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, borderTop: '1px solid #374151', paddingTop: 4 }}>
            Typical model error at +{label}h: ±{rmse}{unit}
            <br/>Source: WeatherNext 2 · Google DeepMind
          </div>
        </div>
      );
    }
    return null;
  };

  const renderAccuracyBadge = (variable: string, unit: string) => {
    const accuracy = getAccuracyLabel(leadHours, variable);
    const { rmse } = getErrorBand(leadHours, variable, 0);
    const dots = Array.from({ length: 5 }).map((_, i) => i < Math.round(accuracy.score / 20) ? '●' : '○').join('');
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
        <span style={{ fontSize: 11, color: accuracy.color, whiteSpace: 'nowrap' }}>
          {dots} {accuracy.label}
        </span>
        <span style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>
          ±{rmse}{unit} at +{leadHours}h
        </span>
      </div>
    );
  };

  const dlBtnStyle = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
    padding: '10px', color: 'white', fontSize: '13px', textAlign: 'left' as const,
    cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, gap: '4px'
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', color: '#e5e7eb' }}>
      
      {/* Header Toggles */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 0', gap: 8 }}>
        <button
          onClick={handleGenerateBrief}
          disabled={isGeneratingBrief}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e3a8a', border: '1px solid #1e40af', borderRadius: '6px', padding: '4px 10px', color: 'white', fontSize: '12px', cursor: isGeneratingBrief ? 'not-allowed' : 'pointer', opacity: isGeneratingBrief ? 0.7 : 1 }}
        >
          {isGeneratingBrief ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
          Decision Brief
        </button>
        <button
          onClick={() => setShowDownloadDrawer(!showDownloadDrawer)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showDownloadDrawer ? '#1e293b' : 'transparent', border: '1px solid #334155', borderRadius: '6px', padding: '4px 10px', color: '#9ca3af', fontSize: '12px', cursor: 'pointer' }}
        >
          <Download size={14} /> Export Data
        </button>
      </div>

      {/* 15-Day Forecast with Confidence Visualization */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ForecastDays15 />
      </div>

      {/* Decision Brief Panel */}
      {briefing && (
        <div style={{ margin: '12px 16px', background: '#0a1628',
          border: '1px solid #1e3a8a', borderRadius: 12, overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ background: '#0f2044', padding: '12px 16px',
            borderBottom: '1px solid #1e3a8a',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✦</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>
                WeatherNext AI Briefing
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, 
                background: briefing.confidence === 'High' ? '#064e3b' : 
                            briefing.confidence === 'Moderate' ? '#451a03' : '#450a0a',
                color: briefing.confidence === 'High' ? '#6ee7b7' : 
                       briefing.confidence === 'Moderate' ? '#fbbf24' : '#f87171',
                padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                {briefing.confidence} confidence
              </span>
              <span style={{ fontSize: 10, color: '#6b7280' }}>
                Gemini · {initDate} {initHour}:00 UTC
              </span>
            </div>
          </div>

          {/* Summary paragraphs */}
          <div style={{ padding: '14px 16px' }}>
            {briefing.summary?.split('\n\n').map((para: string, i: number) => (
              <p key={i} style={{ fontSize: 13, color: '#cbd5e1', 
                lineHeight: 1.75, margin: i === 0 ? '0 0 12px' : '12px 0' }}>
                {para}
              </p>
            ))}
          </div>

          {/* Key risks */}
          {briefing.keyRisks?.length > 0 && (
            <div style={{ padding: '0 16px 14px' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                Key risks
              </p>
              {briefing.keyRisks.map((risk: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start',
                  gap: 8, marginBottom: 6 }}>
                  <span style={{ color: '#f87171', fontSize: 12, marginTop: 1,
                    flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                    {risk}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recommended actions */}
          {briefing.recommendedActions?.length > 0 && (
            <div style={{ padding: '0 16px 14px',
              borderTop: '1px solid #1e3a8a', marginTop: 4 }}>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                margin: '12px 0 8px' }}>
                Recommended actions
              </p>
              {briefing.recommendedActions.map((action: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start',
                  gap: 8, marginBottom: 6 }}>
                  <span style={{ color: '#34d399', fontSize: 12, marginTop: 1,
                    flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                    {action}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #1e3a8a',
            display: 'flex', gap: 8 }}>
            <button onClick={downloadBriefingPDF}
              style={{ flex: 1, padding: '7px 0', background: '#1e3a8a',
                border: 'none', borderRadius: 6, color: '#93c5fd',
                fontSize: 12, cursor: 'pointer' }}>
              📄 Download PDF
            </button>
            <button onClick={copyBriefingText}
              style={{ flex: 1, padding: '7px 0', background: 'transparent',
                border: '1px solid #1e3a8a', borderRadius: 6, color: '#64748b',
                fontSize: 12, cursor: 'pointer' }}>
              📋 Copy text
            </button>
            <button onClick={shareToWhatsApp}
              style={{ flex: 1, padding: '7px 0', background: '#064e3b',
                border: 'none', borderRadius: 6, color: '#6ee7b7',
                fontSize: 12, cursor: 'pointer' }}>
              📱 WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Download Drawer */}
      {showDownloadDrawer && data && (
        <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '16px', margin: '0 16px 16px', borderRadius: '8px' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Export WeatherNext Data
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={downloadCSV} style={dlBtnStyle}>
              📊 CSV — Timeseries
              <span style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>All variables · {data.timeseries.length} rows</span>
            </button>
            <button onClick={downloadJSON} style={dlBtnStyle}>
              {'{ }'} JSON — Full data
              <span style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Includes ensemble members</span>
            </button>
            <button onClick={downloadPDF} style={dlBtnStyle}>
              📄 PDF — Briefing
              <span style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Charts + AI summary</span>
            </button>
            <button onClick={copyShareLink} style={dlBtnStyle}>
              🔗 {showCopied ? 'Copied!' : 'Share Link'}
              <span style={{ fontSize: 10, color: '#9ca3af', display: 'block' }}>Copy URL with state</span>
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#6b7280' }}>
            Location: {locationName}
            <br/>Init: {initDate} {initHour}:00 UTC · Model: WeatherNext 2
            <br/>License: CC BY 4.0 (historic) · GDM Terms (real-time)
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : data ? (
        <>
          {/* 5-Day Summary Cards */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid #1e293b' }}>
            {dailySummary.map(day => (
              <div key={day.hours} style={{
                flex: '0 0 auto', minWidth: 72,
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setLeadHours(day.hours)}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                  {day.label}
                </div>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{day.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
                  {day.temp}°C
                </div>
                <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 2 }}>
                  {day.rain}mm
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                  {day.wind}m/s
                </div>
              </div>
            ))}
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '16px' }}>
            <div style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid #374151' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temp +{leadHours}h</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: 'white' }}>{currentPoint?.tempMean?.toFixed(1) || 0}<span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>°C</span></div>
            </div>
            <div style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid #374151' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rain +{leadHours}h</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: 'white' }}>{currentPoint?.rainMean?.toFixed(1) || 0}<span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>mm</span></div>
            </div>
            <div style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid #374151' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wind +{leadHours}h</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: 'white' }}>{currentPoint?.windMean?.toFixed(1) || 0}<span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>m/s</span></div>
            </div>
            <div style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid #374151' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pressure</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: 'white' }}>{currentPoint?.pressure?.toFixed(0) || 0}<span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>hPa</span></div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ padding: '0 16px 16px' }}>
            
            {!isLatestInit() && (
              <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 6, padding: '6px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>📅</span>
                <span style={{ fontSize: 12, color: '#a5b4fc' }}>
                  Viewing historical forecast from {initDate} {String(initHour).padStart(2, '0')}:00 UTC
                </span>
                <button onClick={goToLatestInit} style={{ marginLeft: 'auto', fontSize: 11, background: '#4338ca', border: 'none', borderRadius: 4, color: 'white', padding: '2px 8px', cursor: 'pointer' }}>
                  Jump to latest →
                </button>
              </div>
            )}

            <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', marginBottom: '4px', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temperature (°C)</h3>
            {renderAccuracyBadge('temperature', '°C')}
            <div id="chart-temp" style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid', borderColor: activeVariable === 'temperature' ? '#f59e0b' : '#374151', borderLeft: activeVariable === 'temperature' ? '3px solid #f59e0b' : '1px solid #374151', marginBottom: '8px', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData} syncId="forecast" onClick={handleChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="hours" stroke="#6b7280" fontSize={10} tickFormatter={(v) => `+${v}h`} />
                  <YAxis stroke="#6b7280" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip variable="temperature" unit="°C" />} />
                  <ReferenceArea x1={0} x2={leadHours} fill="#22c55e" fillOpacity={0.03} />
                  <ReferenceArea x1={72} x2={120} fill="#ef4444" fillOpacity={0.03} />
                  <ReferenceLine x={72} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} label={{ value: '+72h', fill: '#f97316', fontSize: 9, position: 'insideTopLeft' }} />
                  <ReferenceLine x={leadHours} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" label={{ value: `+${leadHours}h`, fill: '#60a5fa', fontSize: 10, position: 'top' }} />
                  <Area type="monotone" dataKey="tempMax" stroke="none" fill="rgba(245,158,11,0.15)" />
                  <Area type="monotone" dataKey="tempMin" stroke="none" fill="rgba(245,158,11,0.15)" />
                  <Line type="monotone" dataKey="tempMean" name="Mean Temp" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', marginBottom: '4px', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precipitation (mm/6h)</h3>
            {renderAccuracyBadge('rain', 'mm')}
            <div id="chart-rain" style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid', borderColor: activeVariable === 'rain' ? '#3b82f6' : '#374151', borderLeft: activeVariable === 'rain' ? '3px solid #3b82f6' : '1px solid #374151', marginBottom: '8px', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData} syncId="forecast" onClick={handleChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="hours" stroke="#6b7280" fontSize={10} tickFormatter={(v) => `+${v}h`} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip content={<CustomTooltip variable="rain" unit="mm" />} />
                  <ReferenceArea x1={0} x2={leadHours} fill="#22c55e" fillOpacity={0.03} />
                  <ReferenceArea x1={72} x2={120} fill="#ef4444" fillOpacity={0.03} />
                  <ReferenceLine x={72} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} label={{ value: '+72h', fill: '#f97316', fontSize: 9, position: 'insideTopLeft' }} />
                  <ReferenceLine x={leadHours} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" label={{ value: `+${leadHours}h`, fill: '#60a5fa', fontSize: 10, position: 'top' }} />
                  <Bar dataKey="rainMean" name="Rain" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', marginBottom: '4px', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wind Speed (m/s)</h3>
            {renderAccuracyBadge('wind', 'm/s')}
            <div id="chart-wind" style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid', borderColor: activeVariable === 'wind' ? '#14b8a6' : '#374151', borderLeft: activeVariable === 'wind' ? '3px solid #14b8a6' : '1px solid #374151', marginBottom: '8px', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} syncId="forecast" onClick={handleChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="hours" stroke="#6b7280" fontSize={10} tickFormatter={(v) => `+${v}h`} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip content={<CustomTooltip variable="wind" unit="m/s" />} />
                  <ReferenceArea x1={0} x2={leadHours} fill="#22c55e" fillOpacity={0.03} />
                  <ReferenceArea x1={72} x2={120} fill="#ef4444" fillOpacity={0.03} />
                  <ReferenceLine x={72} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} label={{ value: '+72h', fill: '#f97316', fontSize: 9, position: 'insideTopLeft' }} />
                  <ReferenceLine x={leadHours} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" label={{ value: `+${leadHours}h`, fill: '#60a5fa', fontSize: 10, position: 'top' }} />
                  <Area type="monotone" dataKey="windMean" name="Mean Wind" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
                  <Line type="monotone" dataKey="windMax" name="Max Wind" stroke="#14b8a6" strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', marginBottom: '4px', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Surface Pressure (hPa)</h3>
            {renderAccuracyBadge('pressure', 'hPa')}
            <div id="chart-pressure" style={{ background: '#1f2937', borderRadius: '10px', padding: '12px', border: '1px solid', borderColor: activeVariable === 'pressure' ? '#a78bfa' : '#374151', borderLeft: activeVariable === 'pressure' ? '3px solid #a78bfa' : '1px solid #374151', marginBottom: '8px', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData} syncId="forecast" onClick={handleChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="hours" stroke="#6b7280" fontSize={10} tickFormatter={(v) => `+${v}h`} />
                  <YAxis stroke="#6b7280" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip variable="pressure" unit="hPa" />} />
                  <ReferenceArea x1={0} x2={leadHours} fill="#22c55e" fillOpacity={0.03} />
                  <ReferenceArea x1={72} x2={120} fill="#ef4444" fillOpacity={0.03} />
                  <ReferenceLine x={72} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} label={{ value: '+72h', fill: '#f97316', fontSize: 9, position: 'insideTopLeft' }} />
                  <ReferenceLine x={leadHours} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" label={{ value: `+${leadHours}h`, fill: '#60a5fa', fontSize: 10, position: 'top' }} />
                  <Line type="monotone" dataKey="pressure" name="Pressure" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Summary Section */}
          <button
            onClick={handleGenerateSummary}
            disabled={isGeneratingAI}
            style={{ margin: '0 16px 16px', width: 'calc(100% - 32px)', padding: '10px', background: '#1d4ed8', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 500, cursor: isGeneratingAI ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isGeneratingAI ? 0.7 : 1 }}
          >
            {isGeneratingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isGeneratingAI ? 'Analyzing Forecast...' : 'Generate Gemini Briefing'}
          </button>

          {aiSummary && (
            <div style={{ margin: '0 16px 16px', background: '#1f2937', border: '1px solid #374151', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {aiSummary}
              </div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280', paddingTop: '10px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>WeatherNext AI</span>
                <span>Gemini 3.1 Pro Preview · {initDate}</span>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
