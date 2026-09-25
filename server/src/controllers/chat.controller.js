import { getDb } from '../db.js';
import { generateAnswer } from '../services/ai.service.js';

function calculateScore(question, text) {
  const words = question.toLowerCase().split(/\W+/).filter(w => w.length > 2); // Exclude very short words
  const textLower = text.toLowerCase();
  let score = 0;
  words.forEach(word => {
    if (textLower.includes(word)) {
      score++;
    }
  });
  return score;
}

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
    
    const rankedDocs = documents.map(doc => {
      return {
        ...doc,
        score: calculateScore(question, doc.textContent)
      };
    }).filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    const answer = await generateAnswer(question, rankedDocs);
    const sources = rankedDocs.map(doc => ({
      _id: doc.id,
      originalName: doc.originalName
    }));

    res.json({ answer, sources });
  } catch (error) {
    next(error);
  }
}
