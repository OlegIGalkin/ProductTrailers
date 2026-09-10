import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import videosRouter from './routes/videos.js';
// Remove the import of getDb – it's not needed at startup
// import { getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
const publicRoot = path.join(__dirname, '..', '..');

// No need to call getDb() here – it will be called lazily by videosRouter

const app = express();

app.use('/api/videos', videosRouter);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.use(express.static(publicRoot));
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});