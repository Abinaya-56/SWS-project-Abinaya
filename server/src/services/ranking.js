export function rankDocuments(question, documents) {
  if (documents.length === 0) return [];

  const extractWords = (text) => text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const queryTokens = extractWords(question);
  const queryWords = [...new Set(queryTokens)];
  if (queryWords.length === 0) return [];

  const df = {};
  const docTokensList = documents.map(doc => {
    const tokens = extractWords(doc.textContent);
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach(token => {
      df[token] = (df[token] || 0) + 1;
    });
    return tokens;
  });

  const N = documents.length;
  const idf = Object.fromEntries(Object.entries(df).map(([term, frequency]) => [
    term,
    Math.log((N + 1) / (frequency + 1)) + 1
  ]));
  const queryVector = Object.fromEntries(queryWords.map(term => [
    term,
    (queryTokens.filter(token => token === term).length / queryTokens.length) * (idf[term] || Math.log(N + 1) + 1)
  ]));
  const queryMagnitude = Math.sqrt(Object.values(queryVector).reduce((sum, value) => sum + value ** 2, 0));

  const ranked = documents.map((doc, index) => {
    const tokens = docTokensList[index];
    const termFrequency = {};
    tokens.forEach(token => {
      termFrequency[token] = (termFrequency[token] || 0) + 1;
    });
    const documentVector = Object.fromEntries(queryWords.map(term => [
      term,
      ((termFrequency[term] || 0) / Math.max(tokens.length, 1)) * (idf[term] || 0)
    ]));
    const dotProduct = queryWords.reduce((sum, term) => sum + queryVector[term] * documentVector[term], 0);
    const documentMagnitude = Math.sqrt(Object.values(documentVector).reduce((sum, value) => sum + value ** 2, 0));
    const score = queryMagnitude && documentMagnitude
      ? dotProduct / (queryMagnitude * documentMagnitude)
      : 0;

    const sentences = doc.textContent.split(/(?<=[.?!])\s+/);
    let bestSentence = '';
    let maxSentenceScore = -1;

    sentences.forEach(sentence => {
      const sentTokens = extractWords(sentence);
      const sentScore = queryWords.reduce((total, word) => total + (sentTokens.includes(word) ? 1 : 0), 0);
      if (sentScore > maxSentenceScore && sentScore > 0) {
        maxSentenceScore = sentScore;
        bestSentence = sentence;
      }
    });
    
    const snippet = bestSentence.length > 240 ? `${bestSentence.substring(0, 240).trim()}...` : bestSentence;

    return { ...doc, score, snippet };
  });

  return ranked.filter(doc => doc.score > 0).sort((a, b) => b.score - a.score);
}
