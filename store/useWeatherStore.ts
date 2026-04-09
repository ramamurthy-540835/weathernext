import { create } from 'zustand';
import { DEFAULT_BBOX, REGION_PRESETS } from '../lib/constants';

interface Bbox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface GlobalAlert {
  city: string;
  lat: number;
  lon: number;
  severity: 'DANGER' | 'WARNING' | 'INFO' | 'CLEAR';
  label: string;
  peakValue: number;
  unit: string;
  probability?: number;
  recommendation?: string;
}

interface WeatherState {
  selectedLat: number | null;
  selectedLon: number | null;
  activeVariable: string;
  leadHours: number;
  initDate: string;
  initHour: number;
  isDateLoading: boolean;
  latestAvailableDate: string;
  latestAvailableHour: number;
  availableInitTimes: string[];
  bbox: Bbox;
  isPlaying: boolean;
  projection: 'globe' | 'mercator';
  autoRotate: boolean;
  spiralMode: boolean;
  activeTab: 'forecast' | 'ensemble' | 'alerts' | 'chat' | 'cyclones';
  chatOpen: boolean;
  globalAlerts: GlobalAlert[];
  isScanning: boolean;
  showEarthquakes: boolean;
  earthquakes: any[];
  loadingCount: number;
  
  setLocation: (lat: number | null, lon: number | null) => void;
  setActiveVariable: (variable: string) => void;
  setLeadHours: (hours: number) => void;
  setInitDate: (date: string) => void;
  setInitHour: (hour: number) => void;
  loadLatestDate: () => Promise<void>;
  goToPreviousInit: () => void;
  goToNextInit: () => void;
  goToLatestInit: () => void;
  isLatestInit: () => boolean;
  setBbox: (bbox: Bbox) => void;
  togglePlay: () => void;
  setProjection: (proj: 'globe' | 'mercator') => void;
  toggleAutoRotate: () => void;
  toggleSpiralMode: () => void;
  setActiveTab: (tab: 'forecast' | 'ensemble' | 'alerts' | 'chat' | 'cyclones') => void;
  setChatOpen: (open: boolean) => void;
  setGlobalAlerts: (alerts: GlobalAlert[]) => void;
  setIsScanning: (scanning: boolean) => void;
  setShowEarthquakes: (show: boolean) => void;
  setEarthquakes: (eqs: any[]) => void;
  incrementLoading: () => void;
  decrementLoading: () => void;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  selectedLat: null,
  selectedLon: null,
  activeVariable: 'temperature',
  leadHours: 0,
  initDate: '2026-04-07',
  initHour: 18,
  isDateLoading: false,
  latestAvailableDate: '2026-04-07',
  latestAvailableHour: 18,
  availableInitTimes: [],
  bbox: REGION_PRESETS.CHENNAI,
  isPlaying: false,
  projection: 'globe',
  autoRotate: true,
  spiralMode: false,
  activeTab: 'forecast',
  chatOpen: false,
  globalAlerts: [],
  isScanning: false,
  showEarthquakes: false,
  earthquakes: [],
  loadingCount: 0,

  setLocation: (lat, lon) => set({ selectedLat: lat, selectedLon: lon }),
  setActiveVariable: (variable) => set({ activeVariable: variable }),
  setLeadHours: (hours) => set({ leadHours: Math.max(0, Math.min(120, hours)) }),
  setInitDate: (date) => set({ initDate: date }),
  setInitHour: (hour) => set({ initHour: hour }),
  
  loadLatestDate: async () => {
    try {
      const res = await fetch('/api/available-dates');
      if (!res.ok) return;
      const json = await res.json();
      if (json.latestDate) {
        set({ 
          initDate: json.latestDate, 
          initHour: json.latestHour,
          latestAvailableDate: json.latestDate,
          latestAvailableHour: json.latestHour
        });
      }
    } catch (e) {
      console.error('Could not load latest date', e);
    }
  },

  goToPreviousInit: () => set(state => {
    if (!state.initDate) return state;
    const hours = [0, 6, 12, 18];
    const currentIdx = hours.indexOf(state.initHour);
    if (currentIdx > 0) {
      return { initHour: hours[currentIdx - 1] };
    } else {
      const prev = new Date(state.initDate);
      prev.setDate(prev.getDate() - 1);
      return { 
        initDate: prev.toISOString().split('T')[0],
        initHour: 18 
      };
    }
  }),
  
  goToNextInit: () => set(state => {
    if (!state.initDate || !state.latestAvailableDate) return state;
    const hours = [0, 6, 12, 18];
    const currentIdx = hours.indexOf(state.initHour);
    const nextHour = currentIdx < 3 ? hours[currentIdx + 1] : 0;
    const nextDate = currentIdx < 3 ? state.initDate : (() => {
      const next = new Date(state.initDate);
      next.setDate(next.getDate() + 1);
      return next.toISOString().split('T')[0];
    })();
    
    if (nextDate > state.latestAvailableDate) return state;
    if (nextDate === state.latestAvailableDate && nextHour > state.latestAvailableHour) return state;
    return { initDate: nextDate, initHour: nextHour };
  }),

  goToLatestInit: () => set(state => ({
    initDate: state.latestAvailableDate,
    initHour: state.latestAvailableHour
  })),

  isLatestInit: () => {
    const s = get();
    return s.initDate === s.latestAvailableDate && s.initHour >= s.latestAvailableHour;
  },

  setBbox: (bbox) => set({ bbox }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setProjection: (proj) => set({ projection: proj }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  toggleSpiralMode: () => set((state) => ({ spiralMode: !state.spiralMode })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setGlobalAlerts: (alerts) => set({ globalAlerts: alerts }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setShowEarthquakes: (show) => set({ showEarthquakes: show }),
  setEarthquakes: (eqs) => set({ earthquakes: eqs }),
  incrementLoading: () => set(s => ({ loadingCount: s.loadingCount + 1 })),
  decrementLoading: () => set(s => ({ loadingCount: Math.max(0, s.loadingCount - 1) })),
}));
