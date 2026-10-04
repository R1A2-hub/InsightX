import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compiledServer = path.join(__dirname, 'dist', 'server.js');

if (process.env.NODE_ENV === 'production' && fs.existsSync(compiledServer)) {
  const { startServer } = await import('./dist/server.js');
  startServer();
} else {
  const { startServer } = await import('./server/serverImpl');
  startServer();
}
