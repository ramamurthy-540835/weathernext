'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Play, Pause, Thermometer, CloudRain, Wind, Gauge, Loader2 } from 'lucide-react';
import { useWeatherStore } from '../../store/useWeatherStore';
import SpiralOverlay from '../cyclones/SpiralOverlay';
import { VARIABLE_LABELS, VARIABLE_MIN, VARIABLE_MAX } from '../../lib/constants';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const VARIABLES = [
  { key: 'temperature', label: 'Temperature', Icon: Thermometer, color: '#f59e0b' },
  { key: 'rain',        label: 'Precipitation', Icon: CloudRain,  color: '#3b82f6' },
  { key: 'wind',        label: 'Wind Speed',    Icon: Wind,       color: '#14b8a6' },
  { key: 'pressure',    label: 'Pressure',      Icon: Gauge,      color: '#a78bfa' },
];

const CITY_PRESETS = [
  { name: 'Chennai',   lat: 13.08,  lon: 80.27,  zoom: 9  },
  { name: 'Dubai',     lat: 25.20,  lon: 55.27,  zoom: 9  },
  { name: 'Mumbai',    lat: 19.07,  lon: 72.87,  zoom: 9  },
  { name: 'Delhi',     lat: 28.61,  lon: 77.20,  zoom: 9  },
  { name: 'Bangalore', lat: 12.97,  lon: 77.59,  zoom: 9  },
  { name: 'Kolkata',   lat: 22.57,  lon: 88.36,  zoom: 9  },
  { name: 'Karachi',   lat: 24.86,  lon: 67.01,  zoom: 9  },
  { name: 'Dhaka',     lat: 23.81,  lon: 90.41,  zoom: 9  },
  { name: 'Riyadh',    lat: 24.68,  lon: 46.72,  zoom: 9  },
  { name: 'Colombo',   lat: 6.93,   lon: 79.84,  zoom: 9  },
  { name: 'Bangkok',   lat: 13.75,  lon: 100.52, zoom: 9  },
  { name: 'Global',    lat: 20.0,   lon: 78.0,   zoom: 2  },
];

const MAJOR_CITIES = [
  { name: 'Chennai', lat: 13.08, lon: 80.27 },
  { name: 'Mumbai', lat: 19.07, lon: 72.87 },
  { name: 'Dubai', lat: 25.20, lon: 55.27 },
  { name: 'Delhi', lat: 28.61, lon: 77.20 },
  { name: 'Bangalore', lat: 12.97, lon: 77.59 },
  { name: 'Kolkata', lat: 22.57, lon: 88.36 },
  { name: 'Karachi', lat: 24.86, lon: 67.01 },
  { name: 'Dhaka', lat: 23.81, lon: 90.41 },
];

export default function GlobalWeatherMap() {
  const mapRef = useRef<MapRef>(null);
  const userInteracting = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    selectedLat,
    selectedLon,
    activeVariable,
    leadHours,
    initDate,
    initHour,
    isPlaying,
    projection,
    autoRotate,
    spiralMode,
    setLocation,
    setActiveVariable,
    setLeadHours,
    togglePlay,
    setChatOpen,
    setActiveTab,
    activeTab,
    globalAlerts,
    setGlobalAlerts,
    isScanning,
    setIsScanning
  } = useWeatherStore();

  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{name: string, lat: number, lon: number}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [zoom, setZoom] = useState(2);
  const [showAlertList, setShowAlertList] = useState(false);
  const [hoveredAlert, setHoveredAlert] = useState<any>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showCities, setShowCities] = useState(true);
  const [cyclones, setCyclones] = useState<any[]>([]);
  const [scanMinimized, setScanMinimized] = useState(true);
  
  const [hazards, setHazards] = useState<{
    earthquakes: any[];
    wildfires: any[];
    counts: any;
  }>({ earthquakes: [], wildfires: [], counts: {} });
  
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showWildfires, setShowWildfires] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setLeadHours(leadHours >= 120 ? 0 : leadHours + 6);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isPlaying, leadHours, setLeadHours]);

  useEffect(() => {
    if (selectedLat && selectedLon) {
      setSearchQuery(`${selectedLat.toFixed(4)}, ${selectedLon.toFixed(4)}`);
    }
  }, [selectedLat, selectedLon]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        console.log('[Hazards] Fetching...');
        const res = await fetch('/api/hazards');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log('[Hazards] Got:', data.counts);
        setHazards(data);
      } catch (e) {
        console.error('[Hazards] Failed:', e);
        // Fallback - fetch earthquakes directly
        try {
          const eq = await fetch('/api/earthquakes');
          const eqData = await eq.json();
          setHazards({ 
            earthquakes: eqData.earthquakes || [],
            wildfires: [],
            counts: { earthquakes: eqData.earthquakes?.length || 0, wildfires: 0 }
          });
        } catch (e2) {
          console.error('[Earthquakes fallback] Failed:', e2);
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'cyclones' && cyclones.length === 0) {
      fetch(`/api/cyclones?initDate=${initDate}&initHour=${initHour}`)
        .then(r => r.json())
        .then(d => setCyclones(d.storms || []))
        .catch(e => console.error(e));
    }
  }, [activeTab, initDate, initHour, cyclones.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHoveredAlert(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-rotation logic
  useEffect(() => {
    let animationFrameId: number;
    const rotate = () => {
      if (autoRotate && projection === 'globe' && mapRef.current && !userInteracting.current && !isPlaying) {
        const map = mapRef.current.getMap();
        const center = map.getCenter();
        center.lng = (center.lng + 0.08) % 360; // Rotation speed
        map.setCenter(center);
      }
      animationFrameId = requestAnimationFrame(rotate);
    };

    if (autoRotate && projection === 'globe') {
      rotate();
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [autoRotate, projection, isPlaying]);

  const handleInteractionStart = () => {
    userInteracting.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleInteractionEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      userInteracting.current = false;
    }, 2000);
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${token}&types=place,locality,district`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        setSearchQuery(data.features[0].place_name.split(',').slice(0,2).join(','));
      } else {
        setSearchQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch {
      setSearchQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  };

  const handleMapClick = useCallback((e: any) => {
    setHoveredAlert(null);
    // Ignore clicks on overlay controls
    const target = e.originalEvent?.target as HTMLElement;
    if (target && (target.closest('button') || target.closest('input'))) return;
    
    const { lat, lng } = e.lngLat;
    setLocation(lat, lng);
    reverseGeocode(lat, lng);
  }, [setLocation]);

  const handleMouseMove = useCallback((e: any) => {
    requestAnimationFrame(() => {
      setHoverCoords({
        lat: e.lngLat.lat,
        lon: e.lngLat.lng
      });
    });
  }, []);

  const handleMouseLeave = () => {
    setHoverCoords(null);
  };

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    if (value.length < 2) { setSuggestions([]); return; }
    
    // First show matching presets instantly
    const presetMatches = CITY_PRESETS.filter(c => 
      c.name.toLowerCase().startsWith(value.toLowerCase())
    );
    
    // Then fetch Mapbox geocoding suggestions
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&types=place,locality&limit=4&country=in,ae,sa,bd,pk,lk,th`
      );
      const data = await res.json();
      const geocoded = (data.features || []).map((f: any) => ({
        name: f.place_name.split(',').slice(0,2).join(','),
        lat: f.center[1],
        lon: f.center[0]
      }));
      setSuggestions([...presetMatches, ...geocoded].slice(0, 6));
      setShowSuggestions(true);
    } catch {
      setSuggestions(presetMatches);
      setShowSuggestions(presetMatches.length > 0);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    let lat: number, lon: number;
    const coordsMatch = searchQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    
    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1]);
      lon = parseFloat(coordsMatch[3]);
      flyToLocation(lat, lon);
    } else {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [lng, lt] = data.features[0].center;
          lat = lt;
          lon = lng;
          flyToLocation(lat, lon);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }
  };

  const flyToLocation = (lat: number, lon: number) => {
    setLocation(lat, lon);
    reverseGeocode(lat, lon);
    mapRef.current?.flyTo({ center: [lon, lat], zoom: spiralMode ? 5 : 9, duration: 1200 });
  };

  // Fly to location when spiral mode is toggled on
  useEffect(() => {
    if (spiralMode && selectedLat !== null && selectedLon !== null) {
      mapRef.current?.flyTo({ center: [selectedLon, selectedLat], zoom: 5, duration: 1200 });
    }
  }, [spiralMode, selectedLat, selectedLon]);

  const baseDate = new Date(
    `${initDate || '2026-04-07'}T${String(initHour || 18).padStart(2,'0')}:00:00Z`
  );
  baseDate.setUTCHours(baseDate.getUTCHours() + leadHours);
  
  const displayDate = baseDate.toLocaleDateString('en-GB', {
    month: 'short', day: 'numeric', timeZone: 'UTC'
  });
  const displayHour = String(baseDate.getUTCHours()).padStart(2,'0');

  const onMapLoad = useCallback(() => {
    setMapLoaded(true);
    const map = mapRef.current?.getMap();
    if (!map) return;

    // satellite-streets-v12 uses these layer names
    const labelLayers = [
      'country-label',
      'state-label', 
      'settlement-major-label',
      'settlement-minor-label',
      'settlement-subdivision-label',
      'airport-label',
      'poi-label',
      'water-point-label',
      'waterway-label',
      'natural-point-label',
    ];

    labelLayers.forEach(layer => {
      try {
        if (map.getLayer(layer)) {
          map.setPaintProperty(layer, 'text-color', '#ffffff');
          map.setPaintProperty(layer, 'text-halo-color', 'rgba(0,0,0,0.8)');
          map.setPaintProperty(layer, 'text-halo-width', 1.5);
        }
      } catch (e) {
        // skip silently
      }
    });
  }, []);

  const getNearestCity = (lat: number, lon: number) => {
    let nearest = CITY_PRESETS[0];
    let minDist = Infinity;
    CITY_PRESETS.forEach(city => {
      if (city.name === 'Global') return;
      const dist = Math.sqrt(
        Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2)
      );
      if (dist < minDist) { minDist = dist; nearest = city; }
    });
    return minDist < 5 ? nearest.name : null; // only show if within ~500km
  };

  const nearestCity = selectedLat ? getNearestCity(selectedLat, selectedLon!) : null;

  const runGlobalScan = async () => {
    setIsScanning(true);
    const results: Array<{
      city: string;
      lat: number;
      lon: number;
      severity: 'DANGER' | 'WARNING' | 'INFO' | 'CLEAR';
      label: string;
      peakValue: number;
      unit: string;
      probability: number;
      recommendation: string;
    }> = [];
    
    for (const station of MAJOR_CITIES) {
      try {
        const res = await fetch(
          `/api/alerts?lat=${station.lat}&lon=${station.lon}` +
          `&initDate=${initDate}&initHour=${initHour}&radius=0.5`
        );
        const json = await res.json();
        const topAlert = json.alerts?.find((a: any) => a.variable !== 'general') || json.alerts?.[0];
        
        results.push({
          city: station.name,
          lat: station.lat,
          lon: station.lon,
          severity: ((topAlert?.variable === 'general' ? 'CLEAR' : (topAlert?.severity || 'CLEAR')) as 'DANGER'|'WARNING'|'INFO'|'CLEAR'),
          label: topAlert?.label || 'No alerts',
          peakValue: topAlert?.peakValue || 0,
          unit: topAlert?.unit || '',
          probability: topAlert?.probability || 0,
          recommendation: topAlert?.recommendation || '',
        });
      } catch {
        results.push({
          city: station.name,
          lat: station.lat,
          lon: station.lon,
          severity: 'CLEAR' as const,
          label: 'No data',
          peakValue: 0,
          unit: '',
          probability: 0,
          recommendation: '',
        });
      }
    }
    
    setGlobalAlerts(results);
    setIsScanning(false);
    setScanMinimized(false);
    
    const dCount = results.filter(r => r.severity === 'DANGER').length;
    if (dCount === 0) {
      setTimeout(() => setScanMinimized(true), 5000);
    }
  };

  useEffect(() => {
    if (!initDate || !mapLoaded) return;
    const timer = setTimeout(() => {
      runGlobalScan();
    }, 10000);
    return () => clearTimeout(timer);
  }, [initDate, initHour, mapLoaded]);

  const dangerCount = globalAlerts.filter(a => a.severity === 'DANGER').length;
  const warningCount = globalAlerts.filter(a => a.severity === 'WARNING').length;
  const clearCount = globalAlerts.filter(a => a.severity === 'CLEAR' || a.severity === 'INFO').length;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        .mapboxgl-ctrl-logo { display: none !important; }
        .mapboxgl-ctrl-attrib { 
          font-size: 9px !important; 
          background: rgba(0,0,0,0.4) !important;
          color: #6b7280 !important;
        }
        .mapboxgl-ctrl-attrib a { color: #6b7280 !important; }
      `}</style>

      {/* Interactive Alert Summary Panel */}
      {globalAlerts.length > 0 && (
        <div style={{ position: 'absolute', top: 56, left: 16, right: selectedLat ? 436 : 16, zIndex: 20 }}>
          {scanMinimized ? (
            <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', width: 'fit-content' }} onClick={() => setScanMinimized(false)}>
              <span style={{ fontSize: 12 }}>🌐</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Alert Scan</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {dangerCount} DANGER · {warningCount} WARNING · {clearCount} Clear
              </span>
              <span style={{ fontSize: 10, color: '#475569', marginLeft: 8 }}>▼ expand</span>
            </div>
          ) : (
            <div style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid #334155', borderRadius: 10, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', maxWidth: 360 }}>
              {/* Header row */}
              <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: showAlertList ? '1px solid #1e293b' : 'none', cursor: 'pointer' }} onClick={() => setShowAlertList(!showAlertList)}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>🌐 Global Alert Scan</span>
                {/* Severity counts */}
                <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
                  {dangerCount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#450a0a', color: '#fca5a5', padding: '2px 8px', borderRadius: 20 }}>🔴 {dangerCount} DANGER</span>
                  )}
                  {warningCount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#431407', color: '#fdba74', padding: '2px 8px', borderRadius: 20 }}>🟠 {warningCount} WARNING</span>
                  )}
                  {clearCount > 0 && (
                    <span style={{ fontSize: 11, background: '#052e16', color: '#86efac', padding: '2px 8px', borderRadius: 20 }}>✓ {clearCount} Clear</span>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); setScanMinimized(true); }} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: '2px 6px' }}>▲ minimize</button>
              </div>

              {/* Expandable alert list */}
              {showAlertList && (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {globalAlerts
                    .sort((a, b) => {
                      const order = { DANGER: 0, WARNING: 1, INFO: 2, CLEAR: 3 };
                      return order[a.severity] - order[b.severity];
                    })
                    .map((alert) => (
                    <div key={alert.city}
                      onClick={() => {
                        setShowAlertList(false);
                        mapRef.current?.flyTo({ center: [alert.lon, alert.lat], zoom: 9, duration: 1200 });
                        setLocation(alert.lat, alert.lon);
                      }}
                      style={{ padding: '10px 14px', borderBottom: '1px solid #0f172a', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, background: 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,138,0.2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Severity dot */}
                      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 3, background: alert.severity === 'DANGER' ? '#ef4444' : alert.severity === 'WARNING' ? '#f97316' : alert.severity === 'INFO' ? '#eab308' : '#22c55e', boxShadow: alert.severity === 'DANGER' ? '0 0 8px rgba(239,68,68,0.8)' : 'none' }} />
                      <div style={{ flex: 1 }}>
                        {/* City + severity */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{alert.city}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: alert.severity === 'DANGER' ? '#fca5a5' : alert.severity === 'WARNING' ? '#fdba74' : alert.severity === 'INFO' ? '#fde68a' : '#86efac' }}>{alert.severity}</span>
                        </div>
                        {/* Alert label */}
                        <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: alert.recommendation ? 4 : 0 }}>
                          {alert.label}
                          {alert.peakValue > 0 && (
                            <span style={{ color: '#94a3b8', marginLeft: 6 }}>· Peak: {alert.peakValue}{alert.unit}{(alert.probability || 0) > 0 && ` · ${alert.probability}% prob`}</span>
                          )}
                        </div>
                        {/* Recommendation */}
                        {alert.recommendation && alert.severity !== 'CLEAR' && (
                          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginTop: 3, paddingLeft: 8, borderLeft: '2px solid #3b82f6' }}>
                            {alert.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Region presets — top right */}
      <div style={{ position: 'absolute', top: 56, right: 16, zIndex: 10 }}>
        <button onClick={() => setShowCities(!showCities)}
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b',
            borderRadius: 6, color: '#94a3b8', fontSize: 10,
            padding: '3px 8px', cursor: 'pointer', marginBottom: 4,
            display: 'block', marginLeft: 'auto' }}>
          {showCities ? '▼ Cities' : '◀ Cities'}
        </button>
        {showCities && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {CITY_PRESETS.map(city => (
              <button key={city.name}
                onClick={(e) => {
                  e.stopPropagation();
                  mapRef.current?.flyTo({ 
                    center: [city.lon, city.lat], 
                    zoom: city.zoom, duration: 1200 
                  });
                  setLocation(city.lat, city.lon);
                  reverseGeocode(city.lat, city.lon);
                }}
                style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid #1e3a5f',
                  borderRadius: 20, color: '#e2e8f0', fontSize: 10, padding: '3px 7px',
                  cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'center' }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = 'rgba(37,99,235,0.5)'}
                onMouseLeave={e => (e.target as HTMLElement).style.background = 'rgba(15,23,42,0.7)'}
              >{city.name}</button>
            ))}
          </div>
        )}
      </div>

      {/* Variable toggles — left center */}
      <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {VARIABLES.map(v => (
          <button key={v.key}
            onClick={() => setActiveVariable(v.key)}
            title={v.label}
            style={{
              width: '40px', height: '40px', borderRadius: '10px', border: '1px solid',
              borderColor: activeVariable === v.key ? v.color : '#374151',
              background: activeVariable === v.key ? '#1d4ed8' : 'rgba(17,24,39,0.9)',
              color: activeVariable === v.key ? 'white' : '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
            <v.Icon size={16} />
          </button>
        ))}
        
        {/* Divider line */}
        <div style={{ 
          width: 40, height: 1, 
          background: '#1e293b', 
          margin: '2px 0' 
        }} />

        {/* Earthquake toggle button */}
        <button
          onClick={() => setShowEarthquakes(prev => !prev)}
          title={`Earthquakes (${hazards.earthquakes?.length || 0})`}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: `1px solid ${showEarthquakes ? '#ef4444' : '#374151'}`,
            background: showEarthquakes 
              ? 'rgba(239,68,68,0.2)' 
              : 'rgba(15,23,42,0.9)',
            color: showEarthquakes ? '#ef4444' : '#6b7280',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          ▲
          {hazards.earthquakes?.length > 0 && (
            <span style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#ef4444',
              color: 'white',
              fontSize: 9,
              borderRadius: 10,
              padding: '1px 4px',
              fontWeight: 700,
              minWidth: 16,
              textAlign: 'center',
              lineHeight: '14px',
            }}>
              {hazards.earthquakes.length}
            </span>
          )}
        </button>

        {/* Wildfire toggle */}
        <button
          onClick={() => setShowWildfires(!showWildfires)}
          title={`Wildfires ${hazards.wildfires?.length ? '(' + hazards.wildfires.length + ')' : ''}`}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${showWildfires ? '#f97316' : '#374151'}`,
            background: showWildfires ? 'rgba(249,115,22,0.2)' : 'rgba(15,23,42,0.9)',
            color: showWildfires ? '#f97316' : '#6b7280',
            cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
          🔥
          {hazards.wildfires?.length > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -5,
              background: '#f97316', color: 'white',
              fontSize: 8, borderRadius: 10, padding: '1px 3px',
              fontWeight: 700, minWidth: 14, textAlign: 'center',
            }}>
              {Math.min(99, hazards.wildfires.length)}
            </span>
          )}
        </button>
      </div>

      {/* Global Scan Button & Legend */}
      <div style={{ position: 'absolute', left: 16, bottom: 160, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={runGlobalScan} disabled={isScanning} style={{
          background: 'rgba(15,23,42,0.9)', border: '1px solid #dc2626',
          borderRadius: 8, color: '#f87171', fontSize: 12, padding: '8px 14px',
          cursor: isScanning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isScanning ? 0.7 : 1
        }}>
          {isScanning ? <Loader2 size={14} className="animate-spin" /> : <span style={{ fontSize: 14 }}>🌐</span>}
          {isScanning ? 'Scanning...' : 'Scan Alerts'}
        </button>
        
        <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid #1e293b', borderRadius: 6, padding: '4px 8px' }}>
          {[
            { color: '#ef4444', label: 'Danger' },
            { color: '#f97316', label: 'Warning' },
            { color: '#22c55e', label: 'Clear' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />
              <span style={{ fontSize: 9, color: '#94a3b8' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coordinate display — bottom left */}
      <div style={{ position: 'absolute', bottom: '80px', left: '16px', zIndex: 10, background: 'rgba(17,24,39,0.85)', border: '1px solid #374151', borderRadius: '8px', padding: '6px 12px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#d1d5db' }}>
          {hoverCoords ? `${hoverCoords.lat.toFixed(4)}°N  ${hoverCoords.lon.toFixed(4)}°E` : 'Hover map for coordinates'}
        </span>
      </div>

      {/* Talk to Weather AI button — floating bottom right (only when sidebar is closed) */}
      {!selectedLat && (
        <button
          onClick={() => {
            setChatOpen(true);
            setActiveTab('chat');
            setLocation(13.08, 80.27);
          }}
          title="Talk to Weather AI"
          style={{
            position: 'absolute', bottom: 86, right: 16, zIndex: 10,
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
            border: 'none', color: 'white', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
          }}
        >
          💬
        </button>
      )}

      {/* Time slider & Variable Legend — bottom center */}
      <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '70%', minWidth: '500px', background: 'rgba(17,24,39,0.95)', border: '1px solid #374151', borderRadius: '16px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* Variable Legend */}
        <div style={{ width: '120px', flexShrink: 0, borderRight: '1px solid #374151', paddingRight: '16px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {VARIABLE_LABELS[activeVariable]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', height: 6, borderRadius: 3,
              background: activeVariable === 'temperature'
                ? 'linear-gradient(to right, #3b82f6, #ffffff, #ef4444)'
                : activeVariable === 'rain'
                ? 'linear-gradient(to right, #ffffff, #3b82f6, #6d28d9)'
                : activeVariable === 'wind'
                ? 'linear-gradient(to right, #22c55e, #eab308, #ef4444)'
                : 'linear-gradient(to right, #3b82f6, #ffffff, #ef4444)'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748b', marginTop: 2 }}>
            <span>{VARIABLE_MIN[activeVariable]}</span>
            <span>{VARIABLE_MAX[activeVariable]}</span>
          </div>
        </div>

        {/* Time slider */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button onClick={togglePlay}
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {isPlaying ? <Pause size={12} color="white" /> : <Play size={12} color="white" />}
            </button>
            <span style={{ fontSize: '12px', color: '#d1d5db', marginLeft: 'auto' }}>
              {displayDate} · {displayHour} UTC · +{leadHours}h
            </span>
          </div>
          <input type="range" min={0} max={120} step={6} value={leadHours}
            onChange={e => setLeadHours(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {['0h','24h','48h','72h','96h','120h'].map(l => (
              <span key={l} style={{ fontSize: '10px', color: '#6b7280' }}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Mapbox map — fills entire container */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: 80.27, latitude: 13.08, zoom: 2 }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        projection={{ name: projection } as any}
        cursor="crosshair"
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onWheel={handleInteractionStart}
        onMove={(e) => setZoom(e.viewState.zoom)}
        onLoad={onMapLoad}
        fog={{
          color: '#0a0a1a',
          'high-color': '#1a3a6e',
          'horizon-blend': 0.04,
          'space-color': '#050510',
          'star-intensity': 0.8
        }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      >
        {selectedLat !== null && selectedLon !== null && (
          <Marker longitude={selectedLon} latitude={selectedLat} anchor="center">
            {spiralMode ? (
              <SpiralOverlay />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%',
                  background: '#ef4444', border: '3px solid white',
                  boxShadow: '0 0 10px rgba(239,68,68,0.6)',
                  margin: '0 auto' }} />
                {nearestCity && (
                  <div style={{ background: 'rgba(15,23,42,0.9)', color: 'white',
                    fontSize: 10, padding: '2px 6px', borderRadius: 4, marginTop: 3,
                    whiteSpace: 'nowrap', border: '1px solid #374151' }}>
                    near {nearestCity}
                  </div>
                )}
              </div>
            )}
          </Marker>
        )}

        {globalAlerts.map((alert) => (
          <Marker
            key={alert.city}
            longitude={alert.lon}
            latitude={alert.lat}
            anchor="center"
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setLocation(alert.lat, alert.lon);
                mapRef.current?.flyTo({
                  center: [alert.lon, alert.lat],
                  zoom: 9, duration: 1200
                });
              }}
              onMouseEnter={(e) => {
                setHoveredAlert(alert);
                setHoverPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredAlert(null)}
              style={{ cursor: 'pointer', position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {/* Outer pulsing ring */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: alert.severity === 'DANGER' ? 28 : 22,
                height: alert.severity === 'DANGER' ? 28 : 22,
                borderRadius: '50%',
                background: alert.severity === 'DANGER' ? 'rgba(239,68,68,0.25)' :
                             alert.severity === 'WARNING' ? 'rgba(249,115,22,0.25)' :
                             alert.severity === 'INFO' ? 'rgba(234,179,8,0.2)' : 'transparent',
                animation: alert.severity !== 'CLEAR' ? 'pulse 1.8s ease-in-out infinite' : 'none',
              }} />
              
              {/* Inner dot */}
              <div style={{
                width: alert.severity === 'DANGER' ? 14 : 10,
                height: alert.severity === 'DANGER' ? 14 : 10,
                borderRadius: '50%',
                background: alert.severity === 'DANGER' ? '#ef4444' :
                             alert.severity === 'WARNING' ? '#f97316' :
                             alert.severity === 'INFO' ? '#eab308' : '#22c55e',
                border: `2px solid ${
                  alert.severity === 'DANGER' ? '#fca5a5' :
                  alert.severity === 'WARNING' ? '#fdba74' :
                  alert.severity === 'INFO' ? '#fde68a' : '#86efac'
                }`,
                boxShadow: alert.severity === 'DANGER' 
                  ? '0 0 8px rgba(239,68,68,0.8)' 
                  : alert.severity === 'WARNING'
                  ? '0 0 6px rgba(249,115,22,0.6)'
                  : 'none',
                position: 'relative',
                zIndex: 1,
              }} />

              {/* City label below dot */}
              <div style={{
                position: 'absolute',
                top: '100%', left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 3,
                background: 'rgba(0,0,0,0.75)',
                color: alert.severity === 'DANGER' ? '#fca5a5' :
                        alert.severity === 'WARNING' ? '#fdba74' :
                        alert.severity === 'INFO' ? '#fde68a' : '#86efac',
                fontSize: 9, fontWeight: 600,
                padding: '1px 5px', borderRadius: 4,
                whiteSpace: 'nowrap', pointerEvents: 'none',
              }}>
                {alert.city}
              </div>
            </div>
          </Marker>
        ))}

        {cyclones.map(storm => (
          <Marker
            key={storm.id}
            longitude={storm.currentLon}
            latitude={storm.currentLat}
            anchor="center"
          >
            <div
              onClick={() => setActiveTab('cyclones')}
              title={`${storm.name}: ${storm.category} · ${storm.currentWindKnots?.toFixed(0)} kts`}
              style={{
                fontSize: 20,
                cursor: 'pointer',
                animation: 'spin 4s linear infinite',
                filter: 'drop-shadow(0 0 8px #3b82f6)',
              }}>
              🌀
            </div>
          </Marker>
        ))}

        {/* EARTHQUAKE MARKERS */}
        {showEarthquakes && (hazards.earthquakes || []).map((eq: any) => (
          <Marker
            key={eq.id}
            longitude={eq.lon}
            latitude={eq.lat}
            anchor="bottom"
          >
            <div
              onClick={() => setHoveredAlert({ ...eq, type: 'earthquake' })}
              style={{ cursor: 'pointer' }}
              title={`M${eq.magnitude} - ${eq.place}`}
            >
              {/* Triangle shape */}
              <div style={{
                width: 0,
                height: 0,
                borderLeft: `${Math.max(7, eq.magnitude * 3)}px solid transparent`,
                borderRight: `${Math.max(7, eq.magnitude * 3)}px solid transparent`,
                borderBottom: `${Math.max(12, eq.magnitude * 5)}px solid ${
                  eq.magnitude >= 7 ? '#ef4444' :
                  eq.magnitude >= 6 ? '#f97316' :
                  eq.magnitude >= 5 ? '#eab308' : '#94a3b8'
                }`,
                filter: eq.tsunami 
                  ? 'drop-shadow(0 0 8px #3b82f6)' 
                  : `drop-shadow(0 0 4px ${eq.magnitude >= 7 ? '#ef4444' : '#f97316'})`,
                margin: '0 auto',
              }} />
              {/* Magnitude label */}
              <div style={{
                fontSize: 9,
                color: 'white',
                textAlign: 'center',
                fontWeight: 700,
                textShadow: '0 0 4px black, 0 0 4px black',
                marginTop: 2,
                whiteSpace: 'nowrap',
              }}>
                M{eq.magnitude?.toFixed(1)}
                {eq.tsunami ? ' 🌊' : ''}
              </div>
            </div>
          </Marker>
        ))}

        {showWildfires && (hazards.wildfires || []).filter((f: any) => f.frp > 50).map((fire: any, i: number) => (
          <Marker
            key={`fire_${i}`}
            longitude={fire.lon}
            latitude={fire.lat}
            anchor="center"
          >
            <div
              onClick={() => setHoveredAlert({ ...fire, type: 'wildfire' })}
              style={{
                cursor: 'pointer',
                fontSize: fire.frp > 100 ? 16 : 12,
                filter: `drop-shadow(0 0 4px orange)`,
              }}
              title={`Fire - FRP: ${fire.frp} MW`}
            >
              🔥
            </div>
          </Marker>
        ))}
      </Map>

      {/* Hover Tooltip */}
      {hoveredAlert && (
        <div style={{
          position: 'fixed',
          left: hoverPos.x + 12,
          top: hoverPos.y - 20,
          zIndex: 1000,
          background: '#0f172a',
          border: `1px solid ${
            hoveredAlert.type === 'earthquake' ? (hoveredAlert.magnitude >= 7 ? '#ef4444' : hoveredAlert.magnitude >= 6 ? '#f97316' : '#eab308') :
            (hoveredAlert.severity === 'DANGER' || hoveredAlert.severity === 'MAJOR') ? '#ef4444' :
            (hoveredAlert.severity === 'WARNING' || hoveredAlert.severity === 'STRONG') ? '#f97316' : '#eab308'
          }`,
          borderRadius: 8,
          padding: '10px 14px',
          minWidth: 200,
          pointerEvents: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); setHoveredAlert(null); }}
            style={{ position: 'absolute', top: 8, right: 8,
              background: 'transparent', border: 'none',
              color: '#64748b', cursor: 'pointer', fontSize: 16,
              lineHeight: 1, padding: 2 }}>
            ✕
          </button>
          {hoveredAlert?.type === 'earthquake' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center',
                gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>
                  {hoveredAlert.magnitude >= 7 ? '🔴' :
                   hoveredAlert.magnitude >= 6 ? '🟠' : '🟡'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
                  M{hoveredAlert.magnitude?.toFixed(1)} Earthquake
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                {hoveredAlert.place}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Depth: {hoveredAlert.depth?.toFixed(0)}km
                · {new Date(hoveredAlert.time).toLocaleDateString()}
              </div>
              {hoveredAlert.tsunami && (
                <div style={{ fontSize: 12, color: '#3b82f6', 
                  fontWeight: 600, marginTop: 4 }}>
                  🌊 Tsunami warning issued
                </div>
              )}
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
                {hoveredAlert.recommendation}
              </div>
              <a href={hoveredAlert.url} target="_blank" rel="noopener"
                style={{ fontSize: 11, color: '#60a5fa', display: 'block',
                  marginTop: 6 }}>
                View USGS report →
              </a>
            </>
          ) : hoveredAlert?.type === 'wildfire' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>🔥</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Wildfire Detected</span>
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                FRP: {hoveredAlert.frp} MW
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center',
                gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12 }}>
                  {(hoveredAlert.severity === 'DANGER' || hoveredAlert.severity === 'MAJOR') ? '🔴' :
                   (hoveredAlert.severity === 'WARNING' || hoveredAlert.severity === 'STRONG') ? '🟠' : '🟡'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
                  {hoveredAlert.city || hoveredAlert.place || 'Alert'}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: (hoveredAlert.severity === 'DANGER' || hoveredAlert.severity === 'MAJOR') ? '#fca5a5' :
                         (hoveredAlert.severity === 'WARNING' || hoveredAlert.severity === 'STRONG') ? '#fdba74' : '#fde68a',
                  background: (hoveredAlert.severity === 'DANGER' || hoveredAlert.severity === 'MAJOR') ? '#450a0a' :
                              (hoveredAlert.severity === 'WARNING' || hoveredAlert.severity === 'STRONG') ? '#431407' : '#422006',
                  padding: '1px 6px', borderRadius: 10, marginLeft: 'auto'
                }}>
                  {hoveredAlert.severity}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                {hoveredAlert.label || (hoveredAlert.magnitude ? `Magnitude: ${hoveredAlert.magnitude}` : 'Fire Detected')}
              </div>
              {hoveredAlert.peakValue > 0 && (
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Peak: {hoveredAlert.peakValue}{hoveredAlert.unit}
                  {(hoveredAlert.probability || 0) > 0 && ` · ${hoveredAlert.probability}% probability`}
                </div>
              )}
              {hoveredAlert.recommendation && (
                <div style={{ fontSize: 11, color: '#6b7280',
                  marginTop: 6, lineHeight: 1.5,
                  borderTop: '1px solid #1e293b', paddingTop: 6 }}>
                  💡 {hoveredAlert.recommendation}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#475569', marginTop: 6 }}>
                Click to view full forecast →
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
