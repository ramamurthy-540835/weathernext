import { WeatherVariable } from '../types/weather';

export const BQ_TABLE = "ctoteam.weathernext_2.weathernext_2_0_0";

export const DEFAULT_BBOX = {
  latMin: 12.90,
  latMax: 13.10,
  lonMin: 80.20,
  lonMax: 80.30
};

export const DEFAULT_INIT_DATE = "2026-04-06";

export const REGION_PRESETS = {
  CHENNAI: { latMin: 12.90, latMax: 13.10, lonMin: 80.20, lonMax: 80.30 },
  DUBAI: { latMin: 24.75, latMax: 25.35, lonMin: 55.10, lonMax: 55.50 },
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
