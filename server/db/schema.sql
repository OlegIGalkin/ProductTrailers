CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time_when_added TEXT NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  source_name TEXT DEFAULT '',
  source_link TEXT DEFAULT '',
  categories TEXT DEFAULT '',
  full_description TEXT DEFAULT '',
  votes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  UNIQUE (video_url, time_when_added)
);
