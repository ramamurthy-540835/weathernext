'use client';

import React, { useEffect, useState } from 'react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function ForecastDays15() {
  const { selectedLat, selectedLon, initDate, initHour } = useWeatherStore();
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedLat || !selectedLon || !initDate) return;

    const fetchForecast = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/forecast?lat=${selectedLat}&lon=${selectedLon}&initDate=${initDate}&initHour=${initHour}&maxHours=360`
        );
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        setForecast(data);
      } catch (e) {
        console.error('Forecast fetch error:', e);
        setForecast(null);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [selectedLat, selectedLon, initDate, initHour]);

  if (!forecast) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
        {loading ? 'Loading 15-day forecast...' : 'Select a location'}
      </div>
    );
  }

  // Group by days
  const dayGroups = new Map<number, any[]>();
  forecast.timeseries?.forEach((ts: any) => {
    const day = ts.forecastDay;
    if (!dayGroups.has(day)) dayGroups.set(day, []);
    dayGroups.get(day)?.push(ts);
  });

  const days = Array.from(dayGroups.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(0, 15);

  const getConfidenceColor = (confidenceLevel: string) => {
    switch (confidenceLevel) {
      case 'HIGH':
        return { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#86efac', label: '✓ HIGH' };
      case 'MODERATE':
        return { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#fdba74', label: '~ MODERATE' };
      case 'LOW-MODERATE':
        return { bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c', text: '#fbbf24', label: '⚠ MODERATE' };
      case 'LOW':
        return { bg: 'rgba(96, 165, 250, 0.15)', border: '#60a5fa', text: '#93c5fd', label: '~ TREND' };
      default:
        return { bg: 'rgba(96, 165, 250, 0.15)', border: '#60a5fa', text: '#93c5fd', label: 'MONITOR' };
    }
  };

  return (
    <div style={{ padding: 16, background: '#111827', color: 'white' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Calendar size={18} style={{ color: '#3b82f6' }} />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          15-Day Forecast (WeatherNext 2.0 Ensemble)
        </h3>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#9ca3af' }}>
          64 Members | All Confidence Levels
        </div>
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginBottom: 16 }}>
        {days.map(([dayNum, dayData]) => {
          const initTime = new Date(`${initDate}T${String(initHour).padStart(2, '0')}:00:00Z`);
          const dayDate = new Date(initTime);
          dayDate.setUTCDate(dayDate.getUTCDate() + dayNum - 1);
          const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

          // Get average confidence for the day
          const confidenceLevel = dayData[0]?.confidenceLevel || 'LOW';
          const confColor = getConfidenceColor(confidenceLevel);

          // Get temp range
          const temps = dayData.map((d: any) => d.tempC?.mean || 0).filter((t: number) => t > 0);
          const minTemp = Math.min(...temps);
          const maxTemp = Math.max(...temps);

          // Get rain
          const maxRain = Math.max(...dayData.map((d: any) => d.rainMm?.p90 || 0));

          return (
            <div
              key={dayNum}
              style={{
                background: confColor.bg,
                border: `2px solid ${confColor.border}`,
                borderRadius: 8,
                padding: 10,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-4px)';
                el.style.boxShadow = `0 8px 16px rgba(59, 130, 246, 0.2)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
              }}
            >
              {/* Date */}
              <div style={{ fontSize: 11, fontWeight: 600, color: confColor.text, marginBottom: 6 }}>
                Day {dayNum}
              </div>
              <div style={{ fontSize: 10, color: '#cbd5e1', marginBottom: 8 }}>
                {dayName}
              </div>

              {/* Confidence Badge */}
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                background: confColor.border,
                color: confColor.bg === 'rgba(34, 197, 94, 0.15)' ? '#000' : '#fff',
                padding: '2px 6px',
                borderRadius: 4,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                {confColor.label}
              </div>

              {/* Temperature */}
              <div style={{ fontSize: 11, color: '#f1f5f9', marginBottom: 4 }}>
                🌡️ {minTemp.toFixed(0)}–{maxTemp.toFixed(0)}°C
              </div>

              {/* Rain */}
              {maxRain > 0 && (
                <div style={{ fontSize: 11, color: '#3b82f6', marginBottom: 4 }}>
                  💧 {maxRain.toFixed(1)}mm
                </div>
              )}

              {/* Confidence Meter */}
              <div style={{
                width: '100%',
                height: 4,
                background: '#1f2937',
                borderRadius: 2,
                overflow: 'hidden',
                marginTop: 8,
              }}>
                <div style={{
                  height: '100%',
                  background: confColor.border,
                  width: confidenceLevel === 'HIGH' ? '100%' : confidenceLevel === 'MODERATE' ? '75%' : confidenceLevel === 'LOW-MODERATE' ? '50%' : '35%',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ background: '#1f2937', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
          Confidence Levels:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10, color: '#cbd5e1' }}>
          <div>✓ HIGH: Days 1-3 (Use for decisions)</div>
          <div>~ MODERATE: Days 4-5 (Plan with care)</div>
          <div>⚠ MODERATE: Days 6-10 (Trends only)</div>
          <div>~ TREND: Days 11-15 (Long-term)</div>
        </div>
      </div>

      {/* Info Box */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 10 }}>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#d1d5db' }}>
          <AlertCircle size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
          <div>
            All confidence levels are shown — click days to see detailed ensemble spread (P10, P50, P90) and member distribution
          </div>
        </div>
      </div>
    </div>
  );
}
