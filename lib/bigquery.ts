import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID || 'ctoteam',
});

export async function runQuery<T>(sql: string): Promise<T[]> {
  const [rows] = await bigquery.query({ query: sql });
  return rows as T[];
}
