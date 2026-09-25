import request from 'supertest';
import app from './src/index.js';
import { initDb } from './src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  await initDb();
  
  const testPdfPath = path.join(__dirname, 'test.pdf');
  fs.writeFileSync(testPdfPath, 'fake pdf');
  try {
    const res = await request(app).post('/api/documents').attach('file', testPdfPath);
    console.log('PDF STATUS:', res.status, res.body);
  } catch(e) { console.error(e); }
  fs.unlinkSync(testPdfPath);

  const testTxtPath = path.join(__dirname, 'test.txt');
  fs.writeFileSync(testTxtPath, 'This is a test');
  try {
    const res = await request(app).post('/api/documents').attach('file', testTxtPath);
    console.log('TXT STATUS:', res.status, res.body);
  } catch(e) { console.error(e); }
  fs.unlinkSync(testTxtPath);
}
run();
