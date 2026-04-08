export const WEATHERNEXT_ACCURACY: Record<string, Record<number, number>> = {
  temperature: { // RMSE in °C at each lead time
    12: 0.8, 24: 1.2, 48: 1.8, 72: 2.4, 96: 3.1, 120: 3.8
  },
  wind: { // RMSE in m/s
    12: 0.7, 24: 1.0, 48: 1.5, 72: 2.1, 96: 2.8, 120: 3.5
  },
  rain: { // less reliable at longer range
    12: 0.5, 24: 1.2, 48: 2.8, 72: 4.5, 96: 6.0, 120: 7.5
  },
  pressure: { // most reliable
    12: 0.3, 24: 0.5, 48: 0.8, 72: 1.2, 96: 1.6, 120: 2.0
  }
};

export const getAccuracyLabel = (hours: number, variable: string) => {
  if (hours <= 24) return { label: 'High accuracy', color: '#22c55e', score: 95 };
  if (hours <= 48) return { label: 'Good accuracy', color: '#84cc16', score: 85 };
  if (hours <= 72) return { label: 'Moderate accuracy', color: '#eab308', score: 70 };
  if (hours <= 96) return { label: 'Lower accuracy', color: '#f97316', score: 55 };
  return { label: 'Indicative only', color: '#ef4444', score: 40 };
};

export const getErrorBand = (hours: number, variable: string, value: number) => {
  const thresholds = [12, 24, 48, 72, 96, 120];
  const threshold = thresholds.find(h => h >= hours) || 120;
  const rmse = WEATHERNEXT_ACCURACY[variable]?.[threshold] || 2;
  return { upper: value + rmse, lower: value - rmse, rmse };
};
