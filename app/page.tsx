'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import GlobalWeatherMap from '@/components/map/GlobalWeatherMap';
import ForecastPanel from '@/components/forecast/ForecastPanel';
import ForecastDays15 from '@/components/ForecastDays15';
import EnsembleViewer from '@/components/ensemble/EnsembleViewer';
import CyclonePanel from '@/components/cyclones/CyclonePanel';
import ArchitectureView from '@/components/ArchitectureView';
import { useWeatherStore } from '@/store/useWeatherStore';
import { X, Loader2, AlertTriangle, CheckCircle, Globe, Map as MapIcon, RefreshCw, Tornado, Zap } from 'lucide-react';

const TalkToData = dynamic(() => import('@/components/chat/TalkToData'), { ssr: false });

function AlertsTab() {
  const { selectedLat, selectedLon, initDate, initHour, earthquakes } = useWeatherStore();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cachedLocation, setCachedLocation] = useState<string>('');

  // Memoize earthquake filtering to prevent unnecessary re-computation
  const nearbyEqs = useMemo(() => {
    if (!earthquakes || selectedLat === null || selectedLon === null) return [];
    return earthquakes.filter(eq =>
      eq.magnitude >= 6.5 &&
      Math.abs(eq.lat - selectedLat) < 5 &&
      Math.abs(eq.lon - selectedLon) < 5
    );
  }, [earthquakes, selectedLat, selectedLon]);

  useEffect(() => {
    if (selectedLat === null || selectedLon === null || !initDate) return;

    const locationKey = `${selectedLat},${selectedLon},${initDate},${initHour}`;
    if (cachedLocation === locationKey) return; // Skip if same location

    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const res = await fetch(`/api/alerts?lat=${selectedLat}&lon=${selectedLon}&initDate=${initDate}&initHour=${initHour}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        let combinedAlerts = data.alerts || [];

        // Merge earthquakes (already filtered via useMemo)
        nearbyEqs.forEach(eq => {
          if (eq.tsunami) {
            combinedAlerts.unshift({
              severity: 'DANGER',
              label: `🌊 TSUNAMI WARNING — ${eq.place}`,
              peakValue: eq.magnitude,
              unit: 'M',
              peakTime: eq.time,
              probability: 100,
              recommendation: 'Coastal evacuation may be required. Monitor official tsunami warning centers.'
            });
          } else {
            combinedAlerts.unshift({
              severity: eq.magnitude >= 7 ? 'DANGER' : 'WARNING',
              label: `M${eq.magnitude} Earthquake — ${eq.place}`,
              peakValue: eq.magnitude,
              unit: 'M',
              peakTime: eq.time,
              probability: 100,
              recommendation: 'Expect aftershocks. Check local infrastructure.'
            });
          }
        });

        setAlerts(combinedAlerts);
        setCachedLocation(locationKey);
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [selectedLat, selectedLon, initDate, initHour, nearbyEqs, cachedLocation]);

  if (loading) return <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  
  if (!alerts.length) return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#22c55e',
        marginBottom: 8 }}>
        All Clear
      </div>
      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
        No significant weather alerts for this location.
        WeatherNext 2 ensemble shows stable conditions
        across all 64 forecast members.
      </div>
      <div style={{ marginTop: 16, padding: '10px 16px',
        background: '#052e16', borderRadius: 8,
        border: '1px solid #166534' }}>
        <div style={{ fontSize: 11, color: '#86efac' }}>
          Next recommended check: {initDate} +6h
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '16px' }}>
      {alerts.map((alert, i) => {
        const severity = alert.severity;
        const borderColor = severity === 'DANGER' ? '#dc2626' : severity === 'WARNING' ? '#d97706' : '#2563eb';
        const badgeBg = severity === 'DANGER' ? '#450a0a' : severity === 'WARNING' ? '#451a03' : '#082f49';
        const badgeColor = severity === 'DANGER' ? '#f87171' : severity === 'WARNING' ? '#fbbf24' : '#38bdf8';

        return (
          <div key={i} style={{ background: '#1f2937', border: '1px solid', borderColor, borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
            <span style={{ background: badgeBg, color: badgeColor, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.05em' }}>
              {severity}
            </span>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginTop: '8px' }}>
              {alert.label}
            </div>
            <div style={{ color: '#d1d5db', fontSize: '13px', marginTop: '4px' }}>
              Peak: {alert.peakValue.toFixed(1)} {alert.unit} at {alert.peakTime ? new Date(alert.peakTime).toLocaleString() : 'N/A'}
            </div>
            <div style={{ marginTop: '10px', background: '#111827', borderRadius: '4px', height: '4px' }}>
              <div style={{ height: '4px', borderRadius: '4px', background: borderColor, width: `${alert.probability}%` }} />
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', textAlign: 'right' }}>
              {alert.probability}% Probability
            </div>
            {alert.recommendation && (
              <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                💡 {alert.recommendation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const { 
    selectedLat, selectedLon, initDate, initHour, setInitDate, setInitHour, 
    goToPreviousInit, goToNextInit, isLatestInit, setLocation, projection, 
    setProjection, autoRotate, toggleAutoRotate, spiralMode, toggleSpiralMode,
    setLeadHours, chatOpen, setChatOpen, activeTab, setActiveTab, isScanning,
    loadingCount
  } = useWeatherStore();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');

  useEffect(() => {
    useWeatherStore.getState().loadLatestDate();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lat') && params.get('lon')) {
      setLocation(Number(params.get('lat')), Number(params.get('lon')));
      if (params.get('initDate')) setInitDate(params.get('initDate')!);
      if (params.get('initHour')) setInitHour(Number(params.get('initHour')));
      if (params.get('leadHours')) setLeadHours(Number(params.get('leadHours')));
    }
  }, []);

  useEffect(() => {
    // Auto-select Dubai on first load so data is visible immediately
    const { selectedLat, setLocation } = useWeatherStore.getState();
    if (!selectedLat) {
      // Small delay to let map render first
      setTimeout(() => {
        setLocation(25.20, 55.27);
      }, 1500);
    }
  }, []);

  useEffect(() => {
    const update = () => {
      const initTimestamp = new Date(`${initDate}T${String(initHour).padStart(2,'0')}:00:00Z`);
      const diffHours = Math.floor((Date.now() - initTimestamp.getTime()) / 3600000);
      setTimeSinceUpdate(diffHours < 1 ? 'Just updated' :
                         diffHours === 1 ? '1h ago' : `${diffHours}h ago`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [initDate, initHour]);

  const isSidebarOpen = selectedLat !== null && selectedLon !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', background: '#030712', color: 'white' }}>
      {loadingCount > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: 2, zIndex: 9999,
          background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
        }} />
      )}
      {isScanning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: 3, zIndex: 9999,
          background: 'linear-gradient(90deg, #2563eb, #7c3aed, #2563eb)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
        }} />
      )}
      
      {/* Top Nav Bar */}
      <div style={{ height: '44px', background: 'rgba(3,7,18,0.9)', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#3b82f6' }}>☁</span> WeatherNext AI Intelligence
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px' }}>
          <button
            onClick={() => isSidebarOpen ? setActiveTab('architecture' as const) : setChatOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1f2937', padding: '4px 10px', borderRadius: '6px', color: '#d1d5db', border: '1px solid #374151', fontSize: '12px', cursor: 'pointer' }}
            title="View WeatherNext Architecture & System Flow"
          >
            <Zap size={14} />
            Architecture
          </button>

          <button
            onClick={() => setProjection(projection === 'globe' ? 'mercator' : 'globe')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1f2937', padding: '4px 10px', borderRadius: '6px', color: '#d1d5db', border: '1px solid #374151', fontSize: '12px', cursor: 'pointer' }}
          >
            {projection === 'globe' ? <Globe size={14} /> : <MapIcon size={14} />}
            {projection === 'globe' ? '3D Globe' : 'Flat Map'}
          </button>
          
          {projection === 'globe' && (
            <button
              onClick={toggleAutoRotate}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: autoRotate ? 'rgba(37,99,235,0.2)' : '#1f2937', padding: '4px 10px', borderRadius: '6px', color: autoRotate ? '#60a5fa' : '#d1d5db', border: `1px solid ${autoRotate ? 'rgba(37,99,235,0.5)' : '#374151'}`, fontSize: '12px', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={autoRotate ? 'animate-spin-slow' : ''} style={{ animationDuration: '3s' }} />
              Auto-Rotate
            </button>
          )}

          <button
            onClick={toggleSpiralMode}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: spiralMode ? 'rgba(220,38,38,0.2)' : '#1f2937', padding: '4px 10px', borderRadius: '6px', color: spiralMode ? '#f87171' : '#d1d5db', border: `1px solid ${spiralMode ? 'rgba(220,38,38,0.5)' : '#374151'}`, fontSize: '12px', cursor: 'pointer' }}
          >
            <Tornado size={14} />
            🌀 Spiral
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', position: 'relative' }}>
          <button
            onClick={goToPreviousInit}
            style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #374151',
              background: 'transparent', color: '#9ca3af', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
          >‹</button>

          <div
            onClick={() => setShowDatePicker(!showDatePicker)}
            style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
              padding: '4px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ fontSize: 14 }}>📅</span>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Init time</div>
              <div style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>
                {initDate || '2026-04-07'} · {String(initHour).padStart(2,'0')}:00 UTC
              </div>
            </div>
          </div>

          <button
            onClick={goToNextInit}
            disabled={isLatestInit()}
            style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #374151',
              background: 'transparent', color: isLatestInit() ? '#374151' : '#9ca3af',
              cursor: isLatestInit() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
          >›</button>

          {isLatestInit() && (
            <>
              <span style={{ fontSize: 10, background: '#065f46', color: '#6ee7b7',
                padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                LATEST
              </span>
              <span style={{ fontSize: 9, color: '#64748b', marginLeft: 4 }}>
                {timeSinceUpdate}
              </span>
            </>
          )}

          {!isLatestInit() && (
            <span style={{ fontSize: 10, background: '#1e1b4b', color: '#a5b4fc',
              padding: '2px 8px', borderRadius: 20 }}>
              HISTORICAL
            </span>
          )}

          {showDatePicker && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
              <input type="date" 
                value={initDate || '2026-04-07'}
                max={new Date().toISOString().split('T')[0]}
                min="2024-01-01"
                onChange={e => setInitDate(e.target.value)}
                style={{ background: '#111827', border: '1px solid #374151', 
                  borderRadius: 6, color: 'white', padding: '6px 10px' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0, 6, 12, 18].map(h => (
                  <button key={h}
                    onClick={() => { setInitHour(h); setShowDatePicker(false); }}
                    style={{ 
                      padding: '4px 10px', borderRadius: 6, fontSize: 12,
                      background: initHour === h ? '#2563eb' : '#374151',
                      border: 'none', color: 'white', cursor: 'pointer'
                    }}
                  >{String(h).padStart(2,'0')}:00</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', marginTop: '44px' }}>
        {/* Map Container */}
        <div style={{ position: 'relative', height: '100%', transition: 'width 0.3s ease-in-out', width: isSidebarOpen ? 'calc(100vw - 420px)' : '100%' }}>
          <GlobalWeatherMap />
        </div>

        {/* Sidebar */}
        <div 
          style={{ 
            width: '420px', 
            height: '100%', 
            background: '#111827', 
            borderLeft: '1px solid #1f2937', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden', 
            flexShrink: 0,
            position: 'absolute',
            right: 0,
            top: 0,
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
            zIndex: 40
          }}
        >
          {isSidebarOpen && (
            <>
              {/* Sidebar Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ color: 'white', fontWeight: 600, fontSize: '15px', margin: 0 }}>
                    {Math.abs(selectedLat).toFixed(2)}°{selectedLat >= 0 ? 'N' : 'S'} {Math.abs(selectedLon).toFixed(2)}°{selectedLon >= 0 ? 'E' : 'W'}
                  </h2>
                  {(initDate || '2026-04-07') && (
                    <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px', marginBottom: 0 }}>
                      WeatherNext 2 · Init: {initDate || '2026-04-07'} {String(initHour).padStart(2,'0')}:00 UTC
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setLocation(null, null)}
                    style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid #1e293b' }}>
                <button onClick={() => {
                  const url = `${window.location.origin}?lat=${selectedLat}&lon=${selectedLon}&date=${initDate}`;
                  navigator.clipboard.writeText(url);
                }} style={{ flex: 1, padding: '5px 0', fontSize: 11,
                  background: '#1e293b', border: 'none', borderRadius: 6,
                  color: '#94a3b8', cursor: 'pointer' }}>
                  🔗 Copy link
                </button>
                
                <button onClick={() => {
                  const text = encodeURIComponent(
                    `WeatherNext AI Forecast\n` +
                    `📍 ${selectedLat?.toFixed(2)}°N, ${selectedLon?.toFixed(2)}°E\n` +
                    `📅 ${initDate} ${initHour}:00 UTC\n` +
                    `Powered by Google DeepMind WeatherNext 2`
                  );
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }} style={{ flex: 1, padding: '5px 0', fontSize: 11,
                  background: '#064e3b', border: 'none', borderRadius: 6,
                  color: '#6ee7b7', cursor: 'pointer' }}>
                  📱 WhatsApp
                </button>
                
                <button onClick={() => window.print()}
                  style={{ flex: 1, padding: '5px 0', fontSize: 11,
                  background: '#1e293b', border: 'none', borderRadius: 6,
                  color: '#94a3b8', cursor: 'pointer' }}>
                  📄 Print
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #1f2937', overflowX: 'auto' }}>
                {(['forecast', 'days', 'ensemble', 'alerts', 'cyclones', 'architecture'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={activeTab === tab
                      ? { flex: 1, padding: '10px', fontSize: '12px', fontWeight: 500, background: 'transparent', border: 'none', borderBottom: '2px solid #3b82f6', color: '#60a5fa', cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }
                      : { flex: 1, padding: '10px', fontSize: '12px', fontWeight: 500, background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#6b7280', cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }
                    }
                  >
                    {tab === 'cyclones' ? '🌀 Cyclones' : tab === 'architecture' ? '⚙️ Architecture' : tab === 'days' ? '📅 15 Days' : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#111827' }}>
                {activeTab === 'forecast' && <ForecastPanel />}
                {activeTab === 'days' && <ForecastDays15 />}
                {activeTab === 'ensemble' && <EnsembleViewer />}
                {activeTab === 'alerts' && <AlertsTab />}
                {activeTab === 'cyclones' && <CyclonePanel />}
                {activeTab === 'architecture' && <ArchitectureView />}
                {activeTab === 'chat' && <TalkToData />}
              </div>

              {/* Sticky Footer for Chat */}
              <div style={{ 
                borderTop: '1px solid #1e293b',
                padding: '12px 16px',
                background: '#0f172a',
                flexShrink: 0
              }}>
                <button
                  onClick={() => setActiveTab('chat')}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                    border: 'none', borderRadius: 10,
                    color: 'white', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                  💬 Talk to Weather AI
                </button>
              </div>
            </>
          )}
        </div>

        {/* Chat Modal (when no location selected) */}
        {chatOpen && !isSidebarOpen && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 600, background: '#111827', border: '1px solid #1f2937', borderRadius: 12, zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'white' }}>💬 Talk to Weather AI</h3>
              <button onClick={() => setChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <TalkToData />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
