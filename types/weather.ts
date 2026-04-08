export interface RawEnsembleMember {
  member: number;
  temperature: number; // Kelvin
  precipitation: number; // meters
  u_wind: number; // m/s
  v_wind: number; // m/s
  surface_pressure: number; // Pa
}

export interface WeatherPoint {
  member: number;
  temperature: number; // °C
  precipitation: number; // mm
  windSpeed: number; // m/s
  pressure: number; // hPa
}

export interface ForecastTimestep {
  time: string;
  hours: number;
  ensemble: WeatherPoint[];
}

export interface LocationForecast {
  lat: number;
  lon: number;
  initTime: string;
  timeseries: ForecastTimestep[];
}

export enum WeatherVariable {
  TEMPERATURE = 'TEMPERATURE',
  RAIN = 'RAIN',
  WIND = 'WIND',
  PRESSURE = 'PRESSURE',
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  DANGER = 'DANGER',
}

export interface Alert {
  variable: WeatherVariable;
  severity: AlertSeverity;
  label: string;
  peakValue: number;
  peakTime: string;
  probability: number;
}
