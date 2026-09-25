import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

export async function generateAnswer(question, contextDocs) {
  const contextText = contextDocs.map(doc => `Source: ${doc.originalName}\nContent: ${doc.textContent}`).join('\n\n');
  
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant. Use the following context to answer the user's question. If you don't know the answer, say so." },
          { role: "user", content: `Context:\n${contextText}\n\nQuestion: ${question}` }
        ]
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate answer from AI");
    }
  } else {
    // Mock fallback
    let bestSnippet = "No relevant context found.";
    if (contextDocs.length > 0) {
      const text = contextDocs[0].textContent;
      bestSnippet = text.substring(0, 200) + (text.length > 200 ? '...' : '');
    }
    return `(mock AI — no API key configured) Based on the documents, here is a relevant snippet: ${bestSnippet}. And regarding your question: ${question} - this is a mock answer.`;
  }
}
