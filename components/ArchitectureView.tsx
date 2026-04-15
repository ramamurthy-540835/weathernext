'use client';

import React, { useState } from 'react';
import { ChevronDown, Database, Cloud, Zap, AlertCircle, MapPin } from 'lucide-react';

export default function ArchitectureView() {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const Section = ({ title, icon: Icon, children }: any) => (
    <div style={{ marginBottom: 20, border: '1px solid #374151', borderRadius: 12, background: '#111827', overflow: 'hidden' }}>
      <button
        onClick={() => setExpandedSection(expandedSection === title ? null : title)}
        style={{
          width: '100%',
          padding: '16px',
          background: '#1f2937',
          border: 'none',
          borderBottom: expandedSection === title ? '1px solid #374151' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#e5e7eb',
          fontWeight: 600,
          fontSize: 14
        }}
      >
        <Icon size={18} style={{ color: '#3b82f6' }} />
        {title}
        <ChevronDown size={16} style={{ marginLeft: 'auto', transform: expandedSection === title ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>
      {expandedSection === title && (
        <div style={{ padding: 16, color: '#d1d5db', fontSize: 13, lineHeight: 1.7 }}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px', background: '#030712', color: 'white', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>WeatherNext 2 Architecture</h2>
      <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 20 }}>Global AI-Powered Weather Forecasting System</p>

      <Section title="System Overview" icon={Cloud}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#3b82f6', fontWeight: 600, marginBottom: 8 }}>Input Layer</div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
              <li>Satellite observations</li>
              <li>Weather stations (global network)</li>
              <li>Radar systems</li>
              <li>Ocean buoys</li>
            </ul>
          </div>
          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 8 }}>Processing</div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
              <li>Blend observations with past patterns</li>
              <li>Generate 64 different forecasts</li>
              <li>AI-powered weather model</li>
              <li>Results in ~30 seconds</li>
            </ul>
          </div>
        </div>
        <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
          <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 8 }}>Output</div>
          <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
            <li>Forecasts for the entire world</li>
            <li>Up to 15 days in advance</li>
            <li>Updates every 6 hours</li>
            <li>Temperature, wind, rain, pressure, and more</li>
          </ul>
        </div>
      </Section>

      <Section title="64-Member Ensemble" icon={Zap}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#60a5fa', fontWeight: 600, marginBottom: 8 }}>What is it?</div>
          <p style={{ margin: '0 0 12px 0' }}>
            64 independent forecasts, each starting with slightly different initial conditions (within observation error bounds).
            Collectively they form a probability distribution.
          </p>
        </div>

        <div style={{ background: '#1f2937', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ color: '#34d399', fontWeight: 600, marginBottom: 8 }}>Ensemble Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            <div>
              <strong>Mean:</strong> Average of 64 members
            </div>
            <div>
              <strong>P10:</strong> 10th percentile (optimistic)
            </div>
            <div>
              <strong>P50:</strong> Median (most likely)
            </div>
            <div>
              <strong>P90:</strong> 90th percentile (worst case)
            </div>
            <div>
              <strong>Spread:</strong> P90 - P10 (uncertainty)
            </div>
            <div>
              <strong>Member Count:</strong> How many exceed threshold
            </div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: 12, borderRadius: 8 }}>
          <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>↓ How Decision Makers Use It</div>
          <p style={{ margin: 0, fontSize: 12 }}>
            Instead of one forecast: "30°C tomorrow"<br/>
            Multiple forecasts: "Average 30°C, but likely stays 28-32°C, 12 of 64 predictions show extreme heat"
          </p>
        </div>
      </Section>

      <Section title="Data Pipeline" icon={Database}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#60a5fa', fontWeight: 600, marginBottom: 6 }}>1. Data Collection (Every 6 hours)</div>
            <p style={{ margin: 0, fontSize: 12 }}>Gather latest weather observations from around the world</p>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#34d399', fontWeight: 600, marginBottom: 6 }}>2. Generate Forecasts (~30 seconds)</div>
            <p style={{ margin: 0, fontSize: 12 }}>Create 64 different weather predictions up to 15 days ahead</p>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>3. Store Data</div>
            <p style={{ margin: 0, fontSize: 12 }}>Save all forecast data for retrieval and analysis</p>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#f87171', fontWeight: 600, marginBottom: 6 }}>4. Display on Dashboard</div>
            <p style={{ margin: 0, fontSize: 12 }}>Show forecasts, statistics, and confidence levels to users</p>
          </div>

          <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#d8b4fe', fontWeight: 600, marginBottom: 6 }}>5. Generate Alerts</div>
            <p style={{ margin: 0, fontSize: 12 }}>Alert users about significant or dangerous weather coming</p>
          </div>
        </div>
      </Section>

      <Section title="Architecture Diagram" icon={Cloud}>
        <svg viewBox="0 0 800 500" style={{ width: '100%', height: 'auto', marginBottom: 16 }}>
          {/* Observations */}
          <g>
            <rect x="20" y="20" width="120" height="80" fill="#1f2937" stroke="#3b82f6" strokeWidth="2" rx="8"/>
            <text x="80" y="50" textAnchor="middle" fill="#60a5fa" fontWeight="bold" fontSize="13">🛰️ OBSERVATIONS</text>
            <text x="80" y="70" textAnchor="middle" fill="#d1d5db" fontSize="11">Satellite, Radar,</text>
            <text x="80" y="85" textAnchor="middle" fill="#d1d5db" fontSize="11">Ground Stations</text>
          </g>

          {/* Arrow 1 */}
          <path d="M 140 60 L 180 60" stroke="#3b82f6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>

          {/* WeatherNext Model */}
          <g>
            <rect x="180" y="20" width="140" height="80" fill="#1f2937" stroke="#10b981" strokeWidth="2" rx="8"/>
            <text x="250" y="50" textAnchor="middle" fill="#34d399" fontWeight="bold" fontSize="13">🧠 WeatherNext 2.0</text>
            <text x="250" y="70" textAnchor="middle" fill="#d1d5db" fontSize="11">64-Member Ensemble</text>
            <text x="250" y="85" textAnchor="middle" fill="#d1d5db" fontSize="11">Neural Network</text>
          </g>

          {/* Arrow 2 */}
          <path d="M 320 60 L 360 60" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-green)"/>

          {/* BigQuery */}
          <g>
            <rect x="360" y="20" width="120" height="80" fill="#1f2937" stroke="#f59e0b" strokeWidth="2" rx="8"/>
            <text x="420" y="50" textAnchor="middle" fill="#fbbf24" fontWeight="bold" fontSize="13">💾 BigQuery</text>
            <text x="420" y="70" textAnchor="middle" fill="#d1d5db" fontSize="11">weathernext_2</text>
            <text x="420" y="85" textAnchor="middle" fill="#d1d5db" fontSize="11">.weathernext_2_0_0</text>
          </g>

          {/* Arrow 3 */}
          <path d="M 420 100 L 420 140" stroke="#f59e0b" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-orange)"/>

          {/* API Endpoints */}
          <g>
            <rect x="360" y="140" width="120" height="80" fill="#1f2937" stroke="#ef4444" strokeWidth="2" rx="8"/>
            <text x="420" y="165" textAnchor="middle" fill="#f87171" fontWeight="bold" fontSize="13">🔌 API Layer</text>
            <text x="420" y="180" textAnchor="middle" fill="#d1d5db" fontSize="10">/api/forecast</text>
            <text x="420" y="195" textAnchor="middle" fill="#d1d5db" fontSize="10">/api/ensemble</text>
            <text x="420" y="210" textAnchor="middle" fill="#d1d5db" fontSize="10">/api/alerts</text>
          </g>

          {/* Arrow 4 */}
          <path d="M 420 220 L 420 260" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-red)"/>

          {/* Dashboard & UI */}
          <g>
            <rect x="360" y="260" width="120" height="80" fill="#1f2937" stroke="#8b5cf6" strokeWidth="2" rx="8"/>
            <text x="420" y="285" textAnchor="middle" fill="#d8b4fe" fontWeight="bold" fontSize="13">🤖 AI Intelligence</text>
            <text x="420" y="305" textAnchor="middle" fill="#d1d5db" fontSize="10">3D Map, Charts,</text>
            <text x="420" y="320" textAnchor="middle" fill="#d1d5db" fontSize="10">Alerts, Forecasts</text>
          </g>

          {/* Arrow 5 */}
          <path d="M 420 340 L 420 380" stroke="#8b5cf6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-purple)"/>

          {/* Decisions */}
          <g>
            <rect x="360" y="380" width="120" height="80" fill="#1f2937" stroke="#06b6d4" strokeWidth="2" rx="8"/>
            <text x="420" y="405" textAnchor="middle" fill="#22d3ee" fontWeight="bold" fontSize="13">🎯 Decisions</text>
            <text x="420" y="425" textAnchor="middle" fill="#d1d5db" fontSize="10">Risk Assessment,</text>
            <text x="420" y="440" textAnchor="middle" fill="#d1d5db" fontSize="10">Warnings & Alerts</text>
          </g>

          {/* Side panel - Ensemble Stats */}
          <g>
            <rect x="520" y="20" width="260" height="440" fill="#0f172a" stroke="#1e293b" strokeWidth="1" rx="8"/>
            <text x="650" y="45" textAnchor="middle" fill="#60a5fa" fontWeight="bold" fontSize="13">📈 Ensemble Statistics</text>

            <text x="530" y="80" fill="#60a5fa" fontWeight="bold" fontSize="11">P10 (Optimistic)</text>
            <rect x="530" y="85" width="220" height="4" fill="#3b82f6" rx="2"/>

            <text x="530" y="110" fill="#34d399" fontWeight="bold" fontSize="11">P50 (Median)</text>
            <rect x="530" y="115" width="220" height="4" fill="#10b981" rx="2"/>

            <text x="530" y="140" fill="#fbbf24" fontWeight="bold" fontSize="11">Mean (Average)</text>
            <rect x="530" y="145" width="220" height="4" fill="#f59e0b" rx="2"/>

            <text x="530" y="170" fill="#f87171" fontWeight="bold" fontSize="11">P90 (Worst Case)</text>
            <rect x="530" y="175" width="220" height="4" fill="#ef4444" rx="2"/>

            <text x="530" y="210" fill="#d1d5db" fontWeight="bold" fontSize="11">Confidence Metrics:</text>
            <text x="530" y="230" fill="#d1d5db" fontSize="10">• HIGH (Days 1-3): ±1.2°C</text>
            <text x="530" y="245" fill="#d1d5db" fontSize="10">• MODERATE (Days 4-5): ±2.1°C</text>
            <text x="530" y="260" fill="#d1d5db" fontSize="10">• LOW-MODERATE (Days 6-10): ±3.5°C</text>
            <text x="530" y="275" fill="#d1d5db" fontSize="10">• LOW (Days 11-15): ±5.0°C</text>

            <text x="530" y="310" fill="#d1d5db" fontWeight="bold" fontSize="11">Member Probability:</text>
            <text x="530" y="330" fill="#d1d5db" fontSize="10">• Hazard members = count</text>
            <text x="530" y="345" fill="#d1d5db" fontSize="10">  exceeding threshold</text>
            <text x="530" y="360" fill="#d1d5db" fontSize="10">• Probability = members / 64</text>

            <text x="530" y="395" fill="#22d3ee" fontWeight="bold" fontSize="11">Alert Logic:</text>
            <text x="530" y="415" fill="#d1d5db" fontSize="10">If worst case is dangerous → WARNING</text>
            <text x="530" y="430" fill="#d1d5db" fontSize="10">If many forecasts agree → ALERT ISSUED</text>
            <text x="530" y="445" fill="#d1d5db" fontSize="10">More agreement = more confidence</text>
          </g>

          {/* Arrow markers */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6"/>
            </marker>
            <marker id="arrowhead-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#10b981"/>
            </marker>
            <marker id="arrowhead-orange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#f59e0b"/>
            </marker>
            <marker id="arrowhead-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#ef4444"/>
            </marker>
            <marker id="arrowhead-purple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6"/>
            </marker>
          </defs>
        </svg>
      </Section>

      <Section title="Operational Workflow" icon={MapPin}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#60a5fa', fontWeight: 600, marginBottom: 8 }}>🔄 Update Cycle (Every 6 Hours)</div>
            <ol style={{ margin: 0, paddingLeft: 20, listStyle: 'decimal' }}>
              <li>Collect latest weather observations</li>
              <li>Generate new forecasts</li>
              <li>Update dashboard with latest data</li>
              <li>AI assistant analyzes patterns and risks</li>
              <li>Issue alerts for dangerous weather</li>
            </ol>
          </div>

          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#34d399', fontWeight: 600, marginBottom: 8 }}>⚡ Common Weather Hazards Monitored</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>🌪️ Dust & Sand Storms</div>
              <div>🔥 Extreme Heat</div>
              <div>🌊 Heavy Rain & Flooding</div>
              <div>🌀 Cyclones & Hurricanes</div>
              <div>💨 Strong Winds</div>
              <div>⚡ Thunderstorms</div>
            </div>
          </div>

          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 8 }}>✅ Decision Support</div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc', fontSize: 12 }}>
              <li>How many forecasts agree? Shows forecast confidence</li>
              <li>Worst case scenario helps with planning</li>
              <li>Tight forecast agreement = more reliable predictions</li>
              <li>Timing matters: predict when hazards might occur</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="System Flow Diagram" icon={AlertCircle}>
        <svg viewBox="0 0 1000 450" style={{ width: '100%', height: 'auto' }}>
          {/* Title Background */}
          <rect x="10" y="10" width="980" height="40" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" rx="4"/>
          <text x="500" y="35" textAnchor="middle" fill="#60a5fa" fontWeight="bold" fontSize="16">WeatherNext 2 System Flow</text>

          {/* Observations Box */}
          <rect x="20" y="80" width="140" height="100" fill="#1f2937" stroke="#3b82f6" strokeWidth="2" rx="8"/>
          <text x="90" y="105" textAnchor="middle" fill="#60a5fa" fontWeight="bold" fontSize="13">🛰️ DATA INPUT</text>
          <text x="90" y="125" textAnchor="middle" fill="#d1d5db" fontSize="11">Satellites</text>
          <text x="90" y="140" textAnchor="middle" fill="#d1d5db" fontSize="11">Weather Stations</text>
          <text x="90" y="155" textAnchor="middle" fill="#d1d5db" fontSize="11">Radar</text>
          <text x="90" y="170" textAnchor="middle" fill="#d1d5db" fontSize="11">Ocean Buoys</text>

          {/* Arrow 1 */}
          <path d="M 160 130 L 200 130" stroke="#3b82f6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-blue)"/>

          {/* Model Box */}
          <rect x="200" y="80" width="140" height="100" fill="#1f2937" stroke="#10b981" strokeWidth="2" rx="8"/>
          <text x="270" y="105" textAnchor="middle" fill="#34d399" fontWeight="bold" fontSize="13">🧠 AI MODEL</text>
          <text x="270" y="125" textAnchor="middle" fill="#d1d5db" fontSize="11">WeatherNext 2.0</text>
          <text x="270" y="140" textAnchor="middle" fill="#d1d5db" fontSize="11">64 Forecasts</text>
          <text x="270" y="155" textAnchor="middle" fill="#d1d5db" fontSize="11">Neural Network</text>
          <text x="270" y="170" textAnchor="middle" fill="#d1d5db" fontSize="11">~30 seconds</text>

          {/* Arrow 2 */}
          <path d="M 340 130 L 380 130" stroke="#10b981" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-green)"/>

          {/* Storage Box */}
          <rect x="380" y="80" width="140" height="100" fill="#1f2937" stroke="#f59e0b" strokeWidth="2" rx="8"/>
          <text x="450" y="105" textAnchor="middle" fill="#fbbf24" fontWeight="bold" fontSize="13">💾 DATABASE</text>
          <text x="450" y="125" textAnchor="middle" fill="#d1d5db" fontSize="11">BigQuery</text>
          <text x="450" y="140" textAnchor="middle" fill="#d1d5db" fontSize="11">Full Dataset</text>
          <text x="450" y="155" textAnchor="middle" fill="#d1d5db" fontSize="11">All 64</text>
          <text x="450" y="170" textAnchor="middle" fill="#d1d5db" fontSize="11">Forecasts</text>

          {/* Arrow 3 */}
          <path d="M 450 180 L 450 220" stroke="#f59e0b" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-orange)"/>

          {/* API Box */}
          <rect x="380" y="220" width="140" height="80" fill="#1f2937" stroke="#ef4444" strokeWidth="2" rx="8"/>
          <text x="450" y="245" textAnchor="middle" fill="#f87171" fontWeight="bold" fontSize="13">🔌 API LAYER</text>
          <text x="450" y="265" textAnchor="middle" fill="#d1d5db" fontSize="11">Query & Filter</text>
          <text x="450" y="280" textAnchor="middle" fill="#d1d5db" fontSize="11">P10/P50/P90</text>

          {/* Arrow 4 */}
          <path d="M 450 300 L 450 340" stroke="#ef4444" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-red)"/>

          {/* Dashboard Box */}
          <rect x="350" y="340" width="200" height="80" fill="#1f2937" stroke="#8b5cf6" strokeWidth="2" rx="8"/>
          <text x="450" y="360" textAnchor="middle" fill="#d8b4fe" fontWeight="bold" fontSize="13">🤖 USER DASHBOARD</text>
          <text x="450" y="378" textAnchor="middle" fill="#d1d5db" fontSize="11">Charts • Maps • Forecasts • Alerts</text>

          {/* Arrow 5 */}
          <path d="M 550 380 L 590 380" stroke="#8b5cf6" strokeWidth="3" fill="none" markerEnd="url(#arrowhead-purple)"/>

          {/* Decision Box */}
          <rect x="590" y="340" width="170" height="80" fill="#1f2937" stroke="#06b6d4" strokeWidth="2" rx="8"/>
          <text x="675" y="360" textAnchor="middle" fill="#22d3ee" fontWeight="bold" fontSize="13">🎯 USER ACTION</text>
          <text x="675" y="378" textAnchor="middle" fill="#d1d5db" fontSize="11">Make Decisions • Issue Alerts</text>

          {/* Right Side Panel - Statistics */}
          <rect x="800" y="80" width="180" height="340" fill="#0f172a" stroke="#1e293b" strokeWidth="2" rx="8"/>
          <text x="890" y="110" textAnchor="middle" fill="#60a5fa" fontWeight="bold" fontSize="12">📊 FORECAST STATS</text>

          <text x="815" y="140" fill="#34d399" fontWeight="bold" fontSize="10">CONFIDENCE LEVELS</text>
          <rect x="815" y="145" width="150" height="4" fill="#34d399" rx="2" opacity="0.3"/>

          <text x="815" y="165" fill="#d1d5db" fontSize="9">Days 1-3: High ±1.2°C</text>
          <text x="815" y="180" fill="#d1d5db" fontSize="9">Days 4-5: Moderate ±2.1°C</text>
          <text x="815" y="195" fill="#d1d5db" fontSize="9">Days 6-10: Low-Mod ±3.5°C</text>
          <text x="815" y="210" fill="#d1d5db" fontSize="9">Days 11-15: Low ±5.0°C</text>

          <text x="815" y="240" fill="#fbbf24" fontWeight="bold" fontSize="10">ALERT LOGIC</text>
          <rect x="815" y="245" width="150" height="4" fill="#fbbf24" rx="2" opacity="0.3"/>

          <text x="815" y="265" fill="#d1d5db" fontSize="9">• If forecast is risky</text>
          <text x="815" y="280" fill="#d1d5db" fontSize="9">  → Issue WARNING</text>
          <text x="815" y="295" fill="#d1d5db" fontSize="9">• If many forecasts agree</text>
          <text x="815" y="310" fill="#d1d5db" fontSize="9">  → Increase confidence</text>
          <text x="815" y="325" fill="#d1d5db" fontSize="9">• Consensus drives</text>
          <text x="815" y="340" fill="#d1d5db" fontSize="9">  alert strength</text>

          <text x="815" y="370" fill="#86efac" fontWeight="bold" fontSize="10">✓ READY TO USE</text>
          <text x="815" y="385" fill="#d1d5db" fontSize="9">Complete weather</text>
          <text x="815" y="400" fill="#d1d5db" fontSize="9">decision system</text>

          {/* Arrow markers */}
          <defs>
            <marker id="arrowhead-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6"/>
            </marker>
            <marker id="arrowhead-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#10b981"/>
            </marker>
            <marker id="arrowhead-orange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#f59e0b"/>
            </marker>
            <marker id="arrowhead-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#ef4444"/>
            </marker>
            <marker id="arrowhead-purple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6"/>
            </marker>
          </defs>
        </svg>
      </Section>

      <Section title="Integration Points" icon={Cloud}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#3b82f6', fontWeight: 600, marginBottom: 8 }}>API Endpoints</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', background: '#111827', padding: 8, borderRadius: 6, color: '#60a5fa' }}>
              GET /api/forecast?lat=X&lon=Y<br/>
              GET /api/alerts?lat=X&lon=Y<br/>
              GET /api/hazards<br/>
              POST /api/chat (NCM AI)
            </div>
          </div>

          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 8 }}>Data Sources</div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc', fontSize: 12 }}>
              <li><strong>WeatherNext 2:</strong> ctoteam.weathernext_2.weathernext_2_0_0</li>
              <li><strong>Earthquakes:</strong> USGS API (real-time, M&gt;4.5)</li>
              <li><strong>Cyclones:</strong> IBTrACS (best track historical)</li>
              <li><strong>Hazards:</strong> Multi-source (NASA, NOAA)</li>
            </ul>
          </div>

          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 8 }}>Deployment</div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc', fontSize: 12 }}>
              <li><strong>Frontend:</strong> Next.js + React (this dashboard)</li>
              <li><strong>API:</strong> Node.js / Cloud Functions</li>
              <li><strong>Database:</strong> BigQuery (WeatherNext 2 data)</li>
              <li><strong>AI:</strong> Google Gemini (chat/insights)</li>
              <li><strong>Hosting:</strong> Cloud Run / Vertex AI</li>
            </ul>
          </div>
        </div>
      </Section>

      <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: 16, borderRadius: 12, marginTop: 20 }}>
        <div style={{ color: '#86efac', fontWeight: 600, marginBottom: 8 }}>✓ Real-Time AI Intelligence System Ready</div>
        <p style={{ margin: 0, fontSize: 12, color: '#d1d5db' }}>
          This real-time AI intelligence system provides complete weather forecasting and alert capabilities.
          The 64 different forecasts give you multiple perspectives on weather risk,
          forecast reliability, and worst-case scenarios for better decision making.
        </p>
      </div>
    </div>
  );
}
