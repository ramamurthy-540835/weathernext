import { WeatherVariable } from '../types/weather';

export const BQ_TABLE = "ctoteam.weathernext_2.weathernext_2_0_0";

export const DEFAULT_BBOX = {
  latMin: 24.75,
  latMax: 25.35,
  lonMin: 55.10,
  lonMax: 55.50
};

export const DEFAULT_INIT_DATE = "2026-04-06";

export const REGION_PRESETS = {
  DUBAI: { latMin: 24.75, latMax: 25.35, lonMin: 55.10, lonMax: 55.50 },
  ABU_DHABI: { latMin: 24.35, latMax: 24.55, lonMin: 54.25, lonMax: 54.65 },
  SHARJAH: { latMin: 25.25, latMax: 25.45, lonMin: 55.35, lonMax: 55.65 },
  UAE_NORTH: { latMin: 25.95, latMax: 26.25, lonMin: 56.15, lonMax: 56.55 },
  UAE_EAST: { latMin: 22.75, latMax: 23.15, lonMin: 58.75, lonMax: 59.35 },
  MUMBAI: { latMin: 18.85, latMax: 19.35, lonMin: 72.75, lonMax: 73.15 },
  GLOBAL: { latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }
};

export const UNIT_CONVERTERS = {
  kelvinToC: (k: number) => k - 273.15,
  mToMm: (m: number) => m * 1000,
  paToHpa: (p: number) => p / 100,
  uvToMs: (u: number, v: number) => Math.sqrt(u ** 2 + v ** 2)
};

export const ALERT_THRESHOLDS = [
  { variable: WeatherVariable.RAIN, threshold: 50, severity: 'DANGER', label: 'Heavy Rain' },
  { variable: WeatherVariable.RAIN, threshold: 20, severity: 'WARNING', label: 'Moderate Rain' },
  { variable: WeatherVariable.WIND, threshold: 20, severity: 'DANGER', label: 'Gale Force Wind' },
  { variable: WeatherVariable.WIND, threshold: 10, severity: 'WARNING', label: 'Strong Wind' },
  { variable: WeatherVariable.TEMPERATURE, threshold: 40, severity: 'DANGER', label: 'Extreme Heat' },
  { variable: WeatherVariable.TEMPERATURE, threshold: 35, severity: 'WARNING', label: 'High Heat' }
];

export const VARIABLE_COLORS: Record<WeatherVariable, string> = {
  [WeatherVariable.TEMPERATURE]: '#ef4444', // red
  [WeatherVariable.RAIN]: '#3b82f6', // blue
  [WeatherVariable.WIND]: '#10b981', // green
  [WeatherVariable.PRESSURE]: '#8b5cf6', // purple
};

export const VARIABLE_UNITS: Record<WeatherVariable, string> = {
  [WeatherVariable.TEMPERATURE]: '°C',
  [WeatherVariable.RAIN]: 'mm',
  [WeatherVariable.WIND]: 'm/s',
  [WeatherVariable.PRESSURE]: 'hPa',
};

export const VARIABLE_LABELS: Record<string, string> = {
  [WeatherVariable.TEMPERATURE]: 'Temperature',
  [WeatherVariable.RAIN]: 'Precipitation',
  [WeatherVariable.WIND]: 'Wind Speed',
  [WeatherVariable.PRESSURE]: 'Surface Pressure',
  'temperature': 'Temperature',
  'rain': 'Precipitation',
  'wind': 'Wind Speed',
  'pressure': 'Surface Pressure',
};

export const VARIABLE_MIN: Record<string, string> = {
  temperature: '-20°C', rain: '0mm', wind: '0 m/s', pressure: '980hPa'
};

export const VARIABLE_MAX: Record<string, string> = {
  temperature: '45°C', rain: '100mm+', wind: '30+ m/s', pressure: '1040hPa'
};

// WeatherNext 2.0 15-Day Forecast Configuration
export const FORECAST_CONFIG = {
  MAX_LEAD_HOURS: 360, // 15 days = 360 hours
  MAX_LEAD_DAYS: 15,
  ENSEMBLE_MEMBERS: 64,
  FORECAST_INTERVALS: [0, 6, 12, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336, 360],
  CONFIDENCE_DEGRADATION: {
    days_1_3: { threshold: 0.8, label: 'High Confidence' },      // +0h to +72h
    days_4_5: { threshold: 0.6, label: 'Moderate Confidence' }, // +72h to +120h
    days_6_10: { threshold: 0.4, label: 'Low-Moderate' },        // +120h to +240h
    days_11_15: { threshold: 0.3, label: 'Low Confidence' }      // +240h to +360h
  },
  PERCENTILES: [10, 25, 50, 75, 90], // P10, P25, P50, P75, P90
  UAE_HAZARD_THRESHOLDS: {
    DUST_STORM_VISIBILITY: { value: 500, unit: 'm', severity: 'DANGER' },       // <500m visibility
    DUST_WARN_VISIBILITY: { value: 1000, unit: 'm', severity: 'WARNING' },      // <1000m visibility
    EXTREME_HEAT: { value: 50, unit: '°C', severity: 'DANGER' },                // >50°C
    HEAT_STRESS: { value: 48, unit: '°C', severity: 'WARNING' },                // >48°C (outdoor labor)
    HIGH_HEAT: { value: 35, unit: '°C', severity: 'ADVISORY' },                 // >35°C
    CYCLONE_WIND: { value: 17.5, unit: 'm/s', severity: 'DANGER' },             // >63 km/h
    MARINE_GALE: { value: 14, unit: 'm/s', severity: 'WARNING' },               // >50 km/h
    FLASH_FLOOD_RAIN: { value: 50, unit: 'mm/24h', severity: 'DANGER' },        // >50mm/day
    MODERATE_RAIN: { value: 20, unit: 'mm/24h', severity: 'WARNING' }           // >20mm/day
  }
};
