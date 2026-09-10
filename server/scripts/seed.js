import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, '..', '..', 'ProductVideosPlaylist.csv');

function parseCsvLine(line, delimiter = ';') {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

const db = getDb();
const csv = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(csv);

const insert = db.prepare(`
  INSERT OR REPLACE INTO videos (
    time_when_added, video_url, title, description,
    source_name, source_link, categories,
    full_description, votes, comments
  ) VALUES (
    @time_when_added, @video_url, @title, @description,
    @source_name, @source_link, @categories,
    @full_description, @votes, @comments
  )
`);

const seedAll = db.transaction((items) => {
  db.exec('DELETE FROM videos');
  for (const row of items) {
    const timeWhenAdded = row.TimeWhenAdded?.trim();
    const title = row.Title?.trim();
    const videoUrl = row.VideoURL?.trim();
    if (!timeWhenAdded || !title || !videoUrl) continue;

    insert.run({
      time_when_added: timeWhenAdded,
      video_url: videoUrl,
      title,
      description: row.Description ?? '',
      source_name: row.SourceName ?? '',
      source_link: row.SourceLink ?? '',
      categories: row.Categories ?? '',
      full_description: '',
      votes: 0,
      comments: 0,
    });
  }
});

seedAll(rows);
const count = db.prepare('SELECT COUNT(*) AS c FROM videos').get().c;
console.log(`Seeded ${count} videos into database.`);
