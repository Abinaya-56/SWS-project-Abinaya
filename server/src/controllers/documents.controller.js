import { getDb } from '../db.js';
import fs from 'fs';
import path from 'path';

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error("No file uploaded or invalid file type");
      err.status = 400;
      throw err;
    }

    const { originalname, size, mimetype, filename, path: filepath } = req.file;
    
    const allowedExtensions = ['.txt', '.md', '.json'];
    const ext = path.extname(originalname).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      const err = new Error("Invalid file type. Only .txt, .md, .json are allowed.");
      err.status = 400;
      throw err;
    }

    const textContent = fs.readFileSync(filepath, 'utf8');

    const db = getDb();
    
    const newDoc = {
      id: filename,
      originalName: originalname,
      size,
      mimeType: mimetype,
      uploadedAt: new Date().toISOString(),
      textContent,
      filePath: filepath
    };

    db.data.documents.push(newDoc);
    await db.write();

    res.status(201).json({
      id: newDoc.id,
      originalName: newDoc.originalName,
      size: newDoc.size,
      mimeType: newDoc.mimeType,
      uploadedAt: newDoc.uploadedAt
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(req, res, next) {
  try {
    const db = getDb();
    const docs = db.data.documents.map(doc => ({
      id: doc.id,
      originalName: doc.originalName,
      size: doc.size,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt
    }));

    // Sort newest first
    docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    res.json(docs);
  } catch (error) {
    next(error);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDb();
    const doc = db.data.documents.find(d => d.id === id);

    if (!doc) {
      const err = new Error("Document not found");
      err.status = 404;
      throw err;
    }

    res.download(doc.filePath, doc.originalName);
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDb();
    const docIndex = db.data.documents.findIndex(d => d.id === id);

    if (docIndex === -1) {
      const err = new Error("Document not found");
      err.status = 404;
      throw err;
    }

    const doc = db.data.documents[docIndex];
    
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    db.data.documents.splice(docIndex, 1);
    await db.write();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
