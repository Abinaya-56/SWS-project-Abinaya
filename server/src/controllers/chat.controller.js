import { getDb } from '../db.js';
import { generateAnswer } from '../services/ai.service.js';
import { rankDocuments } from '../services/ranking.js';

export async function askQuestion(req, res, next) {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || question.trim() === '') {
      const err = new Error("Question is missing or empty");
      err.status = 400;
      throw err;
    }

    const db = getDb();
    const documents = db.data.documents;
    
    const rankedDocs = rankDocuments(question, documents).slice(0, 3);
    
    const answer = await generateAnswer(question, rankedDocs);
    const sources = rankedDocs.map(doc => ({
      _id: doc.id,
      originalName: doc.originalName,
      score: Number(doc.score.toFixed(4)),
      snippet: doc.snippet
    }));

    res.json({ answer, sources });
  } catch (error) {
    next(error);
  }
}
