import request from 'supertest';
import app from '../src/index.js';
import { initDb, getDb } from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('API Tests', () => {
  let docId;
  const testUploadsDir = path.resolve('uploads');

  beforeAll(async () => {
    if (fs.existsSync('db.json')) fs.unlinkSync('db.json');
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testUploadsDir, { recursive: true });
    await initDb();
  });

  afterAll(() => {
    if (fs.existsSync('db.json')) fs.unlinkSync('db.json');
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testUploadsDir, { recursive: true });
  });

  describe('Document Upload', () => {
    it('should reject missing file', async () => {
      const res = await request(app).post('/api/documents');
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject invalid file type', async () => {
      const testFilePath = path.join(__dirname, 'test.pdf');
      fs.writeFileSync(testFilePath, 'fake pdf content');
      
      const res = await request(app)
        .post('/api/documents')
        .attach('file', testFilePath);
      
      expect(res.status).toBe(400);
      fs.unlinkSync(testFilePath);
    });

    it('should upload valid file successfully', async () => {
      const testFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(testFilePath, 'This is a test document with some keywords like AI and blockchain.');

      const res = await request(app)
        .post('/api/documents')
        .attach('file', testFilePath);
      
      if (res.status !== 201) throw new Error("UPLOAD FAILED: " + JSON.stringify(res.body));
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      docId = res.body.id;
      fs.unlinkSync(testFilePath);
    });
  });

  describe('Document List', () => {
    it('should return newest-first order', async () => {
      const testFilePath = path.join(__dirname, 'test2.txt');
      fs.writeFileSync(testFilePath, 'Another doc.');
      await request(app).post('/api/documents').attach('file', testFilePath);
      fs.unlinkSync(testFilePath);

      const res = await request(app).get('/api/documents');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(new Date(res.body[0].uploadedAt).getTime()).toBeGreaterThanOrEqual(new Date(res.body[1].uploadedAt).getTime());
    });
  });

  describe('Chat functionality', () => {
    it('should reject empty question', async () => {
      const res = await request(app).post('/api/chat').send({ question: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return answer and sources for valid question', async () => {
      const res = await request(app).post('/api/chat').send({ question: 'AI and blockchain' });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.sources).toBeDefined();
      expect(res.body.sources.length).toBeGreaterThan(0);
      expect(res.body.sources[0]._id).toBe(docId);
    });

    it('should handle question with no matching docs gracefully', async () => {
      const res = await request(app).post('/api/chat').send({ question: 'randomwordthatdoesnotexist' });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.sources.length).toBe(0);
    });
  });

  describe('Document Delete', () => {
    it('should return 404 for invalid id', async () => {
      const res = await request(app).delete('/api/documents/invalid_id');
      expect(res.status).toBe(404);
    });

    it('should delete existing document', async () => {
      const res = await request(app).delete(`/api/documents/${docId}`);
      expect(res.status).toBe(200);
      
      const res2 = await request(app).get(`/api/documents/${docId}/download`);
      expect(res2.status).toBe(404);
    });
  });
});
