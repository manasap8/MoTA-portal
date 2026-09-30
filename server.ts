import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const prebuilt = path.resolve(process.cwd(), 'server.js');

if (isProduction && fs.existsSync(prebuilt)) {
  await import('./server.js');
} else {
  // In development with tsx or when server.js is not yet built
  await import('./server-dev.ts');
}
