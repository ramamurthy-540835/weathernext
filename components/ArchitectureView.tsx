'use client';

import React, { useState } from 'react';
import { ChevronDown, Database, Cloud, Zap, AlertCircle, MapPin, Server } from 'lucide-react';

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
      <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 20 }}>Hybrid AI-Powered Weather Forecasting & Decision Intelligence</p>

      <Section title="System Overview & Data Fusion" icon={Cloud}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#3b82f6', fontWeight: 600, marginBottom: 8 }}>Multi-Source Input Layer</div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
              <li><strong>Global Models:</strong> ECMWF baseline data</li>
              <li><strong>Observations:</strong> Satellite & Radar</li>
              <li><strong>Local Data:</strong> NCM Ground Stations</li>
              <li>AI harmonizes heterogeneous data</li>
            </ul>
          </div>
          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 8 }}>AI Processing (DeepMind)</div>
            <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
              <li>Probabilistic AI Forecasting</li>
              <li>64-member ensemble generation</li>
              <li>Continuous learning from deviations</li>
              <li>Results generated in ~30 seconds</li>
            </ul>
          </div>
        </div>
        <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
          <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 8 }}>Hybrid Deployment (GCP BigLake)</div>
          <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
            <li><strong>Cloud:</strong> Heavy AI inference runs on Google Cloud</li>
            <li><strong>Storage:</strong> Historical actuals stay in NCM's existing S3 storage</li>
            <li><strong>Federated Query:</strong> GCP BigLake provides the connection to join cloud forecasts with existing S3 actuals securely</li>
          </ul>
        </div>
      </Section>

      <Section title="64-Member Ensemble & Probabilistic AI" icon={Zap}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#60a5fa', fontWeight: 600, marginBottom: 8 }}>Moving Beyond Deterministic Models</div>
          <p style={{ margin: '0 0 12px 0' }}>
            Instead of a single "best guess", WeatherNext generates 64 independent forecasts. This provides confidence intervals (P10 / P50 / P90) enabling risk-aware decision making rather than reactive monitoring.
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
              <strong>Tail Risk:</strong> Extreme scenario simulation
            </div>
          </div>
        </div>
      </Section>

      <Section title="Hybrid Architecture Diagram" icon={Server}>
        <svg viewBox="0 0 800 550" style={{ width: '100%', height: 'auto', marginBottom: 16 }}>
          {/* Cloud Boundary */}
          <rect x="10" y="10" width="780" height="320" fill="rgba(59, 130, 246, 0.05)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="5,5" rx="8"/>
          <text x="20" y="30" fill="#60a5fa" fontSize="12" fontWeight="bold">GOOGLE CLOUD ENVIRONMENT</text>

          {/* On-Premise Boundary */}
          <rect x="10" y="350" width="780" height="180" fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" strokeWidth="1" strokeDasharray="5,5" rx="8"/>
          <text x="20" y="370" fill="#34d399" fontSize="12" fontWeight="bold">NCM ON-PREMISE ENVIRONMENT</text>

          {/* ECMWF / Global Models */}
          <g>
            <rect x="40" y="60" width="120" height="60" fill="#1f2937" stroke="#8b5cf6" strokeWidth="2" rx="8"/>
            <text x="100" y="85" textAnchor="middle" fill="#d8b4fe" fontWeight="bold" fontSize="12">🌍 ECMWF</text>
            <text x="100" y="105" textAnchor="middle" fill="#d1d5db" fontSize="10">Global Baselines</text>
          </g>

          {/* Satellite Data */}
          <g>
            <rect x="40" y="140" width="120" height="60" fill="#1f2937" stroke="#3b82f6" strokeWidth="2" rx="8"/>
            <text x="100" y="165" textAnchor="middle" fill="#60a5fa" fontWeight="bold" fontSize="12">🛰️ Satellite</text>
            <text x="100" y="185" textAnchor="middle" fill="#d1d5db" fontSize="10">Observations</text>
          </g>

          {/* WeatherNext Model */}
          <g>
            <rect x="220" y="100" width="140" height="80" fill="#1f2937" stroke="#10b981" strokeWidth="2" rx="8"/>
            <text x="290" y="130" textAnchor="middle" fill="#34d399" fontWeight="bold" fontSize="13">🧠 WeatherNext 2.0</text>
            <text x="290" y="150" textAnchor="middle" fill="#d1d5db" fontSize="11">AI Data Fusion</text>
            <text x="290" y="165" textAnchor="middle" fill="#d1d5db" fontSize="11">64-Member Ensemble</text>
          </g>

          {/* BigQuery */}
          <g>
            <rect x="420" y="100" width="120" height="80" fill="#1f2937" stroke="#f59e0b" strokeWidth="2" rx="8"/>
            <text x="480" y="130" textAnchor="middle" fill="#fbbf24" fontWeight="bold" fontSize="13">💾 BigQuery</text>
            <text x="480" y="150" textAnchor="middle" fill="#d1d5db" fontSize="11">AI Forecasts</text>
            <text x="480" y="165" textAnchor="middle" fill="#d1d5db" fontSize="11">(weathernext_2)</text>
          </g>

          {/* BigLake Connection */}
          <g>
            <rect x="420" y="220" width="120" height="60" fill="#1f2937" stroke="#06b6d4" strokeWidth="2" rx="8"/>
            <text x="480" y="245" textAnchor="middle" fill="#22d3ee" fontWeight="bold" fontSize="13">🔗 GCP BigLake</text>
            <text x="480" y="265" textAnchor="middle" fill="#d1d5db" fontSize="10">Federated Query Engine</text>
          </g>

          {/* NCM On-Premise Storage */}
          <g>
            <rect x="420" y="400" width="120" height="80" fill="#1f2937" stroke="#10b981" strokeWidth="2" rx="8"/>
            <text x="480" y="430" textAnchor="middle" fill="#34d399" fontWeight="bold" fontSize="13">🗄️ NCM Existing S3</text>
            <text x="480" y="450" textAnchor="middle" fill="#d1d5db" fontSize="11">Historical Actuals</text>
            <text x="480" y="465" textAnchor="middle" fill="#d1d5db" fontSize="11">(Radar, Stations)</text>
          </g>

          {/* Decision Intelligence UI */}
          <g>
            <rect x="620" y="160" width="140" height="80" fill="#1f2937" stroke="#ef4444" strokeWidth="2" rx="8"/>
            <text x="690" y="185" textAnchor="middle" fill="#f87171" fontWeight="bold" fontSize="13">🎯 Decision Layer</text>
            <text x="690" y="205" textAnchor="middle" fill="#d1d5db" fontSize="11">Risk Scores</text>
            <text x="690" y="220" textAnchor="middle" fill="#d1d5db" fontSize="11">Historical Replay</text>
          </g>

          {/* Arrows */}
          <path d="M 160 90 L 220 120" stroke="#8b5cf6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-purple)"/>
          <path d="M 160 170 L 220 150" stroke="#3b82f6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
          <path d="M 360 140 L 420 140" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-green)"/>
          
          {/* BigLake to BigQuery */}
          <path d="M 480 220 L 480 180" stroke="#06b6d4" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-cyan)"/>
          
          {/* On-Prem to BigLake */}
          <path d="M 480 400 L 480 280" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" fill="none" markerEnd="url(#arrowhead-green)"/>
          <text x="490" y="340" fill="#34d399" fontSize="10">Secure Tunnel</text>

          {/* BigQuery to UI */}
          <path d="M 540 140 L 620 180" stroke="#f59e0b" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-orange)"/>
          {/* BigLake to UI (Historical Replay) */}
          <path d="M 540 250 L 620 210" stroke="#06b6d4" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-cyan)"/>

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
            <marker id="arrowhead-cyan" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#06b6d4"/>
            </marker>
          </defs>
        </svg>
      </Section>

      <Section title="Decision Intelligence Layer" icon={AlertCircle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#f87171', fontWeight: 600, marginBottom: 8 }}>From Meteorology to Operations</div>
            <p style={{ margin: 0, fontSize: 12, color: '#d1d5db' }}>
              The system converts raw weather signals into actionable operational metrics:
            </p>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 16, listStyle: 'disc', fontSize: 12 }}>
              <li><strong>Risk Scores:</strong> Automated severity indicators based on P90 tail risks.</li>
              <li><strong>Impact Zones:</strong> Geospatial mapping of high-confidence hazard areas.</li>
              <li><strong>Early Warning:</strong> Predictive intelligence detecting anomalies before threshold triggers.</li>
            </ul>
          </div>

          <div style={{ background: '#1f2937', padding: 12, borderRadius: 8 }}>
            <div style={{ color: '#34d399', fontWeight: 600, marginBottom: 8 }}>Continuous Learning (Adaptive Forecasting)</div>
            <p style={{ margin: 0, fontSize: 12, color: '#d1d5db' }}>
              Through the GCP BigLake historical validation loop, the AI continuously compares its past forecasts against NCM's existing S3 actuals. This feedback loop allows the model to tune its ensemble weights, ensuring the system gets better over time rather than remaining a static model.
            </p>
          </div>
        </div>
      </Section>

      <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: 16, borderRadius: 12, marginTop: 20 }}>
        <div style={{ color: '#86efac', fontWeight: 600, marginBottom: 8 }}>✓ Enterprise-Ready Architecture</div>
        <p style={{ margin: 0, fontSize: 12, color: '#d1d5db' }}>
          This architecture provides the computational power of Google DeepMind while respecting data sovereignty and on-premise investments through GCP BigLake federated queries to existing S3 storage.
        </p>
      </div>
    </div>
  );
}
