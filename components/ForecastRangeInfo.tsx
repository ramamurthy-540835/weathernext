'use client';

import React from 'react';
import { FORECAST_CONFIG } from '@/lib/constants';
import { Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForecastRangeInfo() {
  return (
    <div style={{ background: '#111827', borderRadius: 12, padding: 16, color: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Calendar size={20} style={{ color: '#3b82f6' }} />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          15-Day WeatherNext 2.0 Forecast
        </h3>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Lead Time</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#3b82f6' }}>
            {FORECAST_CONFIG.MAX_LEAD_DAYS} Days
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
            {FORECAST_CONFIG.MAX_LEAD_HOURS} Hours
          </div>
        </div>

        <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Ensemble Members</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#10b981' }}>
            {FORECAST_CONFIG.ENSEMBLE_MEMBERS}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
            Probabilistic Forecasts
          </div>
        </div>
      </div>

      {/* Confidence by Day */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
          Forecast Confidence by Lead Time
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Days 1-3 */}
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 6, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <CheckCircle size={16} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#86efac' }}>Days 1-3 (0-72h)</span>
            </div>
            <div style={{ fontSize: 11, color: '#d1d5db' }}>
              ✓ HIGH Confidence — Use for critical decisions and immediate operations
            </div>
          </div>

          {/* Days 4-5 */}
          <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: 6, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TrendingUp size={16} style={{ color: '#f87171' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5' }}>Days 4-5 (72-120h)</span>
            </div>
            <div style={{ fontSize: 11, color: '#d1d5db' }}>
              ~ MODERATE Confidence — Useful for planning, monitor for changes
            </div>
          </div>

          {/* Days 6-10 */}
          <div style={{ background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.3)', borderRadius: 6, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <AlertCircle size={16} style={{ color: '#fb923c' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fdba74' }}>Days 6-10 (120-240h)</span>
            </div>
            <div style={{ fontSize: 11, color: '#d1d5db' }}>
              ⚠ LOW-MODERATE Confidence — Trends only, frequent updates expected
            </div>
          </div>

          {/* Days 11-15 */}
          <div style={{ background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: 6, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TrendingUp size={16} style={{ color: '#60a5fa', transform: 'rotate(180deg)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>Days 11-15 (240-360h)</span>
            </div>
            <div style={{ fontSize: 11, color: '#d1d5db' }}>
              ~ LOW Confidence — Broad patterns only, use for long-term planning
            </div>
          </div>
        </div>
      </div>

      {/* Percentiles */}
      <div style={{ background: '#1f2937', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
          Ensemble Percentile Coverage
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {[10, 25, 50, 75, 90].map(p => (
            <div key={p} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>P{p}</div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: p === 50 ? '#3b82f6' : p < 50 ? '#f87171' : '#22c55e',
                marginTop: 4
              }}>
                {p === 50 ? 'Median' : p < 50 ? 'Optimistic' : 'Pessimistic'}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
          P10 (10th) to P90 (90th) = 80% confidence band
        </div>
      </div>

      {/* Key Features */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
          🎯 What 15-Day Means for NCM
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#d1d5db', lineHeight: 1.6 }}>
          <li>Extended hazard tracking: cyclones, dust storms, heat waves</li>
          <li>Planning horizon for resource pre-positioning</li>
          <li>Confidence metrics guide when to act vs. when to monitor</li>
          <li>Automatic ensemble spread calculation at each time step</li>
          <li>P90 tail risk for worst-case scenario planning</li>
        </ul>
      </div>
    </div>
  );
}
