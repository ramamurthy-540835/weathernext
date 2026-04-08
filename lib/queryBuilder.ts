import { BQ_TABLE } from './constants';

interface QueryParams {
  lat: number;
  lon: number;
  radius?: number;
  initDate: string;
  initHour: number;
  maxHours?: number;
}

interface AlertQueryParams extends Omit<QueryParams, 'maxHours'> {
  hours?: number;
}

export function buildForecastQuery({ lat, lon, radius = 0.15, initDate, initHour, maxHours = 120 }: QueryParams): string {
  const initTimestamp = `${initDate} ${String(initHour).padStart(2,'0')}:00:00 UTC`;
  return `
    SELECT
      f.time AS forecast_time,
      f.hours,
      AVG(e.2m_temperature) - 273.15               AS temp_c_mean,
      STDDEV(e.2m_temperature)                      AS temp_c_spread,
      AVG(e.total_precipitation_6hr) * 1000         AS rain_mm_mean,
      MAX(e.total_precipitation_6hr) * 1000         AS rain_mm_p90,
      AVG(SQRT(POW(e.10m_u_component_of_wind,2)+POW(e.10m_v_component_of_wind,2))) AS wind_speed_mean,
      MAX(SQRT(POW(e.10m_u_component_of_wind,2)+POW(e.10m_v_component_of_wind,2))) AS wind_speed_max,
      AVG(e.mean_sea_level_pressure) / 100          AS pressure_hpa
    FROM \`${BQ_TABLE}\`,
         UNNEST(forecast) AS f,
         UNNEST(f.ensemble) AS e
    WHERE init_time = TIMESTAMP('${initTimestamp}')
      AND ST_Y(geography) BETWEEN ${lat - radius} AND ${lat + radius}
      AND ST_X(geography) BETWEEN ${lon - radius} AND ${lon + radius}
      AND f.hours <= ${maxHours}
    GROUP BY 1, 2
    ORDER BY f.hours
  `;
}

export function buildEnsembleQuery({ lat, lon, radius = 0.15, initDate, initHour, maxHours = 120 }: QueryParams): string {
  const initTimestamp = `${initDate} ${String(initHour).padStart(2,'0')}:00:00 UTC`;
  return `
    SELECT 
      f.time, 
      f.hours, 
      e.ensemble_member,
      e.2m_temperature - 273.15 AS temp_c,
      e.total_precipitation_6hr * 1000 AS rain_mm,
      SQRT(POW(e.10m_u_component_of_wind,2)+POW(e.10m_v_component_of_wind,2)) AS wind_speed,
      e.mean_sea_level_pressure / 100 AS pressure_hpa
    FROM \`${BQ_TABLE}\`,
         UNNEST(forecast) AS f, 
         UNNEST(f.ensemble) AS e
    WHERE init_time = TIMESTAMP('${initTimestamp}')
      AND ST_Y(geography) BETWEEN ${lat - radius} AND ${lat + radius}
      AND ST_X(geography) BETWEEN ${lon - radius} AND ${lon + radius}
      AND f.hours <= ${maxHours}
    ORDER BY f.hours, e.ensemble_member
    LIMIT 10000
  `;
}

export function buildAlertQuery({ lat, lon, radius = 0.15, initDate, initHour, hours = 72 }: AlertQueryParams): string {
  const initTimestamp = `${initDate} ${String(initHour).padStart(2,'0')}:00:00 UTC`;
  return `
    SELECT
      f.time AS forecast_time,
      f.hours,
      MAX(e.2m_temperature) - 273.15 AS max_temp_c,
      MAX(e.total_precipitation_6hr) * 1000 AS max_rain_mm,
      MAX(SQRT(POW(e.10m_u_component_of_wind,2)+POW(e.10m_v_component_of_wind,2))) AS max_wind_speed
    FROM \`${BQ_TABLE}\`,
         UNNEST(forecast) AS f,
         UNNEST(f.ensemble) AS e
    WHERE init_time = TIMESTAMP('${initTimestamp}')
      AND ST_Y(geography) BETWEEN ${lat - radius} AND ${lat + radius}
      AND ST_X(geography) BETWEEN ${lon - radius} AND ${lon + radius}
      AND f.hours <= ${hours}
    GROUP BY 1, 2
    ORDER BY f.hours
  `;
}
