import { createClient } from '@libsql/client/web';
import { fileURLToPath } from 'url';

// Turso connection config
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let db;

export async function getDb() {
  if (!db) {
    db = createClient({
      url: tursoUrl,
      authToken: tursoToken,
      // Optional: increase timeout (in ms)
      fetch: (url, options) => {
        return fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
      },
    });
    // No schema initialisation – tables must already exist in Turso
  }
  return db;
}

export function rowToApi(row) {
  return {
    TimeWhenAdded: row.time_when_added,
    VideoURL: row.video_url,
    Title: row.title,
    Description: row.description ?? '',
    SourceName: row.source_name ?? '',
    SourceLink: row.source_link ?? '',
    Categories: row.categories ?? '',
    FullDescription: row.full_description ?? '',
    Votes: row.votes ?? 0,
    Comments: row.comments ?? 0,
  };
}